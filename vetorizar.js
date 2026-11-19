/* Vetorizar — PNG sem fundo vira widget vetorial editável (formas por cor) e PDF vira modelos de página.
   Tudo roda no navegador: paleta por "median cut", contornos por marching squares, simplificação RDP + suavização. */
(function () {
  'use strict';
  const r3 = (v) => Math.round(v * 1000) / 1000, r2 = (v) => Math.round(v * 100) / 100;
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();

  /* ---------- paleta (median cut) ---------- */
  function palette(px, n) {
    let boxes = [px.slice()];
    while (boxes.length < n) {
      let bi = -1, best = -1, ch = 0;
      boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let mn = 255, mx = 0; for (const p of b) { if (p[c] < mn) mn = p[c]; if (p[c] > mx) mx = p[c]; } const r = (mx - mn) * Math.sqrt(b.length); if (r > best) { best = r; bi = i; ch = c; } } });
      if (bi < 0 || best <= 0) break;
      const b = boxes[bi].sort((a, c) => a[ch] - c[ch]), m = b.length >> 1; boxes.splice(bi, 1, b.slice(0, m), b.slice(m));
    }
    return boxes.filter((b) => b.length).map((b) => { const s = [0, 0, 0]; b.forEach((p) => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }); return s.map((v) => v / b.length); });
  }

  /* ---------- contornos ---------- */
  function contours(F, W, H) { // F: campo (W×H) com valores 0..1; devolve polilinhas fechadas no cruzamento 0.5
    const segs = [], ek = (t, x, y) => (t === 'h' ? 'h' + x + ',' + y : 'v' + x + ',' + y), pt = new Map();
    const v = (x, y) => F[y * W + x];
    const hp = (x, y) => { const a = v(x, y), b = v(x + 1, y), t = (0.5 - a) / (b - a || 1e-9); return [x + t, y]; };
    const vp = (x, y) => { const a = v(x, y), b = v(x, y + 1), t = (0.5 - a) / (b - a || 1e-9); return [x, y + t]; };
    const adj = new Map(); const add = (a, b) => { if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push(b); adj.get(b).push(a); };
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
      const tl = v(x, y) >= 0.5, tr = v(x + 1, y) >= 0.5, br = v(x + 1, y + 1) >= 0.5, bl = v(x, y + 1) >= 0.5, c = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (c === 0 || c === 15) continue;
      const T = ek('h', x, y), B = ek('h', x, y + 1), L = ek('v', x, y), R = ek('v', x + 1, y);
      [[T, () => hp(x, y)], [B, () => hp(x, y + 1)], [L, () => vp(x, y)], [R, () => vp(x + 1, y)]].forEach(([k, f]) => { if (!pt.has(k)) pt.set(k, f()); });
      const ctr = (v(x, y) + v(x + 1, y) + v(x, y + 1) + v(x + 1, y + 1)) / 4 >= 0.5;
      const S = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: ctr ? [[L, T], [B, R]] : [[L, B], [T, R]], 6: [[T, B]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: ctr ? [[T, R], [L, B]] : [[T, L], [B, R]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]] }[c];
      S.forEach(([a, b]) => add(a, b));
    }
    const seen = new Set(), out = [];
    for (const [k0] of adj) {
      if (seen.has(k0)) continue;
      const poly = []; let prev = null, cur = k0, guard = 0;
      while (cur && !seen.has(cur) && guard++ < 1e6) { seen.add(cur); poly.push(pt.get(cur)); const nb = adj.get(cur), nx = nb.find((q) => q !== prev && !seen.has(q)); prev = cur; cur = nx; }
      if (poly.length >= 3) out.push(poly);
    }
    return out;
  }
  const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const q = P[(i + 1) % P.length]; a += P[i][0] * q[1] - q[0] * P[i][1]; } return a / 2; };
  function rdp(P, eps) {
    if (P.length < 3) return P; const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1; const st = [[0, P.length - 1]];
    while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; const [x1, y1] = P[a], [x2, y2] = P[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((P[i][0] - x1) * dy - (P[i][1] - y1) * dx) / L; if (d > md) { md = d; mi = i; } }
      if (md > eps && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
    return P.filter((_, i) => keep[i]);
  }
  function rdpClosed(P, eps) {
    let m = 0, md = -1; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (d > md) { md = d; m = i; } }
    const a = rdp(P.slice(0, m + 1), eps), b = rdp(P.slice(m).concat([P[0]]), eps); return a.concat(b.slice(1, -1));
  }
  const chaikin = (P) => { const o = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } return o; };
  function blur(M, W, H) { const o = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= W || yy >= H) { n++; continue; } s += M[yy * W + xx]; n++; } o[y * W + x] = s / n; } return o; }

  /* ---------- imagem → elementos ---------- */
  function trace(img, o) {
    o = Object.assign({ colors: 6, detail: 3, white: false, widthMm: 50, maxPx: 420 }, o);
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.min(1, o.maxPx / Math.max(iw, ih)), W = Math.max(2, Math.round(iw * k)), H = Math.max(2, Math.round(ih * k));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H).data, N = W * H, op = new Uint8Array(N), samp = [];
    for (let i = 0; i < N; i++) { const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3]; if (a >= 60 && !(o.white && r > 238 && gg > 238 && b > 238)) { op[i] = 1; if (i % 3 === 0 || N < 40000) samp.push([r, gg, b]); } }
    if (!samp.length) return { w: 0, h: 0, els: [], n: 0 };
    const pal = palette(samp, Math.max(1, Math.min(16, o.colors))), lab = new Int16Array(N).fill(-1), cache = new Map();
    for (let i = 0; i < N; i++) { if (!op[i]) continue; const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], key = (r >> 3) << 10 | (gg >> 3) << 5 | (b >> 3); let c = cache.get(key); if (c === undefined) { let bd = 1e9; c = 0; pal.forEach((p, j) => { const e = (p[0] - r) ** 2 + (p[1] - gg) ** 2 + (p[2] - b) ** 2; if (e < bd) { bd = e; c = j; } }); cache.set(key, c); } lab[i] = c; }
    const cnt = pal.map(() => 0); for (let i = 0; i < N; i++) if (lab[i] >= 0) cnt[lab[i]]++;
    const order = pal.map((_, i) => i).filter((i) => cnt[i] > 0).sort((a, b) => cnt[b] - cnt[a]);
    const eps = [1.6, 1.1, 0.8, 0.55, 0.35][o.detail - 1] || 0.8, speck = [40, 20, 10, 5, 2][o.detail - 1] || 10, s = o.widthMm / W, els = [], PW = W + 2, PH = H + 2;
    order.forEach((ci, idx) => {
      const M = new Float32Array(PW * PH); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (idx === 0 ? op[i] : lab[i] === ci) M[(y + 1) * PW + x + 1] = 1; }
      const F = blur(M, PW, PH), polys = [];
      contours(F, PW, PH).forEach((P) => { if (Math.abs(area(P)) < speck) return; let q = rdpClosed(P, eps); if (q.length < 3) return; q = chaikin(q); polys.push(q.map(([x, y]) => [(x - 1) * s, (y - 1) * s])); });
      if (!polys.length) return;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; polys.forEach((P) => P.forEach(([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }));
      const w = Math.max(0.4, x1 - x0), h = Math.max(0.4, y1 - y0), nz = (P) => ({ pts: P.map(([x, y]) => [r3((x - x0) / w), r3((y - y0) / h)]), closed: true }), parts = polys.map(nz);
      const e = E('path', r2(x0), r2(y0), r2(w), r2(h), { pts: parts[0].pts, closed: true, smooth: false, fill: hex(pal[ci]), stroke: 'none', sw: 0 });
      if (parts.length > 1) e.more = parts.slice(1); e.rule = 'evenodd'; els.push(e);
    });
    return { w: r2(W * s), h: r2(H * s), els, n: order.length };
  }

  const loadFile = (f) => new Promise((res) => { const u = URL.createObjectURL(f), im = new Image(); im.onload = () => res({ im, u }); im.onerror = () => { URL.revokeObjectURL(u); res(null); }; im.src = u; });
  function hasAlpha(im) { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 64, 64); const d = g.getImageData(0, 0, 64, 64).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 200) return true; return false; }

  async function openWidget(file, done) {
    const L = await loadFile(file); if (!L) { toast('Não consegui abrir essa imagem.'); return; }
    const alpha = hasAlpha(L.im); let res = null, tm = 0;
    modal(`<div class="insroot vec"><h2>Vetorizar widget</h2><p class="hint"><b>${esc(file.name)}</b>${alpha ? '' : ' · sem fundo transparente: se o fundo for branco, deixe a opção abaixo ligada.'} Cada cor vira uma forma que você edita no ModuLab.</p>
      <div class="vecpv"><div><small>Original</small><div class="vbox"><img src="${L.u}" alt=""></div></div><div><small>Vetorizado</small><div class="vbox"><canvas id="vcPv"></canvas></div></div></div>
      <div class="fgrid"><label class="pfield"><span>Cores: <b id="vcCn">6</b></span><input type="range" id="vcC" min="2" max="12" value="6"></label><label class="pfield"><span>Detalhe: <b id="vcDn">3</b></span><input type="range" id="vcD" min="1" max="5" value="3"></label></div>
      <label class="chk"><input type="checkbox" id="vcW"${alpha ? '' : ' checked'}> Tratar branco como transparente</label>
      <div class="fgrid"><label class="pfield"><span>Largura (mm)</span><input type="number" id="vcM" min="10" max="300" value="50"></label><label class="pfield"><span>Nome</span><input type="text" id="vcN" maxlength="60" value="${esc(file.name.replace(/\.[^.]+$/, ''))}"></label></div>
      <p class="hint" id="vcI"></p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="vcGo">Vetorizar e guardar</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q);
      const run = () => { clearTimeout(tm); tm = setTimeout(() => {
        g('#vcCn').textContent = g('#vcC').value; g('#vcDn').textContent = g('#vcD').value;
        try { res = trace(L.im, { colors: +g('#vcC').value, detail: +g('#vcD').value, white: g('#vcW').checked, widthMm: Math.max(10, +g('#vcM').value || 50), maxPx: 360 });
          if (res.els.length) previewCanvas(g('#vcPv'), { bg: '#FFFFFF', els: res.els }, res.w, res.h, 200, 200); g('#vcI').textContent = res.els.length ? `${res.els.length} forma${res.els.length > 1 ? 's' : ''}.` : 'Nada para vetorizar com essas opções.';
        } catch (e) { console.error(e); g('#vcI').textContent = 'Não consegui vetorizar essa imagem.'; }
      }, 120); };
      ['#vcC', '#vcD', '#vcW', '#vcM'].forEach((q) => { g(q).oninput = run; }); run();
      g('#vcGo').onclick = () => {
        const o = { colors: +g('#vcC').value, detail: +g('#vcD').value, white: g('#vcW').checked, widthMm: Math.max(10, +g('#vcM').value || 50), maxPx: 600 };
        let out; try { out = trace(L.im, o); } catch (e) { out = null; }
        if (!out || !out.els.length) { g('#vcI').textContent = 'Nada para guardar.'; return; }
        const it = { id: uid('l'), kind: 'wgt', cat: true, name: g('#vcN').value.trim() || 'Widget vetorizado', w: out.w, h: out.h, els: out.els, vetor: { cores: o.colors, detalhe: o.detail }, createdAt: Date.now() };
        Store.saveLib(it).then(() => { S.lib.push(it); URL.revokeObjectURL(L.u); close(); toast('Widget vetorizado e guardado no catálogo. Abra no ModuLab para editar. 💜'); if (done) done(it); }).catch(() => toast('Não consegui guardar esse widget.'));
      };
    });
  }

  /* ---------- PDF → modelos de página (ou planner) ---------- */
  async function openPdf(file, done) {
    if (!window.Importar || !Importar.loadLib) { toast('O leitor de PDF não está disponível.'); return; }
    toast('Abrindo o PDF…'); let pdf;
    try { const L = await Importar.loadLib(); pdf = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; } catch (e) { console.warn(e); toast(Importar.fmtErr(e)); return; }
    const n = pdf.numPages, base = file.name.replace(/\.pdf$/i, '');
    modal(`<div class="insroot imp"><h2>PDF para o catálogo</h2><p class="hint"><b>${esc(file.name)}</b> · ${n} página${n > 1 ? 's' : ''}. Textos, formas e imagens viram elementos editáveis.</p>
      <label class="f">Quais páginas<input type="text" id="pdR" placeholder="Todas (ou ex.: 1-3, 5)"></label>
      <label class="f">Guardar como<select id="pdK"><option value="tpl">Modelos de página (um por página)</option><option value="plan">Planner/caderno (todas juntas)</option></select></label>
      <label class="f">Nome<input type="text" id="pdN" maxlength="70" value="${esc(base)}"></label>
      <div id="pdProg" hidden><div class="impbar"><i></i></div><p class="hint" id="pdMsg"></p></div>
      <p class="hint" id="pdI"></p><div class="row" style="justify-content:flex-end" id="pdB"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="pdGo">Vetorizar e guardar</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q); let busy = false;
      g('#pdGo').onclick = async () => {
        if (busy) return; const rt = g('#pdR').value.trim(), pgs = rt ? Importar.parseRange(rt, n) : Array.from({ length: n }, (_, i) => i + 1);
        if (!pgs.length) { g('#pdI').textContent = 'Escolha ao menos uma página.'; return; }
        busy = true; g('#pdGo').disabled = true; g('#pdProg').hidden = false; const bar = g('.impbar i'), msg = g('#pdMsg'), ctx = Importar.makeCtx(), res = [];
        try {
          for (let k = 0; k < pgs.length; k++) { msg.textContent = `Vetorizando a página ${pgs[k]} (${k + 1} de ${pgs.length})…`; bar.style.width = (k / pgs.length * 100) + '%'; await new Promise((r) => setTimeout(r, 20)); res.push({ num: pgs[k], r: await Importar.convertPage(pdf, pgs[k], ctx) }); }
          msg.textContent = 'Ajustando os textos…'; await Importar.fitTexts(res.map((x) => x.r));
          const nm = g('#pdN').value.trim() || base, now = Date.now(), made = [];
          if (g('#pdK').value === 'tpl') {
            for (const { num, r } of res) { const it = { id: uid('l'), kind: 'template', cat: true, name: pgs.length > 1 ? `${nm} · pág. ${num}` : nm, w: r.w, h: r.h, bg: r.bg, bgImg: null, els: r.els, vetor: { pdf: file.name, pagina: num }, createdAt: now }; await Store.saveLib(it); S.lib.push(it); made.push(it); }
          } else {
            const pages = {}, order = []; res.forEach(({ num, r }) => { const id = uid('pg'); pages[id] = { id, w: r.w, h: r.h, bg: r.bg, bgImg: null, name: `${nm} · pág. ${num}`.slice(0, 60), els: r.els }; order.push(id); });
            const f = pages[order[0]], meta = { kind: 'project', name: nm, size: { w: f.w, h: f.h }, view: 'single', coverAlone: false, weekStart: 0, style: { pal: 'lavanda', pair: 'assinatura' }, order, count: order.length };
            const it = { id: uid('l'), kind: 'planner', cat: true, name: nm, meta, pages, order, count: order.length, vetor: { pdf: file.name }, createdAt: now }; await Store.saveLib(it); S.lib.push(it); made.push(it);
          }
          close(); toast(`PDF vetorizado: ${made.length} item${made.length > 1 ? 'ns' : ''} no catálogo. 🌸`); if (done) done(made);
        } catch (err) { console.warn(err); busy = false; g('#pdGo').disabled = false; g('#pdProg').hidden = true; g('#pdI').textContent = 'Algo deu errado ao converter este PDF.'; }
      };
    });
  }

  window.Vetorizar = { contours, rdp, area, trace, openWidget, openPdf };
})();
