/* Vetor — gerador de PDF vetorial do Estúdio de Miolos.
   Sem dependências: recebe os mesmos comandos de desenho do canvas (caminhos, cores, texto, imagens)
   e escreve formas e letras de verdade dentro do PDF. As fontes são embutidas (TrueType/OpenType). */
(function () {
  'use strict';
  const PT = 72 / 25.4;
  const nf = (n) => { const s = (+n).toFixed(3); return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''); };
  const enc = new TextEncoder();
  const hex4 = (n) => ('0000' + n.toString(16)).slice(-4);
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const pdfStr = (s) => { let h = 'FEFF'; for (const u of String(s)) { const c = u.codePointAt(0); if (c > 0xffff) { const d = c - 0x10000; h += hex4(0xd800 + (d >> 10)) + hex4(0xdc00 + (d & 0x3ff)); } else h += hex4(c); } return '<' + h + '>'; };

  async function deflate(u8) {
    if (typeof CompressionStream === 'undefined') return null;
    const cs = new CompressionStream('deflate'), w = cs.writable.getWriter();
    w.write(u8); w.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
  }
  async function inflate(u8) {
    const ds = new DecompressionStream('deflate'), w = ds.writable.getWriter();
    w.write(u8); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }

  /* ---------- WOFF → sfnt (TTF/OTF) ---------- */
  async function woffToSfnt(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0) !== 0x774f4646) return buf; // não é WOFF: já é sfnt
    const flavor = dv.getUint32(4), n = dv.getUint16(12);
    const tabs = [];
    for (let i = 0; i < n; i++) {
      const o = 44 + i * 20;
      tabs.push({ tag: dv.getUint32(o), off: dv.getUint32(o + 4), comp: dv.getUint32(o + 8), orig: dv.getUint32(o + 12), sum: dv.getUint32(o + 16) });
    }
    for (const t of tabs) {
      const raw = new Uint8Array(buf, t.off, t.comp);
      t.data = t.comp < t.orig ? await inflate(raw) : raw;
    }
    let size = 12 + 16 * n; tabs.forEach((t) => { size += (t.orig + 3) & ~3; });
    const out = new Uint8Array(size), ov = new DataView(out.buffer);
    ov.setUint32(0, flavor); ov.setUint16(4, n);
    let sr = 1, es = 0; while (sr * 2 <= n) { sr *= 2; es++; }
    ov.setUint16(6, sr * 16); ov.setUint16(8, es); ov.setUint16(10, n * 16 - sr * 16);
    let pos = 12 + 16 * n;
    tabs.forEach((t, i) => {
      const o = 12 + i * 16;
      ov.setUint32(o, t.tag); ov.setUint32(o + 4, t.sum); ov.setUint32(o + 8, pos); ov.setUint32(o + 12, t.orig);
      out.set(t.data.subarray(0, t.orig), pos); pos += (t.orig + 3) & ~3;
    });
    return out.buffer;
  }

  /* ---------- leitor de fontes ---------- */
  function parseFont(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf), tag4 = (o) => String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
    let base = 0;
    if (tag4(0) === 'ttcf') base = dv.getUint32(12);
    const flavor = tag4(base), n = dv.getUint16(base + 4), T = {};
    for (let i = 0; i < n; i++) { const o = base + 12 + i * 16; T[tag4(o)] = { off: dv.getUint32(o + 8), len: dv.getUint32(o + 12) }; }
    if (!T.head || !T.hhea || !T.hmtx || !T.cmap || !T.maxp) throw new Error('fonte incompleta');
    const upm = dv.getUint16(T.head.off + 18) || 1000;
    const bb = [dv.getInt16(T.head.off + 36), dv.getInt16(T.head.off + 38), dv.getInt16(T.head.off + 40), dv.getInt16(T.head.off + 42)];
    const asc = dv.getInt16(T.hhea.off + 4), desc = dv.getInt16(T.hhea.off + 6), nHM = dv.getUint16(T.hhea.off + 34), nG = dv.getUint16(T.maxp.off + 4);
    let cap = 0, italic = 0;
    if (T['OS/2'] && T['OS/2'].len >= 90 && dv.getUint16(T['OS/2'].off) >= 2) cap = dv.getInt16(T['OS/2'].off + 88);
    if (T.post) italic = dv.getInt32(T.post.off + 4) / 65536;
    const adv = (g) => { if (g >= nG) g = 0; const i = g < nHM ? g : nHM - 1; return dv.getUint16(T.hmtx.off + i * 4); };
    // cmap
    const cm = T.cmap.off, nt = dv.getUint16(cm + 2); let best = null, bestScore = -1;
    for (let i = 0; i < nt; i++) {
      const pid = dv.getUint16(cm + 4 + i * 8), eid = dv.getUint16(cm + 6 + i * 8), off = cm + dv.getUint32(cm + 8 + i * 8), fmt = dv.getUint16(off);
      const score = (pid === 3 && eid === 10 && fmt === 12) ? 4 : (pid === 0 && fmt === 12) ? 3 : (pid === 3 && eid === 1 && fmt === 4) ? 2 : (pid === 0 && fmt === 4) ? 1 : -1;
      if (score > bestScore) { bestScore = score; best = { off, fmt }; }
    }
    if (!best) throw new Error('fonte sem tabela de caracteres');
    const o = best.off;
    let lookup;
    if (best.fmt === 12) {
      const ng = dv.getUint32(o + 12);
      lookup = (cp) => { let lo = 0, hi = ng - 1; while (lo <= hi) { const mid = (lo + hi) >> 1, g = o + 16 + mid * 12, s = dv.getUint32(g), e = dv.getUint32(g + 4); if (cp < s) hi = mid - 1; else if (cp > e) lo = mid + 1; else return dv.getUint32(g + 8) + cp - s; } return 0; };
    } else {
      const sc = dv.getUint16(o + 6) / 2, endO = o + 14, startO = endO + sc * 2 + 2, deltaO = startO + sc * 2, rangeO = deltaO + sc * 2;
      lookup = (cp) => {
        if (cp > 0xffff) return 0;
        for (let i = 0; i < sc; i++) {
          if (cp <= dv.getUint16(endO + i * 2)) {
            const st = dv.getUint16(startO + i * 2); if (cp < st) return 0;
            const ro = dv.getUint16(rangeO + i * 2), dl = dv.getInt16(deltaO + i * 2);
            if (ro === 0) return (cp + dl) & 0xffff;
            const g = dv.getUint16(rangeO + i * 2 + ro + (cp - st) * 2); return g ? (g + dl) & 0xffff : 0;
          }
        }
        return 0;
      };
    }
    let cff = null;
    if (flavor === 'OTTO') { if (!T['CFF ']) throw new Error('OpenType sem contornos'); cff = true; }
    const name = (() => { try { const no = T.name.off, cnt = dv.getUint16(no + 2), so = no + dv.getUint16(no + 4); for (let i = 0; i < cnt; i++) { const r = no + 6 + i * 12; if (dv.getUint16(r + 6) === 6) { const l = dv.getUint16(r + 8), f = dv.getUint16(r + 10); let s = ''; if (dv.getUint16(r) === 3 || dv.getUint16(r) === 0) { for (let k = 0; k < l; k += 2) s += String.fromCharCode(dv.getUint16(so + f + k)); } else { for (let k = 0; k < l; k++) s += String.fromCharCode(u8[so + f + k]); } return s; } } } catch (e) { } return 'Fonte'; })();
    return { buf, upm, bbox: bb, asc, desc, cap, italic, adv, lookup, cff, name: name.replace(/[^A-Za-z0-9-]/g, '') || 'Fonte', tables: T, base };
  }

  /* ---------- documento PDF ---------- */
  class Doc {
    constructor(o = {}) {
      this.dry = !!o.dry; this.pages = []; this.fonts = new Map(); this.fontUse = new Map(); this.images = new Map(); this.gs = new Map();
      this.links = []; this.reqs = new Map(); this.title = o.title || 'Miolo'; this.failedText = 0;
    }
    page(wmm, hmm) { const p = { w: wmm, h: hmm, ops: [], fonts: new Set(), imgs: new Set(), gs: new Set(), links: [], depth: 0 }; this.pages.push(p); return new Ctx(this, p); }
    link(pageIdx, x, y, w, h, target) { this.pages[pageIdx].links.push({ x, y, w, h, target }); }
    /** registra uma fonte (ArrayBuffer sfnt) para família/peso/itálico */
    addFont(family, weight, italic, buf) {
      const key = family.toLowerCase();
      if (!this.fonts.has(key)) this.fonts.set(key, []);
      const rec = { family, weight: weight || 400, italic: !!italic, font: parseFont(buf), id: 'F' + (this.fontUse.size + 1), used: new Map() };
      this.fontUse.set(rec.id, rec); this.fonts.get(key).push(rec); return rec;
    }
    pickFont(fam, weight, italic) {
      const list = this.fonts.get(fam.toLowerCase()); if (!list) return null;
      let best = null, sc = 1e9;
      for (const r of list) { const s = Math.abs(r.weight - weight) + (r.italic === italic ? 0 : 450); if (s < sc) { sc = s; best = r; } }
      return best;
    }
    gsName(ca, CA) { const k = nf(ca) + '|' + nf(CA); if (!this.gs.has(k)) this.gs.set(k, { name: 'G' + (this.gs.size + 1), ca, CA }); return this.gs.get(k).name; }
    imageRec(im) {
      let r = this.images.get(im); if (r) return r;
      const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, w, h).data; let alpha = false;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 255) { alpha = true; break; }
      r = { id: 'I' + (this.images.size + 1), w, h };
      if (!alpha) {
        const b64 = c.toDataURL('image/jpeg', 0.92).split(',')[1], bin = atob(b64), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        r.jpeg = u;
      } else {
        r.rgb = new Uint8Array(w * h * 3); r.a = new Uint8Array(w * h);
        for (let i = 0, j = 0, k = 0; i < d.length; i += 4, j += 3, k++) { r.rgb[j] = d[i]; r.rgb[j + 1] = d[i + 1]; r.rgb[j + 2] = d[i + 2]; r.a[k] = d[i + 3]; }
      }
      this.images.set(im, r); return r;
    }

    async finish() {
      const objs = [null]; // 1-based
      const add = (dict, data) => { objs.push({ dict, data }); return objs.length - 1; };
      const catalog = add('', null), pagesRoot = add('', null);
      const stream = async (dict, bytes, z = true) => {
        let data = bytes, d = dict;
        if (z) { const c = await deflate(bytes); if (c && c.length < bytes.length) { data = c; d += '/Filter/FlateDecode'; } }
        return add(d + '/Length ' + data.length, data);
      };
      // fontes usadas
      const fontObj = new Map();
      for (const rec of this.fontUse.values()) {
        if (!rec.used.size) continue;
        const f = rec.font, k = 1000 / f.upm, fname = f.name;
        const raw = new Uint8Array(f.buf);
        let file;
        if (f.cff) file = await stream('/Subtype/OpenType', raw);
        else file = await stream('/Length1 ' + raw.length, raw);
        const flags = 4 | (rec.italic ? 64 : 0);
        const desc = add('<</Type/FontDescriptor/FontName/' + fname + '/Flags ' + flags + '/FontBBox[' + f.bbox.map((v) => Math.round(v * k)).join(' ') + ']/ItalicAngle ' + nf(f.italic) + '/Ascent ' + Math.round(f.asc * k) + '/Descent ' + Math.round(f.desc * k) + '/CapHeight ' + Math.round((f.cap || f.asc * 0.7) * k) + '/StemV 80/' + (f.cff ? 'FontFile3' : 'FontFile2') + ' ' + file + ' 0 R>>', null);
        const gl = [...rec.used.keys()].sort((a, b) => a - b);
        const W = gl.map((g) => g + '[' + Math.round(f.adv(g) * k) + ']').join(' ');
        const cid = add('<</Type/Font/Subtype/' + (f.cff ? 'CIDFontType0' : 'CIDFontType2') + '/BaseFont/' + fname + '/CIDSystemInfo<</Registry(Adobe)/Ordering(Identity)/Supplement 0>>/FontDescriptor ' + desc + ' 0 R/DW 1000/W[' + W + ']' + (f.cff ? '' : '/CIDToGIDMap/Identity') + '>>', null);
        const pairs = gl.map((g) => '<' + hex4(g) + '> <' + (rec.used.get(g) > 0xffff ? (() => { const c = rec.used.get(g) - 0x10000; return hex4(0xd800 + (c >> 10)) + hex4(0xdc00 + (c & 0x3ff)); })() : hex4(rec.used.get(g))) + '>');
        let cm = '/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CIDSystemInfo<</Registry(Adobe)/Ordering(UCS)/Supplement 0>> def /CMapName/Adobe-Identity-UCS def /CMapType 2 def 1 begincodespacerange <0000> <FFFF> endcodespacerange\n';
        for (let i = 0; i < pairs.length; i += 100) { const ch = pairs.slice(i, i + 100); cm += ch.length + ' beginbfchar\n' + ch.join('\n') + '\nendbfchar\n'; }
        cm += 'endcmap CMapName currentdict /CMap defineresource pop end end';
        const tu = await stream('', enc.encode(cm));
        fontObj.set(rec.id, add('<</Type/Font/Subtype/Type0/BaseFont/' + fname + '/Encoding/Identity-H/DescendantFonts[' + cid + ' 0 R]/ToUnicode ' + tu + ' 0 R>>', null));
      }
      // imagens
      const imgObj = new Map();
      for (const r of this.images.values()) {
        if (!r.used) continue;
        const base = '/Type/XObject/Subtype/Image/Width ' + r.w + '/Height ' + r.h + '/BitsPerComponent 8/Interpolate true';
        if (r.jpeg) imgObj.set(r.id, add(base + '/ColorSpace/DeviceRGB/Filter/DCTDecode/Length ' + r.jpeg.length, r.jpeg));
        else {
          const sm = await stream('/Type/XObject/Subtype/Image/Width ' + r.w + '/Height ' + r.h + '/BitsPerComponent 8/ColorSpace/DeviceGray', r.a);
          imgObj.set(r.id, await stream(base + '/ColorSpace/DeviceRGB/SMask ' + sm + ' 0 R', r.rgb));
        }
      }
      const gsObj = new Map();
      for (const g of this.gs.values()) gsObj.set(g.name, add('<</Type/ExtGState/ca ' + nf(g.ca) + '/CA ' + nf(g.CA) + '>>', null));
      // páginas
      const pageNums = this.pages.map(() => 0);
      const ids = []; // reservar números das páginas para os links
      for (let i = 0; i < this.pages.length; i++) { ids.push(objs.length + i * 2); }
      for (let i = 0; i < this.pages.length; i++) {
        const p = this.pages[i];
        while (p.depth > 0) { p.ops.push('Q'); p.depth--; }
        const cs = await stream('', enc.encode(p.ops.join('\n')));
        const res = '<</Font<<' + [...p.fonts].filter((f) => fontObj.has(f)).map((f) => '/' + f + ' ' + fontObj.get(f) + ' 0 R').join('') + '>>/XObject<<' + [...p.imgs].map((f) => '/' + f + ' ' + imgObj.get(f) + ' 0 R').join('') + '>>/ExtGState<<' + [...p.gs].map((f) => '/' + f + ' ' + gsObj.get(f) + ' 0 R').join('') + '>>>>';
        const annots = [];
        for (const L of p.links) {
          if (L.target == null || L.target < 0 || L.target >= this.pages.length) continue;
          const x1 = L.x * PT, y1 = (p.h - L.y - L.h) * PT, x2 = (L.x + L.w) * PT, y2 = (p.h - L.y) * PT;
          annots.push(add('<</Type/Annot/Subtype/Link/Rect[' + [x1, y1, x2, y2].map(nf).join(' ') + ']/Border[0 0 0]/Dest[' + (ids[L.target]) + ' 0 R/Fit]>>', null));
        }
        const pn = add('<</Type/Page/Parent ' + pagesRoot + ' 0 R/MediaBox[0 0 ' + nf(p.w * PT) + ' ' + nf(p.h * PT) + ']/Contents ' + cs + ' 0 R/Resources ' + res + (annots.length ? '/Annots[' + annots.map((a) => a + ' 0 R').join(' ') + ']' : '') + '>>', null);
        pageNums[i] = pn;
      }
      // os números reservados precisam coincidir: refaz o destino dos links com os números reais
      objs.forEach((o) => { if (o && o.dict.includes('/Dest[')) o.dict = o.dict.replace(/\/Dest\[(\d+) 0 R/, (m, n) => { const i = ids.indexOf(+n); return '/Dest[' + (i >= 0 ? pageNums[i] : n) + ' 0 R'; }); });
      objs[catalog] = { dict: '<</Type/Catalog/Pages ' + pagesRoot + ' 0 R>>', data: null };
      objs[pagesRoot] = { dict: '<</Type/Pages/Kids[' + pageNums.map((n) => n + ' 0 R').join(' ') + ']/Count ' + pageNums.length + '>>', data: null };
      const info = add('<</Title' + pdfStr(this.title) + '/Producer(Estudio de Miolos - Craft Notes Unique)>>', null);
      // serialização
      const chunks = [], offs = []; let len = 0;
      const push = (u) => { chunks.push(u); len += u.length; };
      push(enc.encode('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n'));
      for (let i = 1; i < objs.length; i++) {
        const o = objs[i]; offs[i] = len;
        if (o.data) { push(enc.encode(i + ' 0 obj\n<<' + o.dict + '>>\nstream\n')); push(o.data); push(enc.encode('\nendstream\nendobj\n')); }
        else push(enc.encode(i + ' 0 obj\n' + o.dict + '\nendobj\n'));
      }
      const xr = len;
      let x = 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
      for (let i = 1; i < objs.length; i++) x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
      x += 'trailer\n<</Size ' + objs.length + '/Root ' + catalog + ' 0 R/Info ' + info + ' 0 R>>\nstartxref\n' + xr + '\n%%EOF\n';
      push(enc.encode(x));
      return new Blob(chunks, { type: 'application/pdf' });
    }
  }

  /* ---------- "canvas" que escreve no PDF ---------- */
  const colorCache = new Map();
  let colorCtx = null;
  function parseColor(s) {
    let r = colorCache.get(s); if (r) return r;
    if (!colorCtx) colorCtx = document.createElement('canvas').getContext('2d');
    colorCtx.fillStyle = '#000000'; colorCtx.fillStyle = String(s);
    const v = colorCtx.fillStyle; let m;
    if ((m = /^#([0-9a-f]{6})$/i.exec(v))) r = { r: parseInt(m[1].slice(0, 2), 16) / 255, g: parseInt(m[1].slice(2, 4), 16) / 255, b: parseInt(m[1].slice(4, 6), 16) / 255, a: 1 };
    else if ((m = /^rgba?\(([^)]+)\)$/.exec(v))) { const p = m[1].split(',').map((t) => parseFloat(t)); r = { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p.length > 3 ? p[3] : 1 }; }
    else r = { r: 0, g: 0, b: 0, a: 1 };
    colorCache.set(s, r); return r;
  }
  let measureCtx = null;
  const real = () => measureCtx || (measureCtx = document.createElement('canvas').getContext('2d'));
  function parseCssFont(f) {
    const m = /^(?:(italic|oblique)\s+)?(?:(\d{3}|normal|bold)\s+)?([\d.]+)px\s+(.+)$/.exec(String(f).trim());
    if (!m) return null;
    const fams = []; m[4].replace(/"([^"]+)"|'([^']+)'|([^,]+)/g, (_, a, b, c) => { const n = (a || b || c || '').trim(); if (n) fams.push(n); });
    return { italic: !!m[1], weight: m[2] === 'bold' ? 700 : m[2] === 'normal' || !m[2] ? 400 : +m[2], size: +m[3], fams, css: m[4] };
  }

  const SAVED = ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'globalAlpha', 'font', 'textAlign', 'textBaseline', 'letterSpacing'];
  class Ctx {
    constructor(doc, page) {
      this.doc = doc; this.pg = page; this.m = [1, 0, 0, 1, 0, 0]; this.dash = []; this.stack = [];
      this.fillStyle = '#000000'; this.strokeStyle = '#000000'; this.lineWidth = 1; this.lineCap = 'butt'; this.lineJoin = 'miter'; this.miterLimit = 10;
      this.globalAlpha = 1; this.font = '10px sans-serif'; this.textAlign = 'start'; this.textBaseline = 'alphabetic'; this.letterSpacing = '0px';
      this.path = []; this.cp = null; this.sp = null;
    }
    /* transformações */
    save() { const s = { m: this.m.slice(), dash: this.dash.slice() }; SAVED.forEach((k) => { s[k] = this[k]; }); this.stack.push(s); this.pg.ops.push('q'); this.pg.depth++; }
    restore() { const s = this.stack.pop(); if (!s) return; this.m = s.m; this.dash = s.dash; SAVED.forEach((k) => { this[k] = s[k]; }); this.pg.ops.push('Q'); this.pg.depth--; }
    translate(x, y) { this.m = mul(this.m, [1, 0, 0, 1, x, y]); }
    scale(x, y) { this.m = mul(this.m, [x, 0, 0, y, 0, 0]); }
    rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [c, s, -s, c, 0, 0]); }
    transform(a, b, c, d, e, f) { this.m = mul(this.m, [a, b, c, d, e, f]); }
    setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; }
    resetTransform() { this.m = [1, 0, 0, 1, 0, 0]; }
    setLineDash(d) { this.dash = (d || []).map(Number); }
    tp(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
    up(X, Y) { const m = this.m, det = m[0] * m[3] - m[1] * m[2] || 1e-12, dx = X - m[4], dy = Y - m[5]; return [(m[3] * dx - m[2] * dy) / det, (-m[1] * dx + m[0] * dy) / det]; }
    scl() { return Math.sqrt(Math.abs(this.m[0] * this.m[3] - this.m[1] * this.m[2])) || 1e-6; }
    /* caminhos */
    beginPath() { this.path = []; this.cp = null; this.sp = null; }
    moveTo(x, y) { const p = this.tp(x, y); this.path.push(['m', p]); this.cp = p; this.sp = p; }
    lineTo(x, y) { if (!this.cp) return this.moveTo(x, y); const p = this.tp(x, y); this.path.push(['l', p]); this.cp = p; }
    closePath() { if (!this.cp) return; this.path.push(['h']); this.cp = this.sp; }
    rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); this.moveTo(x, y); }
    bezierCurveTo(a, b, c, d, e, f) { if (!this.cp) this.moveTo(a, b); const p1 = this.tp(a, b), p2 = this.tp(c, d), p3 = this.tp(e, f); this.path.push(['c', p1, p2, p3]); this.cp = p3; }
    quadraticCurveTo(a, b, c, d) {
      if (!this.cp) this.moveTo(a, b);
      const q = this.tp(a, b), p = this.tp(c, d), s = this.cp;
      this.path.push(['c', [s[0] + 2 / 3 * (q[0] - s[0]), s[1] + 2 / 3 * (q[1] - s[1])], [p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1])], p]); this.cp = p;
    }
    ellipse(cx, cy, rx, ry, rot, a0, a1, ccw) {
      const TAU = Math.PI * 2; let da = a1 - a0;
      if (!ccw) { if (da >= TAU) da = TAU; else { da %= TAU; if (da < 0) da += TAU; } } else { if (da <= -TAU) da = -TAU; else { da %= TAU; if (da > 0) da -= TAU; } }
      const cr = Math.cos(rot), sr = Math.sin(rot);
      const P = (t) => [cx + rx * Math.cos(t) * cr - ry * Math.sin(t) * sr, cy + rx * Math.cos(t) * sr + ry * Math.sin(t) * cr];
      const D = (t) => [-rx * Math.sin(t) * cr - ry * Math.cos(t) * sr, -rx * Math.sin(t) * sr + ry * Math.cos(t) * cr];
      const s = P(a0); if (this.cp) this.lineTo(s[0], s[1]); else this.moveTo(s[0], s[1]);
      if (da === 0) return;
      const n = Math.max(1, Math.ceil(Math.abs(da) / (Math.PI / 2) - 1e-9)), dl = da / n, k = 4 / 3 * Math.tan(dl / 4);
      for (let i = 0; i < n; i++) {
        const t0 = a0 + i * dl, t1 = t0 + dl, p0 = P(t0), p3 = P(t1), d0 = D(t0), d1 = D(t1);
        this.bezierCurveTo(p0[0] + k * d0[0], p0[1] + k * d0[1], p3[0] - k * d1[0], p3[1] - k * d1[1], p3[0], p3[1]);
      }
    }
    arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
    arcTo(x1, y1, x2, y2, r) {
      if (!this.cp) return this.moveTo(x1, y1);
      const [x0, y0] = this.up(this.cp[0], this.cp[1]);
      const ax = x0 - x1, ay = y0 - y1, bx = x2 - x1, by = y2 - y1, la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      const cross = ax * by - ay * bx;
      if (!r || la < 1e-9 || lb < 1e-9 || Math.abs(cross) < 1e-9 * la * lb) return this.lineTo(x1, y1);
      const ux = ax / la, uy = ay / la, vx = bx / lb, vy = by / lb, ang = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy))), t = r / Math.tan(ang / 2);
      const t0 = [x1 + ux * t, y1 + uy * t], t2 = [x1 + vx * t, y1 + vy * t], bis = [ux + vx, uy + vy], bl = Math.hypot(bis[0], bis[1]), dist = r / Math.sin(ang / 2);
      const c = [x1 + bis[0] / bl * dist, y1 + bis[1] / bl * dist];
      this.lineTo(t0[0], t0[1]);
      const s0 = Math.atan2(t0[1] - c[1], t0[0] - c[0]); let s1 = Math.atan2(t2[1] - c[1], t2[0] - c[0]), d = s1 - s0;
      while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI;
      this.arc(c[0], c[1], r, s0, s0 + d, d < 0);
    }
    /* pintura */
    emitPath(path) {
      const o = this.pg.ops, H = this.pg.h, X = (p) => nf(p[0] * PT) + ' ' + nf((H - p[1]) * PT);
      for (const s of path) {
        if (s[0] === 'm') o.push(X(s[1]) + ' m'); else if (s[0] === 'l') o.push(X(s[1]) + ' l'); else if (s[0] === 'c') o.push(X(s[1]) + ' ' + X(s[2]) + ' ' + X(s[3]) + ' c'); else o.push('h');
      }
    }
    rg(c, stroke) { return nf(c.r) + ' ' + nf(c.g) + ' ' + nf(c.b) + (stroke ? ' RG' : ' rg'); }
    useAlpha(ca, CA) { if (ca >= 0.999 && CA >= 0.999) return; const n = this.doc.gsName(ca, CA); this.pg.gs.add(n); this.pg.ops.push('/' + n + ' gs'); }
    paintPath(path, mode, rule) {
      if (!path.length) return;
      const o = this.pg.ops, ga = this.globalAlpha;
      o.push('q');
      if (mode === 'fill') { const c = parseColor(this.fillStyle); o.push(this.rg(c, false)); this.useAlpha(ga * c.a, 1); this.emitPath(path); o.push(rule === 'evenodd' ? 'f*' : 'f'); }
      else {
        const c = parseColor(this.strokeStyle), k = this.scl() * PT;
        o.push(this.rg(c, true)); this.useAlpha(1, ga * c.a);
        o.push(nf(Math.max(0.01, this.lineWidth * k)) + ' w');
        o.push({ butt: 0, round: 1, square: 2 }[this.lineCap] + ' J'); o.push({ miter: 0, round: 1, bevel: 2 }[this.lineJoin] + ' j'); o.push(nf(this.miterLimit) + ' M');
        const d = this.dash.length % 2 ? this.dash.concat(this.dash) : this.dash;
        o.push('[' + d.map((v) => nf(v * k)).join(' ') + '] 0 d');
        this.emitPath(path); o.push('S');
      }
      o.push('Q');
    }
    fill(rule) { this.paintPath(this.path, 'fill', typeof rule === 'string' ? rule : 'nonzero'); }
    stroke() { this.paintPath(this.path, 'stroke'); }
    clip() { if (!this.path.length) return; this.emitPath(this.path); this.pg.ops.push('W n'); }
    fillRect(x, y, w, h) {
      const keep = [this.path, this.cp, this.sp]; this.beginPath(); this.rect(x, y, w, h); this.paintPath(this.path, 'fill'); [this.path, this.cp, this.sp] = keep;
    }
    strokeRect(x, y, w, h) { const keep = [this.path, this.cp, this.sp]; this.beginPath(); this.rect(x, y, w, h); this.paintPath(this.path, 'stroke'); [this.path, this.cp, this.sp] = keep; }
    clearRect() { /* o papel já é branco */ }
    /* texto */
    measureText(s) { const r = real(); r.font = this.font; if ('letterSpacing' in r) r.letterSpacing = this.letterSpacing; r.textBaseline = this.textBaseline; r.textAlign = 'left'; return r.measureText(s); }
    fillText(s, x, y) {
      s = String(s); if (!s) return;
      const f = parseCssFont(this.font); if (!f) return;
      const doc = this.doc;
      if (doc.dry) { for (const fam of f.fams.slice(0, 1)) doc.reqs.set(fam + '|' + f.weight + '|' + (f.italic ? 1 : 0), { fam, weight: f.weight, italic: f.italic }); return; }
      let rec = null;
      for (const fam of f.fams) { rec = doc.pickFont(fam, f.weight, f.italic); if (rec) break; }
      const chars = Array.from(s), gl = rec ? chars.map((ch) => rec.font.lookup(ch.codePointAt(0))) : null;
      if (!rec || gl.some((g, i) => !g && !/\s/.test(chars[i]))) return this.rasterText(s, x, y, f);
      const r = real(); r.font = this.font; if ('letterSpacing' in r) r.letterSpacing = this.letterSpacing; r.textBaseline = this.textBaseline; r.textAlign = 'left';
      const m0 = r.measureText(s), total = m0.width, al = this.textAlign;
      const x0 = al === 'center' ? x - total / 2 : (al === 'right' || al === 'end') ? x - total : x, yb = y - (m0.alphabeticBaseline || 0);
      let prev = 0; const f1 = rec.font, k = f.size / f1.upm, arr = [];
      let pref = '';
      chars.forEach((ch, i) => {
        pref += ch; const w = i === chars.length - 1 ? total : r.measureText(pref).width, want = w - prev; prev = w;
        const nat = f1.adv(gl[i]) * k; rec.used.set(gl[i], ch.codePointAt(0));
        arr.push('<' + hex4(gl[i]) + '>'); const adj = (nat - want) / f.size * 1000; if (Math.abs(adj) > 0.05) arr.push(nf(adj));
      });
      const m = this.m, base = [PT * m[0], -PT * m[1], PT * m[2], -PT * m[3], PT * m[4], PT * (this.pg.h - m[5])], T0 = mul(base, [1, 0, 0, -1, x0, yb]), T = (f.italic && !rec.italic) ? mul(T0, [1, 0, 0.22, 1, 0, 0]) : T0;
      const c = parseColor(this.fillStyle), o = this.pg.ops; this.pg.fonts.add(rec.id);
      o.push('q'); o.push(this.rg(c, false)); this.useAlpha(this.globalAlpha * c.a, 1);
      o.push('BT /' + rec.id + ' ' + nf(f.size) + ' Tf ' + T.map((v) => nf(v)).join(' ') + ' Tm [' + arr.join('') + '] TJ ET'); o.push('Q');
    }
    rasterText(s, x, y, f) {
      this.doc.failedText++;
      const r = real(); r.font = this.font; if ('letterSpacing' in r) r.letterSpacing = this.letterSpacing; r.textBaseline = 'alphabetic'; r.textAlign = 'left';
      const m0 = r.measureText(s), w = m0.width, asc = m0.fontBoundingBoxAscent || f.size, desc = m0.fontBoundingBoxDescent || f.size * 0.3;
      const al = this.textAlign, x0 = al === 'center' ? x - w / 2 : (al === 'right' || al === 'end') ? x - w : x;
      const bm = this.textBaseline === 'alphabetic' ? 0 : (() => { r.textBaseline = this.textBaseline; return r.measureText(s).alphabeticBaseline || 0; })(), yb = y - bm;
      const res = Math.max(1, Math.min(10, 11.8 * this.scl())), pad = f.size * 0.15;
      const cv = document.createElement('canvas'); cv.width = Math.min(8000, Math.ceil((w + 2 * pad) * res)); cv.height = Math.min(4000, Math.ceil((asc + desc + 2 * pad) * res));
      const g = cv.getContext('2d'); g.font = (f.italic ? 'italic ' : '') + f.weight + ' ' + (f.size * res) + 'px ' + f.css; if ('letterSpacing' in g) g.letterSpacing = (parseFloat(this.letterSpacing) || 0) * res + 'px';
      g.fillStyle = this.fillStyle; g.textBaseline = 'alphabetic'; g.fillText(s, pad * res, (pad + asc) * res);
      this.drawImage(cv, x0 - pad, yb - asc - pad, cv.width / res, cv.height / res);
    }
    /* imagens */
    drawImage(im, a, b, c, d, e, f, g, h) {
      if (this.doc.dry) return;
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height; if (!iw || !ih) return;
      let sx = 0, sy = 0, sw = iw, sh = ih, dx, dy, dw, dh;
      if (arguments.length >= 9) { sx = a; sy = b; sw = c; sh = d; dx = e; dy = f; dw = g; dh = h; } else { dx = a; dy = b; dw = c == null ? iw : c; dh = d == null ? ih : d; }
      if (!sw || !sh || !dw || !dh) return;
      const kx = dw / sw, ky = dh / sh, X = dx - sx * kx, Y = dy - sy * ky, W = iw * kx, H = ih * ky, crop = sx !== 0 || sy !== 0 || sw !== iw || sh !== ih;
      const rec = this.doc.imageRec(im); rec.used = true; this.pg.imgs.add(rec.id);
      const o = this.pg.ops, m = this.m, base = [PT * m[0], -PT * m[1], PT * m[2], -PT * m[3], PT * m[4], PT * (this.pg.h - m[5])], M = mul(base, [W, 0, 0, -H, X, Y + H]);
      o.push('q');
      if (crop) { const keep = [this.path, this.cp, this.sp]; this.beginPath(); this.rect(dx, dy, dw, dh); this.emitPath(this.path); o.push('W n'); [this.path, this.cp, this.sp] = keep; }
      this.useAlpha(this.globalAlpha, this.globalAlpha);
      o.push(M.map((v) => nf(v)).join(' ') + ' cm /' + rec.id + ' Do'); o.push('Q');
    }
  }

  /* ---------- carregamento de fontes ---------- */
  const fontBuf = new Map(); // chave → ArrayBuffer (sfnt) | null
  const slug = (f) => f.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  async function fetchCached(url) {
    try {
      if (typeof caches !== 'undefined') {
        const ca = await caches.open('estudio-fontes-v1'), hit = await ca.match(url);
        if (hit) return await hit.arrayBuffer();
        const r = await fetch(url); if (!r.ok) return null;
        await ca.put(url, r.clone()); return await r.arrayBuffer();
      }
      const r = await fetch(url); return r.ok ? await r.arrayBuffer() : null;
    } catch (e) { return null; }
  }
  /** Fontes do Google: arquivos .woff do pacote Fontsource (cdn.jsdelivr.net), convertidos para TTF/OTF no navegador. */
  const Vetor = {
    Doc, woffToSfnt, parseFont, fontBuf,
    googleFont: async (fam, weight, italic) => {
      const id = slug(fam), ws = [...new Set([weight, 400, 700, 300, 500, 600])];
      for (const it of italic ? ['italic', 'normal'] : ['normal']) {
        for (const w of ws) {
          const buf = await fetchCached('https://cdn.jsdelivr.net/npm/@fontsource/' + id + '/files/' + id + '-latin-' + w + '-' + it + '.woff');
          if (buf) { try { return { buf: await woffToSfnt(buf), weight: w, italic: it === 'italic' }; } catch (e) { /* tenta o próximo */ } }
        }
      }
      return null;
    },
    /** carrega as fontes pedidas no ensaio. userFonts: [{family, load:()=>Promise<ArrayBuffer>}] */
    async loadFonts(reqs, userFonts, prog) {
      const users = new Map((userFonts || []).map((u) => [u.family.toLowerCase(), u]));
      const list = [...reqs.values()], missing = new Set(); let done = 0;
      const jobs = list.map((q) => async () => {
        const key = q.fam.toLowerCase() + '|' + q.weight + '|' + (q.italic ? 1 : 0);
        if (!fontBuf.has(key)) {
          let got = null;
          if (users.has(q.fam.toLowerCase())) { try { got = { buf: await users.get(q.fam.toLowerCase()).load(), weight: 400, italic: false, user: true }; } catch (e) { } }
          else if (!/^(sans-serif|serif|monospace|cursive|system-ui)$/i.test(q.fam)) got = await Vetor.googleFont(q.fam, q.weight, q.italic).catch(() => null);
          fontBuf.set(key, got);
        }
        if (!fontBuf.get(key)) missing.add(q.fam);
        done++; if (prog) prog(done / list.length);
      });
      let i = 0; await Promise.all(Array(Math.min(4, jobs.length)).fill(0).map(async () => { while (i < jobs.length) await jobs[i++](); }));
      return missing;
    },
    /** entrega ao documento todas as fontes carregadas */
    useLoaded(doc, reqs) {
      const seen = new Set();
      for (const q of reqs.values()) {
        const got = fontBuf.get(q.fam.toLowerCase() + '|' + q.weight + '|' + (q.italic ? 1 : 0)); if (!got) continue;
        const k = q.fam.toLowerCase() + '|' + got.weight + '|' + (got.italic ? 1 : 0); if (seen.has(k)) continue; seen.add(k);
        try { doc.addFont(q.fam, got.weight, got.italic, got.buf.slice ? got.buf.slice(0) : got.buf); } catch (e) { console.warn('Fonte não embutida', q.fam, e); }
      }
    },
  };
  window.Vetor = Vetor;
})();
