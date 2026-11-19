/* Bordas das páginas (v2): a imagem, o padrão ou a cor entram INTEIROS na página e só aparecem onde o "posicionamento" deixa.
   A faixa vai do extremo da página até a margem de segurança e pode ser aumentada/diminuída. */
(function () {
  'use strict';
  const LAY = [
    ['completo', 'Completo', [['full', 'Página toda'], ['fadeT', 'Esmaecido em cima'], ['fadeB', 'Esmaecido embaixo'], ['fadeL', 'Esmaecido à esquerda'], ['fadeR', 'Esmaecido à direita'], ['fadeTB', 'Esmaecido em cima e embaixo'], ['fadeLR', 'Esmaecido nas laterais'], ['fadeC', 'De dentro para fora'], ['fadeE', 'De fora para dentro']]],
    ['moldura', 'Moldura', [['ring', 'Moldura inteira'], ['ringR', 'Moldura arredondada'], ['thin', 'Moldura fina'], ['sq', 'Moldura de cantos'], ['kDiag', 'Cantos diagonais'], ['kOval', 'Moldura oval'], ['kSplit', 'Meia página + contorno'], ['kEdge', 'Linhas no extremo'], ['kDbl', 'Dupla no extremo'], ['kLarge', 'Contorno com canto grosso'], ['kIns', 'Moldura dupla interna'], ['kB3', 'Moldura grossa arredondada'], ['kB2', 'Moldura grossa'], ['kB4', 'Barra grossa lateral'], ['kB5', 'Barra grossa + linhas'], ['kOE', 'Meia página + linha'], ['kBd', 'Borda lateral']]],
    ['contorno', 'Contorno', [['o1', 'Linha fina'], ['o2', 'Linha grossa'], ['o12', 'Fina + grossa'], ['o21', 'Grossa + fina'], ['o11', 'Duas finas'], ['o3', 'Fina, grossa, fina'], ['oR', 'Fina arredondada'], ['oR2', 'Fina + grossa arredondada']]],
    ['faixas', 'Faixas', [['t', 'Em cima'], ['b', 'Embaixo'], ['tb', 'Em cima e embaixo'], ['lr', 'Laterais'], ['l', 'Só esquerda'], ['r', 'Só direita'], ['out', 'Lateral de fora'], ['in', 'Lateral da encadernação'], ['mh', 'Faixa no meio (deitada)'], ['mv', 'Faixa no meio (em pé)']]],
    ['lados', 'Lados', [['sTB2', 'Em cima e embaixo (fina)'], ['sL', 'Metade esquerda + contorno'], ['sR', 'Metade direita + contorno'], ['sT', 'Metade de cima + contorno'], ['sB', 'Metade de baixo + contorno']]],
    ['destaque', 'Destaque', [['halfMoon', 'Meia-lua'], ['softArch', 'Arco suave'], ['hdr', 'Cabeçalho'], ['hdr2', 'Cabeçalho solto'], ['ftr', 'Rodapé'], ['ftr2', 'Rodapé solto']]],
    ['onda', 'Ondulado', [['t~', 'Onda em cima'], ['b~', 'Onda embaixo'], ['tb~', 'Onda em cima e embaixo'], ['ring~', 'Onda na moldura'], ['t)', 'Festão em cima'], ['b)', 'Festão embaixo'], ['tb)', 'Festão em cima e embaixo'], ['ring)', 'Festão na moldura']]],
    ['renda', 'Renda', [['t:', 'Arcos em cima'], ['b:', 'Arcos embaixo'], ['tb:', 'Arcos em cima e embaixo'], ['ring:', 'Arcos na moldura'], ['t^', 'Pontas em cima'], ['b^', 'Pontas embaixo'], ['tb^', 'Pontas em cima e embaixo'], ['ring^', 'Pontas na moldura']]],
    ['cantos', 'Cantos', [['cArc', 'Cantos em leque'], ['cTri', 'Cantos em triângulo'], ['cSq', 'Cantos quadrados'], ['cL', 'Cantos em L'], ['sc', 'Canto arredondado'], ['scL', 'Canto arredondado (outro lado)'], ['sc2', 'Canto arredondado + contorno']]],
  ];
  const nameOf = (id) => { for (const [, , L] of LAY) { const f = L.find((x) => x[0] === id); if (f) return f[1]; } return 'Moldura inteira'; };
  const catOf = (id) => (LAY.find((c) => c[2].some((x) => x[0] === id)) || LAY[1])[0];
  const DEF = () => ({ v: 2, kind: 'img', src: null, color: '#C398C8', lay: 'ring', w: null, op: 1, fit: 'cover', span: 'cont', ps: 20, tile: false, liner: 0, lc: '#4A4E79', lw: 0.4, ls: 'solid', inv: false, ofs: null });

  /* margem de segurança (distância do extremo da página) */
  function safeOf(pg) {
    try { if (window.Margens && pg.mg && S.meta && S.meta.mgOn) { const g = Margens.geom(pg, pg.mg); return { l: g.x0, t: g.top, r: pg.w - g.x1, b: pg.h - g.bot }; } } catch (e) { /* padrão */ }
    const m = Math.max(6, Math.min(pg.w, pg.h) * 0.075); return { l: m, t: m, r: m, b: m };
  }
  const avgSafe = (pg) => { const s = safeOf(pg); return (s.l + s.t + s.r + s.b) / 4; };

  /* perfil da borda interna: devolve quanto a borda "entra" a mais na página */
  function profile(sty, A) {
    if (sty === '~') { const P = A * 6; return (s) => A * (0.5 + 0.5 * Math.sin((s / P) * Math.PI * 2)); }
    if (sty === ')') { const P = A * 2.2; return (s) => { const u = ((s % P) / P) * 2 - 1; return A * Math.sqrt(Math.max(0, 1 - u * u)); }; }
    if (sty === '^') { const P = A * 2.4; return (s) => { const u = (s % P) / P; return A * (1 - Math.abs(2 * u - 1)); }; }
    if (sty === ':') { const P = A * 2.6; return (s) => { const u = ((s % P) / P) * 2 - 1; return A * (1 - Math.sqrt(Math.max(0, 1 - u * u))); }; }
    return () => 0;
  }
  const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const q = P[(i + 1) % P.length]; a += P[i][0] * q[1] - q[0] * P[i][1]; } return a / 2; };
  const pos = (P) => (area(P) < 0 ? P.slice().reverse() : P);

  function bandPoly(side, pg, T, f, L) { // polígono de uma faixa, com a borda interna decorada
    const n = Math.max(2, Math.ceil(L / 0.6)), pts = [];
    const map = { t: (u, v) => [u, v], b: (u, v) => [u, pg.h - v], l: (u, v) => [v, u], r: (u, v) => [pg.w - v, u] }[side];
    pts.push(map(0, 0), map(L, 0));
    for (let i = n; i >= 0; i--) { const s = (L * i) / n; pts.push(map(s, T + f(s))); }
    return pos(pts);
  }
  function roundRect(x, y, w, h, r, rev) {
    const P = [], N = 8; r = Math.max(0, Math.min(r, w / 2, h / 2));
    const arc = (cx, cy, a0) => { for (let k = 0; k <= N; k++) { const a = a0 + (k / N) * Math.PI / 2; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
    if (r > 0) { arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI); } else P.push([x, y], [x + w, y], [x + w, y + h], [x, y + h]);
    return rev ? P.reverse() : P;
  }
  function ringPoly(pg, T, f, rad) { // moldura com furo (furo em sentido contrário)
    const outer = [[0, 0], [pg.w, 0], [pg.w, pg.h], [0, pg.h]], l = T.l, t = T.t, r = pg.w - T.r, bt = pg.h - T.b, inner = [];
    if (rad > 0) return [outer, roundRect(l, t, r - l, bt - t, rad, true)];
    const nx = (len) => Math.max(2, Math.ceil(len / 0.6));
    let n = nx(r - l); for (let i = 0; i <= n; i++) { const s = ((r - l) * i) / n; inner.push([l + s, t + f(s)]); }
    n = nx(bt - t); for (let i = 0; i <= n; i++) { const s = ((bt - t) * i) / n; inner.push([r - f(s), t + s]); }
    n = nx(r - l); for (let i = 0; i <= n; i++) { const s = ((r - l) * i) / n; inner.push([r - s, bt - f(s)]); }
    n = nx(bt - t); for (let i = 0; i <= n; i++) { const s = ((bt - t) * i) / n; inner.push([l + f(s), bt - s]); }
    return [outer, area(inner) > 0 ? inner.reverse() : inner];
  }

  /* região (lista de polígonos) de um posicionamento */
  function rrPoly(x, y, w, h, rs) {
    const P = [], N = 10, r = rs.map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
    const arc = (cx, cy, rr2, a0) => { if (rr2 <= 0) { P.push([cx, cy]); return; } for (let k = 0; k <= N; k++) { const a = a0 + (k / N) * Math.PI / 2; P.push([cx + rr2 * Math.cos(a), cy + rr2 * Math.sin(a)]); } };
    arc(x + r[0], y + r[0], r[0], Math.PI); arc(x + w - r[1], y + r[1], r[1], -Math.PI / 2); arc(x + w - r[2], y + h - r[2], r[2], 0); arc(x + r[3], y + h - r[3], r[3], Math.PI / 2);
    return pos(P);
  }
  const hole = (P) => P.slice().reverse();
  const ringOf = (x, y, w, h, R, th) => (w <= 2 * th || h <= 2 * th ? [] : [rrPoly(x, y, w, h, [R, R, R, R]), hole(rrPoly(x + th, y + th, w - 2 * th, h - 2 * th, [Math.max(0, R - th), Math.max(0, R - th), Math.max(0, R - th), Math.max(0, R - th)]))]);
  function region(pg, b) {
    const polys = region0(pg, b); if (!b.inv || /^(full|fade)/.test(b.lay || '')) return polys;
    return [pos([[0, 0], [pg.w, 0], [pg.w, pg.h], [0, pg.h]])].concat(polys.map(hole));
  }
  function region0(pg, b) {
    const W = pg.w, H = pg.h, S0 = safeOf(pg), T = b.w != null ? { l: b.w, t: b.w, r: b.w, b: b.w } : S0, avg = (T.l + T.t + T.r + T.b) / 4, A = Math.max(1.4, Math.min(avg * 0.35, 7));
    const id = b.lay || 'ring', idx = S.order.indexOf(pg.id), right = idx >= 0 && (idx + 1) % 2 === 1, polys = [];
    const sty = /[~)^:]$/.test(id) ? id.slice(-1) : '', base = sty ? id.slice(0, -1) : id, f = profile(sty, A);
    const rect = (x, y, w, h) => pos([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    if (base === 'full' || base.startsWith('fade')) return [rect(0, 0, W, H)];
    if (/^o(1|2|12|21|11|3|R|R2)$/.test(base)) {
      const th = b.lt != null ? b.lt : 1.4, thin = Math.max(0.3, th / 3.5), gap = th * 0.9, R0 = base[1] === 'R' ? 7 : 0;
      const spec = { o1: [thin], o2: [th], o12: [thin, th], o21: [th, thin], o11: [thin, thin], o3: [thin, th, thin], oR: [thin], oR2: [thin, th] }[base]; let o = b.ofs != null ? b.ofs : Math.max(2, avg * 0.5);
      spec.forEach((t, i) => { ringOf(o, o, W - 2 * o, H - 2 * o, Math.max(0, R0 - (o - (b.ofs != null ? b.ofs : Math.max(2, avg * 0.5)))), t).forEach((q) => polys.push(q)); o += t + gap; });
      return polys;
    }
    if (base === 'sTB2') { const tt = Math.max(2, avg * 0.5); return [rect(0, 0, W, tt), rect(0, H - tt, W, tt)]; }
    if (/^s[LRTB]$/.test(base)) {
      const o = b.ofs != null ? b.ofs : Math.max(2, avg * 0.5), th = Math.max(0.3, (b.lt != null ? Math.min(b.lt, 3) : 0.6)), hw = W / 2, hh = H * 0.45;
      if (base === 'sL') return [rect(0, 0, hw, H)].concat(ringOf(hw + o, o, hw - 2 * o, H - 2 * o, 0, th));
      if (base === 'sR') return [rect(hw, 0, hw, H)].concat(ringOf(o, o, hw - 2 * o, H - 2 * o, 0, th));
      if (base === 'sT') return [rect(0, 0, W, hh)].concat(ringOf(o, hh + o, W - 2 * o, H - hh - 2 * o, 0, th));
      return [rect(0, H - hh, W, hh)].concat(ringOf(o, o, W - 2 * o, H - hh - 2 * o, 0, th));
    }
    if (base === 'halfMoon' || base === 'softArch') { const m = Math.max(avg, 4), w = W - 2 * m, h = H - 2 * m; return [rect(0, 0, W, H), hole(rrPoly(m, m, w, h, base === 'halfMoon' ? [w / 2, w / 2, 0, 0] : [w * 0.3, w * 0.3, 0, 0]))]; }
    if (base === 'hdr' || base === 'ftr') { const hh = Math.max(avg * 1.1, 5), y = base === 'hdr' ? 0 : H - hh; return [rrPoly(0, y, W, hh, base === 'hdr' ? [0, 0, hh * 0.5, hh * 0.5] : [hh * 0.5, hh * 0.5, 0, 0])]; }
    if (base === 'hdr2' || base === 'ftr2') { const hh = Math.max(avg * 0.9, 4), m = Math.max(avg * 0.6, 3), y = base === 'hdr2' ? m : H - m - hh; return [rrPoly(m, y, W - 2 * m, hh, [hh / 2, hh / 2, hh / 2, hh / 2])]; }
    if (base === 'sc' || base === 'scL' || base === 'sc2') {
      const m = Math.max(avg, 4), h = H - 2 * m, R = Math.min((W - m) * 0.9, h / 2), left = base !== 'scL'; const wx = left ? m : 0, ww = W - m;
      const win = rrPoly(wx, m, ww, h, left ? [R, 0, 0, R] : [0, R, R, 0]), out = [rect(0, 0, W, H), hole(win)];
      if (base === 'sc2') { const o = Math.max(2, avg * 0.5), thn = 0.5; ringOf(wx + o, m + o, ww - o, h - 2 * o, Math.max(0, R - o), thn).forEach((q) => out.push(q)); }
      return out;
    }
    if (/^k(Diag|Oval|Split|Edge|Dbl|Large|Ins|B3|B2|B4|B5|OE|Bd)$/.test(base)) {
      const th = Math.max(avg * 0.7, 2.2), thin = 0.5, o = b.ofs != null ? b.ofs : Math.max(2, avg * 0.5), hw = W / 2, m = Math.max(avg, 4);
      const rings = (spec, o0, gap, R0) => { let q = o0; spec.forEach((t) => { ringOf(q, q, W - 2 * q, H - 2 * q, Math.max(0, R0 - (q - o0)), t).forEach((p) => polys.push(p)); q += t + gap; }); };
      if (base === 'kDiag') { const R = Math.min(W, H) * 0.35; polys.push(pos([[0, 0], [R, 0], [0, R]]), pos([[W, H], [W - R, H], [W, H - R]])); }
      else if (base === 'kOval') { const w = W - 2 * m * 1.2, h = H - 2 * m * 1.2; polys.push(pos([[0, 0], [W, 0], [W, H], [0, H]]), hole(rrPoly(m * 1.2, m * 1.2, w, h, [w / 2, w / 2, w / 2, w / 2]))); }
      else if (base === 'kSplit') { polys.push(rect(hw, 0, hw, H)); rings([thin], o, 0, 5); }
      else if (base === 'kEdge') rings([thin, thin, thin], 1.2, 0.7, 0);
      else if (base === 'kDbl') rings([thin, th], 1.2, th * 0.5, 0);
      else if (base === 'kLarge') { polys.push(pos([[0, 0], [W, 0], [W, th], [th, th], [th, H], [0, H]])); rings([thin], th + o * 0.5, 0, 0); }
      else if (base === 'kIns') rings([th * 0.6, th * 0.6], o, th * 0.5, 0);
      else if (base === 'kB3') rings([Math.max(avg, 3)], o, 0, 8);
      else if (base === 'kB2') rings([Math.max(avg, 3)], o, 0, 2);
      else if (base === 'kB4') polys.push(rect(o, 0, th, H));
      else if (base === 'kB5') { rings([thin, thin], 1.2, 0.7, 0); polys.push(rect(o + 2, 0, th, H)); }
      else if (base === 'kOE') { polys.push(rect(0, 0, hw - o, H), rect(hw - o + o * 1.5, 0, thin, H)); }
      else polys.push(rect(W - th * 1.2, 0, th * 1.2, H));
      return polys;
    }
    if (base === 'ring' || base === 'ringR' || base === 'thin' || base === 'sq') {
      const TT = base === 'thin' ? { l: Math.max(1, T.l / 3), t: Math.max(1, T.t / 3), r: Math.max(1, T.r / 3), b: Math.max(1, T.b / 3) } : T;
      if (base === 'sq') { const R = Math.max(avg * 3, 14); [[0, 0, 1, 1], [W, 0, -1, 1], [W, H, -1, -1], [0, H, 1, -1]].forEach(([x, y, sx, sy]) => { const ex = Math.min(R, W / 2), ey = Math.min(R, H / 2), th = avg; polys.push(pos([[x, y], [x + sx * ex, y], [x + sx * ex, y + sy * th], [x + sx * th, y + sy * th], [x + sx * th, y + sy * ey], [x, y + sy * ey]])); }); return polys; }
      return ringPoly(pg, TT, f, base === 'ringR' ? Math.min(Math.max(avg * 1.4, 6), 14) : 0);
    }
    if (base[0] === 'c') {
      const R = Math.max(avg * 3, 14), th = avg;
      [[0, 0, 1, 1], [W, 0, -1, 1], [W, H, -1, -1], [0, H, 1, -1]].forEach(([x, y, sx, sy]) => {
        if (base === 'cArc') { const P = [[x, y]]; for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI / 2; P.push([x + sx * R * Math.cos(a), y + sy * R * Math.sin(a)]); } polys.push(pos(P)); }
        else if (base === 'cTri') polys.push(pos([[x, y], [x + sx * R, y], [x, y + sy * R]]));
        else if (base === 'cSq') polys.push(pos([[x, y], [x + sx * R * 0.7, y], [x + sx * R * 0.7, y + sy * R * 0.7], [x, y + sy * R * 0.7]]));
        else polys.push(pos([[x, y], [x + sx * R, y], [x + sx * R, y + sy * th], [x + sx * th, y + sy * th], [x + sx * th, y + sy * R], [x, y + sy * R]]));
      });
      return polys;
    }
    if (base === 'mh') { const t = Math.max(avg * 1.4, 4); return [rect(0, (H - t) / 2, W, t)]; }
    if (base === 'mv') { const t = Math.max(avg * 1.4, 4); return [rect((W - t) / 2, 0, t, H)]; }
    const has = { t: false, b: false, l: false, r: false };
    if (base === 'out') has[right ? 'r' : 'l'] = true; else if (base === 'in') has[right ? 'l' : 'r'] = true;
    else base.split('').forEach((k) => { if (k === 't' || k === 'b' || k === 'l' || k === 'r') has[k] = true; });
    if (base === 'lr') { has.l = true; has.r = true; } if (base === 'tb') { has.t = true; has.b = true; }
    ['t', 'b', 'l', 'r'].forEach((s) => { if (has[s]) polys.push(bandPoly(s, pg, T[s], f, s === 't' || s === 'b' ? W : H)); });
    return polys;
  }
  function sidesOfLay(id) { const base = /[~)^:]$/.test(id) ? id.slice(0, -1) : id; return base; }

  function fillPolys(c, polys) { c.beginPath(); polys.forEach((P) => { P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }); }

  function paintSrc(c, pg, b) {
    const W = pg.w, H = pg.h, idx = S.order.indexOf(pg.id), right = idx >= 0 && (idx + 1) % 2 === 1;
    if (b.kind === 'cor') { if (!b.color || b.color === 'none') return; c.fillStyle = b.color; c.fillRect(0, 0, W, H); return; }
    const im = getImg(b.src); if (!im) { c.fillStyle = 'rgba(195,152,200,.35)'; c.fillRect(0, 0, W, H); return; }
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height; if (!iw || !ih) return;
    const fit = (w, h) => { if (b.fit === 'stretch') return { x: 0, y: 0, w, h }; const k = Math.max(w / iw, h / ih); return { x: (w - iw * k) / 2, y: (h - ih * k) / 2, w: iw * k, h: ih * k }; };
    if (b.tile) {
      const tw = Math.max(6, b.ps || 20), th = tw * ih / iw; c.save();
      if (right && b.span !== 'cont') { c.translate(W, 0); c.scale(-1, 1); }
      const x0 = right && b.span === 'cont' ? -(W % tw) : 0; c.beginPath(); c.rect(0, 0, W, H); c.clip();
      for (let y = 0; y < H; y += th) for (let x = x0; x < W; x += tw) c.drawImage(im, x, y, tw, th);
      c.restore(); return;
    }
    if (b.span === 'cont') { const r = fit(W * 2, H); c.drawImage(im, r.x - (right ? W : 0), r.y, r.w, r.h); }
    else if (right) { const r = fit(W, H); c.save(); c.translate(W, 0); c.scale(-1, 1); c.drawImage(im, r.x, r.y, r.w, r.h); c.restore(); }
    else { const r = fit(W, H); c.drawImage(im, r.x, r.y, r.w, r.h); }
  }

  function draw2(c, pg, b) {
    window.__fb = { w: pg.w, h: pg.h }; c.save(); c.globalAlpha *= b.op ?? 1;
    const polys = region(pg, b), id = b.lay || 'ring', fade = id.startsWith('fade'), canVec = typeof c.createLinearGradient === 'function';
    if (fade && canVec && typeof document !== 'undefined') {
      const k = Math.min(4, 1400 / Math.max(pg.w, pg.h)), cv = document.createElement('canvas'); cv.width = Math.max(2, Math.round(pg.w * k)); cv.height = Math.max(2, Math.round(pg.h * k));
      const g = cv.getContext('2d'); g.scale(k, k); paintSrc(g, pg, b); g.globalCompositeOperation = 'destination-in';
      const lin = (x0, y0, x1, y1, st) => { const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, a]) => gr.addColorStop(o, `rgba(0,0,0,${a})`)); return gr; }, Wd = pg.w, Hd = pg.h; let gr;
      if (id === 'fadeT') gr = lin(0, 0, 0, Hd, [[0, 0], [0.55, 1]]); else if (id === 'fadeB') gr = lin(0, 0, 0, Hd, [[0.45, 1], [1, 0]]);
      else if (id === 'fadeL') gr = lin(0, 0, Wd, 0, [[0, 0], [0.55, 1]]); else if (id === 'fadeR') gr = lin(0, 0, Wd, 0, [[0.45, 1], [1, 0]]);
      else if (id === 'fadeTB') gr = lin(0, 0, 0, Hd, [[0, 0], [0.3, 1], [0.7, 1], [1, 0]]); else if (id === 'fadeLR') gr = lin(0, 0, Wd, 0, [[0, 0], [0.3, 1], [0.7, 1], [1, 0]]);
      else { g.translate(Wd / 2, Hd / 2); g.scale(Wd, Hd); gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.72); (id === 'fadeC' ? [[0, 1], [0.4, 1], [0.72, 0]] : [[0, 0], [0.3, 0], [0.72, 1]]).forEach(([o, a]) => gr.addColorStop(o, `rgba(0,0,0,${a})`)); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); c.drawImage(cv, 0, 0, pg.w, pg.h); c.restore(); return; }
      g.fillStyle = gr; g.fillRect(0, 0, pg.w, pg.h); c.drawImage(cv, 0, 0, pg.w, pg.h);
    } else { c.save(); fillPolys(c, polys); c.clip(); paintSrc(c, pg, b); c.restore(); }
    if (b.liner) { // forrado: fio fino acompanhando a borda por dentro
      const d = [0, 1.5, 3, 5][b.liner] || 0, S0 = safeOf(pg), T = b.w != null ? { l: b.w, t: b.w, r: b.w, b: b.w } : S0, avg = (T.l + T.t + T.r + T.b) / 4, A = /[~)^:]$/.test(id) ? Math.max(1.4, Math.min(avg * 0.35, 7)) : 0, o = A + d + 0.8;
      const base = sidesOfLay(id), ring = ['ring', 'ringR', 'thin'].includes(base), sd = { t: ring || ['t', 'tb'].includes(base), b: ring || ['b', 'tb'].includes(base), l: ring || ['l', 'lr'].includes(base), r: ring || ['r', 'lr'].includes(base) };
      if (b.inv || !['ring', 'ringR', 'thin', 't', 'b', 'tb', 'lr', 'l', 'r', 'out', 'in'].includes(base)) { /* sem forrado */ }
      else {
        const L = [], l = T.l + o, t = T.t + o, r = pg.w - T.r - o, bt = pg.h - T.b - o, idx = S.order.indexOf(pg.id), right = idx >= 0 && (idx + 1) % 2 === 1;
        if (base === 'out') { sd.l = !right; sd.r = right; } if (base === 'in') { sd.l = right; sd.r = !right; }
        if (sd.t) L.push({ p: [[sd.l ? l : 0, t], [sd.r ? r : pg.w, t]], closed: false }); if (sd.b) L.push({ p: [[sd.l ? l : 0, bt], [sd.r ? r : pg.w, bt]], closed: false });
        if (sd.l) L.push({ p: [[l, sd.t ? t : 0], [l, sd.b ? bt : pg.h]], closed: false }); if (sd.r) L.push({ p: [[r, sd.t ? t : 0], [r, sd.b ? bt : pg.h]], closed: false });
        window.__fb = { w: pg.w, h: pg.h }; c.globalAlpha = 1 * (b.op ?? 1); if (window.LN) LN.stroke(c, L, b.ls || 'solid', b.lc || '#4A4E79', b.lw || 0.4);
      }
    }
    c.restore();
  }

  const _old = window.drawBorder;
  window.drawBorder = drawBorder = function (c, pg) { const b = pg.border; if (b && b.v === 2) { draw2(c, pg, b); return; } return _old.apply(this, arguments); };

  /* ---------- imagem pequena demais? ---------- */
  function pxNeeded(pg) { return { w: Math.round(pg.w / 25.4 * 150), h: Math.round(pg.h / 25.4 * 150) }; }
  function readDims(file) { return new Promise((res) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); }; im.onerror = () => res(null); im.src = u; }); }
  async function checkUpload(files) {
    const p = curPage(), need = pxNeeded(p), ok = [];
    for (const f of files) {
      const d = await readDims(f); if (!d) { ok.push(f); continue; }
      if (d.w >= need.w && d.h >= need.h) { ok.push(f); continue; }
      const use = await new Promise((res) => {
        modal(`<h2>Imagem pequena para esta página</h2><p class="hint"><b>${esc(f.name)}</b> tem ${d.w} × ${d.h} px. Para a borda cobrir uma página ${esc(sizeName(p.w, p.h))} sem ficar pixelada, o mínimo é <b>${need.w} × ${need.h} px</b> (150 dpi).</p>
          <div class="row" style="justify-content:flex-end"><button class="btn ghost" id="bgNo">Escolher outra</button><button class="btn" id="bgYes">Usar assim mesmo</button></div>`, (b, close) => { $('#bgNo', b).onclick = () => { close(); res(false); }; $('#bgYes', b).onclick = () => { close(); res(true); }; });
      });
      if (use) ok.push(f);
    }
    return ok;
  }

  /* ---------- painel ---------- */
  const edit = () => { if (!S.bordaEdit || S.bordaEdit.v !== 2) { const p = curPage(); S.bordaEdit = Object.assign(DEF(), p && p.border && p.border.v === 2 ? clone(p.border) : {}); } return S.bordaEdit; };
  let catSel = null;
  const sw = (id, on, l) => `<label class="tgl" title="${l}"><input type="checkbox" id="${id}"${on ? ' checked' : ''}><i></i><span>${l}</span></label>`;
  PANELS.bordas = {
    html() {
      const b = edit(), p = curPage(), cat = catSel || catOf(b.lay), thinCat = ['contorno', 'lados'].includes(catOf(b.lay)), imgs = BORDER_IMGS(), pats = BORDER_PATS(), mm = r1(avgSafe(p)), cur = b.w != null ? b.w : mm, mx = Math.round(Math.min(p.w, p.h) * 0.4);
      const item = (it) => `<button type="button" class="bdim${b.src === it.src ? ' on' : ''}" data-bi="${it.id}" title="${esc(it.name || '')}"><img src="${esc(srcUrl(it.src))}" alt="${esc(it.name || '')}"></button>`;
      const open = !!(Pref.acc && Pref.acc.bdpos !== false);
      return `<h2>Bordas</h2>
      <div class="segf bdtabs"><button type="button" data-bm="img" class="${b.kind !== 'cor' ? 'on' : ''}">Padrão</button><button type="button" data-bm="cor" class="${b.kind === 'cor' ? 'on' : ''}">Preenchimento</button></div>
      ${b.kind !== 'cor' ? `<div class="bdsec"><div class="bdh"><b>Imagens e padrões</b><span class="bdacts"><button type="button" class="btn sm" id="bdMk">Criar no ModuLab</button><span class="btn sm upl">Enviar<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" data-up="border" aria-label="Enviar imagem de borda"></span></span></div>
        ${pats.length || imgs.length ? `<div class="bdims">${pats.map(item).join('')}${imgs.map(item).join('')}</div>` : '<p class="hint">Ainda não há imagens. Envie uma ou crie um padrão no ModuLab.</p>'}
        <div class="bdrow"><div class="segf sm"><button type="button" data-bf="cover" class="${b.fit !== 'stretch' ? 'on' : ''}">Cobrir</button><button type="button" data-bf="stretch" class="${b.fit === 'stretch' ? 'on' : ''}">Esticar</button></div>${sw('bdTile', b.tile, 'Repetir')}</div>
        ${b.tile ? `<label class="pfield"><span>Tamanho de cada repetição (mm)</span><input type="number" id="bdPs" min="6" max="150" step="1" value="${b.ps || 20}"></label>` : ''}</div>`
      : `<div class="bdsec"><div class="bdh"><b>Cor ou gradiente</b></div><div class="bdrow">${colorField('bcor', b.color, true)}</div></div>`}
      <div class="wacc${open ? ' open' : ''}" data-bdacc="bdpos"><button type="button" class="wah" aria-expanded="${open}"><i class="wtri"></i><b>Posicionamento · <em>${esc(nameOf(b.lay))}</em></b></button>
        <div class="wab"><div class="bdsws">${sw('bdCont', b.span !== 'inv', 'Contínuo')}<small>${b.span !== 'inv' ? 'a borda atravessa as duas páginas' : 'a página da direita fica espelhada'}</small>${cat === 'completo' ? '' : sw('bdInvC', !!b.inv, 'Inverter o recorte')}</div><div class="bdchips">${LAY.map(([k, n]) => `<button type="button" class="chip${cat === k ? ' on' : ''}" data-bc="${k}">${n}</button>`).join('')}</div>
        <div class="bdthumbs">${(LAY.find((c) => c[0] === cat) || LAY[1])[2].map(([k, n]) => `<button type="button" class="bdt${b.lay === k ? ' on' : ''}" data-bl="${k}" title="${n}"><canvas data-bpc="${k}" width="54" height="72"></canvas><span>${n}</span></button>`).join('')}</div></div></div>
      <div class="bdsec"><label class="bdsl"><span>Opacidade</span><input type="range" id="bO" min="0.1" max="1" step="0.05" value="${b.op ?? 1}"><b id="bOv">${Math.round((b.op ?? 1) * 100)}%</b></label>
        <label class="bdsl"><span>${thinCat ? 'Espessura das linhas' : 'Largura da borda'}</span><input type="range" id="bW" min="${thinCat ? 0.3 : 1}" max="${thinCat ? Math.round(mx / 4) : mx}" step="${thinCat ? 0.1 : 0.5}" value="${thinCat ? (b.lt != null ? b.lt : 1.4) : Math.min(cur, mx)}"><input type="number" id="bWn" min="${thinCat ? 0.3 : 1}" max="${mx}" step="${thinCat ? 0.1 : 0.5}" value="${thinCat ? r1(b.lt != null ? b.lt : 1.4) : r1(cur)}"> <button type="button" class="btn sm ghost" id="bWr" title="Voltar até a margem de segurança">↺</button></label>
        ${thinCat ? `<label class="bdsl"><span>Afastamento do extremo</span><input type="range" id="bOf" min="0" max="${Math.round(mx / 2)}" step="0.5" value="${b.ofs != null ? b.ofs : Math.max(2, r1(mm * 0.5))}"><b id="bOfv">${r1(b.ofs != null ? b.ofs : Math.max(2, mm * 0.5))} mm</b></label>` : ''}
        <p class="hint" style="margin:0">${thinCat ? 'Linhas finas acompanham a página; ajuste a espessura e o afastamento.' : b.w == null ? 'Vai do extremo da página até a margem de segurança' : 'Margem de segurança em ' + mm + ' mm'}. Arraste para diminuir (para fora) ou aumentar (para dentro).</p>
        <div class="pfield"><span>Forrado</span><div class="segf sm">${[[0, 'Desativado'], [1, 'Perto'], [2, 'Médio'], [3, 'Longe']].map(([k, n]) => `<button type="button" data-bld="${k}" class="${(b.liner || 0) === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        ${b.liner ? `<label class="pfield"><span>Cor do forrado</span>${colorField('blc', b.lc, false)}</label><div class="fgrid"><label class="pfield"><span>Espessura (mm)</span><input type="number" id="bLw" min="0.1" max="3" step="0.1" value="${b.lw || 0.4}"></label><label class="pfield"><span>Tipo de linha</span><select id="bLs">${LN.OPTS.map(([k, n]) => `<option value="${k}"${(b.ls || 'solid') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>` : ''}</div>
      <div class="pgrp"><h3>APLICAR</h3>${scopeHTML('bd', true)}<div class="row"><button class="btn pri" id="bdGo">Aplicar</button><button class="btn ghost danger" id="bdRm">Remover borda</button></div><p class="hint" id="bdMsg">${p.border ? 'Esta página já tem uma borda.' : ''}</p></div>`;
    },
    mount(P) {
      const b = edit(), redo = () => renderPanel(), live = () => { try { redraw(); } catch (e) { /* */ } };
      const thinCat = ['contorno', 'lados'].includes(catOf(b.lay)), isThin = (k) => ['contorno', 'lados'].includes(catOf(k));
      const preview = () => { $$('[data-bpc]', P).forEach((cv) => { const W = 54, H = 72, c = cv.getContext('2d'); c.clearRect(0, 0, W, H); const s = 0.9; c.save(); c.translate(W * (1 - s) / 2, H * (1 - s) / 2); c.scale(s * W / 60, s * H / 84); c.fillStyle = '#fff'; c.fillRect(0, 0, 60, 84); c.restore(); c.save(); c.translate(W * (1 - s) / 2, H * (1 - s) / 2); c.scale(s * W / 60, s * H / 84); const pg = { id: '_pv', w: 60, h: 84, els: [], border: Object.assign({}, b, { lay: cv.dataset.bpc, w: isThin(cv.dataset.bpc) ? null : Math.max(9, Math.min(b.w != null ? b.w : 9, 14)), lt: b.lt, kind: b.kind === 'cor' || b.src ? b.kind : 'cor', color: b.kind === 'cor' ? b.color : '#C398C8', op: 1, span: 'igual', tile: false }) }; c.beginPath(); c.rect(0, 0, 60, 84); c.clip(); try { draw2(c, pg, pg.border); } catch (e) { /* */ } c.restore(); c.strokeStyle = '#E7DCE8'; c.lineWidth = 1; c.strokeRect(W * 0.05 + 0.5, H * 0.05 + 0.5, W * 0.9 - 1, H * 0.9 - 1); }); };
      preview(); S.panelRepaint = preview;
      $$('[data-bm]', P).forEach((x) => x.onclick = () => { b.kind = x.dataset.bm === 'cor' ? 'cor' : 'img'; redo(); });
      $$('[data-bc]', P).forEach((x) => x.onclick = () => { catSel = x.dataset.bc; redo(); });
      $$('[data-bl]', P).forEach((x) => x.onclick = () => { b.lay = x.dataset.bl; redo(); });
      $$('[data-bf]', P).forEach((x) => x.onclick = () => { b.fit = x.dataset.bf; redo(); });
      $$('[data-bld]', P).forEach((x) => x.onclick = () => { b.liner = +x.dataset.bld; redo(); });
      $$('[data-bi]', P).forEach((x) => x.onclick = () => { const it = S.lib.find((o) => o.id === x.dataset.bi); if (!it) return; b.src = it.src; b.kind = 'img'; if (it.kind === 'pat') { b.tile = true; b.ps = it.ps || 20; } redo(); });
      const tg = $('#bdTile', P); if (tg) tg.onchange = () => { b.tile = tg.checked; redo(); };
      const ps = $('#bdPs', P); if (ps) ps.onchange = () => { b.ps = cl(+ps.value || 20, 6, 150); };
      const co = $('#bdCont', P); co.onchange = () => { b.span = co.checked ? 'cont' : 'inv'; redo(); };
      const ic = $('#bdInvC', P); if (ic) ic.onchange = () => { b.inv = ic.checked; redo(); };
      const ofs = $('#bOf', P); if (ofs) ofs.oninput = () => { b.ofs = +ofs.value; $('#bOfv', P).textContent = r1(b.ofs) + ' mm'; preview(); };
      const lws = $('#bLw', P); if (lws) lws.onchange = () => { b.lw = cl(+lws.value || 0.4, 0.1, 3); }; const lss = $('#bLs', P); if (lss) lss.onchange = () => { b.ls = lss.value; };
      const bo = $('#bO', P); bo.oninput = () => { b.op = +bo.value; $('#bOv', P).textContent = Math.round(b.op * 100) + '%'; };
      const bw = $('#bW', P), bn = $('#bWn', P); const kk = thinCat ? 'lt' : 'w'; bw.oninput = () => { b[kk] = +bw.value; bn.value = r1(b[kk]); preview(); }; bn.onchange = () => { b[kk] = cl(+bn.value || 1, thinCat ? 0.3 : 1, +bw.max); bw.value = b[kk]; preview(); };
      $('#bWr', P).onclick = () => { b.w = null; b.lt = null; redo(); };
      $$('[data-bdacc]', P).forEach((a) => { const h = $('.wah', a); h.onclick = (ev) => { if (ev.target.closest('.tgl')) return; const o = !a.classList.contains('open'); a.classList.toggle('open', o); Pref.acc = Pref.acc || {}; Pref.acc.bdpos = o; savePref(); }; });
      const ci = $('input[data-k="bcor"]', P); $$('[data-cset="bcor"]', P).forEach((x) => x.onclick = () => { b.color = x.dataset.v; redo(); });
      if (ci) { ci.oninput = () => { b.color = ci.dataset.gv || ci.value; preview(); }; ci.onchange = () => { b.color = ci.dataset.gv || ci.value; redo(); }; }
      const lc = $('input[data-k="blc"]', P); $$('[data-cset="blc"]', P).forEach((x) => x.onclick = () => { b.lc = x.dataset.v; redo(); }); if (lc) { lc.oninput = () => { b.lc = lc.dataset.gv || lc.value; }; lc.onchange = () => { b.lc = lc.dataset.gv || lc.value; redo(); }; }
      mountScope(P, 'bd'); mountLib(P, 'border'); if (S.meta.view === 'spread') { const o = $('#bdSc option[value="cur"]', P); if (o) o.textContent = 'Esta dupla (as 2 páginas)'; }
      const up = $('[data-up]', P); if (up) up.onchange = async () => { const fs = await checkUpload([...up.files]); up.value = ''; if (fs.length) await uploadFiles(fs, 'border'); };
      const mk = $('#bdMk', P); if (mk) mk.onclick = () => { if (window.ModuLab && ModuLab.openPat) ModuLab.openPat(null); };
      $('#bdGo', P).onclick = () => { if (b.kind !== 'cor' && !b.src) { $('#bdMsg', P).textContent = 'Escolha uma imagem ou um padrão para a borda.'; return; } let ids = readScope(P, 'bd'); if (!ids.length) { $('#bdMsg', P).textContent = 'Escolha pelo menos uma página.'; return; }
        if ($('#bdSc', P).value === 'cur' && S.meta.view === 'spread') ids = curSpread().map((i) => S.order[i]).filter(Boolean);
        applyBorder(ids, b); $('#bdMsg', P).textContent = `Borda aplicada em ${ids.length} página${ids.length === 1 ? '' : 's'}. 🌸`; };
      $('#bdRm', P).onclick = () => { const ids = readScope(P, 'bd'); applyBorder(ids, null); $('#bdMsg', P).textContent = `Borda removida de ${ids.length} página${ids.length === 1 ? '' : 's'}.`; };
    },
  };
  window.Bordas = { draw2, region, safeOf };
})();
