/* Estúdio de Miolos · Conteúdo da página por seções (Ajuste 74 / 74b)
   p.layout = 'free' | 'sections'
   p.sec = { m, g, link, both, unit, dim, rh[] (altura de cada linha), rows[][] (larguras das seções de cada linha), rot{"r,c":deg}, mg[] ({a:"r,c", cov:["r,c",...]} = seção que ocupa também as de baixo) }
   e.slot = "r,c" (seção onde o elemento está encaixado) */
(function () {
  'use strict';
  const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
  const MINMM = 6;
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const on = (p) => !!(p && p.layout === 'sections' && p.sec);
  const keyOf = (r, c) => r + ',' + c;
  const unkey = (k) => k.split(',').map(Number);
  const def = (p) => ({ m: r1(Math.min(p.w, p.h) * 0.04), g: 3, link: true, both: true, unit: 'mm', dim: false, rh: [1, 1], rows: [[1, 1], [1, 1]], rot: {} });
  function migrate(s) { if (s.cw && !s.rows) { s.rows = s.rh.map(() => s.cw.slice()); delete s.cw; } if (s.link === undefined) s.link = true; }

  /* ---------- geometria ---------- */
  function geom(p) {
    const s = p.sec; migrate(s); const nR = s.rh.length;
    const ah = Math.max(10, p.h - 2 * s.m - (nR - 1) * s.g), sh = sum(s.rh), ys = [], hs = []; let y = s.m;
    s.rh.forEach((v) => { const h = ah * v / sh; ys.push(y); hs.push(h); y += h + s.g; });
    const rows = s.rows.map((a) => {
      const n = a.length, aw = Math.max(10, p.w - 2 * s.m - (n - 1) * s.g), t = sum(a), xs = [], ws = []; let x = s.m;
      a.forEach((v) => { const w = aw * v / t; xs.push(x); ws.push(w); x += w + s.g; });
      return { xs, ws, n, aw, t };
    });
    const G = { ys, hs, ah, sh, nR, rows, anc: {}, cov: {} };
    (s.mg || []).forEach((m) => {
      const [ar, ac] = unkey(m.a); if (!rows[ar] || ac >= rows[ar].n) return;
      const ks = m.cov.filter((k) => { const [r, c] = unkey(k); return rows[r] && c < rows[r].n; }); if (!ks.length) return;
      const last = Math.max(ar, ...ks.map((k) => unkey(k)[0]));
      G.anc[m.a] = { x: rows[ar].xs[ac], y: ys[ar], w: rows[ar].ws[ac], h: ys[last] + hs[last] - ys[ar] }; ks.forEach((k) => { G.cov[k] = m.a; });
    });
    return G;
  }
  const basic = (G, r, c) => ({ x: G.rows[r].xs[c], y: G.ys[r], w: G.rows[r].ws[c], h: G.hs[r] });
  const rectOf = (G, r, c) => G.anc[keyOf(r, c)] || basic(G, r, c);
  function cellAt(p, G, pt) {
    const g = p.sec.g / 2; let r = -1;
    for (let i = 0; i < G.nR; i++) if (pt.y >= G.ys[i] - g && pt.y < G.ys[i] + G.hs[i] + g) r = i;
    if (r < 0) return null; const R = G.rows[r]; let c = -1;
    for (let i = 0; i < R.n; i++) if (pt.x >= R.xs[i] - g && pt.x < R.xs[i] + R.ws[i] + g) c = i;
    if (c < 0) return null; const a = G.cov[keyOf(r, c)]; if (a) { const [ar, ac] = unkey(a); return { r: ar, c: ac }; }
    return { r, c };
  }
  const ctr = (e) => ({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
  const validKey = (G, k) => { const [r, c] = unkey(k); return r < G.nR && c < G.rows[r].n; };

  function place(e, R, rot, setRot) {
    const sw = rot === 90 || rot === 270, cw = sw ? R.h : R.w, ch = sw ? R.w : R.h; let w = cw, h = ch;
    if (e.type === 'image') { const sc = Math.min(cw / Math.max(0.5, e.w), ch / Math.max(0.5, e.h)); w = e.w * sc; h = e.h * sc; }
    e.w = r1(w); e.h = r1(h); e.x = r1(R.x + R.w / 2 - e.w / 2); e.y = r1(R.y + R.h / 2 - e.h / 2);
    if (setRot) e.rot = rot;
  }

  /* encaixa: ids = elementos "tocados" que podem trocar de seção; fresh = elementos novos (vão para a seção escolhida/primeira vazia) */
  function fit(p, ids, fresh) {
    if (!on(p)) return; const s = p.sec, G = geom(p);
    p.els.forEach((e) => { if (e.slot && !validKey(G, e.slot)) delete e.slot; });
    p.els.forEach((e) => { const a = e.slot && G.cov[e.slot]; if (a) { if (p.els.some((o) => o !== e && o.slot === a)) delete e.slot; else e.slot = a; } });
    const occ = (k, self) => p.els.find((o) => o !== self && o.slot === k);
    if (ids && ids.size) {
      p.els.forEach((e) => {
        if (!ids.has(e.id) || e.locked || e.free) return;
        if (fresh && fresh.has(e.id)) {
          const pref = p === curPage() && S.secSel && validKey(G, S.secSel) && !G.cov[S.secSel] && !occ(S.secSel, e) ? S.secSel : null;
          if (pref) { e.slot = pref; return; }
          for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.rows[r].n; c++) { const kk = keyOf(r, c); if (!e.slot && !G.cov[kk] && !occ(kk, e)) e.slot = kk; }
          if (e.slot) return;
        }
        const cell = cellAt(p, G, ctr(e));
        if (!cell) { delete e.slot; return; }
        const k = keyOf(cell.r, cell.c), other = occ(k, e);
        if (!other) { e.slot = k; return; }
        if (e.slot && e.slot !== k && !ids.has(other.id)) { other.slot = e.slot; e.slot = k; return; }
        if (e.slot === k) return;
        let best = null, bd = 1e9; const c0 = ctr(e);
        for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.rows[r].n; c++) { const kk = keyOf(r, c); if (G.cov[kk] || occ(kk, e)) continue; const R = rectOf(G, r, c), d = Math.hypot(R.x + R.w / 2 - c0.x, R.y + R.h / 2 - c0.y); if (d < bd) { bd = d; best = kk; } }
        if (best) e.slot = best; else delete e.slot;
      });
    }
    p.els.forEach((e) => { if (!e.slot || e.free) return; const [r, c] = unkey(e.slot), rot = ((s.rot[e.slot] || 0) % 360 + 360) % 360; place(e, rectOf(G, r, c), rot, e.slot in s.rot); });
  }

  /* ---------- reconhecer o conteúdo que já existe ---------- */
  function infer(p) {
    const els = p.els.filter((e) => !e.hidden && e.w > 1 && e.h > 1); if (!els.length) return null;
    els.sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2));
    const rowsE = []; let cur = null;
    els.forEach((e) => { const cy = e.y + e.h / 2; if (cur && cy <= cur.y1 && cy >= cur.y0) { cur.list.push(e); cur.y0 = Math.min(cur.y0, e.y); cur.y1 = Math.max(cur.y1, e.y + e.h); } else { cur = { list: [e], y0: e.y, y1: e.y + e.h }; rowsE.push(cur); } });
    const s = def(p); s.rh = rowsE.map((r) => Math.max(10, r.y1 - r.y0)); s.rows = rowsE.map((r) => { r.list.sort((a, b) => a.x - b.x); return r.list.map((e) => Math.max(10, e.w)); });
    s.m = r1(Math.max(2, Math.min(s.m, ...els.map((e) => Math.min(e.x, e.y)).filter((v) => v > 0)))); if (!isFinite(s.m)) s.m = def(p).m;
    const n0 = s.rows[0].length; s.link = s.rows.every((a) => a.length === n0 && a.every((v, i) => Math.abs(v - s.rows[0][i]) < 0.5));
    rowsE.forEach((r, ri) => r.list.forEach((e, ci) => { e.slot = keyOf(ri, ci); }));
    return s;
  }
  const cloneStruct = (t, q) => { const s = JSON.parse(JSON.stringify(t)); s.rot = {}; s.m = Math.min(s.m, r1(Math.min(q.w, q.h) * 0.08)); return s; };

  /* ---------- páginas da dupla ---------- */
  const spreadPages = (p) => {
    if ((S.meta.view || 'single') !== 'spread') return [p];
    try { const a = curSpread().map((i) => S.pages[S.order[i]]).filter(Boolean); return a.includes(p) ? a : [p]; } catch (_) { return [p]; }
  };
  const targets = (p, both) => (both && p.sec && p.sec.both !== false ? spreadPages(p).filter((q) => on(q) || q === p) : [p]);

  function flash(ms) { S.secDimT = Date.now() + (ms || 1600); setTimeout(() => { try { drawOverlaysOnly(); } catch (_) { /* */ } }, (ms || 1600) + 60); }

  function edit(p, fn, ids, both) {
    const T = targets(p, both);
    change(T.map((q) => q.id), () => { T.forEach((q) => { fn(q); cleanMg(q); fit(q, q === p ? ids : null); }); });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    flash(); redraw(); renderProps(); T.forEach((q) => thumbRefresh(q.id));
  }
  function setMode(p, mode) {
    const T = spreadPages(p);
    change(T.map((q) => q.id), () => {
      if (mode === 'sections') {
        T.forEach((q) => { if (!q.sec && q.els.length) q.sec = infer(q); });
        const tmpl = (T.find((q) => q.sec && q.els.length) || {}).sec;
        T.forEach((q) => { if (!q.sec) q.sec = tmpl ? cloneStruct(tmpl, q) : def(q); migrate(q.sec); q.layout = 'sections'; q.sec.both = T.length > 1; fit(q); });
      } else T.forEach((q) => { q.layout = 'free'; });
    });
    S.secSel = null; S.secMenu = null; flash(); redraw(); renderProps(); T.forEach((q) => thumbRefresh(q.id));
  }

  /* ---------- operações (sempre numa página) ---------- */
  function remapMg(q, f) { // f(key) -> nova chave | null
    const s = q.sec; if (!s.mg) return;
    s.mg = s.mg.map((m) => { const a = f(m.a); if (!a) return null; const cov = m.cov.map(f).filter(Boolean); return cov.length ? { a, cov } : null; }).filter(Boolean);
  }
  function cleanMg(q) {
    const s = q.sec; if (!s.mg || !s.mg.length) return; const G0 = geom(Object.assign({}, q, { sec: Object.assign({}, s, { mg: [] }) })), seen = new Set();
    s.mg = s.mg.map((m) => {
      const [ar, ac] = unkey(m.a); if (!G0.rows[ar] || ac >= G0.rows[ar].n || seen.has(m.a)) return null; const R = basic(G0, ar, ac); let cov = m.cov.filter((k) => {
        const [r, c] = unkey(k); if (!G0.rows[r] || c >= G0.rows[r].n || r <= ar || seen.has(k)) return false; const b = basic(G0, r, c); return Math.abs(b.x - R.x) < 1.2 && Math.abs(b.w - R.w) < 1.2;
      });
      const rr = Array.from(new Set(cov.map((k) => unkey(k)[0]))).sort((x, y) => x - y); const ok = []; let want = ar + 1; rr.forEach((x) => { if (x === want) { ok.push(x); want++; } });
      cov = cov.filter((k) => ok.includes(unkey(k)[0])); if (!cov.length) return null; seen.add(m.a); cov.forEach((k) => seen.add(k)); return { a: m.a, cov };
    }).filter(Boolean);
  }
  const hasMgRow = (q, r) => (q.sec.mg || []).some((m) => unkey(m.a)[0] === r || m.cov.some((k) => unkey(k)[0] === r));
  function groupRows(q, r, i) { // linhas ligadas por mesclas verticais nas colunas i e i+1
    const s = q.sec, set = new Set([r]); let grow = true;
    while (grow) {
      grow = false;
      (s.mg || []).forEach((m) => { const keys = [m.a].concat(m.cov), rs = keys.map((k) => unkey(k)); if (rs.some(([rr, cc]) => set.has(rr) && (cc === i || cc === i + 1))) rs.forEach(([rr]) => { if (!set.has(rr)) { set.add(rr); grow = true; } }); });
    }
    return Array.from(set).filter((rr) => s.rows[rr] && s.rows[rr].length > i);
  }
  function remapRow(q, r, f) { // f(c) -> novo c ou null, só dentro da linha r
    const s = q.sec, rot = {};
    Object.keys(s.rot).forEach((k) => { const [rr, c] = unkey(k); if (rr !== r) { rot[k] = s.rot[k]; return; } const n = f(c); if (n !== null) rot[keyOf(r, n)] = s.rot[k]; });
    s.rot = rot;
    q.els.forEach((e) => { if (!e.slot) return; const [rr, c] = unkey(e.slot); if (rr !== r) return; const n = f(c); if (n !== null) e.slot = keyOf(r, n); else delete e.slot; });
    remapMg(q, (k) => { const [rr, c] = unkey(k); if (rr !== r) return k; const n = f(c); return n === null ? null : keyOf(r, n); });
  }
  function remapAll(q, f) { // f(r,c) -> [r,c] | null
    const s = q.sec, rot = {};
    Object.keys(s.rot).forEach((k) => { const [r, c] = unkey(k), n = f(r, c); if (n) rot[keyOf(n[0], n[1])] = s.rot[k]; });
    s.rot = rot;
    q.els.forEach((e) => { if (!e.slot) return; const [r, c] = unkey(e.slot), n = f(r, c); if (n) e.slot = keyOf(n[0], n[1]); else delete e.slot; });
    remapMg(q, (k) => { const [r, c] = unkey(k), n = f(r, c); return n ? keyOf(n[0], n[1]) : null; });
  }
  const rowsOf = (q, r) => (q.sec.link ? q.sec.rows.map((_, i) => i) : [r]);
  function addRow(q, at) { const s = q.sec; at = Math.max(0, Math.min(s.rh.length, at)); const src = s.rows[Math.min(at, s.rows.length - 1)].slice(); s.rh.splice(at, 0, sum(s.rh) / s.rh.length); s.rows.splice(at, 0, src); remapAll(q, (r, c) => [r >= at ? r + 1 : r, c]); fillMg(q); }
  function fillMg(q) { // linha nova no meio de uma mescla vertical entra na mescla
    const s = q.sec; (s.mg || []).forEach((m) => {
      const [ar, ac] = unkey(m.a), last = Math.max(...m.cov.map((k) => unkey(k)[0])), G = geom(Object.assign({}, q, { sec: Object.assign({}, s, { mg: [] }) })), R = basic(G, ar, ac);
      for (let rr = ar + 1; rr < last; rr++) { const k = keyOf(rr, ac); if (G.rows[rr] && ac < G.rows[rr].n && !m.cov.includes(k)) { const b = basic(G, rr, ac); if (Math.abs(b.x - R.x) < 1.2 && Math.abs(b.w - R.w) < 1.2) m.cov.push(k); } }
    });
  }
  function delRow(q, i) { const s = q.sec; if (s.rh.length <= 1 || i < 0 || i >= s.rh.length) return; s.rh.splice(i, 1); s.rows.splice(i, 1); remapAll(q, (r, c) => (r === i ? null : [r > i ? r - 1 : r, c])); cleanMg(q); }
  function addCol(q, r, at) {
    const s = q.sec; if (!s.rows[r]) r = 0;
    rowsOf(q, r).forEach((rr) => { const a = s.rows[rr], a0 = Math.max(0, Math.min(a.length, at)); a.splice(a0, 0, sum(a) / a.length); remapRow(q, rr, (c) => (c >= a0 ? c + 1 : c)); });
  }
  function delCol(q, r, i) {
    const s = q.sec; if (!s.rows[r]) return;
    if (s.link && s.rows[0].length <= 1) return;
    const rs = rowsOf(q, r).slice().sort((a, b) => b - a);
    rs.forEach((rr) => { const a = s.rows[rr]; if (i >= a.length) return; if (a.length <= 1) { delRow(q, rr); return; } a.splice(i, 1); remapRow(q, rr, (c) => (c === i ? null : c > i ? c - 1 : c)); });
  }
  function mergeRight(q, r, c) {
    const s = q.sec, a = s.rows[r]; if (!a || c + 1 >= a.length) return false; s.link = false;
    a[c] += a[c + 1]; a.splice(c + 1, 1); remapRow(q, r, (x) => (x === c + 1 ? null : x > c + 1 ? x - 1 : x)); return true;
  }
  function split(q, r, c) {
    const s = q.sec; if (!s.rows[r]) return; const one = (rr) => { const a = s.rows[rr]; if (c >= a.length) return; a[c] /= 2; a.splice(c + 1, 0, a[c]); remapRow(q, rr, (x) => (x > c ? x + 1 : x)); };
    rowsOf(q, r).forEach(one);
  }
  function mergeDown(q, r, c) {
    const s = q.sec, G = geom(q); let key = keyOf(r, c); if (G.cov[key]) key = G.cov[key];
    const [ar, ac] = unkey(key); s.mg = s.mg || []; let m = s.mg.find((x) => x.a === key); const last = m ? Math.max(...m.cov.map((k) => unkey(k)[0])) : ar;
    if (last + 1 >= s.rh.length) return false;
    const R = basic(G, ar, ac), row = G.rows[last + 1]; let nc = -1; for (let j = 0; j < row.n; j++) if (Math.abs(row.xs[j] - R.x) < 1.2 && Math.abs(row.ws[j] - R.w) < 1.2) nc = j;
    if (nc < 0) return false; const nk = keyOf(last + 1, nc), m2 = s.mg.find((x) => x.a === nk);
    if (!m) { m = { a: key, cov: [] }; s.mg.push(m); }
    m.cov.push(nk); if (m2) { m.cov.push(...m2.cov); s.mg.splice(s.mg.indexOf(m2), 1); }
    q.els.forEach((e) => { if (e.slot === nk) { if (q.els.some((o) => o !== e && o.slot === key)) delete e.slot; else e.slot = key; } });
    if (s.rot[nk] !== undefined) { if (s.rot[key] === undefined) s.rot[key] = s.rot[nk]; delete s.rot[nk]; }
    return true;
  }
  function splitV(q, r, c) {
    const s = q.sec, G = geom(q); if (!s.rows[r]) return; let key = keyOf(r, c); if (G.cov[key]) key = G.cov[key];
    const m0 = (s.mg || []).find((x) => x.a === key);
    if (m0) { m0.cov.sort((a, b) => unkey(a)[0] - unkey(b)[0]); m0.cov.pop(); if (!m0.cov.length) s.mg.splice(s.mg.indexOf(m0), 1); return; } // já mesclada: desfaz uma linha
    const hh = s.rh[r] / 2; s.rh[r] = hh; s.rh.splice(r + 1, 0, hh); s.rows.splice(r + 1, 0, s.rows[r].slice());
    remapAll(q, (rr, cc) => [rr > r ? rr + 1 : rr, cc]); s.mg = s.mg || [];
    for (let k = 0; k < s.rows[r].length; k++) {
      if (k === c) continue; const kk = keyOf(r, k), nk = keyOf(r + 1, k), m = s.mg.find((x) => x.a === kk || x.cov.includes(kk));
      if (m) m.cov.push(nk); else s.mg.push({ a: kk, cov: [nk] });
    }
  }
  function setColSize(q, r, i, mm) {
    const G = geom(q), s = q.sec;
    (s.link ? rowsOf(q, r) : groupRows(q, r, Math.max(0, Math.min(i, i - 0)))).forEach((rr) => {
      const a = s.rows[rr], R = G.rows[rr], n = a.length; if (n < 2 || i >= n) return;
      const v = a.map((x) => R.aw * x / R.t), old = v[i], m2 = Math.max(MINMM, Math.min(R.aw - MINMM * (n - 1), mm)), rest = R.aw - m2, others = R.aw - old;
      v.forEach((_, j) => { if (j !== i) v[j] = others > 0.01 ? v[j] * rest / others : rest / (n - 1); }); v[i] = m2; s.rows[rr] = v;
    });
  }
  function setRowSize(q, i, mm) {
    const G = geom(q), s = q.sec, n = s.rh.length; if (n < 2) return;
    const v = s.rh.map((x) => G.ah * x / G.sh), old = v[i], m2 = Math.max(MINMM, Math.min(G.ah - MINMM * (n - 1), mm)), rest = G.ah - m2, others = G.ah - old;
    v.forEach((_, j) => { if (j !== i) v[j] = others > 0.01 ? v[j] * rest / others : rest / (n - 1); }); v[i] = m2; s.rh = v;
  }
  function swapCells(q, k1, k2) {
    const s = q.sec, a = q.els.filter((e) => e.slot === k1), b = q.els.filter((e) => e.slot === k2);
    a.forEach((e) => { e.slot = k2; }); b.forEach((e) => { e.slot = k1; });
    const r1v = s.rot[k1], r2v = s.rot[k2]; delete s.rot[k1]; delete s.rot[k2]; if (r1v !== undefined) s.rot[k2] = r1v; if (r2v !== undefined) s.rot[k1] = r2v;
  }
  function neighbor(q, r, c, dir) {
    const s = q.sec; let nr = r, nc = c;
    if (dir === 'L') nc = c - 1; else if (dir === 'R') nc = c + 1;
    else { nr = r + (dir === 'U' ? -1 : 1); if (nr < 0 || nr >= s.rows.length) return null; const R = s.rows[nr]; nc = Math.min(c, R.length - 1); }
    if (nr < 0 || nc < 0 || nr >= s.rows.length || nc >= s.rows[nr].length) return null; return keyOf(nr, nc);
  }
  const rotKey = (s, k, d) => { s.rot[k] = (((s.rot[k] || 0) + d) % 360 + 360) % 360; };
  const fmt = (s, v) => (s.unit === 'cm' ? (Math.round(v) / 10).toFixed(1).replace('.', ',') + ' cm' : (Math.round(v * 10) / 10).toString().replace('.', ',') + ' mm');

  const keysOf = (p, G) => { G = G || geom(p); const base = S.secSet && S.secSet.includes(S.secSel) ? S.secSet : (S.secSel ? [S.secSel] : []); return base.filter((k) => validKey(G, k) && !G.cov[k]); };
  function mergeKeys(q, ks) {
    const pts = ks.map(unkey), rows = Array.from(new Set(pts.map((x) => x[0]))).sort((a, b) => a - b), cols = Array.from(new Set(pts.map((x) => x[1]))).sort((a, b) => a - b);
    const contig = (a) => a.every((v, i) => i === 0 || v === a[i - 1] + 1);
    if (!contig(rows) || (rows.length > 1 && !contig(cols))) return false;
    if (pts.length !== rows.length * cols.length && !(cols.length === 1 || rows.length === 1)) return false;
    const r0 = rows[0], c0 = cols[0];
    for (let i = 0; i < cols.length - 1; i++) for (const r of rows) if (!mergeRight(q, r, c0)) return false;
    for (let i = 0; i < rows.length - 1; i++) if (!mergeDown(q, r0, c0)) return false;
    return true;
  }
  const blocked = (p, r) => { if (!p.sec.link && hasMgRow(p, r)) { toast('Essa linha tem mescla vertical: desfaça-a (Dividir ↕) para mexer nas colunas.'); return true; } return false; };
  /* ação genérica a partir da seção selecionada (painel, menu "···" e botões rápidos) */
  function act(p, a, k) {
    if (!k) k = S.secSel; const [r, c] = k ? unkey(k) : [0, 0], run = (fn) => edit(p, fn);
    switch (a) {
      case 'rot1': { const ks = keysOf(p); return run((q) => (ks.length ? ks : [k]).forEach((kk) => rotKey(q.sec, kk, 90))); }
      case 'mergeSel': {
        const ks = keysOf(p), t = JSON.parse(JSON.stringify({ w: p.w, h: p.h, els: p.els, sec: p.sec, layout: p.layout, id: p.id }));
        if (ks.length < 2 || !mergeKeys(t, ks)) { toast('Essas seções não formam um bloco que dê para mesclar.'); return; }
        S.secSel = ks.map(unkey).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map((x) => keyOf(x[0], x[1]))[0]; S.secSet = null; return run((q) => { mergeKeys(q, ks); });
      }
      case 'dcs': { const ks = keysOf(p).map(unkey).sort((x, y) => y[0] - x[0] || y[1] - x[1]); if (ks.some(([rr]) => blocked(p, rr))) return; S.secSel = null; S.secSet = null; return run((q) => { ks.forEach(([rr, cc]) => delCol(q, rr, cc)); }); }
      case 'drs': { const rs = Array.from(new Set(keysOf(p).map((x) => unkey(x)[0]))).sort((a, b) => b - a); S.secSel = null; S.secSet = null; return run((q) => { rs.forEach((rr) => delRow(q, rr)); }); }
      case 'clr': return run((q) => { q.els.forEach((e) => { if (e.slot === k) { delete e.slot; e.free = true; } }); });
      case 'ra': S.secSel = keyOf(r + 1, c); return run((q) => addRow(q, r));
      case 'rb': return run((q) => addRow(q, r + 1));
      case 'ca': if (blocked(p, r)) return; S.secSel = keyOf(r, c + 1); return run((q) => addCol(q, r, c));
      case 'cb': if (blocked(p, r)) return; return run((q) => addCol(q, r, c + 1));
      case 'dr': S.secSel = null; return run((q) => delRow(q, r));
      case 'dc': if (blocked(p, r)) return; S.secSel = null; return run((q) => delCol(q, r, c));
      case 'merge': { if (blocked(p, r)) return; if (c + 1 >= p.sec.rows[r].length) { toast('Não há seção à direita para mesclar.'); return; } return run((q) => { mergeRight(q, r, c); }); }
      case 'split': if (blocked(p, r)) return; return run((q) => split(q, r, c));
      case 'mergeD': { const ok = (() => { const q = p, G = geom(q); let key = keyOf(r, c); if (G.cov[key]) key = G.cov[key]; const R = basic(G, ...unkey(key)), m = (q.sec.mg || []).find((x) => x.a === key), last = m ? Math.max(...m.cov.map((x) => unkey(x)[0])) : unkey(key)[0]; if (last + 1 >= G.nR) return false; const row = G.rows[last + 1]; return row.xs.some((x, j) => Math.abs(x - R.x) < 1.2 && Math.abs(row.ws[j] - R.w) < 1.2); })();
        if (!ok) { toast('Embaixo não há uma seção com a mesma largura para mesclar.'); return; } return run((q) => { mergeDown(q, r, c); }); }
      case 'splitV': return run((q) => splitV(q, r, c));
      case 'mU': case 'mD': case 'mL': case 'mR': {
        const t = neighbor(p, r, c, a[1]); if (!t) return; S.secSel = t; return run((q) => { const t2 = neighbor(q, r, c, a[1]); if (t2) swapCells(q, k, t2); });
      }
      default:
    }
  }

  /* ---------- painel ---------- */
  function block(p) {
    const s = p.sec; migrate(s); const G = geom(p), o = Pref.acc && Pref.acc.pg_sec !== undefined ? Pref.acc.pg_sec !== false : true;
    const sel = S.secSel && validKey(G, S.secSel) ? (() => { const [r, c] = unkey(S.secSel); return { r, c, k: S.secSel }; })() : null;
    const nsel = sel ? keysOf(p, G).length : 0, rr = sel ? sel.r : 0, cols = s.rows[rr].length, spread = spreadPages(p).length > 1;
    const stp = (k, l, n) => `<div class="stp"><span>${l}</span><button type="button" class="btn xs" data-sa="${k}-" aria-label="Menos ${l}">−</button><b>${n}</b><button type="button" class="btn xs" data-sa="${k}+" aria-label="Mais ${l}">＋</button></div>`;
    const sz = (ax, arr, ws) => arr.map((_, i) => `<label class="szi"><span>${ax === 'c' ? 'C' : 'L'}${i + 1}</span><input type="number" step="0.5" min="${MINMM}" data-ss="${ax}${i}" value="${r1(ws[i])}"></label>`).join('');
    const ib = (a, t, l, cls) => `<button type="button" class="btn xs${cls ? ' ' + cls : ''}" data-sa="${a}" title="${t}" aria-label="${t}">${l}</button>`;
    const w = document.createElement('div'); w.className = 'wacc' + (o ? ' open' : ''); w.dataset.acc = 'pg_sec';
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${o}"><i class="wtri"></i><b>Seções da página</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab"><div class="pgrp tpan secp">
      <div class="srow">${stp('r', 'Linhas', G.nR)}${stp('c', 'Colunas', cols)}</div>
      <div class="srow"><span class="sl">Linhas e colunas</span><div class="segf pgseg sm"><button type="button" data-sa="lk1" class="${s.link ? 'on' : ''}" title="Alterar uma coluna altera todas as linhas">Juntas</button><button type="button" data-sa="lk0" class="${s.link ? '' : 'on'}" title="Cada linha tem as suas colunas">Independentes</button></div></div>
      <div class="srow"><label class="sin"><span>Espaço (mm)</span><input type="number" step="0.5" min="0" data-sn="g" value="${r1(s.g)}"></label><label class="sin"><span>Margem (mm)</span><input type="number" step="0.5" min="0" data-sn="m" value="${r1(s.m)}"></label></div>
      <div class="srow"><span class="sl">Medidas</span><div class="segf pgseg sm"><button type="button" data-sa="u-mm" class="${s.unit !== 'cm' ? 'on' : ''}">mm</button><button type="button" data-sa="u-cm" class="${s.unit === 'cm' ? 'on' : ''}">cm</button></div><label class="chk sm"><input type="checkbox" data-sa="dim"${s.dim ? ' checked' : ''}> sempre</label>${spread ? `<label class="chk sm"><input type="checkbox" data-sa="both"${s.both !== false ? ' checked' : ''}> margem e medidas nas 2</label>` : ''}</div>
      <details class="sdet"><summary>Tamanhos exatos${sel ? '' : ''}</summary><div class="szl"><small>Colunas${s.link ? '' : ' · linha ' + (rr + 1)}</small>${sz('c', s.rows[rr], G.rows[rr].ws)}</div><div class="szl"><small>Linhas</small>${sz('r', s.rh, G.hs)}</div></details>
      <div class="srow">${ib('eq', 'Igualar os tamanhos', 'Igualar')}${ib('rotall', 'Girar todas as seções', '↻ Todas')}</div>
      ${sel ? `<div class="secsel"><div class="sh"><b>${nsel > 1 ? nsel + ' seções selecionadas' : 'Seção ' + (sel.r + 1) + '·' + (sel.c + 1)}</b><small>${fmt(s, G.rows[sel.r].ws[sel.c])} × ${fmt(s, (G.anc[sel.k] || { h: G.hs[sel.r] }).h)}</small></div>
        ${nsel > 1 ? `<div class="srow">${ib('mergeSel', 'Mesclar as seções selecionadas', '⧉ Mesclar seleção', 'pri')}${ib('rot1', 'Girar as seções selecionadas', '↻ Girar todas as selecionadas')}</div>` : ''}<div class="srow"><span class="sl">Mover</span>${ib('mL', 'Mover para a esquerda', '←')}${ib('mU', 'Mover para cima', '↑')}${ib('mD', 'Mover para baixo', '↓')}${ib('mR', 'Mover para a direita', '→')}${ib('rot1', 'Girar a seção', '↻ Girar', 'pri')}</div>
        <div class="srow"><span class="sl">Seção</span>${ib('merge', 'Mesclar com a seção da direita', '⧉ →')}${ib('mergeD', 'Mesclar com a seção de baixo', '⧉ ↓')}${ib('split', 'Dividir em duas colunas', '⫶ ↔')}${ib('splitV', 'Dividir em duas linhas (ou desfazer a mescla de baixo)', '⫶ ↕')}${ib('clr', 'Soltar o conteúdo da seção', 'Soltar')}</div>
        <div class="srow"><span class="sl">Inserir</span>${ib('ra', 'Linha acima', '＋ ↑')}${ib('rb', 'Linha abaixo', '＋ ↓')}${ib('ca', 'Coluna à esquerda', '＋ ←')}${ib('cb', 'Coluna à direita', '＋ →')}</div>
        <div class="srow"><span class="sl">Excluir</span>${ib('dc', s.link ? 'Excluir esta coluna' : 'Excluir esta seção', s.link ? 'Coluna' : 'Seção', 'dng')}${ib('dr', 'Excluir esta linha', 'Linha', 'dng')}</div></div>`
        : '<p class="hint">Clique numa seção para mover, girar, mesclar, dividir, inserir ou excluir.</p>'}
      </div></div>`;
    const hd = w.querySelector('.wah');
    hd.onclick = () => { w.classList.toggle('open'); const v = w.classList.contains('open'); hd.setAttribute('aria-expanded', v); Pref.acc = Pref.acc || {}; Pref.acc.pg_sec = v; try { savePref(); } catch (_) { /* */ } };
    const det = w.querySelector('.sdet'); if (det) { det.open = !!S.secDet; det.ontoggle = () => { S.secDet = det.open; }; }
    const click = (ev) => {
      const b = ev.target.closest('[data-sa]'); if (!b) return; const a = b.dataset.sa;
      if (b.tagName === 'INPUT' && ev.type === 'click' && a !== 'dim' && a !== 'both') return;
      if (b.tagName === 'INPUT' && ev.type === 'click') return; // checkboxes agem no "change"
      const k = S.secSel;
      if (a === 'r+') edit(p, (q) => addRow(q, q.sec.rh.length)); else if (a === 'r-') edit(p, (q) => delRow(q, q.sec.rh.length - 1));
      else if (a === 'c+') edit(p, (q) => addCol(q, Math.min(rr, q.sec.rows.length - 1), q.sec.rows[Math.min(rr, q.sec.rows.length - 1)].length));
      else if (a === 'c-') edit(p, (q) => delCol(q, Math.min(rr, q.sec.rows.length - 1), q.sec.rows[Math.min(rr, q.sec.rows.length - 1)].length - 1));
      else if (a === 'lk1') {
        const n0 = s.rows[0].length; if (!s.rows.every((x) => x.length === n0)) { toast('Para juntar, todas as linhas precisam ter o mesmo número de colunas.'); return; }
        edit(p, (q) => { q.sec.link = true; const base = q.sec.rows[Math.min(rr, q.sec.rows.length - 1)].slice(); q.sec.rows = q.sec.rows.map(() => base.slice()); });
      } else if (a === 'lk0') edit(p, (q) => { q.sec.link = false; });
      else if (a === 'u-mm') edit(p, (q) => { q.sec.unit = 'mm'; }, null, true); else if (a === 'u-cm') edit(p, (q) => { q.sec.unit = 'cm'; }, null, true);
      else if (a === 'eq') edit(p, (q) => { q.sec.rh = q.sec.rh.map(() => 1); q.sec.rows = q.sec.rows.map((x) => x.map(() => 1)); });
      else if (a === 'rotall') edit(p, (q) => { const g2 = geom(q); for (let i = 0; i < g2.nR; i++) for (let j = 0; j < g2.rows[i].n; j++) rotKey(q.sec, keyOf(i, j), 90); });
      else if (k) { act(p, a, k); }
    };
    w.addEventListener('click', click);
    w.addEventListener('change', (ev) => {
      const i = ev.target;
      if (i.dataset.sa === 'dim') edit(p, (q) => { q.sec.dim = i.checked; }, null, true);
      else if (i.dataset.sa === 'both') { const v = i.checked; spreadPages(p).forEach((q) => { if (q.sec) q.sec.both = v; }); S.secDimT = 0; }
      else if (i.dataset.sn) { const v = Math.min(40, Math.max(0, +i.value || 0)); edit(p, (q) => { q.sec[i.dataset.sn] = v; }, null, true); }
      else if (i.dataset.ss) { const ax = i.dataset.ss[0], n = +i.dataset.ss.slice(1), v = +i.value || MINMM; edit(p, (q) => { if (ax === 'c') setColSize(q, Math.min(rr, q.sec.rows.length - 1), n, v); else setRowSize(q, n, v); }); }
    });
    return w;
  }

  /* ---------- sobreposição ---------- */
  const eo = window.extraOverlay;
  window.extraOverlay = function (p, k) {
    let h = eo(p, k); if (!on(p)) return h;
    const s = p.sec; migrate(s); const G = geom(p), cur = p === curPage(), sel = cur && S.secSel && validKey(G, S.secSel) ? S.secSel : null, selSet = cur ? keysOf(p, G) : [];
    const showDim = !!S.secDrag || s.dim === true || Date.now() < (S.secDimT || 0);
    for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.rows[r].n; c++) {
      const key = keyOf(r, c); if (G.cov[key]) continue;
      const R = rectOf(G, r, c), full = p.els.some((e) => e.slot === key), rot = s.rot[key] || 0;
      h += `<div class="sxc${selSet.includes(key) ? ' on' : ''}${full ? ' full' : ''}${cur && S.secOver === key ? ' over' : ''}" style="left:${R.x * k}px;top:${R.y * k}px;width:${R.w * k}px;height:${R.h * k}px">${full ? '' : `<span${cur ? ` data-sadd="${key}" title="Adicionar um widget, adesivo ou objeto aqui"` : ''} style="transform:rotate(${rot}deg)">＋</span>`}${rot ? `<em>${rot}°</em>` : ''}</div>`;
      if (showDim) {
        h += `<div class="sxw" style="left:${R.x * k}px;top:${R.y * k + 2}px;width:${R.w * k}px"><b>${fmt(s, R.w)}</b></div>`;
        if (c === 0) h += `<div class="sxh" style="left:${R.x * k + 2}px;top:${R.y * k}px;height:${R.h * k}px"><b>${fmt(s, R.h)}</b></div>`;
      }
    }
    if (cur) {
      for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.rows[r].n - 1; c++) { if (G.cov[keyOf(r, c)]) continue; const R = rectOf(G, r, c); h += `<i class="sdv v" data-sdv="c${r}_${c}" title="Arraste para mudar a largura" style="left:${(R.x + R.w + s.g / 2) * k - 7}px;top:${R.y * k}px;height:${R.h * k}px"></i>`; }
      for (let r = 0; r < G.nR - 1; r++) h += `<i class="sdv hz" data-sdv="r${r}" title="Arraste para mudar a altura" style="top:${(G.ys[r] + G.hs[r] + s.g / 2) * k - 7}px;left:${s.m * k}px;width:${(p.w - 2 * s.m) * k}px"></i>`;
      if (sel) {
        const [r, c] = unkey(sel), R = rectOf(G, r, c), cx = (R.x + R.w / 2) * k;
        h += `<i class="sgrip" data-sgrip="1" title="Arraste para trocar esta seção de lugar" style="left:${R.x * k + 4}px;top:${R.y * k + 4}px">⠿</i>`;
        h += `<i class="spill" data-smenu="1" title="Mais opções da seção" style="left:${cx - 16}px;top:${R.y * k - 9}px">···</i>`;
        if (S.secMenu === sel) {
          const it = (a, l) => `<button type="button" data-sm="${a}">${l}</button>`;
          h += `<div class="smenu" style="left:${cx}px;top:${R.y * k + 14}px">${it('dc', s.link ? 'Excluir coluna' : 'Excluir seção')}${it('dr', 'Excluir linha')}${it('merge', 'Mesclar com a da direita')}${it('mergeD', 'Mesclar com a de baixo')}${it('split', 'Dividir em colunas')}${it('splitV', 'Dividir em linhas')}${it('rot1', 'Girar seção')}</div>`;
        }
        const ks = keysOf(p, G), rects = ks.map((kk) => { const [rr, cc] = unkey(kk); return rectOf(G, rr, cc); });
        const ux = Math.min(...rects.map((q) => q.x)), uy = Math.min(...rects.map((q) => q.y)), ux1 = Math.max(...rects.map((q) => q.x + q.w)), uy1 = Math.max(...rects.map((q) => q.y + q.h));
        const bx = ((ux + ux1) / 2) * k, by = ((uy + uy1) / 2) * k, btn = (cls, a2, t, ic, st) => `<button type="button" class="sq ${cls}" data-sq="${a2}" title="${t}" aria-label="${t}" style="${st}">${ic}</button>`;
        h += btn('col', 'col+', 'Adicionar coluna', QI.col, `left:${bx - 38}px;top:-42px`) + btn('col m', 'col-', 'Excluir coluna', QI.colm, `left:${bx - 2}px;top:-42px`);
        h += btn('row', 'row+', 'Adicionar linha', QI.row, `top:${by - 38}px;left:-42px`) + btn('row m', 'row-', 'Excluir linha', QI.rowm, `top:${by - 2}px;left:-42px`);
        if (ks.length > 1) h += btn('mg', 'mergeSel', 'Mesclar as seções selecionadas', QI.mg, `left:${bx + 34}px;top:-42px`);
        else if (G.anc[ks[0]]) h += btn('mg', 'splitV', 'Dividir (desfazer a mescla)', QI.sp, `left:${bx + 34}px;top:-42px`);
      }
    }
    return h;
  };
  const QI = {
    col: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="9" height="14" rx="2"/><path d="M18 9v6M15 12h6"/></svg>',
    colm: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="9" height="14" rx="2"/><path d="M15 12h6"/></svg>',
    rowm: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="9" rx="2"/><path d="M9 19h6"/></svg>',
    mg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="7" height="12" rx="2"/><rect x="14" y="6" width="7" height="12" rx="2"/><path d="M10 12h4"/></svg>',
    sp: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14" stroke-dasharray="2 2"/></svg>',
    row: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="9" rx="2"/><path d="M12 16v6M9 19h6"/></svg>'
  };

  /* ---------- interação ---------- */
  const stage = document.getElementById('stage'); let drag = null, msel = null;
  const curSec = (ev) => { const w = ev.target.closest && ev.target.closest('.pg'); if (!w || ev.button > 0) return null; const p = S.pages[w.dataset.id]; return on(p) && p === curPage() ? { w, p } : null; };
  function openWidgets() { const b = document.querySelector('#rail button[data-tab="widgets"]'); if (b) b.click(); }
  stage.addEventListener('pointerdown', (ev) => {
    const ctx = curSec(ev); if (!ctx) return; const { w, p } = ctx, tg = ev.target, stop = () => { ev.preventDefault(); ev.stopPropagation(); };
    const add = tg.closest('[data-sadd]'); if (add) { S.secSel = add.dataset.sadd; S.secSet = null; S.secMenu = null; const p0 = toMM(ev, w); msel = { w, p, x0: p0.x, y0: p0.y, base: [], moved: false, addKey: add.dataset.sadd }; return; }
    const sm = tg.closest('[data-sm]'); if (sm) { stop(); const a = sm.dataset.sm; S.secMenu = null; act(p, a, S.secSel); return; }
    if (tg.closest('[data-smenu]')) { stop(); S.secMenu = S.secMenu === S.secSel ? null : S.secSel; drawOverlaysOnly(); return; }
    const sq = tg.closest('[data-sq]'); if (sq) { stop(); const q = sq.dataset.sq; act(p, q === 'col+' ? 'cb' : q === 'row+' ? 'rb' : q === 'col-' ? 'dcs' : q === 'row-' ? 'drs' : q, S.secSel); return; }
    const gr = tg.closest('[data-sgrip]'); if (gr) { stop(); try { w.setPointerCapture(ev.pointerId); } catch (_) { /* */ } drag = { kind: 'move', p, w, from: S.secSel }; S.secDrag = true; return; }
    const dv = tg.closest('[data-sdv]');
    if (dv) {
      stop(); try { w.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
      const id = dv.dataset.sdv, ax = id[0], pt = toMM(ev, w), s = p.sec;
      if (ax === 'c') { const [r, i] = id.slice(1).split('_').map(Number); drag = { ax, r, i, p, w, b: snapOf([p.id]), a0: s.rows.map((x) => x.slice()), p0: pt.x, G: geom(p), moved: false, grp: s.link ? s.rows.map((_, k) => k) : groupRows(p, r, i).filter((k) => s.rows[k].length > i + 1) }; }
      else { const i = +id.slice(1); drag = { ax, i, p, w, b: snapOf([p.id]), a0: s.rh.slice(), p0: pt.y, G: geom(p), moved: false }; }
      S.secDrag = true; drawOverlaysOnly(); return;
    }
    if (tg.closest('.sb,.hd,[data-tact],.tcedit')) { S.secMenu = null; return; }
    const pt0 = toMM(ev, w), G0 = geom(p), cell = cellAt(p, G0, pt0), ck = cell ? keyOf(cell.r, cell.c) : null; S.secMenu = null;
    if (ev.shiftKey && ck) { const cur0 = keysOf(p, G0); S.secSet = cur0.includes(ck) ? cur0.filter((x) => x !== ck) : cur0.concat(ck); S.secSel = S.secSet.length ? S.secSet[S.secSet.length - 1] : null; if (S.secSet.length && !S.secSet.includes(S.secSel)) S.secSel = S.secSet[0]; if (!S.secSet.length) S.secSet = null; }
    else { S.secSel = ck; S.secSet = null; }
    if (!hit(p, pt0)) msel = { w, p, x0: pt0.x, y0: pt0.y, base: ev.shiftKey ? (S.secSet || (S.secSel ? [S.secSel] : [])).slice() : [], moved: false };
    setTimeout(() => { drawOverlaysOnly(); renderProps(); }, 0);
  }, true);
  stage.addEventListener('pointermove', (ev) => {
    if (msel && !drag) {
      const m = msel, pt = toMM(ev, m.w); if (!m.moved && Math.hypot(pt.x - m.x0, pt.y - m.y0) * S.k < 5) return; m.moved = true;
      const G = geom(m.p), x0 = Math.min(m.x0, pt.x), x1 = Math.max(m.x0, pt.x), y0 = Math.min(m.y0, pt.y), y1 = Math.max(m.y0, pt.y), hitk = [];
      for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.rows[r].n; c++) { const kk = keyOf(r, c); if (G.cov[kk]) continue; const R = rectOf(G, r, c); if (R.x < x1 && R.x + R.w > x0 && R.y < y1 && R.y + R.h > y0) hitk.push(kk); }
      const all = Array.from(new Set(m.base.concat(hitk))); S.secSet = all.length > 1 ? all : null; S.secSel = all.length ? (hitk[0] || all[0]) : null; if (S.secSet && !S.secSet.includes(S.secSel)) S.secSel = S.secSet[0]; drawOverlaysOnly(); return;
    }
    if (!drag) return; const d = drag, pt = toMM(ev, d.w);
    if (d.kind === 'move') { const c = cellAt(d.p, geom(d.p), pt), k = c ? keyOf(c.r, c.c) : null; if (k !== S.secOver) { S.secOver = k; drawOverlaysOnly(); } return; }
    const s = d.p.sec, G = d.G;
    if (d.ax === 'c') {
      const R0 = G.rows[d.r], pair0 = R0.ws[d.i] + R0.ws[d.i + 1], na0 = Math.max(MINMM, Math.min(pair0 - MINMM, R0.ws[d.i] + (pt.x - d.p0)));
      if (Math.abs(na0 - R0.ws[d.i]) > 1e-6) d.moved = true;
      d.grp.forEach((rr) => { const R = G.rows[rr], u = R.t / R.aw, pr = R.ws[d.i] + R.ws[d.i + 1], na = Math.max(MINMM, Math.min(pr - MINMM, R.ws[d.i] + (na0 - R0.ws[d.i]))), a = s.rows[rr]; a[d.i] = na * u; a[d.i + 1] = (pr - na) * u; });
    } else {
      const u = G.sh / G.ah, delta = (pt.y - d.p0) * u, lo = MINMM * u, pair = d.a0[d.i] + d.a0[d.i + 1], na = Math.max(lo, Math.min(pair - lo, d.a0[d.i] + delta));
      if (Math.abs(na - d.a0[d.i]) > 1e-6) d.moved = true; s.rh[d.i] = na; s.rh[d.i + 1] = pair - na;
    }
    fit(d.p); scheduleRedraw(); ev.preventDefault();
  });
  const endDrag = () => {
    if (msel) { const m = msel; msel = null; if (m.moved) renderProps(); else if (m.addKey) { S.sel = []; S.secSel = m.addKey; openWidgets(); redraw(); renderProps(); } }
    if (!drag) return; const d = drag; drag = null; S.secDrag = false;
    if (d.kind === 'move') {
      const to = S.secOver; S.secOver = null;
      if (to && d.from && to !== d.from) { S.secSel = to; edit(d.p, (q) => swapCells(q, d.from, to)); } else { redraw(); renderProps(); }
      return;
    }
    if (d.moved) { pushHist(d.b, snapOf([d.p.id])); thumbRefresh(d.p.id); }
    flash(900); redraw(); renderProps();
  };
  stage.addEventListener('pointerup', endDrag, true); stage.addEventListener('pointercancel', endDrag, true);

  /* ---------- ganchos: soltar elemento, elemento novo ---------- */
  const ch0 = window.change;
  window.change = function (ids, fn) {
    return ch0.call(this, ids, function () {
      const before = new Map(); (ids || []).forEach((id) => { const p = S.pages[id]; if (on(p)) before.set(id, new Set(p.els.map((e) => e.id))); });
      fn();
      before.forEach((set, id) => { const p = S.pages[id]; if (p) { const nu = new Set(p.els.filter((e) => !set.has(e.id)).map((e) => e.id)); fit(p, nu, nu); } });
    });
  };
  function drop(p, ids) { if (on(p)) fit(p, new Set(ids || [])); }

  /* ---------- coluna da direita: seções sempre no topo + cartão do elemento ---------- */
  const rp = window.renderProps;
  window.renderProps = function () {
    const r = rp.apply(this, arguments);
    try {
      const P = document.getElementById('props'), p = curPage(), els = selEls();
      if (!P || !on(p) || !els.length || P.querySelector('[data-acc="pg_sec"]')) return r;
      const blk = block(p), back = P.querySelector('#pbRow'), wrap = document.createElement('div'); wrap.className = 'secpin';
      wrap.innerHTML = '<div class="secttl"><i></i><b>Configuração da página</b><i></i></div>'; wrap.appendChild(blk);
      const tt = document.createElement('div'); tt.className = 'secttl'; tt.innerHTML = '<i></i><b>' + (els.length === 1 ? 'Objeto selecionado' : els.length + ' objetos') + '</b><i></i>'; wrap.appendChild(tt);
      if (back) back.insertAdjacentElement('afterend', wrap); else P.insertBefore(wrap, P.firstChild);
      if (els.length === 1) {
        const e = els[0], first = P.querySelector('.pact'); if (!first) return r;
        const w = document.createElement('div'); w.id = 'secEl'; w.className = 'secsel';
        w.innerHTML = e.slot ? `<div class="srow"><b>Seção ${unkey(e.slot)[0] + 1}·${unkey(e.slot)[1] + 1}</b><button type="button" class="btn xs pri" data-se="rot">↻ Girar seção</button><button type="button" class="btn xs" data-se="free">Soltar da seção</button></div>`
          : `<div class="srow"><b>Fora das seções</b><button type="button" class="btn xs pri" data-se="fit">Encaixar numa seção</button></div>`;
        first.insertAdjacentElement('afterend', w);
        w.addEventListener('click', (ev) => {
          const b = ev.target.closest('[data-se]'); if (!b) return; const a = b.dataset.se;
          if (a === 'rot') edit(p, (q) => rotKey(q.sec, e.slot, 90));
          else if (a === 'free') edit(p, () => { delete e.slot; e.free = true; });
          else if (a === 'fit') edit(p, () => { e.free = false; }, new Set([e.id]));
        });
      }
    } catch (err) { console.warn(err); }
    return r;
  };

  window.Secoes = { block, setMode, fit, drop, on, geom, act, infer };
})();
