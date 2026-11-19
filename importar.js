/* Importar PDF — transforma as páginas de um PDF em elementos editáveis (textos, formas, traços e imagens).
   Lê o PDF com o pdf.js (pasta vendor/pdfjs), percorre os comandos de desenho de cada página e recria cada um
   como elemento do editor, na mesma ordem e posição. PDFs feitos por programas (Canva, Word, Illustrator…)
   voltam com textos e formas de verdade; PDFs de scanner (só imagem) entram como imagem. */
(function () {
  'use strict';
  const MM = 25.4 / 72, r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
  const MAXEL = 4000;

  /* ---------- matrizes: [a b c d e f], p' = (x·a + y·c + e, x·b + y·d + f); cat(m,n) = aplica m e depois n ---------- */
  const cat = (m, n) => [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3], m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]];
  const ap = (m, x, y) => [x * m[0] + y * m[2] + m[4], x * m[1] + y * m[3] + m[5]];
  const scl = (m) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));

  let lib = null;
  async function loadLib() {
    if (lib) return lib;
    const base = new URL('vendor/pdfjs/', document.baseURI).href;
    const m = await import(base + 'pdf.min.mjs');
    m.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
    lib = m; return m;
  }

  /* ---------- fontes: do PDF para as fontes do editor ---------- */
  const norm = (s) => String(s || '').replace(/^[A-Z]{6}\+/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function mapFont(f) {
    const raw = String((f && f.name) || '').replace(/^[A-Z]{6}\+/, ''), n = norm(raw);
    let weight = 400;
    if ((f && f.bold) || /bold|black|heavy/.test(n)) weight = 700; else if (/semibold|demi/.test(n)) weight = 600; else if (/medium/.test(n)) weight = 500;
    const italic = !!((f && f.italic) || /italic|oblique/.test(n));
    let fam = null;
    for (const [name] of FONTS) { const k = norm(name); if (n.includes(k)) { fam = name; break; } }
    const exact = !!fam;
    if (!fam) {
      if (/script|brush|hand|calligraph|vibes|cursive|signature|allura|lettering/.test(n)) fam = 'Great Vibes';
      else if (/times|georgia|garamond|palatino|minion|cambria|baskerv|didot|bodoni|serif|book|caslon|merriweather|playfair|lora/.test(n) && !/sans/.test(n)) fam = 'Lora';
      else if (f && f.fallbackName === 'serif' && !/sans/.test(n)) fam = 'Lora';
      else fam = 'Nunito';
    }
    return { fam, weight, italic, exact, orig: raw || 'fonte do PDF' };
  }

  /* ---------- cores ---------- */
  const hexOf = (a) => {
    if (typeof a === 'string') return /^#[0-9a-f]{6}$/i.test(a) ? a.toLowerCase() : null;
    if (Array.isArray(a) && a.length >= 3) { const h = (v) => ('0' + Math.max(0, Math.min(255, Math.round(+v))).toString(16)).slice(-2); return '#' + h(a[0]) + h(a[1]) + h(a[2]); }
    return null;
  };
  const patColor = (args, st) => { // gradientes e padrões: usa uma cor média, e conta como aproximação
    st.approx++;
    if (args && args[0] === 'RadialAxial' && Array.isArray(args[3]) && args[3].length) { const c = args[3]; const m = c[Math.floor((c.length - 1) / 2)]; return hexOf(m[1]) || hexOf(c[0][1]) || '#d9d9d9'; }
    return '#d9d9d9';
  };

  /* ---------- caminhos ---------- */
  function flatten(data, M) { // dados do pdf.js → subcaminhos de pontos em pixels da página
    const subs = []; let cur = null, i = 0;
    const P = (x, y) => ap(M, x, y);
    while (i < data.length) {
      const op = data[i++];
      if (op === 0) { cur = { pts: [P(data[i], data[i + 1])], closed: false }; subs.push(cur); i += 2; }
      else if (op === 1) { if (!cur) { cur = { pts: [], closed: false }; subs.push(cur); } cur.pts.push(P(data[i], data[i + 1])); i += 2; }
      else if (op === 2 || op === 3) {
        if (!cur) { cur = { pts: [P(data[i], data[i + 1])], closed: false }; subs.push(cur); }
        const p0 = cur.pts[cur.pts.length - 1];
        let c1, c2, p3;
        if (op === 2) { c1 = P(data[i], data[i + 1]); c2 = P(data[i + 2], data[i + 3]); p3 = P(data[i + 4], data[i + 5]); i += 6; }
        else { const q = P(data[i], data[i + 1]); p3 = P(data[i + 2], data[i + 3]); i += 4; c1 = [p0[0] + 2 / 3 * (q[0] - p0[0]), p0[1] + 2 / 3 * (q[1] - p0[1])]; c2 = [p3[0] + 2 / 3 * (q[0] - p3[0]), p3[1] + 2 / 3 * (q[1] - p3[1])]; }
        const len = Math.hypot(c1[0] - p0[0], c1[1] - p0[1]) + Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) + Math.hypot(p3[0] - c2[0], p3[1] - c2[1]);
        const n = Math.max(6, Math.min(28, Math.ceil(len / 2.5)));
        for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; cur.pts.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]]); }
      }
      else if (op === 4) { if (cur) { cur.closed = true; const f = cur.pts[0]; cur = { pts: [f.slice()], closed: false, fresh: true }; subs.push(cur); } }
      else break;
    }
    return subs.filter((s) => !s.fresh || s.pts.length > 1).filter((s) => s.pts.length > 1 || s.closed);
  }
  const isRect = (s) => {
    let p = s.pts.slice(); if (p.length === 5 && Math.hypot(p[0][0] - p[4][0], p[0][1] - p[4][1]) < .01) p = p.slice(0, 4);
    if (p.length !== 4) return null;
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]), eq = (a, b) => Math.abs(a - b) < .02;
    const ok = (eq(p[0][0], p[1][0]) && eq(p[1][1], p[2][1]) && eq(p[2][0], p[3][0]) && eq(p[3][1], p[0][1])) || (eq(p[0][1], p[1][1]) && eq(p[1][0], p[2][0]) && eq(p[2][1], p[3][1]) && eq(p[3][0], p[0][0]));
    return ok ? { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } : null;
  };

  /* ---------- uma página ---------- */
  async function convertPage(pdf, num, ctx) {
    const page = await pdf.getPage(num), vp = page.getViewport({ scale: 1 }), OPS = lib.OPS;
    const W = r2(vp.width * MM), H = r2(vp.height * MM);
    const st = { approx: 0, clip: 0, imgs: 0, texts: 0, paths: 0, fontsRep: new Map(), dropped: 0 };
    const els = []; let bg = '#FFFFFF', bgSet = false;
    const ol = await page.getOperatorList();
    const fonts = new Map(); const getFont = (id) => { if (fonts.has(id)) return fonts.get(id); let f = null; try { f = page.commonObjs.get(id); } catch (e) { /* sem fonte */ } const m = mapFont(f); fonts.set(id, m); return m; };
    const S0 = () => ({ ctm: vp.transform.slice(), fill: '#000000', stroke: '#000000', lw: 1, dash: null, fa: 1, sa: 1, clip: null });
    let s = S0(); const stack = []; const forms = [];
    let cmds = [], pendClip = null, clipNext = false;
    // texto
    let tm = [1, 0, 0, 1, 0, 0], tlm = [1, 0, 0, 1, 0, 0], tf = { id: null, size: 0, Tc: 0, Tw: 0, Th: 1, rise: 0, lead: 0, mode: 0 };
    let tbuf = [];
    const push = (e) => { if (els.length >= MAXEL) { st.dropped++; return; } els.push(e); };
    const flushText = () => { if (!tbuf.length) return; finishText(tbuf).forEach(push); tbuf = []; };
    const emit = (e) => { flushText(); push(e); };

    function finishText(runs) {
      // 1) junta pedaços da mesma linha; 2) junta linhas seguidas de um mesmo parágrafo
      const lines = [];
      for (const r of runs) {
        const L = lines[lines.length - 1];
        if (L && L.sig === r.sig && Math.abs(L.ang - r.ang) < .6 && Math.abs(L.size - r.size) < .25) {
          const ux = Math.cos(L.ang * Math.PI / 180), uy = Math.sin(L.ang * Math.PI / 180);
          const dx = (r.o[0] - L.end[0]) * ux + (r.o[1] - L.end[1]) * uy, dy = -(r.o[0] - L.end[0]) * uy + (r.o[1] - L.end[1]) * ux;
          if (Math.abs(dy) < L.size * .15 && dx > -L.size * .12 && dx < L.size * .42) {
            if (dx > L.size * .14 && !/\s$/.test(L.text) && !/^\s/.test(r.text)) L.text += ' ';
            L.text += r.text; L.end = r.end; L.w = Math.hypot(L.end[0] - L.o[0], L.end[1] - L.o[1]); continue;
          }
        }
        lines.push({ text: r.text, o: r.o, end: r.end, ang: r.ang, size: r.size, sig: r.sig, f: r.f, color: r.color, alpha: r.alpha, ls: r.ls, w: Math.hypot(r.end[0] - r.o[0], r.end[1] - r.o[1]) });
      }
      const out = []; let i = 0;
      while (i < lines.length) {
        const g = [lines[i]]; i++;
        while (i < lines.length) {
          const a = g[g.length - 1], b = lines[i];
          if (b.sig !== a.sig || Math.abs(b.ang) > .6 || Math.abs(a.ang) > .6 || Math.abs(b.size - a.size) > .25) break;
          const pitch = b.o[1] - a.o[1]; if (pitch < a.size * .9 || pitch > a.size * 2) break;
          if (g.length > 1) { const p0 = g[1].o[1] - g[0].o[1]; if (Math.abs(pitch - p0) > p0 * .12) break; }
          if (Math.abs(b.o[0] - a.o[0]) > 1) break;
          g.push(b); i++;
        }
        out.push(g);
      }
      return out.map((g) => {
        const L = g[0], size = L.size, pitch = g.length > 1 ? (g[1].o[1] - g[0].o[1]) : size * 1.25, lh = r2(Math.max(.9, Math.min(2.4, pitch / size)));
        const text = g.map((x) => x.text.replace(/\s+$/, '')).join('\n'), wpx = Math.max(...g.map((x) => x.w));
        const w = Math.max(.5, wpx * MM), lines = g.length, hmm = lines * lh * size * MM;
        const cs = Math.cos(L.ang * Math.PI / 180), sn = Math.sin(L.ang * Math.PI / 180), top = (lh * size * MM) / 2 + .37 * size * MM;
        const O = [L.o[0] * MM, L.o[1] * MM], cx = w / 2, cy = -top + hmm / 2;
        const C = [O[0] + cs * cx - sn * cy, O[1] + sn * cx + cs * cy];
        const e = E('text', r2(C[0] - w / 2), r2(C[1] - hmm / 2), r2(w), r2(hmm), { text, font: L.f.fam, size: r2(size), weight: L.f.weight, italic: L.f.italic, color: L.color, align: 'left', valign: 'top', lh, ls: L.ls || 0 });
        if (Math.abs(L.ang) > .05) e.rot = r2(L.ang);
        if (L.alpha < 1) e.opacity = r2(L.alpha);
        e.pdfFont = L.f.orig; e._need = { w: w, lines: g.map((x) => x.text.replace(/\s+$/, '')) };
        st.texts++; return e;
      });
    }

    const showGlyphs = (glyphs) => {
      if (!tf.id || !Array.isArray(glyphs)) return;
      const f = getFont(tf.id), fs = tf.size, Th = tf.Th;
      let x = 0, text = '';
      const M0 = cat(tm, s.ctm);
      for (const g of glyphs) {
        if (typeof g === 'number') { const adj = -g * fs * Th / 1000; if (-g > 170) text += ' '; x += adj; continue; }
        if (!g) continue;
        const ch = g.unicode != null && g.unicode !== '' ? g.unicode : (g.fontChar && g.fontChar.length === 1 ? g.fontChar : '');
        text += ch;
        x += ((g.width || 0) * fs / 1000 + tf.Tc + (g.isSpace ? tf.Tw : 0)) * Th;
      }
      const Mx = cat([1, 0, 0, 1, 0, tf.rise], M0), o = ap(Mx, 0, 0), en = ap(Mx, x, 0);
      const ang = Math.atan2(Mx[1], Mx[0]) * 180 / Math.PI, vs = Math.hypot(Mx[2], Mx[3]), size = Math.abs(fs) * vs;
      tm = cat([1, 0, 0, 1, x, 0], tm);
      if (tf.mode === 3 || !text.trim() || size < 1) return;
      if ((Mx[0] * Mx[3] - Mx[1] * Mx[2]) * (vp.transform[0] * vp.transform[3] - vp.transform[1] * vp.transform[2]) < 0) return; // texto espelhado: ignora
      const color = s.fill || '#000000';
      tbuf.push({ text, o, end: en, ang, size, f, color, alpha: s.fa, ls: size > 0 ? r3(tf.Tc / Math.abs(fs)) : 0, sig: [f.fam, f.weight, f.italic, color, s.fa].join('|') });
      if (!f.exact) st.fontsRep.set(f.orig, f.fam);
    };

    const sw = () => Math.max(.05, r3(s.lw * scl(s.ctm) * MM));
    function paint(op) {
      const fill = op >= 22 && op <= 27, stroke = op === 20 || op === 21 || op === 24 || op === 25 || op === 26 || op === 27;
      const close = op === 21 || op === 26 || op === 27, eo = op === 23 || op === 25 || op === 27;
      if (!cmds.length) return;
      let subs = []; cmds.forEach((c) => { subs = subs.concat(flatten(c, s.ctm)); }); cmds = [];
      if (!subs.length) return;
      if (close || fill) subs.forEach((q) => { if (fill || close) q.closed = true; });
      const fc = fill ? s.fill : null, sc = stroke ? s.stroke : null;
      if (!fc && !sc) return;
      // retângulo simples
      if (subs.length === 1) {
        const R = isRect(subs[0]);
        if (R && R.w > .05 && R.h > .05) {
          const pw = vp.width, ph = vp.height;
          if (fc && !sc && !bgSet && !els.length && !tbuf.length && R.w >= pw * .98 && R.h >= ph * .98 && s.fa >= .99) { bg = fc; bgSet = true; return; }
          const e = E('rect', r2(R.x * MM), r2(R.y * MM), r2(R.w * MM), r2(R.h * MM), { fill: fc || 'none', stroke: sc || 'none', sw: sc ? sw() : 0, radius: 0 });
          if (s.fa < 1) e.opacity = r2(s.fa); if (s.dash && sc) e.dash = s.dash.map((d) => r3(d * scl(s.ctm) * MM));
          st.paths++; return emit(e);
        }
      }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      subs.forEach((q) => q.pts.forEach((p) => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }));
      x0 *= MM; x1 *= MM; y0 *= MM; y1 *= MM;
      if (x1 < -2 || y1 < -2 || x0 > W + 2 || y0 > H + 2) { st.dropped++; return; }
      let w = x1 - x0, h = y1 - y0; if (w < .4) { x0 -= (.4 - w) / 2; w = .4; } if (h < .4) { y0 -= (.4 - h) / 2; h = .4; }
      const nz = (q) => ({ pts: q.pts.map((p) => [r3((p[0] * MM - x0) / w), r3((p[1] * MM - y0) / h)]), closed: !!q.closed });
      const parts = subs.map(nz), first = parts[0];
      const e = E('path', r2(x0), r2(y0), r2(w), r2(h), { pts: first.pts, closed: first.closed, smooth: false, fill: fc || 'none', stroke: sc || 'none', sw: sc ? sw() : 0 });
      if (parts.length > 1) { e.more = parts.slice(1); } if (eo) e.rule = 'evenodd';
      if (s.fa < 1 && fc) e.opacity = r2(s.fa); else if (s.sa < 1 && sc) e.opacity = r2(s.sa);
      if (s.dash && sc) e.dash = s.dash.map((d) => r3(d * scl(s.ctm) * MM));
      e.cap = ['butt', 'round', 'square'][s.cap || 0] || 'butt'; e.join = ['miter', 'round', 'bevel'][s.join || 0] || 'miter';
      st.paths++; emit(e);
    }

    async function image(img, mask) {
      if (!img) return; const m = s.ctm; // quadrado unitário
      const a = m[0], b = m[1], c = m[2], d = m[3], e0 = m[4], f0 = m[5];
      const w = Math.hypot(a, b), h = Math.hypot(c, d); if (w < .5 || h < .5) return;
      const ang = Math.atan2(b, a) * 180 / Math.PI, cx = e0 + (a + c) / 2, cy = f0 + (b + d) / 2;
      let src = null;
      try { src = await ctx.imageSrc(img, mask ? s.fill : null, s, W, H, { w, h, ang, cx, cy }); } catch (err) { console.warn('imagem', err); }
      if (!src) { st.dropped++; return; }
      let ex = r2((cx - w / 2) * MM), ey = r2((cy - h / 2) * MM), ew = r2(w * MM), eh = r2(h * MM);
      if (src.crop) { ex = r2(src.crop.x * MM); ey = r2(src.crop.y * MM); ew = r2(src.crop.w * MM); eh = r2(src.crop.h * MM); }
      const el = E('image', ex, ey, ew, eh, { src: src.key, fit: 'stretch', radius: 0 });
      if (Math.abs(ang) > .05 && !src.crop) el.rot = r2(ang);
      if (s.fa < 1) el.opacity = r2(s.fa);
      st.imgs++; emit(el);
    }

    for (let i = 0; i < ol.fnArray.length; i++) {
      const fn = ol.fnArray[i], a = ol.argsArray[i];
      switch (fn) {
        case OPS.save: stack.push(Object.assign({}, s, { ctm: s.ctm.slice() })); break;
        case OPS.restore: if (stack.length) s = stack.pop(); break;
        case OPS.transform: s.ctm = cat(Array.from(a && a[0] != null && typeof a[0] === 'object' ? a[0] : a), s.ctm); break;
        case OPS.paintFormXObjectBegin: forms.push(Object.assign({}, s, { ctm: s.ctm.slice() })); if (a && a[0]) s.ctm = cat(Array.from(a[0]), s.ctm); break;
        case OPS.paintFormXObjectEnd: if (forms.length) s = forms.pop(); break;
        case OPS.setLineWidth: s.lw = a[0]; break;
        case OPS.setLineCap: s.cap = a[0]; break;
        case OPS.setLineJoin: s.join = a[0]; break;
        case OPS.setDash: s.dash = a[0] && a[0].length ? Array.from(a[0]) : null; break;
        case OPS.setFillRGBColor: s.fill = hexOf(a[0]) || hexOf(a) || s.fill; break;
        case OPS.setStrokeRGBColor: s.stroke = hexOf(a[0]) || hexOf(a) || s.stroke; break;
        case OPS.setFillGray: case OPS.setFillCMYKColor: break;
        case OPS.setFillColorN: s.fill = hexOf(a && a[0]) || (a && a.length && typeof a[0] === 'string' && a[0] !== '' && a[0][0] !== '#' ? patColor(a, st) : s.fill); break;
        case OPS.setStrokeColorN: s.stroke = hexOf(a && a[0]) || (a && a.length && typeof a[0] === 'string' && a[0][0] !== '#' ? patColor(a, st) : s.stroke); break;
        case OPS.setGState: (a[0] || []).forEach(([k, v]) => { if (k === 'LW') s.lw = v; else if (k === 'D') s.dash = v[0] && v[0].length ? Array.from(v[0]) : null; else if (k === 'CA') s.sa = v; else if (k === 'ca') s.fa = v; else if (k === 'Font') { tf.id = v[0] ? (v[0].name || v[0]) : tf.id; tf.size = v[1]; } else if (k === 'SMask' && v) st.approx++; }); break;
        case OPS.constructPath: {
          const paintOp = a[0], data = a[1] && a[1][0];
          if (clipNext && paintOp === OPS.endPath && data) { // o caminho que vem depois de "clip" é a área de recorte, não um desenho
            clipNext = false; const subs = flatten(data, s.ctm), R = subs.length === 1 ? isRect(subs[0]) : null;
            if (R) s.clip = R; else st.clip++;
            break;
          }
          if (data) cmds.push(data);
          if (paintOp >= 20 && paintOp <= 27) paint(paintOp);
          else if (paintOp === OPS.endPath && !data) { if (pendClip) { st.clip++; if (pendClip.rect) s.clip = pendClip.rect; pendClip = null; } cmds = []; }
          break;
        }
        case OPS.stroke: case OPS.closeStroke: case OPS.fill: case OPS.eoFill: case OPS.fillStroke: case OPS.eoFillStroke: case OPS.closeFillStroke: case OPS.closeEOFillStroke: paint(fn); break;
        case OPS.endPath: if (pendClip) { st.clip++; if (pendClip.rect) s.clip = pendClip.rect; pendClip = null; } cmds = []; break;
        case OPS.clip: case OPS.eoClip: { clipNext = true; let subs = []; cmds.forEach((c) => { subs = subs.concat(flatten(c, s.ctm)); }); const R = subs.length === 1 ? isRect(subs[0]) : null; pendClip = { rect: R }; cmds = []; break; }
        case OPS.shadingFill: st.approx++; break;
        case OPS.beginText: tm = [1, 0, 0, 1, 0, 0]; tlm = tm.slice(); break;
        case OPS.endText: break;
        case OPS.setFont: tf.id = a[0]; tf.size = a[1]; break;
        case OPS.setCharSpacing: tf.Tc = a[0]; break;
        case OPS.setWordSpacing: tf.Tw = a[0]; break;
        case OPS.setHScale: tf.Th = a[0] / 100; break;
        case OPS.setLeading: tf.lead = a[0]; break;
        case OPS.setTextRise: tf.rise = a[0]; break;
        case OPS.setTextRenderingMode: tf.mode = a[0]; break;
        case OPS.setTextMatrix: tm = Array.from(a && a[0] != null && typeof a[0] === 'object' ? a[0] : a).slice(0, 6); tlm = tm.slice(); break;
        case OPS.moveText: tlm = cat([1, 0, 0, 1, a[0], a[1]], tlm); tm = tlm.slice(); break;
        case OPS.setLeadingMoveText: tf.lead = -a[1]; tlm = cat([1, 0, 0, 1, a[0], a[1]], tlm); tm = tlm.slice(); break;
        case OPS.nextLine: tlm = cat([1, 0, 0, 1, 0, -tf.lead], tlm); tm = tlm.slice(); break;
        case OPS.showText: showGlyphs(a[0]); break;
        case OPS.nextLineShowText: tlm = cat([1, 0, 0, 1, 0, -tf.lead], tlm); tm = tlm.slice(); showGlyphs(a[0]); break;
        case OPS.nextLineSetSpacingShowText: tf.Tw = a[0]; tf.Tc = a[1]; tlm = cat([1, 0, 0, 1, 0, -tf.lead], tlm); tm = tlm.slice(); showGlyphs(a[2]); break;
        case OPS.paintImageXObject: case OPS.paintImageXObjectRepeat: { const id = a[0]; flushText(); const obj = await ctx.getObj(page, id); await image(obj, false); break; }
        case OPS.paintInlineImageXObject: flushText(); await image(a[0], false); break;
        case OPS.paintImageMaskXObject: flushText(); await image(a[0], true); break;
        case OPS.paintSolidColorImageMask: { const m = s.ctm, R = { x: Math.min(m[4], m[4] + m[0] + m[2]), y: Math.min(m[5], m[5] + m[1] + m[3]), w: Math.abs(m[0]) + Math.abs(m[2]), h: Math.abs(m[1]) + Math.abs(m[3]) }; if (R.w > .05 && R.h > .05) emit(E('rect', r2(R.x * MM), r2(R.y * MM), r2(R.w * MM), r2(R.h * MM), { fill: s.fill, stroke: 'none', sw: 0, radius: 0 })); break; }
        default: break;
      }
    }
    flushText();
    page.cleanup();
    return { w: W, h: H, bg, els, st };
  }

  /* ---------- imagens: dados do pdf.js → arquivo guardado ---------- */
  function makeCtx() {
    const cache = new Map();
    const getObj = (page, id) => new Promise((res) => {
      let done = false; const fin = (o) => { if (!done) { done = true; res(o); } };
      try { const store = String(id).startsWith('g_') ? page.commonObjs : page.objs; store.get(id, fin); setTimeout(() => fin(null), 8000); } catch (e) { fin(null); }
    });
    async function imageSrc(img, maskColor, s, W, H, geo) {
      const iw = img.width || (img.bitmap && img.bitmap.width), ih = img.height || (img.bitmap && img.bitmap.height); if (!iw || !ih) return null;
      const cv = document.createElement('canvas'); cv.width = iw; cv.height = ih; const g = cv.getContext('2d');
      if (img.bitmap) g.drawImage(img.bitmap, 0, 0);
      else if (img.data) {
        const id = g.createImageData(iw, ih), o = id.data, d = img.data, kind = img.kind;
        if (kind === 3 || d.length === iw * ih * 4) o.set(d.subarray ? d.subarray(0, o.length) : d);
        else if (kind === 2 || d.length === iw * ih * 3) { for (let p = 0, q = 0; p < iw * ih; p++) { o[q++] = d[p * 3]; o[q++] = d[p * 3 + 1]; o[q++] = d[p * 3 + 2]; o[q++] = 255; } }
        else { const rb = (iw + 7) >> 3; for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) { const bit = (d[y * rb + (x >> 3)] >> (7 - (x & 7))) & 1, v = maskColor ? 255 : bit ? 255 : 0, q = (y * iw + x) * 4; o[q] = o[q + 1] = o[q + 2] = v; o[q + 3] = maskColor ? (bit ? 0 : 255) : 255; } }
        g.putImageData(id, 0, 0);
      } else return null;
      if (maskColor) { // máscara de cor única: pinta com a cor de preenchimento
        const t = document.createElement('canvas'); t.width = iw; t.height = ih; const tg = t.getContext('2d'); tg.fillStyle = maskColor; tg.fillRect(0, 0, iw, ih); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(cv, 0, 0); g.clearRect(0, 0, iw, ih); g.drawImage(t, 0, 0);
      }
      // recorte retangular (sem rotação): corta os pixels que ficariam fora da área visível
      let crop = null, out = cv;
      const clip = s.clip;
      if (Math.abs(geo.ang) < .05 || Math.abs(Math.abs(geo.ang) - 180) < .05) {
        const x0 = geo.cx - geo.w / 2, y0 = geo.cy - geo.h / 2, x1 = x0 + geo.w, y1 = y0 + geo.h;
        let cx0 = Math.max(x0, 0), cy0 = Math.max(y0, 0), cx1 = Math.min(x1, W / MM), cy1 = Math.min(y1, H / MM);
        if (clip) { cx0 = Math.max(cx0, clip.x); cy0 = Math.max(cy0, clip.y); cx1 = Math.min(cx1, clip.x + clip.w); cy1 = Math.min(cy1, clip.y + clip.h); }
        if (cx1 - cx0 < .5 || cy1 - cy0 < .5) return null;
        if (cx0 > x0 + .3 || cy0 > y0 + .3 || cx1 < x1 - .3 || cy1 < y1 - .3) {
          const sx = iw / geo.w, sy = ih / geo.h, rx = (cx0 - x0) * sx, ry = (cy0 - y0) * sy, rw = (cx1 - cx0) * sx, rh = (cy1 - cy0) * sy;
          const c2 = document.createElement('canvas'); c2.width = Math.max(1, Math.round(rw)); c2.height = Math.max(1, Math.round(rh));
          c2.getContext('2d').drawImage(cv, rx, ry, rw, rh, 0, 0, c2.width, c2.height); out = c2; crop = { x: cx0, y: cy0, w: cx1 - cx0, h: cy1 - cy0 };
        }
      }
      // tamanho máximo e formato (JPEG sem transparência, PNG com)
      const MAXS = 2600; let fc = out;
      if (Math.max(out.width, out.height) > MAXS) { const k = MAXS / Math.max(out.width, out.height), c3 = document.createElement('canvas'); c3.width = Math.round(out.width * k); c3.height = Math.round(out.height * k); c3.getContext('2d').drawImage(out, 0, 0, c3.width, c3.height); fc = c3; }
      const px = fc.getContext('2d').getImageData(0, 0, Math.min(fc.width, 64), Math.min(fc.height, 64)).data; let alpha = !!maskColor;
      if (!alpha) for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { alpha = true; break; }
      const key = (img._ik = img._ik || Math.random().toString(36)) + ':' + (crop ? [crop.x, crop.y, crop.w, crop.h].map((v) => v.toFixed(1)).join(',') : 'full') + ':' + (maskColor || '');
      let up = cache.get(key);
      if (!up) {
        const type = alpha ? 'image/png' : 'image/jpeg', blob = await new Promise((r) => fc.toBlob(r, type, .9));
        up = await Store.upload(blob, type); cache.set(key, up);
      }
      return { key: up, crop };
    }
    return { getObj, imageSrc };
  }

  /* ---------- pós-processo: mede o texto nas fontes do editor e alarga a caixa se precisar ---------- */
  async function fitTexts(pages) {
    const cv = document.createElement('canvas').getContext('2d'), used = new Set();
    pages.forEach((p) => p.els.forEach((e) => { if (e.type === 'text') used.add(`${e.italic ? 'italic ' : ''}${e.weight} 16px "${e.font}"`); }));
    await Promise.all([...used].map((f) => (document.fonts && document.fonts.load ? document.fonts.load(f).catch(() => null) : null)));
    pages.forEach((p) => p.els.forEach((e) => {
      if (e.type !== 'text' || !e._need) return;
      font(cv, e.size * PT, e.font, e.weight, e.italic);
      const mw = Math.max(...e._need.lines.map((t) => cv.measureText(t).width / F)), ls = (e.ls || 0) * e.size * PT * Math.max(...e._need.lines.map((t) => t.length));
      const need = mw + ls + .6; if (need > e.w) e.w = r2(need); else e.w = r2(e.w + .6);
      delete e._need;
    }));
  }

  /* ---------- tela: escolher arquivo, opções, progresso ---------- */
  const fmtErr = (err) => (err && err.name === 'PasswordException') ? 'Este PDF tem senha. Remova a senha e tente de novo.' : (err && err.name === 'InvalidPDFException') ? 'Não consegui ler este arquivo como PDF.' : 'Não consegui abrir este PDF.';
  function parseRange(txt, n) {
    const out = new Set(); String(txt || '').split(',').forEach((part) => { const t = part.trim(); if (!t) return; const m = /^(\d+)\s*-\s*(\d+)$/.exec(t); if (m) { let a = +m[1], b = +m[2]; if (a > b) [a, b] = [b, a]; for (let i = Math.max(1, a); i <= Math.min(n, b); i++) out.add(i); } else if (/^\d+$/.test(t) && +t >= 1 && +t <= n) out.add(+t); });
    return [...out].sort((a, b) => a - b);
  }
  async function pickFile() {
    return new Promise((res) => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/pdf,.pdf'; inp.style.display = 'none'; document.body.appendChild(inp);
      inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); res(f || null); };
      inp.addEventListener('cancel', () => { inp.remove(); res(null); }); inp.click();
    });
  }
  async function start(file) {
    file = file || await pickFile(); if (!file) return;
    toast('Abrindo o PDF…');
    let pdf;
    try { const L = await loadLib(); pdf = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; }
    catch (err) { console.warn(err); toast(fmtErr(err)); return; }
    const n = pdf.numPages, inEd = S.view === 'editor' && S.pid, base = file.name.replace(/\.pdf$/i, '');
    modal(`<div class="insroot imp"><h2>Importar PDF</h2><p class="hint"><b>${esc(file.name)}</b> · ${n} página${n > 1 ? 's' : ''}. Cada página vira uma página editável, no tamanho original, com textos, formas e imagens separados.</p>
      <h3>QUAIS PÁGINAS</h3>
      <label class="chk"><input type="radio" name="ipR" value="all" checked> Todas (${n})</label>
      <label class="chk"><input type="radio" name="ipR" value="sel"> Só estas <input type="text" id="ipRange" placeholder="Ex.: 1-3, 5" style="width:140px"></label>
      <h3>ONDE COLOCAR</h3>
      ${inEd ? `<label class="chk"><input type="radio" name="ipD" value="cur" checked> Neste projeto, depois da página ${S.cur + 1}</label>
      <label class="chk"><input type="radio" name="ipD" value="end"> Neste projeto, no fim</label>
      <label class="chk"><input type="radio" name="ipD" value="new"> Em um projeto novo</label>` : `<label class="chk"><input type="radio" name="ipD" value="new" checked> Em um projeto novo</label>`}
      <label class="f" id="ipNameL" ${inEd ? 'hidden' : ''}>Nome do projeto<input type="text" id="ipName" value="${esc(base)}" maxlength="80"></label>
      <p class="hint" id="ipInfo"></p>
      <div id="ipProg" hidden><div class="impbar"><i></i></div><p class="hint" id="ipMsg"></p></div>
      <div class="row" style="justify-content:flex-end" id="ipBtns"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="ipGo">Importar</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q);
      const dest = () => { const x = b.querySelector('input[name=ipD]:checked'); return x ? x.value : 'new'; };
      b.querySelectorAll('input[name=ipD]').forEach((r) => { r.onchange = () => { g('#ipNameL').hidden = dest() !== 'new'; }; });
      g('#ipRange').onfocus = () => { b.querySelector('input[name=ipR][value=sel]').checked = true; };
      let busy = false;
      g('#ipGo').onclick = async () => {
        if (busy) return;
        const pgs = b.querySelector('input[name=ipR]:checked').value === 'all' ? Array.from({ length: n }, (_, i) => i + 1) : parseRange(g('#ipRange').value, n);
        if (!pgs.length) { g('#ipInfo').textContent = 'Escolha ao menos uma página. Ex.: 1-3, 5'; return; }
        busy = true; g('#ipGo').disabled = true; g('#ipBtns').querySelector('[data-close]').disabled = true; g('#ipProg').hidden = false;
        const bar = g('.impbar i'), msg = g('#ipMsg'), ctx = makeCtx(), res = [], tot = { texts: 0, imgs: 0, paths: 0, approx: 0, clip: 0, dropped: 0 }, reps = new Map();
        try {
          for (let k = 0; k < pgs.length; k++) {
            msg.textContent = `Convertendo a página ${pgs[k]} (${k + 1} de ${pgs.length})…`; bar.style.width = (k / pgs.length * 100) + '%'; await new Promise((r) => setTimeout(r, 20));
            const r = await convertPage(pdf, pgs[k], ctx); res.push({ num: pgs[k], r });
            Object.keys(tot).forEach((key) => { tot[key] += r.st[key] || 0; }); r.st.fontsRep.forEach((v, key) => reps.set(key, v));
          }
          msg.textContent = 'Ajustando os textos…'; await fitTexts(res.map((x) => x.r));
          const pages = res.map(({ num, r }) => ({ id: uid('pg'), w: r.w, h: r.h, bg: r.bg, bgImg: null, name: `${base} · pág. ${num}`.slice(0, 60), els: r.els }));
          bar.style.width = '100%'; msg.textContent = 'Guardando…'; const pname = g('#ipName').value.trim() || base;
          if (dest() === 'new' || !inEd) {
            close(); await createProject(pname, { w: pages[0].w, h: pages[0].h }, pages);
          } else {
            const pos = dest() === 'cur' ? S.cur + 1 : S.order.length;
            change([], () => pages.forEach((pg, i) => { S.pages[pg.id] = pg; S.order.splice(pos + i, 0, pg.id); }));
            S.cur = pos; S.sel = []; close(); refreshAll();
          }
          const parts = [`${tot.texts} texto${tot.texts === 1 ? '' : 's'}`, `${tot.paths} forma${tot.paths === 1 ? '' : 's'}`, `${tot.imgs} imagem${tot.imgs === 1 ? '' : 'ns'}`];
          toast(`PDF importado: ${pages.length} página${pages.length > 1 ? 's' : ''} (${parts.join(', ')}).`);
          const notes = [];
          if (reps.size) notes.push(`Fontes trocadas por parecidas: ${[...reps].slice(0, 6).map(([a, c]) => `${a} → ${c}`).join(', ')}${reps.size > 6 ? '…' : ''}.`);
          if (tot.approx) notes.push(`${tot.approx} gradiente${tot.approx > 1 ? 's/efeitos foram aproximados' : '/efeito foi aproximado'} por cor lisa.`);
          if (tot.clip) notes.push('Recortes de formas não são mantidos (os de imagens retangulares sim).');
          if (tot.dropped) notes.push(`${tot.dropped} item${tot.dropped > 1 ? 's' : ''} fora da página ou acima do limite foram ignorados.`);
          if (notes.length && window.Avisos) Avisos.add('Importação de PDF · ' + notes.join(' '));
          if (notes.length) setTimeout(() => toast('Importado! Veja detalhes no sino 🔔'), 2800);
        } catch (err) { console.warn(err); busy = false; if (g('#ipGo')) { g('#ipGo').disabled = false; g('#ipBtns').querySelector('[data-close]').disabled = false; g('#ipProg').hidden = true; g('#ipInfo').textContent = 'Algo deu errado ao converter. ' + (err && err.message ? err.message : ''); } else toast('Algo deu errado ao converter o PDF.'); }
      };
    });
  }

  // botões: início e painel de páginas; também aceita arrastar um PDF para a janela
  const hl = window.loadHome;
  if (typeof hl === 'function') window.loadHome = async function () {
    const r = await hl.apply(this, arguments);
    try { const row = document.querySelector('#hSample'); if (row && !document.getElementById('hPdf')) { const b = document.createElement('button'); b.className = 'btn sm'; b.id = 'hPdf'; b.textContent = 'Importar PDF'; b.onclick = () => start(); row.insertAdjacentElement('afterend', b); } } catch (e) { /* segue */ }
    return r;
  };
  document.addEventListener('dragover', (e) => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')) e.preventDefault(); });
  document.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) { e.preventDefault(); start(f); } });
  window.Importar = { start, convertPage, makeCtx, fitTexts, loadLib, parseRange, fmtErr };
})();
