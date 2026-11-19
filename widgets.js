/* Widgets — personalização completa.
   Parte 1: motor (cores da paleta, marcadores, molduras, título, fundo) e novos tipos de elemento.
   Todo elemento pode ter um "wx" (decoração do widget). Sem wx, nada muda no desenho. */
(function () {
  'use strict';

  /* ---------- cores e fontes que acompanham a paleta do projeto ---------- */
  const tok = (v) => {
    if (typeof v !== 'string' || v[0] !== '@') return v;
    const st = (typeof styleOf === 'function' && S.meta) ? styleOf() : null;
    const p = st ? st.pal : PALS.lavanda;
    return p[v.slice(1)] || '#4A4E79';
  };
  const fnt = (v) => {
    const st = (typeof styleOf === 'function' && S.meta) ? styleOf() : { title: 'Quicksand', script: 'Great Vibes', body: 'Nunito' };
    return v === '@title' ? st.title : v === '@script' ? st.script : v === '@body' ? st.body : (v || st.title);
  };

  /* ---------- marcadores ---------- */
  const MARKS = [['square', 'Quadrado'], ['rounded', 'Arredondado'], ['circle', 'Bolinha'], ['dot', 'Bolinha cheia'], ['heart', 'Coração'], ['star', 'Estrela'], ['sparkle', 'Brilho'], ['flower', 'Flor'], ['diamond', 'Losango'], ['leaf', 'Folha'], ['drop', 'Gota'], ['hex', 'Hexágono'], ['tick', 'Visto'], ['dash', 'Traço'], ['num', 'Número'], ['none', 'Nenhum']];
  const MSHAPE = { heart: 'coracao', star: 'estrela', sparkle: 'brilho', leaf: 'folha', drop: 'gota', hex: 'hexagono' };
  function paintM(c, o) {
    if (o.mode === 'solid') fillIf(c, o.fill || o.stroke);
    else if (o.mode === 'soft') { c.save(); c.globalAlpha *= 0.3; fillIf(c, o.fill || o.stroke); c.restore(); }
    strokeIf(c, o.stroke, o.sw || 0.3);
  }
  function mark(c, k, cx, cy, s, o) {
    o = o || {}; const sw = o.sw || 0.3;
    if (k === 'none' || !s) return;
    if (k === 'square' || k === 'rounded') { rr(c, cx - s / 2, cy - s / 2, s, s, s * (k === 'square' ? 0.22 : 0.42)); paintM(c, o); return; }
    if (k === 'circle') { c.beginPath(); c.arc(cx, cy, s / 2, 0, 7); paintM(c, o); return; }
    if (k === 'dot') { c.beginPath(); c.arc(cx, cy, s * 0.32, 0, 7); fillIf(c, o.stroke); return; }
    if (MSHAPE[k]) { c.save(); c.translate(cx - s / 2, cy - s / 2); shapePath(c, MSHAPE[k], s, s); paintM(c, o); c.restore(); return; }
    if (k === 'flower') {
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.beginPath(); c.ellipse(cx + Math.cos(a) * s * 0.24, cy + Math.sin(a) * s * 0.24, s * 0.22, s * 0.22, 0, 0, 7); paintM(c, o); }
      c.beginPath(); c.ellipse(cx, cy, s * 0.1, s * 0.1, 0, 0, 7); fillIf(c, o.stroke); return;
    }
    if (k === 'diamond') { c.beginPath(); c.moveTo(cx, cy - s / 2); c.lineTo(cx + s * 0.42, cy); c.lineTo(cx, cy + s / 2); c.lineTo(cx - s * 0.42, cy); c.closePath(); paintM(c, o); return; }
    if (k === 'tick') { c.beginPath(); c.moveTo(cx - s * 0.36, cy); c.lineTo(cx - s * 0.08, cy + s * 0.28); c.lineTo(cx + s * 0.38, cy - s * 0.3); c.lineCap = 'round'; c.lineJoin = 'round'; strokeIf(c, o.stroke, sw * 1.5); c.lineCap = 'butt'; c.lineJoin = 'miter'; return; }
    if (k === 'dash') { c.beginPath(); c.moveTo(cx - s * 0.4, cy); c.lineTo(cx + s * 0.4, cy); c.lineCap = 'round'; strokeIf(c, o.stroke, sw * 1.5); c.lineCap = 'butt'; return; }
    if (k === 'num') { font(c, s * 0.95, o.font || 'Nunito', 600); c.fillStyle = o.stroke; T(c, (o.num || 1) + '.', cx, cy, 'center', 'middle'); }
  }
  window.mark = mark;

  /* ---------- tipos de elemento novos / reescritos ---------- */
  R.checklist = function (c, e) {
    const n = Math.max(1, e.n | 0), rh = e.h / n, sc = e.msize || 1, mk = e.box || 'square', sw = e.sw || 0.3;
    const bs = mk === 'none' ? 0 : Math.min(rh * 0.55, 4.2) * sc, fsz = e.size ? e.size * PT : Math.min(Math.min(rh * 0.55, 4.2) * 0.95, rh * 0.48);
    const fam = e.font || 'Nunito';
    for (let i = 0; i < n; i++) {
      const y = i * rh, by = y + (rh - bs) / 2, cy = y + rh / 2;
      mark(c, mk, bs / 2, cy, bs, { stroke: e.color, fill: e.mfc || e.color, mode: e.mfill || 'none', sw, num: i + (e.num0 || 1), font: fam });
      const lb = Array.isArray(e.items) ? e.items[i] : '';
      const gap = mk === 'none' ? 0 : 1.6;
      let lx = bs + (mk === 'none' ? 0.4 : 1.8);
      if (lb) { font(c, fsz, fam, 400); c.fillStyle = e.textColor || e.color; T(c, lb, bs + gap, e.lines ? by + bs - 0.5 : cy, 'left', e.lines ? 'alphabetic' : 'middle'); }
      if (e.lines && lx < e.w) { c.beginPath(); c.moveTo(lx, by + bs); c.lineTo(e.w, by + bs); strokeIf(c, e.stroke, sw * 0.85); }
    }
  };
  R.progress = function (c, e) {
    const rows = Math.max(1, e.rows | 0), segs = Math.max(2, e.segs | 0), lw = e.labelW > 0 ? e.w * e.labelW : 0, rh = e.h / rows;
    const bh = Math.min(rh * 0.5, 4.2), bw = e.w - lw - (lw ? 1.4 : 0);
    for (let r = 0; r < rows; r++) {
      const cy = r * rh + rh / 2, L = (e.labels || [])[r];
      if (L && lw) { font(c, Math.min(rh * 0.38, 3.6), e.font, 500); c.fillStyle = e.color; T(c, fitText(c, L, lw - 1), 0, cy, 'left', 'middle'); }
      const x0 = lw ? lw + 1.4 : 0, g = Math.min(0.7, bw / segs * 0.2), sw2 = (bw - g * (segs - 1)) / segs, val = ((e.vals || [])[r] || 0) * segs;
      for (let i = 0; i < segs; i++) {
        rr(c, x0 + i * (sw2 + g), cy - bh / 2, sw2, bh, Math.min(bh / 2, sw2 / 2, 1.4));
        if (i < val) fillIf(c, e.accent); strokeIf(c, e.stroke || e.accent, e.sw || 0.3);
      }
    }
  };
  R.numgrid = function (c, e) {
    const n = Math.max(1, e.n | 0), cols = Math.max(1, Math.min(e.cols | 0 || 7, n)), rows = Math.ceil(n / cols), cw = e.w / cols, ch = e.h / rows, s = Math.min(cw, ch) * 0.86, st = e.start || 1;
    for (let i = 0; i < n; i++) {
      const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch / 2;
      mark(c, e.mk || 'rounded', cx, cy, s, { stroke: e.color, fill: e.mfc || e.color, mode: e.mfill || 'none', sw: e.sw || 0.28, num: st + i, font: e.font });
      if (e.numbers !== false && (e.mk || 'rounded') !== 'num') { font(c, s * 0.42, e.font, 600); c.fillStyle = e.textColor || e.color; T(c, String(st + i), cx, cy + (['heart', 'drop'].includes(e.mk) ? s * 0.04 : 0), 'center', 'middle'); }
    }
  };
  R.rate = function (c, e) {
    const n = Math.max(1, e.n | 0), s = Math.min(e.h, e.w / n * 0.9), gap = n > 1 ? (e.w - s * n) / (n - 1) : 0;
    for (let i = 0; i < n; i++) mark(c, e.mk || 'star', i * (s + gap) + s / 2, e.h / 2, s * 0.9, { stroke: e.color, fill: e.mfc || e.color, mode: e.mfill || 'none', sw: e.sw || 0.3, num: i + 1, font: e.font });
  };
  Object.assign(TYPE_NAME, { progress: 'Barras de progresso', numgrid: 'Grade numerada', rate: 'Sequência de símbolos' });
  FIELDS.checklist = [['n', 'Itens', 'num', 1], ['items', 'Texto dos itens (um por linha)', 'lines'], ['font', 'Fonte', 'font'], ['size', 'Tamanho do texto (pt, 0 = automático)', 'num', 0.5], ['lines', 'Linha para escrever', 'chk'], ['textColor', 'Texto', 'color'], ['stroke', 'Linhas', 'colorN'], ['sw', 'Espessura (mm)', 'num', 0.05]];
  FIELDS.progress = [['labels', 'Nomes (um por linha)', 'lines'], ['rows', 'Barras', 'num', 1], ['segs', 'Divisões', 'num', 1], ['labelW', 'Largura dos nomes (0–0,6)', 'num', 0.02], ['font', 'Fonte', 'font'], ['color', 'Texto', 'color'], ['accent', 'Preenchimento', 'color'], ['stroke', 'Contorno', 'colorN']];
  FIELDS.numgrid = [['n', 'Quantidade', 'num', 1], ['cols', 'Colunas', 'num', 1], ['start', 'Começa em', 'num', 1], ['numbers', 'Mostrar números', 'chk'], ['font', 'Fonte', 'font'], ['textColor', 'Cor dos números', 'color'], ['sw', 'Espessura (mm)', 'num', 0.05]];
  FIELDS.rate = [['n', 'Quantidade', 'num', 1], ['sw', 'Espessura (mm)', 'num', 0.05]];

  /* ---------- molduras ---------- */
  const FK = [['none', 'Sem borda'], ['solid', 'Fina'], ['dash', 'Tracejada'], ['dot', 'Pontilhada'], ['double', 'Dupla'], ['bold', 'Grossa e fina'], ['corners', 'Só cantos'], ['notch', 'Vintage'], ['scallop', 'Bolhas'], ['offset', 'Sombra 3D'], ['tb', 'Cima e baixo'], ['b', 'Embaixo'], ['l', 'Barra lateral']];
  function scallopPath(c, x, y, w, h, d) {
    const n = Math.max(2, Math.round((w - d) / d)), m = Math.max(2, Math.round((h - d) / d)), dw = (w - d) / n, dh = (h - d) / m, b = d / 2, P = Math.PI;
    c.beginPath(); c.moveTo(x + b, y + b);
    for (let i = 0; i < n; i++) c.arc(x + b + (i + 0.5) * dw, y + b, dw / 2, P, 0, false);
    for (let j = 0; j < m; j++) c.arc(x + w - b, y + b + (j + 0.5) * dh, dh / 2, -P / 2, P / 2, false);
    for (let i = n - 1; i >= 0; i--) c.arc(x + b + (i + 0.5) * dw, y + h - b, dw / 2, 0, P, false);
    for (let j = m - 1; j >= 0; j--) c.arc(x + b, y + b + (j + 0.5) * dh, dh / 2, P / 2, 3 * P / 2, false);
    c.closePath();
  }
  function shapePathF(c, x, y, w, h, f) {
    if (f.k === 'scallop') scallopPath(c, x, y, w, h, f.bump || 4.5); else rr(c, x, y, w, h, f.r || 0);
  }
  function frame(c, x, y, w, h, f) {
    if (!f || f.k === 'none' || !f.k) return;
    const t = Math.max(0.05, f.w || 0.4), col = tok(f.c || '@ink'), r = Math.max(0, f.r || 0), g = f.gap ?? t * 2.5;
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineJoin = 'round';
    const box = (i, rd, lw) => { rr(c, x + i, y + i, w - 2 * i, h - 2 * i, Math.max(0, rd)); c.lineWidth = lw; c.stroke(); };
    const ln = (x1, y1, x2, y2, lw) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = lw; c.stroke(); };
    switch (f.k) {
      case 'dash': c.setLineDash([t * 3, t * 2]); box(t / 2, r, t); break;
      case 'dot': c.lineCap = 'round'; c.setLineDash([0, t * 2.2]); box(t / 2, r, t); break;
      case 'double': box(t / 2, r, t); box(t / 2 + g, r - g, t); break;
      case 'bold': box(t / 2, r, t); box(t + g * 0.7, r - g * 0.7, Math.max(0.15, t * 0.28)); break;
      case 'corners': {
        const L = Math.min(w, h) * 0.16, i = t / 2; c.lineCap = 'square';
        c.beginPath();
        c.moveTo(x + i, y + i + L); c.lineTo(x + i, y + i); c.lineTo(x + i + L, y + i);
        c.moveTo(x + w - i - L, y + i); c.lineTo(x + w - i, y + i); c.lineTo(x + w - i, y + i + L);
        c.moveTo(x + w - i, y + h - i - L); c.lineTo(x + w - i, y + h - i); c.lineTo(x + w - i - L, y + h - i);
        c.moveTo(x + i + L, y + h - i); c.lineTo(x + i, y + h - i); c.lineTo(x + i, y + h - i - L);
        c.lineWidth = t; c.stroke(); break;
      }
      case 'notch': {
        box(t / 2, 0, t); box(t / 2 + g, 0, Math.max(0.15, t * 0.55));
        const q = g * 1.9;
        [[x, y], [x + w - q, y], [x, y + h - q], [x + w - q, y + h - q]].forEach(([a, b]) => c.fillRect(a, b, q, q));
        break;
      }
      case 'scallop': scallopPath(c, x, y, w, h, f.bump || 4.5); c.lineWidth = t; c.stroke(); break;
      case 'offset': case 'solid': box(t / 2, r, t); break;
      case 'tb': ln(x, y + t / 2, x + w, y + t / 2, t); ln(x, y + h - t / 2, x + w, y + h - t / 2, t); break;
      case 'b': ln(x, y + h - t / 2, x + w, y + h - t / 2, t); break;
      case 'l': ln(x + t / 2, y, x + t / 2, y + h, t); break;
      default: box(t / 2, r, t);
    }
    c.restore();
  }
  function layout(e) {
    const w = e.wx, f = w.fr || { k: 'none' };
    const off = f.k === 'offset' ? Math.max(0.6, f.gap || 1.4) : 0, bw = e.w - off, bh = e.h - off;
    const ex = f.k === 'scallop' ? (f.bump || 4.5) * 0.5 : 0, ft = Math.max(0.05, f.w || 0.4), fg = f.gap ?? ft * 2.5;
    /* a moldura ocupa espaço: o conteúdo é empurrado para dentro e nunca fica sob a borda */
    const fi = !f.k || f.k === 'none' || f.k === 'scallop' ? 0 : f.k === 'double' || f.k === 'notch' ? ft + fg : f.k === 'bold' ? ft + fg * 0.7 : ft, rin = f.k === 'scallop' || !f.r ? 0 : 0.2929 * Math.min(f.r, bw / 2, bh / 2), pad = (w.pad || 0) + ex + fi + rin; /* cantos arredondados: o conteúdo recua para caber dentro da curva */
    const hd = w.hd && w.hd.on ? Math.min(w.hd.h || 7, bh * 0.6) + fi : 0, pin = pad - fi;
    return { f, off, bw, bh, hd, pad, ex, fi, ix: pad, iy: hd ? hd + pin : pad, iw: Math.max(2, bw - 2 * pad), ih: Math.max(2, bh - (hd ? hd + pin : pad) - pad) };
  }
  /* registro: tipo de widget -> função que devolve as células (coordenadas da caixa externa) quando há espaço entre elas */
  const CELLS = {
    calendar(e, L) {
      if (!(e.wdGap > 0 || e.cellGap > 0 || e.cellR > 0)) return null;
      const ie = Object.assign({}, e, { w: L.iw, h: L.ih }), K = calLayout(ie), out = [], ox = L.ix, oy = L.iy;
      if (K.tH) out.push({ x: ox, y: oy, w: L.iw, h: K.tH });
      const gap = Math.min(e.wdGap || 0, K.cw * 0.6), rb = e.wdR > 0 ? e.wdR : Math.min(1.6, K.hH / 3);
      if (gap > 0) for (let i = 0; i < 7; i++) out.push({ x: ox + K.cw * i + gap / 2, y: oy + K.tH, w: K.cw - gap, h: K.hH, r: rb }); else out.push({ x: ox, y: oy + K.tH, w: L.iw, h: K.hH, r: rb });
      if (e.cellGap > 0 || e.cellR > 0) {
        const cg = Math.min(e.cellGap || 0, Math.min(K.cw, K.ch) * 0.5);
        for (let i = 0; i < K.rows * 7; i++) { const d = i - K.off + 1; if (e.cellHide && (d < 1 || d > K.dim)) continue; out.push({ x: ox + (i % 7) * K.cw + cg / 2, y: oy + K.top + Math.floor(i / 7) * K.ch + cg / 2, w: K.cw - cg, h: K.ch - cg, r: e.cellR || 0 }); }
      } else out.push({ x: ox, y: oy + K.top, w: L.iw, h: K.ch * K.rows });
      return out;
    }
  };
  function drawWx(c, e, fn) {
    const w = e.wx, L = layout(e), f = L.f;
    c.save();
    if (w.sh) { c.save(); c.globalAlpha *= 0.16; c.fillStyle = '#3E3550'; rr(c, 0.9, 1.2, L.bw, L.bh, f.r || 0); c.fill(); c.restore(); }
    if (f.k === 'offset') { c.save(); rr(c, L.off, L.off, L.bw, L.bh, f.r || 0); c.fillStyle = tok(f.c || '@ink'); c.fill(); c.restore(); }
    /* widgets com espaço entre células: o fundo só pinta dentro das células */
    let clipped = false; const cf = CELLS[e.type], cl = cf ? cf(e, L) : null;
    if (cl && cl.length) { c.save(); c.beginPath(); cl.forEach((q) => { const r = Math.max(0, Math.min(q.r || 0, q.w / 2, q.h / 2)); c.moveTo(q.x + r, q.y); c.arcTo(q.x + q.w, q.y, q.x + q.w, q.y + q.h, r); c.arcTo(q.x + q.w, q.y + q.h, q.x, q.y + q.h, r); c.arcTo(q.x, q.y + q.h, q.x, q.y, r); c.arcTo(q.x, q.y, q.x + q.w, q.y, r); c.closePath(); }); c.clip(); clipped = true; }
    const bg = w.bg;
    if (bg && bg.t === 'cor') { c.save(); c.globalAlpha *= (bg.op ?? 1); shapePathF(c, 0, 0, L.bw, L.bh, f); fillIf(c, tok(bg.c || '@soft')); c.restore(); }
    else if (bg && bg.t === 'img' && bg.src) {
      const im = getImg(bg.src);
      c.save(); shapePathF(c, 0, 0, L.bw, L.bh, f); c.clip(); c.globalAlpha *= (bg.op ?? 1);
      if (im) drawImgFit(c, im, 0, 0, L.bw, L.bh, bg.fit || 'cover'); else { c.fillStyle = 'rgba(195,152,200,.15)'; c.fillRect(0, 0, L.bw, L.bh); }
      c.restore();
    }
    if (clipped) c.restore();
    const hd = w.hd;
    if (hd && hd.on && L.hd > 0) {
      c.save(); shapePathF(c, 0, 0, L.bw, L.bh, f); c.clip();
      if (hd.fill && hd.fill !== 'none') { c.fillStyle = tok(hd.fill); c.fillRect(0, 0, L.bw, L.hd); }
      c.restore();
      if (hd.line) { c.beginPath(); c.moveTo(L.ex, L.hd); c.lineTo(L.bw - L.ex, L.hd); strokeIf(c, tok(hd.lc || '@ink'), hd.lw || 0.3); }
      if (hd.text) {
        const ins = L.ex + L.fi, av = Math.max(4, L.bw - 4.4 - 2 * ins);
        let fs = Math.min((hd.size || 8) * PT, (L.hd - L.fi) * 0.78); const fam = fnt(hd.font), wt = hd.weight || 600, ax = hd.align === 'left' ? 2.2 + ins : hd.align === 'right' ? L.bw - 2.2 - ins : L.bw / 2;
        font(c, fs, fam, wt); setLS(c, (hd.ls || 0) * fs * F); const tw = M(c, hd.text);
        if (tw > av) { fs *= Math.max(0.5, av / tw); font(c, fs, fam, wt); setLS(c, (hd.ls || 0) * fs * F); } /* o título acompanha a largura do widget */
        c.fillStyle = tok(hd.c || '@ink');
        T(c, fitText(c, hd.text, av), ax, (L.fi + L.hd) / 2 + fs * 0.04, hd.align || 'center', 'middle'); setLS(c, 0);
      }
    }
    c.save(); if (f.r > 0 && f.k !== 'scallop') { shapePathF(c, 0, 0, L.bw, L.bh, f); c.clip(); }
    c.translate(L.ix, L.iy);
    fn(c, Object.assign({}, e, { w: L.iw, h: L.ih }));
    c.restore();
    frame(c, 0, 0, L.bw, L.bh, f);
    c.restore();
  }
  function pageFrame(c, pg) {
    const f = pg.frame; if (!f || f.k === 'none') return;
    const i = f.inset ?? 5, k = f.k === 'offset' ? 'bold' : f.k;
    c.save(); c.globalAlpha *= (f.op ?? 1); frame(c, i, i, pg.w - 2 * i, pg.h - 2 * i, Object.assign({}, f, { k })); c.restore();
  }

  window.WX = window.WX || {};
  Object.assign(window.WX, { tok, fnt, MARKS, FK, mark, frame, layout, draw: drawWx, pageFrame });
})();
