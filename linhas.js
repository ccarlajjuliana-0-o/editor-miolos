/* Estilos de linha (pontilhada, tracejada, serrilhada, dupla…) usados em tabelas, calendários e células. */
(function () {
  'use strict';
  const OPTS = [['solid', 'Contínua'], ['dot', 'Pontilhada'], ['dash', 'Tracejada'], ['long', 'Tracejada longa'], ['dashdot', 'Traço e ponto'], ['dashdd', 'Traço, ponto, ponto'], ['double', 'Dupla (iguais)'], ['double2', 'Dupla (fina e grossa)'], ['triple', 'Tripla'], ['zigzag', 'Serrilhada'], ['wave', 'Ondulada']];
  const seg = (x1, y1, x2, y2) => ({ p: [[x1, y1], [x2, y2]], closed: false });
  /* retângulo (arredondado) como polilinhas; sides = 'trbl' ou subconjunto para contorno parcial */
  function rect(x, y, w, h, r, sides) {
    sides = sides || 'trbl'; r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (sides === 'trbl') {
      const P = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * Math.PI / 2; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
      if (r > 0) { arc(x + r, y + r, Math.PI); arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); } else P.push([x, y], [x + w, y], [x + w, y + h], [x, y + h]);
      return [{ p: P, closed: true }];
    }
    /* contorno parcial: lados e cantos em ordem, juntando trechos vizinhos */
    const on = { t: sides.includes('t'), r: sides.includes('r'), b: sides.includes('b'), l: sides.includes('l') }, pieces = [];
    const arcPts = (cx, cy, a0) => { const P = []; for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * Math.PI / 2; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return P; };
    pieces.push({ s: 't', pts: [[x + r, y], [x + w - r, y]] }, { c: ['t', 'r'], pts: r > 0 ? arcPts(x + w - r, y + r, -Math.PI / 2) : [] }, { s: 'r', pts: [[x + w, y + r], [x + w, y + h - r]] }, { c: ['r', 'b'], pts: r > 0 ? arcPts(x + w - r, y + h - r, 0) : [] },
      { s: 'b', pts: [[x + w - r, y + h], [x + r, y + h]] }, { c: ['b', 'l'], pts: r > 0 ? arcPts(x + r, y + h - r, Math.PI / 2) : [] }, { s: 'l', pts: [[x, y + h - r], [x, y + r]] }, { c: ['l', 't'], pts: r > 0 ? arcPts(x + r, y + r, Math.PI) : [] });
    const out = []; let cur = null;
    pieces.forEach((q) => { const ok = q.s ? on[q.s] : (on[q.c[0]] && on[q.c[1]]); if (ok) { if (!cur) { cur = { p: [], closed: false }; out.push(cur); } q.pts.forEach((pt) => cur.p.push(pt)); } else if (q.s) cur = null; });
    return out.filter((o) => o.p.length > 1);
  }
  const len = (P, closed) => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (closed) s += Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]); return s; };
  function norm(P, i, closed) { const n = P.length, a = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = P[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; }
  const offset = (P, d, closed) => P.map((p, i) => { const nn = norm(P, i, closed); return [p[0] + nn[0] * d, p[1] + nn[1] * d]; });
  function resample(P, closed, step) { const Q = closed ? P.concat([P[0]]) : P, out = [[Q[0][0], Q[0][1], 0]]; let acc = 0, next = step; for (let i = 1; i < Q.length; i++) { const x0 = Q[i - 1][0], y0 = Q[i - 1][1], dx = Q[i][0] - x0, dy = Q[i][1] - y0, L = Math.hypot(dx, dy); while (next <= acc + L) { const t = (next - acc) / L; out.push([x0 + dx * t, y0 + dy * t, next]); next += step; } acc += L; } out.push([Q[Q.length - 1][0], Q[Q.length - 1][1], acc]); return out; }
  function path(c, P, closed) { c.beginPath(); P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (closed) c.closePath(); }
  function one(c, P, closed, sty, col, lw, dash, cap) { path(c, P, closed); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.lineCap = cap || 'butt'; c.lineJoin = 'round'; c.stroke(); c.setLineDash([]); c.lineCap = 'butt'; }
  function stroke(c, polys, sty, col, lw) {
    if (!col || col === 'none' || !(lw > 0) || !polys || !polys.length) return; sty = sty || 'solid'; c.save();
    const L = Math.max(lw, 0.22);
    polys.forEach(({ p, closed }) => {
      if (p.length < 2) return;
      switch (sty) {
        case 'dot': one(c, p, closed, sty, col, lw, [0, L * 2.4], 'round'); break;
        case 'dash': one(c, p, closed, sty, col, lw, [L * 4, L * 2.6]); break;
        case 'long': one(c, p, closed, sty, col, lw, [L * 9, L * 3.5]); break;
        case 'dashdot': one(c, p, closed, sty, col, lw, [L * 6, L * 2.2, 0.01, L * 2.2], 'round'); break;
        case 'dashdd': one(c, p, closed, sty, col, lw, [L * 6, L * 2.2, 0.01, L * 2.2, 0.01, L * 2.2], 'round'); break;
        case 'double': { const g = L * 1.3; one(c, offset(p, -g, closed), closed, sty, col, lw); one(c, offset(p, g, closed), closed, sty, col, lw); break; }
        case 'double2': { const g = L * 1.5; one(c, offset(p, -g, closed), closed, sty, col, lw * 0.55); one(c, offset(p, g * 0.6, closed), closed, sty, col, lw * 1.6); break; }
        case 'triple': { const g = L * 1.9; [-g, 0, g].forEach((d, i) => one(c, offset(p, d, closed), closed, sty, col, i === 1 ? lw * 0.6 : lw * 0.9)); break; }
        case 'zigzag': case 'wave': {
          const st = sty === 'zigzag' ? Math.max(0.9, L * 5) : Math.max(0.5, L * 1.6), amp = Math.max(0.35, L * 1.8), R = resample(p, closed, st), Q = [];
          R.forEach((q, i) => { const nn = norm(R, i, closed); const a = sty === 'zigzag' ? (i % 2 ? amp : -amp) : amp * Math.sin(q[2] / (L * 5) * Math.PI); Q.push([q[0] + nn[0] * a, q[1] + nn[1] * a]); });
          one(c, Q, false, sty, col, lw, null, 'round'); break; }
        default: one(c, p, closed, sty, col, lw);
      }
    });
    c.restore();
  }
  window.LN = { OPTS, seg, rect, stroke };
})();
