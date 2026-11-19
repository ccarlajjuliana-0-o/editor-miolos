/* Tabela estilo planilha: seleção de células/linhas/colunas, tamanhos individuais, travas, bordas/fundo/fonte por célula,
   botões + e − nas linhas de divisão e fórmulas simples (=SOMA(B2:B5), =B2*C2…). Tabelas antigas continuam iguais. */
(function () {
  'use strict';
  const r2 = (v) => Math.round(v * 100) / 100;
  const colName = (n) => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const hasH = (e) => Array.isArray(e.header) && e.header.length > 0;
  const nR = (e) => e.rows + (hasH(e) ? 1 : 0);
  const key = (r, c) => r + ',' + c;
  const cellOf = (e, r, c) => (e.cells && e.cells[key(r, c)]) || null;
  const MINR = 1.5, MINC = 3;

  /* ---------- tamanhos (linhas e colunas com trava) ---------- */
  function dist(arr, n, total, locks) {
    const a = Array.isArray(arr) && arr.length === n ? arr.map((v) => Math.max(0.01, +v || 0.01)) : Array(n).fill(1);
    const lk = a.map((_, i) => !!(locks && locks[i]));
    let sumL = 0, wf = 0, nf = 0; a.forEach((v, i) => { if (lk[i]) sumL += v; else { wf += v; nf++; } });
    if (!nf) { const s = a.reduce((x, y) => x + y, 0) || 1; return a.map((v) => v / s * total); }
    if (sumL > total * 0.9) { const k = total * 0.9 / sumL; return a.map((v, i) => (lk[i] ? v * k : (total - sumL * k) / nf)); }
    const free = total - sumL; return a.map((v, i) => (lk[i] ? v : (wf ? v / wf * free : free / nf)));
  }
  /* widgets têm título/moldura: a tabela fica numa área interna (WX.layout) deslocada do canto do elemento */
  function inn(e) {
    if (!(e.wx && window.WX && WX.layout)) return { ox: 0, oy: 0, W: e.w, H: e.h, hd: 0 };
    try { const L = WX.layout(e); return { ox: L.ix, oy: L.iy, W: L.iw, H: L.ih, hd: L.hd || 0 }; } catch (er) { return { ox: 0, oy: 0, W: e.w, H: e.h, hd: 0 }; }
  }
  function lay(e, raw) {
    const I = raw ? { ox: 0, oy: 0, W: e.w, H: e.h, hd: 0 } : inn(e), H = hasH(e), rows = nR(e), cols = e.cols, rh = dist(e.rh, rows, I.H, e.lockR), cw = dist(e.cwm || e.cw, cols, I.W, e.lockC), ry = [0], cx = [0];
    rh.forEach((v) => ry.push(ry[ry.length - 1] + v)); cw.forEach((v) => cx.push(cx[cx.length - 1] + v));
    return { H, rows, cols, rh, cw, ry, cx, ox: I.ox, oy: I.oy, W: I.W, Ht: I.H, hd: I.hd };
  }
  window.colWidths = function (e) { return lay(e, true).cw; };
  let DW = 0, DH = 0;
  function bake(e) { const I = inn(e); DW = e.w - I.W; DH = e.h - I.H; const L = lay(e); e.rh = L.rh.map(r2); e.cwm = L.cw.map(r2); e.cw = null; e.w = r2(e.cwm.reduce((a, b) => a + b, 0) + DW); e.h = r2(e.rh.reduce((a, b) => a + b, 0) + DH); }
  const sumH = (e) => { e.h = r2(e.rh.reduce((a, b) => a + b, 0) + DH); }, sumW = (e) => { e.w = r2(e.cwm.reduce((a, b) => a + b, 0) + DW); };

  /* ---------- texto, números e fórmulas ---------- */
  function raw(e, r, c) {
    const x = cellOf(e, r, c); if (x && x.t !== undefined) return String(x.t);
    const H = hasH(e); if (H && r === 0) return String((e.header || [])[c] ?? '');
    if (c === 0 && Array.isArray(e.side)) { const s = e.side[r - (H ? 1 : 0)]; return s ? String(s) : ''; }
    return '';
  }
  function setRaw(e, r, c, v) {
    const H = hasH(e), k = key(r, c); e.cells = e.cells || {};
    if (H && r === 0) { e.header = (e.header || []).slice(); while (e.header.length < e.cols) e.header.push(''); e.header[c] = v; if (e.cells[k]) delete e.cells[k].t; return; }
    if (c === 0 && Array.isArray(e.side)) { e.side = e.side.slice(); while (e.side.length < e.rows) e.side.push(''); e.side[r - (H ? 1 : 0)] = v; if (e.cells[k]) delete e.cells[k].t; return; }
    e.cells[k] = e.cells[k] || {}; if (v === '' && Object.keys(e.cells[k]).length === 1) delete e.cells[k]; else e.cells[k].t = v;
  }
  const toNum = (s) => { s = String(s).replace(/R\$|\s/g, ''); if (!s) return NaN; if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.'); else if (s.endsWith('%') && !isNaN(parseFloat(s))) return parseFloat(s) / 100; return /^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(s) ? parseFloat(s) : NaN; };
  const refRC = (s) => { const m = /^([A-Za-z]{1,2})(\d+)$/.exec(s); if (!m) return null; let c = 0; for (const ch of m[1].toUpperCase()) c = c * 26 + ch.charCodeAt(0) - 64; return [+m[2] - 1, c - 1]; };
  function evalF(e, src, stack) {
    const toks = []; const re = /\s*(\d+(?:[.,]\d+)?%?|[A-Za-zÀ-ÿ]{1,2}\d+(?::[A-Za-z]{1,2}\d+)?|[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.]*(?=\s*\()|[-+*/^();,])/y; let i = 0, m;
    src = src.trim(); while (i < src.length) { re.lastIndex = i; m = re.exec(src); if (!m) throw '#ERRO!'; toks.push(m[1]); i = re.lastIndex; }
    let p = 0; const peek = () => toks[p], next = () => toks[p++];
    const cellV = (r, c, rangeMode) => { if (r < 0 || c < 0 || r >= nR(e) || c >= e.cols) throw '#REF!'; if (stack.includes(key(r, c))) throw '#CICLO!'; const s = raw(e, r, c); if (s[0] === '=') return evalF(e, s.slice(1), stack.concat(key(r, c))); const n = toNum(s); if (isNaN(n)) { if (rangeMode || s === '') return rangeMode ? null : 0; throw '#VALOR!'; } return n; };
    const flat = (a) => a.flat(2);
    const FN = { SOMA: (a) => a.reduce((x, y) => x + y, 0), SUM: null, MEDIA: (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), AVERAGE: null, MIN: (a) => (a.length ? Math.min(...a) : 0), MAX: (a) => (a.length ? Math.max(...a) : 0), MULT: (a) => a.reduce((x, y) => x * y, 1), PRODUTO: null, PRODUCT: null, CONT: (a) => a.length, COUNT: null, 'CONT.NUM': null, ABS: (a) => Math.abs(a[0]), ARRED: (a) => { const d = Math.pow(10, a[1] || 0); return Math.round(a[0] * d) / d; }, ROUND: null };
    FN.SUM = FN.SOMA; FN.AVERAGE = FN.MEDIA; FN['MÉDIA'] = FN.MEDIA; FN.PRODUTO = FN.PRODUCT = FN.MULT; FN.COUNT = FN['CONT.NUM'] = FN.CONT; FN.ROUND = FN.ARRED;
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(), b = term(); v = o === '+' ? sc(v) + sc(b) : sc(v) - sc(b); } return v; }
    function term() { let v = pw(); while (peek() === '*' || peek() === '/') { const o = next(), b = pw(); if (o === '*') v = sc(v) * sc(b); else { if (sc(b) === 0) throw '#DIV/0!'; v = sc(v) / sc(b); } } return v; }
    function pw() { const b = un(); if (peek() === '^') { next(); return Math.pow(sc(b), sc(pw())); } return b; }
    function un() { if (peek() === '-') { next(); return -sc(un()); } if (peek() === '+') { next(); return sc(un()); } return prim(); }
    const sc = (v) => { if (Array.isArray(v)) { const f = flat(v).filter((x) => x !== null); return f.length ? f[0] : 0; } return v; };
    function prim() {
      const t = next(); if (t === undefined) throw '#ERRO!';
      if (t === '(') { const v = expr(); if (next() !== ')') throw '#ERRO!'; return v; }
      if (/^\d/.test(t)) { let s = t; const pc = s.endsWith('%'); if (pc) s = s.slice(0, -1); const n = parseFloat(s.replace(',', '.')); return pc ? n / 100 : n; }
      if (peek() === '(' && /^[A-Za-zÀ-ÿ]/.test(t) && !refRC(t)) { next(); const args = []; if (peek() !== ')') { for (;;) { args.push(expr()); if (peek() === ';' || peek() === ',') { next(); continue; } break; } } if (next() !== ')') throw '#ERRO!'; const f = FN[t.toUpperCase()]; if (!f) throw '#NOME?'; return f(flat(args).filter((x) => x !== null && !isNaN(x))); }
      if (t.includes(':')) { const [a, b] = t.split(':'), A = refRC(a), B = refRC(b); if (!A || !B) throw '#REF!'; const out = []; for (let r = Math.min(A[0], B[0]); r <= Math.max(A[0], B[0]); r++) for (let c = Math.min(A[1], B[1]); c <= Math.max(A[1], B[1]); c++) out.push(cellV(r, c, true)); return out; }
      const R = refRC(t); if (R) return cellV(R[0], R[1], false);
      throw '#NOME?';
    }
    const v = expr(); if (p < toks.length) throw '#ERRO!'; return sc(v);
  }
  const fmtNum = (x) => { if (!isFinite(x)) return '#NUM!'; x = Math.round(x * 1e6) / 1e6; return Number.isInteger(x) ? String(x) : x.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false }); };
  function disp(e, r, c) { const s = raw(e, r, c); if (s[0] !== '=') return s; try { return fmtNum(evalF(e, s.slice(1), [key(r, c)])); } catch (er) { return typeof er === 'string' ? er : '#ERRO!'; } }

  /* ---------- desenho ---------- */
  function cellStyle(e, r, c) {
    const x = cellOf(e, r, c) || {}, H = hasH(e) && r === 0;
    return { font: x.font || (H ? (e.hdFont || e.font) : e.font), size: x.size || (H ? e.hdSize : 0) || e.size || 8, color: x.color || (H ? (e.hdColor || e.color) : e.color), weight: x.weight || (H ? (e.hdWeight || 600) : (c === 0 && Array.isArray(e.side) ? 600 : 400)), italic: !!x.italic, under: !!x.under, ls: x.ls || (H ? e.hdLs || 0 : 0), al: x.al || (H ? (e.hdAlign || 'center') : 'left'), va: x.va || 'middle' };
  }
  function drawText(c, e, r, k, X, Y, W, Hh) {
    const s = disp(e, r, k); if (!s) return; const st = cellStyle(e, r, k), pad = 0.9;
    let fs = Math.min(st.size * PT, Hh * 0.62); if (cellOf(e, r, k) && cellOf(e, r, k).size) fs = Math.min(st.size * PT, Hh * 0.9);
    c.save(); c.beginPath(); c.rect(X, Y, W, Hh); c.clip(); c.fillStyle = st.color;
    const setF = () => { font(c, fs, st.font, st.weight, st.italic); setLS(c, st.ls * fs * F); };
    let lines; setF(); const maxW = Math.max(1, W - pad * 2);
    lines = (s.indexOf('\n') < 0 && M(c, s) <= maxW) ? [s] : wrap(c, s, maxW);
    let lh = fs * 1.2; let guard = 0; while (lines.length * lh > Hh - 0.6 && fs > st.size * PT * 0.5 && guard++ < 12) { fs *= 0.92; setF(); lines = wrap(c, s, maxW); lh = fs * 1.2; }
    const tot = lines.length * lh, y0 = st.va === 'top' ? Y + 0.4 : st.va === 'bottom' ? Y + Hh - tot - 0.4 : Y + (Hh - tot) / 2, px = st.al === 'left' ? X + pad : st.al === 'right' ? X + W - pad : X + W / 2;
    lines.forEach((t, i) => { const yy = y0 + lh * i + lh / 2; T(c, t, px, yy, st.al, 'middle'); if (st.under) { const w = M(c, t), x0 = st.al === 'left' ? px : st.al === 'right' ? px - w : px - w / 2; c.fillRect(x0, yy + fs * 0.42, w, Math.max(0.12, fs * 0.05)); } });
    setLS(c, 0); c.restore();
  }
  const bdSpec = (e, b) => (b && typeof b === 'object') ? { w: b.w || e.sw || 0.3, c: b.c || e.stroke, s: b.s || e.lnStyle } : null;
  R.table = function (c, e) {
    const L = lay(e, true), { H, rows, cols, rh, cw, ry, cx } = L, TW = cx[cols], TH = ry[rows], cells = e.cells || {}, hasBd = Object.keys(cells).some((q) => cells[q].bd);
    const cm = e.cellGap > 0 || e.cellR > 0, cg = cm ? Math.min(e.cellGap || 0, Math.min(...rh) * 0.5, Math.min(...cw) * 0.5) : 0, sw = e.sw || 0.3, hasHF = e.headFill && e.headFill !== 'none';
    const hl = e.hdLine || 'none', hlc = e.hdLc || e.stroke, hlw = e.hdLw || sw, hr = e.hdR > 0 ? e.hdR : (e.hdR === 0 ? 0 : Math.min(1.6, rh[0] / 4));
    const hsty = e.hdLnStyle || e.lnStyle, hlines = (X, Y, W, Hh) => LN.sideLines(c, X, Y, W, Hh, hr, hl, hsty, hlc, hlw);
    const zebra = (r) => (e.cellFill2 && e.cellFill2 !== 'none' && (r - (H ? 1 : 0)) % 2 === 1) ? e.cellFill2 : (e.cellFill && e.cellFill !== 'none' ? e.cellFill : null);
    const fillOv = (r, k) => { const x = cells[key(r, k)]; return x && x.fill !== undefined ? (x.fill === 'none' ? null : x.fill) : undefined; };
    const hdOv = H && Array.from({ length: cols }, (_, k) => fillOv(0, k)).some((v) => v !== undefined);
    if (cm) {
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const X = cx[k] + cg / 2, Y = ry[r] + cg / 2, W = cw[k] - cg, Hh = rh[r] - cg, isH = H && r === 0, ov = fillOv(r, k), x = cells[key(r, k)];
        if (isH) { const f = ov !== undefined ? ov : (hasHF ? e.headFill : null); if (f) { rr(c, X, Y, W, Hh, hr); c.fillStyle = f; c.fill(); } if (ov === undefined) hlines(X, Y, W, Hh); continue; }
        const fl = ov !== undefined ? ov : zebra(r), cr = Math.min(e.cellR || 0, W / 2, Hh / 2); rr(c, X, Y, W, Hh, cr); if (fl) { c.fillStyle = fl; c.fill(); }
        if (e.cellBorder !== false || (x && x.bd)) {
          const bd = (x && x.bd) || {}, sd = cellSides(e); let sides = ''; ['t', 'r', 'b', 'l'].forEach((q) => { const o = bd[q.toUpperCase()]; if (o === undefined && sd.includes(q)) sides += q; });
          if (sides) LN.stroke(c, LN.rect(X, Y, W, Hh, cr, sides), e.lnStyle, e.stroke, sw);
          [['T', X, Y, X + W, Y], ['R', X + W, Y, X + W, Y + Hh], ['B', X, Y + Hh, X + W, Y + Hh], ['L', X, Y, X, Y + Hh]].forEach(([q, x1, y1, x2, y2]) => { const o = bdSpec(e, bd[q]); if (o) LN.stroke(c, [LN.seg(x1, y1, x2, y2)], o.s, o.c, o.w); });
        }
      }
    } else {
      if (H && hasHF && !hdOv) { rr(c, 0, 0, TW, rh[0], hr); c.fillStyle = e.headFill; c.fill(); }
      if (H) { hlines(0, 0, TW, rh[0]); if (e.hdGrid) { const P = []; for (let k = 1; k < cols; k++) P.push(LN.seg(cx[k], 0, cx[k], rh[0])); LN.stroke(c, P, hsty, hlc, hlw); } }
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const isH = H && r === 0, ov = fillOv(r, k); let fl = ov !== undefined ? ov : (isH ? (hdOv && hasHF ? e.headFill : null) : zebra(r)); if (fl) { c.fillStyle = fl; c.fillRect(cx[k], ry[r], cw[k] + 0.02, rh[r] + 0.02); } }
      if (!hasBd) { const GP = []; if (e.gridH !== false) for (let r = H ? 1 : 0; r <= rows; r++) GP.push(LN.seg(0, ry[r], TW, ry[r])); if (e.gridV !== false) for (let i = 0; i <= cols; i++) GP.push(LN.seg(cx[i], H ? rh[0] : 0, cx[i], TH)); LN.stroke(c, GP, e.lnStyle, e.stroke, sw); }
      else {
        const he = {}, ve = {}, y0 = H ? 1 : 0; // arestas: he[r][k] topo da linha r; ve[k][r] esquerda da coluna k
        for (let r = y0; r <= rows; r++) for (let k = 0; k < cols; k++) if (e.gridH !== false) he[r + ',' + k] = 'd';
        for (let k = 0; k <= cols; k++) for (let r = y0; r < rows; r++) if (e.gridV !== false) ve[k + ',' + r] = 'd';
        for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const bd = cells[key(r, k)] && cells[key(r, k)].bd; if (!bd) continue; const set = (m, id, v) => { m[id] = v === undefined ? m[id] : (v || null); }; set(he, r + ',' + k, bd.T); set(he, (r + 1) + ',' + k, bd.B); set(ve, k + ',' + r, bd.L); set(ve, (k + 1) + ',' + r, bd.R); }
        const groups = new Map(), add = (v, seg) => { const o = v === 'd' ? { w: sw, c: e.stroke, s: e.lnStyle } : bdSpec(e, v); if (!o) return; const g = o.s + '|' + o.c + '|' + o.w; if (!groups.has(g)) groups.set(g, { o, P: [] }); groups.get(g).P.push(seg); };
        Object.keys(he).forEach((id) => { const [r, k] = id.split(',').map(Number); add(he[id], LN.seg(cx[k], ry[r], cx[k + 1], ry[r])); });
        Object.keys(ve).forEach((id) => { const [k, r] = id.split(',').map(Number); add(ve[id], LN.seg(cx[k], ry[r], cx[k], ry[r + 1])); });
        groups.forEach(({ o, P }) => LN.stroke(c, P, o.s, o.c, o.w));
      }
    }
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) drawText(c, e, r, k, cx[k] + cg / 2, ry[r] + cg / 2, cw[k] - cg, rh[r] - cg);
  };

  /* ---------- estrutura: inserir, excluir, redimensionar ---------- */
  function remap(e, fr, fc) { // fr/fc: índice antigo → novo (ou null para remover)
    const shift = (v) => (typeof v === 'string' && v[0] === '=' ? v.replace(/(^|[^A-Za-z0-9.])([A-Za-z]{1,2})(\d+)(?![\d(])/g, (m0, pre, L, n) => { const rc = refRC(L + n); if (!rc) return m0; const nr = fr(rc[0]), nc2 = fc(rc[1]); return nr === null || nc2 === null ? pre + '#REF!' : pre + colName(nc2) + (nr + 1); }) : v);
    if (Array.isArray(e.header)) e.header = e.header.map(shift); if (Array.isArray(e.side)) e.side = e.side.map(shift);
    Object.keys(e.cells || {}).forEach((q) => { if (e.cells[q].t !== undefined) e.cells[q].t = shift(e.cells[q].t); });
    const nc = {}; Object.keys(e.cells || {}).forEach((q) => { const [r, c] = q.split(',').map(Number), nr = fr(r), ncc = fc(c); if (nr === null || ncc === null) return; nc[key(nr, ncc)] = e.cells[q]; }); e.cells = nc;
    const lk = (o, f) => { const n = {}; Object.keys(o || {}).forEach((q) => { const v = f(+q); if (v !== null && o[q]) n[v] = true; }); return n; };
    e.lockR = lk(e.lockR, fr); e.lockC = lk(e.lockC, fc);
  }
  function insRow(e, at) {
    const H = hasH(e), y0 = H ? 1 : 0; at = Math.max(y0, Math.min(nR(e), at)); bake(e); const ref = Math.max(y0, Math.min(nR(e) - 1, at)), h = e.rh[ref] || 6;
    e.rh.splice(at, 0, h); e.rows++; if (Array.isArray(e.side)) { e.side = e.side.slice(); e.side.splice(at - y0, 0, ''); } remap(e, (r) => (r >= at ? r + 1 : r), (c) => c); sumH(e);
  }
  function delRow(e, i) {
    const H = hasH(e), y0 = H ? 1 : 0; if (e.rows <= 1) { toast('A tabela precisa de ao menos uma linha.'); return false; } if (i < y0 || i >= nR(e)) return false;
    bake(e); e.rh.splice(i, 1); e.rows--; if (Array.isArray(e.side)) { e.side = e.side.slice(); e.side.splice(i - y0, 1); } remap(e, (r) => (r === i ? null : r > i ? r - 1 : r), (c) => c); sumH(e); return true;
  }
  function insCol(e, at) {
    at = Math.max(0, Math.min(e.cols, at)); bake(e); const ref = Math.max(0, Math.min(e.cols - 1, at)), w = e.cwm[ref] || 20;
    e.cwm.splice(at, 0, w); e.cols++; if (Array.isArray(e.header)) { e.header = e.header.slice(); while (e.header.length < e.cols - 1) e.header.push(''); e.header.splice(at, 0, ''); } remap(e, (r) => r, (c) => (c >= at ? c + 1 : c)); sumW(e);
  }
  function delCol(e, i) {
    if (e.cols <= 1) { toast('A tabela precisa de ao menos uma coluna.'); return false; } if (i < 0 || i >= e.cols) return false;
    bake(e); e.cwm.splice(i, 1); e.cols--; if (Array.isArray(e.header)) { e.header = e.header.slice(); e.header.splice(i, 1); } remap(e, (r) => r, (c) => (c === i ? null : c > i ? c - 1 : c)); sumW(e); return true;
  }
  function sizeRow(e, i, h, keep) {
    if (e.lockR && e.lockR[i]) return false; bake(e); h = Math.max(MINR, h); const d = h - e.rh[i];
    if (keep) { let j = i + 1; while (j < e.rh.length && e.lockR && e.lockR[j]) j++; if (j >= e.rh.length) return false; const nj = Math.max(MINR, e.rh[j] - d); h = e.rh[i] + (e.rh[j] - nj); e.rh[j] = nj; }
    e.rh[i] = h; sumH(e); return true;
  }
  function sizeCol(e, i, w, keep) {
    if (e.lockC && e.lockC[i]) return false; bake(e); w = Math.max(MINC, w); const d = w - e.cwm[i];
    if (keep) { let j = i + 1; while (j < e.cwm.length && e.lockC && e.lockC[j]) j++; if (j >= e.cwm.length) return false; const nj = Math.max(MINC, e.cwm[j] - d); w = e.cwm[i] + (e.cwm[j] - nj); e.cwm[j] = nj; }
    e.cwm[i] = w; sumW(e); return true;
  }

  /* ---------- seleção ---------- */
  const TS = () => S.tcell;
  const curEl = () => { const t = TS(); if (!t) return null; const p = curPage(); return p ? p.els.find((x) => x.id === t.id) || null : null; };
  const tblEl = () => { const e = curEl(); if (e) return e; const x = selEls(); return x.length === 1 && x[0].type === 'table' ? x[0] : null; };
  const rng = (t) => ({ r0: Math.min(t.a[0], t.b[0]), r1: Math.max(t.a[0], t.b[0]), c0: Math.min(t.a[1], t.b[1]), c1: Math.max(t.a[1], t.b[1]) });
  const exit = () => { if (S.tcell) { try { const ae = document.activeElement; if (ae && ae.matches && ae.matches('input,textarea,select')) ae.blur(); } catch (er) { /* */ } S.tcell = null; try { drawOverlaysOnly(); renderProps(); } catch (er) { /* */ } } };
  function enter(e, r, c) { try { const ae = document.activeElement; if (ae && ae.matches && ae.matches('input,textarea,select')) ae.blur(); } catch (er) { /* */ } S.sel = [e.id]; S.tcell = { id: e.id, a: [r, c], b: [r, c], hover: null, drag: null, title: false }; redraw(); renderProps(); }
  const local = (e, pt) => { const I = inn(e), a = -(e.rot || 0) * Math.PI / 180, dx = pt.x - (e.x + e.w / 2), dy = pt.y - (e.y + e.h / 2); return { x: dx * Math.cos(a) - dy * Math.sin(a) + e.w / 2 - I.ox, y: dx * Math.sin(a) + dy * Math.cos(a) + e.h / 2 - I.oy }; };
  const findIdx = (arr, v) => { for (let i = 0; i < arr.length - 1; i++) if (v < arr[i + 1]) return i; return arr.length - 2; };
  const clampRC = (e, r, c) => [Math.max(0, Math.min(nR(e) - 1, r)), Math.max(0, Math.min(e.cols - 1, c))];
  const cellKeys = (e, t) => { const q = rng(t), out = []; for (let r = q.r0; r <= q.r1; r++) for (let c = q.c0; c <= q.c1; c++) out.push([r, c]); return out; };
  const label = (e, t) => { const q = rng(t), a = colName(q.c0) + (q.r0 + 1); return q.r0 === q.r1 && q.c0 === q.c1 ? a : a + ':' + colName(q.c1) + (q.r1 + 1); };

  /* ---------- sobreposição ---------- */
  const eo = window.extraOverlay;
  const tokc = (v, d) => { try { const x = window.WX && WX.tok ? WX.tok(v) : v; return /^#[0-9a-f]{6}$/i.test(x || '') ? x : d; } catch (er) { return d; } };
  window.extraOverlay = function (p, k) {
    let h = eo(p, k); const t = TS(); if (!t) return h;
    const e = curEl(); if (!e || S.sel.length !== 1 || S.sel[0] !== e.id || !p.els.includes(e)) { if (p === curPage()) S.tcell = null; return h; }
    const L = lay(e), q = rng(t), lk = (cond) => (cond ? `<b class="tlk">${ico('lock')}</b>` : ''), hdOn = L.hd > 0 && e.wx && e.wx.hd && e.wx.hd.on;
    let s = '';
    if (t.title && hdOn) s += `<div class="tsel" style="left:${-L.ox * k}px;top:${-L.oy * k}px;width:${(e.w) * k}px;height:${L.hd * k}px"></div>`;
    else {
      s += `<div class="tsel" style="left:${L.cx[q.c0] * k}px;top:${L.ry[q.r0] * k}px;width:${(L.cx[q.c1 + 1] - L.cx[q.c0]) * k}px;height:${(L.ry[q.r1 + 1] - L.ry[q.r0]) * k}px"></div>`;
      s += `<div class="tanc" style="left:${L.cx[t.a[1]] * k}px;top:${L.ry[t.a[0]] * k}px;width:${L.cw[t.a[1]] * k}px;height:${L.rh[t.a[0]] * k}px"></div>`;
    }
    for (let c = 0; c < L.cols; c++) s += `<i class="tcs${!t.title && c >= q.c0 && c <= q.c1 ? ' on' : ''}" data-tcol="${c}" style="left:${L.cx[c] * k}px;width:${L.cw[c] * k}px">${colName(c)}${lk(e.lockC && e.lockC[c])}</i>`;
    for (let r = 0; r < L.rows; r++) s += `<i class="trs${!t.title && r >= q.r0 && r <= q.r1 ? ' on' : ''}" data-trow="${r}" style="top:${L.ry[r] * k}px;height:${L.rh[r] * k}px">${r + 1}${lk(e.lockR && e.lockR[r])}</i>`;
    if (hdOn) s += `<i class="trs ttl${t.title ? ' on' : ''}" data-ttl="1" title="Linha do título do widget" style="top:${-L.oy * k}px;height:${L.hd * k}px">T${lk(e.wx.hd.lock)}</i>`;
    s += `<i class="tall" data-tall="1" title="Selecionar tudo"></i>`;
    for (const q2 of Object.keys(e.cells || {})) if (e.cells[q2].lock) { const [r, c] = q2.split(',').map(Number); if (r < L.rows && c < L.cols) s += `<b class="tclk" style="left:${(L.cx[c + 1] - 3.2) * k}px;top:${(L.ry[r] + 0.4) * k}px">${ico('lock')}</b>`; }
    const hv = t.hover;
    if (hv && !t.drag) {
      if (hv.ax === 'c') { const x = L.cx[hv.k] * k; s += `<i class="tgl v" style="left:${x}px"></i><div class="tchips c" style="left:${x}px"><button type="button" data-tact="inscol" data-i="${hv.k}" title="Inserir coluna aqui">＋</button><button type="button" data-tact="delcol" data-i="${Math.max(0, hv.k - 1)}" title="Excluir a coluna à esquerda desta linha">−</button></div>`; }
      else { const y = L.ry[hv.k] * k; s += `<i class="tgl h" style="top:${y}px"></i><div class="tchips r" style="top:${y}px"><button type="button" data-tact="insrow" data-i="${hv.k}" title="Inserir linha aqui">＋</button><button type="button" data-tact="delrow" data-i="${Math.max(0, hv.k - 1)}" title="Excluir a linha acima desta divisão">−</button></div>`; }
    }
    return h + `<div class="tov" style="left:${e.x * k}px;top:${e.y * k}px;width:${e.w * k}px;height:${e.h * k}px;transform:rotate(${e.rot || 0}deg)"><div class="tin" style="left:${L.ox * k}px;top:${L.oy * k}px;width:${L.W * k}px;height:${L.Ht * k}px">${s}</div></div>`;
  };

  /* ---------- editor da célula ---------- */
  let EDIT = null;
  function startEdit(e, r, c, init) {
    const isT = r === -1, x = cellOf(e, r, c);
    if (isT) { if (!(e.wx && e.wx.hd && e.wx.hd.on)) return; if (e.wx.hd.lock) { toast('Linha do título travada. Destrave para editar.'); return; } }
    else if (x && x.lock) { toast('Célula travada. Destrave para editar.'); return; }
    const w = document.querySelector('#stage .pg.on') || document.querySelector('#stage .pg'); if (!w) return; const ov = w.querySelector('.ov'); if (!ov) return;
    closeEdit(true); const L = lay(e), k = S.k, p = curPage(), b = snapOf([p.id]);
    const wrap = document.createElement('div'); wrap.className = 'tcw'; Object.assign(wrap.style, { left: e.x * k + 'px', top: e.y * k + 'px', width: e.w * k + 'px', height: e.h * k + 'px', transform: `rotate(${e.rot || 0}deg)` });
    const ta = document.createElement('textarea'); ta.className = 'tcedit';
    if (isT) { const hd = e.wx.hd; Object.assign(ta.style, { left: '0px', top: '0px', width: e.w * k + 'px', height: L.hd * k + 'px', fontFamily: `"${(window.WX && WX.fnt ? WX.fnt(hd.font) : 'Nunito')}", Nunito, sans-serif`, fontSize: Math.min((hd.size || 8) * PT, L.hd * 0.7) * k + 'px', fontWeight: hd.weight || 600, color: tokc(hd.c, '#3E3550'), textAlign: hd.align || 'center' }); ta.value = init !== undefined ? init : (hd.text || ''); }
    else { const st = cellStyle(e, r, c); Object.assign(ta.style, { left: (L.ox + L.cx[c]) * k + 'px', top: (L.oy + L.ry[r]) * k + 'px', width: Math.max(L.cw[c] * k, 60) + 'px', minHeight: L.rh[r] * k + 'px', fontFamily: `"${st.font}", Nunito, sans-serif`, fontSize: Math.min(st.size * PT, L.rh[r] * 0.62) * k + 'px', fontWeight: st.weight, fontStyle: st.italic ? 'italic' : 'normal', color: st.color, textAlign: st.al }); ta.value = init !== undefined ? init : raw(e, r, c); }
    wrap.append(ta); ov.append(wrap); S.editing = e.id; ta.focus(); if (init === undefined) ta.select(); else ta.setSelectionRange(ta.value.length, ta.value.length);
    EDIT = { e, r, c, ta, wrap, b, p, done: false };
    ta.onpointerdown = (ev) => ev.stopPropagation(); ta.ondblclick = (ev) => ev.stopPropagation();
    ta.onkeydown = (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); closeEdit(false); return; }
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); closeEdit(true); if (isT) { const t = TS(); if (t) { t.title = false; t.a = t.b = [hasH(e) ? 0 : 0, 0]; drawOverlaysOnly(); renderProps(); } } else move(e, 1, 0, false); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '\n' + ta.value.slice(ta.selectionEnd); ta.setSelectionRange(s + 1, s + 1); return; }
      if (ev.key === 'Tab' && !isT) { ev.preventDefault(); closeEdit(true); move(e, 0, ev.shiftKey ? -1 : 1, false); }
    };
    ta.onblur = () => closeEdit(true);
  }
  function closeEdit(commit) {
    const E = EDIT; if (!E || E.done) return; E.done = true; EDIT = null;
    if (commit) { const v = E.ta.value; if (E.r === -1) { if (v !== (E.e.wx.hd.text || '')) E.e.wx.hd.text = v; } else if (v !== raw(E.e, E.r, E.c)) setRaw(E.e, E.r, E.c, v); }
    E.wrap.remove(); S.editing = null; if (commit) pushHist(E.b, snapOf([E.p.id])); redraw(); renderProps(); try { thumbRefresh(E.p.id); } catch (er) { /* */ }
  }
  function move(e, dr, dc, extend) {
    const t = TS(); if (!t) return; if (t.title) { if (dr > 0) { t.title = false; t.a = [0, 0]; t.b = [0, 0]; drawOverlaysOnly(); renderProps(); } return; } if (dr < 0 && t.b[0] === 0 && e.wx && e.wx.hd && e.wx.hd.on && !extend) { t.title = true; drawOverlaysOnly(); renderProps(); return; } const f = clampRC(e, t.b[0] + dr, t.b[1] + dc); t.b = f; if (!extend) t.a = f.slice(); drawOverlaysOnly(); renderProps();
  }

  /* ---------- ações (botões + e −, painel) ---------- */
  function mutate(fn, msg) { const p = curPage(), e = tblEl(); if (!e) return; const b = snapOf([p.id]); const ok = fn(e); if (ok === false) return; pushHist(b, snapOf([p.id])); redraw(); renderProps(); try { thumbRefresh(p.id); } catch (er) { /* */ } if (msg) toast(msg); }
  function act(a, i) {
    const t = TS(), e = curEl(); if (!e) return; const q = t ? rng(t) : null;
    if (a === 'inscol') mutate((x) => { insCol(x, i); t.a = [t.a[0], i]; t.b = [t.b[0], i]; });
    else if (a === 'delcol') mutate((x) => { if (!delCol(x, i)) return false; t.a = clampRC(x, t.a[0], Math.min(t.a[1], x.cols - 1)); t.b = t.a.slice(); });
    else if (a === 'insrow') mutate((x) => { insRow(x, i); const nr = Math.max(hasH(x) ? 1 : 0, i); t.a = [nr, t.a[1]]; t.b = [nr, t.b[1]]; });
    else if (a === 'delrow') mutate((x) => { if (!delRow(x, i)) return false; t.a = clampRC(x, Math.min(t.a[0], nR(x) - 1), t.a[1]); t.b = t.a.slice(); });
    else if (a === 'insrowA') act('insrow', q.r0); else if (a === 'insrowB') act('insrow', q.r1 + 1); else if (a === 'inscolA') act('inscol', q.c0); else if (a === 'inscolB') act('inscol', q.c1 + 1);
    else if (a === 'delrowT') mutate((x) => { if (!delRow(x, q.r0)) return false; t.a = clampRC(x, Math.min(q.r0, nR(x) - 1), t.a[1]); t.b = t.a.slice(); });
    else if (a === 'delrowB') mutate((x) => { if (!delRow(x, q.r1)) return false; t.a = clampRC(x, Math.min(q.r1, nR(x) - 1), t.a[1]); t.b = t.a.slice(); });
    else if (a === 'delcolL') mutate((x) => { if (!delCol(x, q.c0)) return false; t.a = clampRC(x, t.a[0], Math.min(q.c0, x.cols - 1)); t.b = t.a.slice(); });
    else if (a === 'delcolR') mutate((x) => { if (!delCol(x, q.c1)) return false; t.a = clampRC(x, t.a[0], Math.min(q.c1, x.cols - 1)); t.b = t.a.slice(); });
    else if (a === 'delrows') mutate((x) => { let n = 0; for (let r = q.r1; r >= q.r0; r--) if (delRow(x, r)) n++; if (!n) return false; t.a = clampRC(x, Math.min(q.r0, nR(x) - 1), t.a[1]); t.b = t.a.slice(); });
    else if (a === 'delcols') mutate((x) => { let n = 0; for (let c = q.c1; c >= q.c0; c--) if (delCol(x, c)) n++; if (!n) return false; t.a = clampRC(x, t.a[0], Math.min(q.c0, x.cols - 1)); t.b = t.a.slice(); });
  }

  /* ---------- mouse e teclado ---------- */
  const stage = document.getElementById('stage');
  let drag = null;
  /* faixas de passagem do mouse: a linha de divisão + o caminho até os botões ＋ e − (que ficam fora da tabela) */
  function hoverAt(e, lp, k, L, cur) {
    const tol = 7 / k, W = L.W, H = L.Ht;
    if (cur && !drag) { // mantém o botão enquanto o mouse caminha até ele
      if (cur.ax === 'c') { const x = L.cx[cur.k]; if (Math.abs(lp.x - x) <= 26 / k && lp.y >= -70 / k && lp.y <= H + 6 / k) return cur; }
      else { const y = L.ry[cur.k]; if (Math.abs(lp.y - y) <= 26 / k && lp.x >= -90 / k && lp.x <= W + 6 / k) return cur; }
    }
    if (lp.y >= -4 / k && lp.y <= H + 4 / k && lp.x >= -4 / k && lp.x <= W + 4 / k) {
      for (let i = 0; i <= L.cols; i++) if (Math.abs(lp.x - L.cx[i]) <= tol) return { ax: 'c', k: i };
      for (let i = 0; i <= L.rows; i++) if (Math.abs(lp.y - L.ry[i]) <= tol) return { ax: 'r', k: i };
    }
    return null;
  }
  const hdBand = (e, L, lp) => { const hdOn = L.hd > 0 && e.wx && e.wx.hd && e.wx.hd.on; if (!hdOn) return 0; const top = -L.oy, bot = top + L.hd; if (lp.x < -L.ox - 1 || lp.x > e.w - L.ox + 1) return 0; if (Math.abs(lp.y - bot) <= 4 / S.k) return 2; if (lp.y >= top - 1 && lp.y < bot) return 1; return 0; };
  stage.addEventListener('pointerdown', (ev) => {
    const t = TS(); if (!t) return; const tg = ev.target;
    if (tg.closest && tg.closest('.tcedit')) return;
    const chip = tg.closest && tg.closest('[data-tact]'); if (chip) { ev.stopPropagation(); ev.preventDefault(); t.hover = null; act(chip.dataset.tact, +chip.dataset.i); return; }
    const w = tg.closest && tg.closest('.pg'); if (!w || ev.button > 0) return; const p = S.pages[w.dataset.id], e = curEl();
    if (!e || p !== curPage()) { exit(); return; } if (tg.dataset && (tg.dataset.h !== undefined || tg.dataset.v !== undefined)) return;
    closeEdit(true);
    const pt = toMM(ev, w), lp = local(e, pt), L = lay(e), k = S.k, tol = 5 / k, down = () => { ev.preventDefault(); ev.stopPropagation(); try { w.setPointerCapture(ev.pointerId); } catch (er) { /* */ } };
    const colSel = tg.closest('[data-tcol]'), rowSel = tg.closest('[data-trow]'), ttlSel = tg.closest('[data-ttl]');
    if (tg.closest('[data-tall]')) { down(); t.title = false; t.a = [0, 0]; t.b = [nR(e) - 1, e.cols - 1]; drawOverlaysOnly(); renderProps(); return; }
    if (ttlSel) { down(); t.title = true; drawOverlaysOnly(); renderProps(); return; }
    if (colSel) { down(); t.title = false; const c = +colSel.dataset.tcol; if (ev.shiftKey) t.b = [nR(e) - 1, c]; else { t.a = [0, c]; t.b = [nR(e) - 1, c]; } drag = { kind: 'cols', w }; drawOverlaysOnly(); renderProps(); return; }
    if (rowSel) { down(); t.title = false; const r = +rowSel.dataset.trow; if (ev.shiftKey) t.b = [r, e.cols - 1]; else { t.a = [r, 0]; t.b = [r, e.cols - 1]; } drag = { kind: 'rows', w }; drawOverlaysOnly(); renderProps(); return; }
    const band = hdBand(e, L, lp);
    if (band) {
      down(); t.title = true; t.hover = null;
      if (band === 2 && !(e.wx.hd.lock)) drag = { kind: 'title', y0: lp.y, b: snapOf([p.id]), p, e, moved: false, w };
      else if (band === 2) toast('Linha do título travada: destrave para mudar a altura.');
      drawOverlaysOnly(); renderProps(); return;
    }
    const inside = lp.x >= 0 && lp.x <= L.W && lp.y >= 0 && lp.y <= L.Ht;
    if (!inside && !(lp.x >= -tol && lp.x <= L.W + tol && lp.y >= -tol && lp.y <= L.Ht + tol)) { exit(); return; }
    down(); t.title = false;
    for (let i = 1; i <= L.cols; i++) if (Math.abs(lp.x - L.cx[i]) <= tol) { if (e.lockC && e.lockC[i - 1]) { toast('Coluna travada: destrave para mudar a largura.'); return; } drag = { kind: 'col', i: i - 1, x0: lp.x, b: snapOf([p.id]), p, e, moved: false, w }; return; }
    for (let i = 1; i <= L.rows; i++) if (Math.abs(lp.y - L.ry[i]) <= tol) { if (e.lockR && e.lockR[i - 1]) { toast('Linha travada: destrave para mudar a altura.'); return; } drag = { kind: 'row', i: i - 1, y0: lp.y, b: snapOf([p.id]), p, e, moved: false, w }; return; }
    const r = findIdx(L.ry, Math.max(0, Math.min(L.Ht - 0.001, lp.y))), c = findIdx(L.cx, Math.max(0, Math.min(L.W - 0.001, lp.x)));
    if (ev.shiftKey) t.b = [r, c]; else { t.a = [r, c]; t.b = [r, c]; } drag = { kind: 'sel', w, sx: ev.clientX, sy: ev.clientY, armed: false }; t.hover = null; drawOverlaysOnly(); renderProps();
  }, true);
  stage.addEventListener('pointermove', (ev) => {
    const t = TS(); if (!t) return; const e = curEl(); if (!e) return; const w = (drag && drag.w) || (ev.target.closest && ev.target.closest('.pg')); if (!w) return;
    const pt = toMM(ev, w), lp = local(e, pt), L = lay(e);
    if (drag) {
      if (drag.kind === 'sel') { if (!drag.armed) { if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 5) return; drag.armed = true; } const r = findIdx(L.ry, Math.max(0, Math.min(L.Ht - 0.001, lp.y))), c = findIdx(L.cx, Math.max(0, Math.min(L.W - 0.001, lp.x))); if (t.b[0] !== r || t.b[1] !== c) { t.b = [r, c]; drawOverlaysOnly(); } }
      else if (drag.kind === 'cols') { const c = findIdx(L.cx, Math.max(0, Math.min(L.W - 0.001, lp.x))); t.b = [nR(e) - 1, c]; drawOverlaysOnly(); }
      else if (drag.kind === 'rows') { const r = findIdx(L.ry, Math.max(0, Math.min(L.Ht - 0.001, lp.y))); t.b = [r, e.cols - 1]; drawOverlaysOnly(); }
      else if (drag.kind === 'col') { if (Math.abs(lp.x - drag.x0) * S.k < 3 && !drag.moved) return; drag.moved = true; const w0 = L.cw[drag.i]; if (sizeCol(e, drag.i, w0 + (lp.x - drag.x0), ev.shiftKey)) { drag.x0 += e.cwm[drag.i] - w0; } scheduleRedraw(); }
      else if (drag.kind === 'row') { if (Math.abs(lp.y - drag.y0) * S.k < 3 && !drag.moved) return; drag.moved = true; const h0 = L.rh[drag.i]; if (sizeRow(e, drag.i, h0 + (lp.y - drag.y0), ev.shiftKey)) { drag.y0 += e.rh[drag.i] - h0; } scheduleRedraw(); }
      else if (drag.kind === 'title') { if (Math.abs(lp.y - drag.y0) * S.k < 3 && !drag.moved) return; drag.moved = true; const d = Math.max(3, (e.wx.hd.h || 7) + (lp.y - drag.y0)) - (e.wx.hd.h || 7); if (d) { bake(e); e.wx.hd.h = r2((e.wx.hd.h || 7) + d); e.h = r2(e.h + d); drag.y0 += d; scheduleRedraw(); } }
      return;
    }
    if (ev.target.closest && ev.target.closest('[data-tact]')) return;
    const cur = t.hover, h = hoverAt(e, lp, S.k, L, cur);
    if ((!h && !cur) || (h && cur && h.ax === cur.ax && h.k === cur.k)) return; t.hover = h; drawOverlaysOnly();
  });
  const endT = () => {
    const t = TS(); if (!drag) return; const d = drag; drag = null; if (!t) return;
    if ((d.kind === 'col' || d.kind === 'row' || d.kind === 'title') && d.moved) { pushHist(d.b, snapOf([d.p.id])); try { thumbRefresh(d.p.id); } catch (er) { /* */ } }
    redraw(); renderProps();
  };
  stage.addEventListener('pointerup', endT, true); stage.addEventListener('pointercancel', endT, true);

  stage.addEventListener('dblclick', (ev) => {
    const w = ev.target.closest && ev.target.closest('.pg'); if (!w || S.tool || S.ptEdit) return; const p = S.pages[w.dataset.id]; if (!p) return;
    if (ev.target.closest('[data-tact],[data-tcol],[data-trow],.tcedit')) { ev.stopImmediatePropagation(); return; }
    const pt = toMM(ev, w); let e = null;
    for (let i = p.els.length - 1; i >= 0; i--) { const x = p.els[i]; if (x.hidden || x.locked) continue; const a = -(x.rot || 0) * Math.PI / 180, dx = pt.x - (x.x + x.w / 2), dy = pt.y - (x.y + x.h / 2), lx = dx * Math.cos(a) - dy * Math.sin(a) + x.w / 2, ly = dx * Math.sin(a) + dy * Math.cos(a) + x.h / 2; if (lx >= 0 && lx <= x.w && ly >= 0 && ly <= x.h) { e = x; break; } }
    if (!e || e.type !== 'table') return; ev.stopImmediatePropagation(); ev.preventDefault();
    const lp = local(e, pt), L = lay(e), band = hdBand(e, L, lp);
    if (!TS() || TS().id !== e.id) enter(e, 0, 0);
    if (band) { TS().title = true; drawOverlaysOnly(); renderProps(); startEdit(e, -1, 0); return; }
    const r = findIdx(L.ry, Math.max(0, Math.min(L.Ht - 0.001, lp.y))), c = findIdx(L.cx, Math.max(0, Math.min(L.W - 0.001, lp.x))), t = TS(); t.title = false; t.a = [r, c]; t.b = [r, c]; drawOverlaysOnly(); renderProps();
    startEdit(e, r, c);
  }, true);

  window.addEventListener('keydown', (ev) => {
    const t = TS(); if (!t || EDIT) return; const tg = ev.target; if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
    const e = curEl(); if (!e) return; const k = ev.key, mod = ev.ctrlKey || ev.metaKey, eat = () => { ev.preventDefault(); ev.stopImmediatePropagation(); };
    if (k === 'Escape') { eat(); exit(); return; }
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (d) { eat(); move(e, d[0], d[1], ev.shiftKey); return; }
    if (k === 'Tab') { eat(); move(e, 0, ev.shiftKey ? -1 : 1, false); return; }
    if (k === 'Enter' || k === 'F2') { eat(); if (t.title) startEdit(e, -1, 0); else startEdit(e, t.b[0], t.b[1]); return; }
    if (mod && k.toLowerCase() === 'a') { eat(); t.a = [0, 0]; t.b = [nR(e) - 1, e.cols - 1]; drawOverlaysOnly(); renderProps(); return; }
    if (t.title && (k === 'Delete' || k === 'Backspace')) { eat(); return; }
    if (k === 'Delete' || k === 'Backspace') { eat(); fmtApply((x, r, c) => { setRaw(x, r, c, ''); }, 'content'); return; }
    if (mod && (k.toLowerCase() === 'c' || k.toLowerCase() === 'x')) { eat(); const q = rng(t), rows = []; for (let r = q.r0; r <= q.r1; r++) { const a = []; for (let c = q.c0; c <= q.c1; c++) a.push(raw(e, r, c)); rows.push(a.join('\t')); } const txt = rows.join('\n'); window.__tclip = txt; try { navigator.clipboard.writeText(txt); } catch (er) { /* */ } if (k.toLowerCase() === 'x') fmtApply((x, r, c) => { setRaw(x, r, c, ''); }, 'content'); return; }
    if (mod && k.toLowerCase() === 'v') {
      eat(); const go = (txt) => { if (!txt) return; const q = rng(t), rows = txt.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t')); mutate((x) => { rows.forEach((row, i) => row.forEach((v, j) => { const r = q.r0 + i, c = q.c0 + j; if (r < nR(x) && c < x.cols) { const cl = cellOf(x, r, c); if (!(cl && cl.lock)) setRaw(x, r, c, v); } })); }); };
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then((s) => go(s || window.__tclip), () => go(window.__tclip)); else go(window.__tclip); return;
    }
    if (!mod && !ev.altKey && k.length === 1) { eat(); if (t.title) startEdit(e, -1, 0, k); else startEdit(e, t.b[0], t.b[1], k); }
  }, true);

  /* ---------- aplicar formatação à seleção ---------- */
  function fmtApply(fn, what) {
    const t = TS(), e = curEl(); if (!t || !e) return; let skipped = 0;
    mutate((x) => { cellKeys(x, t).forEach(([r, c]) => { const cl = cellOf(x, r, c); if (cl && cl.lock && what !== 'lock') { skipped++; return; } fn(x, r, c); }); if (skipped) toast(skipped + ' célula' + (skipped > 1 ? 's travadas foram' : ' travada foi') + ' ignorada' + (skipped > 1 ? 's' : '') + '.'); });
  }
  const setCell = (x, r, c, o) => { x.cells = x.cells || {}; const k = key(r, c); x.cells[k] = Object.assign(x.cells[k] || {}, o); Object.keys(x.cells[k]).forEach((q) => { if (x.cells[k][q] === undefined) delete x.cells[k][q]; }); if (!Object.keys(x.cells[k]).length) delete x.cells[k]; };

  /* ---------- painel lateral ---------- */
  const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
  const cf = (k, v, none) => colorField(k, v, none).replace(/data-cset="/g, 'data-tset="').replace(/data-k="/g, 'data-tk="').replace(/ data-gr="1"/g, '');
  const block = (id, title, body, openDef) => {
    const o = Pref.acc && Pref.acc[id] !== undefined ? Pref.acc[id] !== false : openDef !== false, w = document.createElement('div'); w.className = 'wacc' + (o ? ' open' : ''); w.dataset.acc = id;
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${o}"><i class="wtri"></i><b>${title}</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab"><div class="pgrp tpan">${body}</div></div>`;
    const hd = w.querySelector('.wah'); hd.onclick = () => { w.classList.toggle('open'); const on = w.classList.contains('open'); hd.setAttribute('aria-expanded', on); Pref.acc = Pref.acc || {}; Pref.acc[id] = on; try { savePref(); } catch (er) { /* */ } };
    return w;
  };
  /* fundo: seleção = tabela toda → vira a cor "do todo"; seleção parcial → exceção só dessas células; "sem cor" numa exceção devolve a célula ao todo */
  function fillCore(z, t, v) {
    const q = rng(t), y0 = hasH(z) ? 1 : 0, allBody = q.c0 === 0 && q.c1 === z.cols - 1 && q.r0 <= y0 && q.r1 === nR(z) - 1, withHead = hasH(z) && q.r0 === 0;
    const free = (r, c) => !(cellOf(z, r, c) || {}).lock;
    if (allBody) {
      if (v === 'none' || v === null) { z.cellFill = 'none'; z.cellFill2 = 'none'; if (withHead) z.headFill = 'none'; } else { z.cellFill = v; z.cellFill2 = 'none'; if (withHead) z.headFill = v; }
      cellKeys(z, t).forEach(([r, c]) => { if (free(r, c)) setCell(z, r, c, { fill: undefined }); });
    } else cellKeys(z, t).forEach(([r, c]) => { if (free(r, c)) setCell(z, r, c, { fill: v === 'none' || v === null ? undefined : v }); });
  }
  const applyFill = (v) => { const t = TS(); if (t) mutate((z) => fillCore(z, t, v)); };
  /* contorno da célula: um único botão por lado liga/desliga (lados internos entram só em "todos") */
  const bdTargets = (e, t, s2) => { const q = rng(t), sides = s2 === 'A' ? ['T', 'R', 'B', 'L'] : [s2], out = []; cellKeys(e, t).forEach(([r, c]) => sides.forEach((sd) => { const inner = (sd === 'T' && r !== q.r0) || (sd === 'B' && r !== q.r1) || (sd === 'L' && c !== q.c0) || (sd === 'R' && c !== q.c1); if (s2 !== 'A' && inner) return; out.push([r, c, sd]); })); return out; };
  const bdOn = (e, r, c, sd) => { const bd = (cellOf(e, r, c) || {}).bd, v = bd && bd[sd]; if (v !== undefined) return !!v; if (e.cellGap > 0 || e.cellR > 0) return e.cellBorder !== false && cellSides(e).includes(sd.toLowerCase()); return sd === 'T' || sd === 'B' ? e.gridH !== false : e.gridV !== false; };
  function panel(P) {
    ['tab', 'tcel', 'tfmt', 'tbrd', 'tfor', 'tcells'].forEach((id) => P.querySelectorAll(`[data-acc="${id}"]`).forEach((x) => x.remove()));
    const sel = selEls(); if (sel.length !== 1 || sel[0].type !== 'table') return; const e = sel[0];
    const cont = P.querySelector('[data-acc="cont"]'); if (!cont) return;
    FIELDS._tx1 = [['rows', 'Linhas', 'num', 1], ['cols', 'Colunas', 'num', 1], ['header', 'Cabeçalho (separe por vírgula)', 'list'], ['side', 'Primeira coluna (separe por vírgula)', 'list']];
    FIELDS._tx2 = [['font', 'Fonte', 'font'], ['size', 'Tamanho (pt)', 'num', 0.5], ['color', 'Cor do texto', 'color']];
    FIELDS._tx3 = [['stroke', 'Cor das linhas', 'colorN'], ['sw', 'Espessura (mm)', 'num', 0.05], ['lnStyle', 'Tipo de linha', 'sel', LN.OPTS, null, 'solid'], ['cellR', 'Cantos arredondados (mm)', 'num', 0.5], ['gridH', 'Linhas horizontais', 'chk', 0, null, true], ['gridV', 'Linhas verticais', 'chk', 0, null, true], ['cellBorder', 'Contorno da tabela', 'sides'],
      ['cellFill', 'Fundo das células', 'colorN'], ['cellFill2', 'Cor alternada (linhas)', 'colorN'], ['cellGap', 'Espaço entre células (mm)', 'num', 0.2]];
    const fx = (type) => fieldsHTML(Object.assign({}, e, { type }));
    const t = TS() && TS().id === e.id ? TS() : null, L = lay(e), nm = r2, H4 = (x) => `<h4 class="tsh">${x}</h4>`;
    const sizes = () => {
      const q = t && !t.title ? rng(t) : null, full = e.cols <= 10 && nR(e) <= 14, rs = [], cs = [];
      for (let c = 0; c < e.cols; c++) if (full || (q && c >= q.c0 && c <= q.c1)) cs.push(c);
      for (let r = 0; r < nR(e); r++) if (full || (q && r >= q.r0 && r <= q.r1)) rs.push(r);
      const row = (ax, i, v, lk) => `<div class="tsz"><span>${ax === 'c' ? colName(i) : i + 1}</span><input type="number" step="0.5" min="1" data-tsz="${ax}${i}" value="${nm(v)}"><label class="tlkb" title="Travar"><input type="checkbox" data-tlk="${ax}${i}"${lk ? ' checked' : ''}><i>${ico('lock')}</i></label></div>`;
      return `<h5 class="tsh2">Largura das colunas (mm)</h5><div class="tszg">${cs.map((c) => row('c', c, L.cw[c], e.lockC && e.lockC[c])).join('') || '<small class="hint">Selecione células para ver.</small>'}</div>
        <h5 class="tsh2">Altura das linhas (mm)</h5><div class="tszg">${rs.map((r) => row('r', r, L.rh[r], e.lockR && e.lockR[r])).join('') || '<small class="hint">Selecione células para ver.</small>'}</div>
        <div class="row tbtn"><button type="button" class="btn sm" data-ta="eqc">Igualar larguras</button><button type="button" class="btn sm" data-ta="eqr">Igualar alturas</button></div>`;
    };
    let body = H4('Estrutura') + fx('_tx1'), after = '';
    if (!t) {
      body += `<button type="button" class="btn sm pri" data-ta="on">Editar células</button><p class="hint">Ou dê dois cliques na tabela: selecione células, linhas ou colunas como numa planilha, arraste as divisões para mudar tamanhos e use ＋ e − nelas para inserir ou excluir.</p>${sizes()}`;
    } else if (t.title) {
      const hd = (e.wx && e.wx.hd) || {}, al = hd.align || 'center';
      body += `<div class="tselh"><b>Título</b><small>linha T</small><button type="button" class="btn sm ghost" data-ta="off">Sair</button></div>
        <label class="pfield"><span>Texto do título</span><input type="text" data-ti="text" value="${esc(hd.text || '')}"></label>
        <div class="tsz"><span>Alt.</span><input type="number" step="0.5" min="3" data-ti="h" value="${nm(hd.h || 7)}"><label class="tlkb" title="Travar a altura e o texto da linha do título"><input type="checkbox" data-ti="lock"${hd.lock ? ' checked' : ''}><i>${ico('lock')}</i></label></div>
        <div class="pfield"><span>Alinhamento</span><div class="segf tseg">${[['left', 'Esq.'], ['center', 'Centro'], ['right', 'Dir.']].map(([v, tt]) => `<button type="button" class="${al === v ? 'on' : ''}" data-ti="align:${v}">${tt}</button>`).join('')}</div></div>
        <div class="fgrid"><label class="pfield"><span>Cor do texto</span><input type="color" data-ti="c" value="${tokc(hd.c, '#3E3550')}"></label><label class="pfield"><span>Fundo</span><input type="color" data-ti="fill" value="${tokc(hd.fill, '#F7E5E7')}"></label></div>
        <p class="hint">Fonte, peso e linha própria estão em "Título do widget". Dois cliques no título editam o texto; arraste a divisão de baixo para mudar a altura.</p>${sizes()}`;
    } else {
      const q = rng(t), a = clampRC(e, t.a[0], t.a[1]), cl = cellOf(e, a[0], a[1]) || {}, st = cellStyle(e, a[0], a[1]), n = cellKeys(e, t).length, bd = cl.bd || {};
      const allLockedCells = cellKeys(e, t).every(([r, c]) => (cellOf(e, r, c) || {}).lock), allR = (() => { for (let r = q.r0; r <= q.r1; r++) if (!(e.lockR && e.lockR[r])) return false; return true; })(), allC = (() => { for (let c = q.c0; c <= q.c1; c++) if (!(e.lockC && e.lockC[c])) return false; return true; })();
      const sidesBtn = () => `<div class="sides tsides">${[['A', 'Todos os lados', 'cellBorder'], ['T', 'Em cima', 'cbT'], ['R', 'À direita', 'cbR'], ['B', 'Embaixo', 'cbB'], ['L', 'À esquerda', 'cbL']].map(([s2, tt, ic]) => { const on = bdTargets(e, t, s2).every(([r, c, sd]) => bdOn(e, r, c, sd)); return `<button type="button" class="sdb${on ? ' on' : ''}" data-tb="${s2}" aria-pressed="${on}" title="${tt} (clique para ${on ? 'tirar' : 'aplicar'})">${sideIco(ic)}</button>`; }).join('')}</div>`;
      const seg = (name, opts, cur) => `<div class="segf tseg">${opts.map(([v, tt]) => `<button type="button" class="${cur === v ? 'on' : ''}" data-tal="${name}:${v}" title="${tt}">${tt}</button>`).join('')}</div>`;
      body += `<div class="tselh"><b>${esc(label(e, t))}</b><small>${n} célula${n > 1 ? 's' : ''} · ativa ${colName(a[1])}${a[0] + 1}</small><button type="button" class="btn sm ghost" data-ta="off">Sair</button></div>
        <div class="tinsdel">${[['Linha', [['insrowA', 'up', '＋', 'Inserir linha acima da seleção'], ['delrowT', 'up', '−', 'Excluir a linha de cima da seleção'], ['insrowB', 'down', '＋', 'Inserir linha abaixo da seleção'], ['delrowB', 'down', '−', 'Excluir a linha de baixo da seleção']]], ['Coluna', [['inscolA', 'left', '＋', 'Inserir coluna à esquerda da seleção'], ['delcolL', 'left', '−', 'Excluir a coluna da esquerda da seleção'], ['inscolB', 'right', '＋', 'Inserir coluna à direita da seleção'], ['delcolR', 'right', '−', 'Excluir a coluna da direita da seleção']]]].map(([nmz, bs]) => `<div class="tid"><span>${nmz}</span>${bs.map(([ac, dir, sg, tt]) => `<button type="button" class="btn sm tidb${sg === '−' ? ' danger' : ''}" data-ta="${ac}" title="${tt}" aria-label="${tt}"><svg viewBox="0 0 10 10" width="9" height="9" fill="currentColor">${{ up: '<path d="M5 2l4 5H1z"/>', down: '<path d="M5 8L1 3h8z"/>', left: '<path d="M2 5l5-4v8z"/>', right: '<path d="M8 5L3 1v8z"/>' }[dir]}</svg>${sg}</button>`).join('')}</div>`).join('')}</div>
        <div class="row tbtn"><button type="button" class="btn sm${allLockedCells ? ' pri' : ''}" data-ta="lockcell">${allLockedCells ? 'Destravar' : 'Travar'} célula(s)</button><button type="button" class="btn sm${allR ? ' pri' : ''}" data-ta="lockrow">${allR ? 'Destravar' : 'Travar'} altura da linha</button><button type="button" class="btn sm${allC ? ' pri' : ''}" data-ta="lockcol">${allC ? 'Destravar' : 'Travar'} largura da coluna</button></div>
        <p class="hint">Célula travada não muda texto nem formato. Linha travada mantém a altura e coluna travada mantém a largura, mesmo ao esticar a tabela.</p>${sizes()}
        ${H4('Formato da seleção')}<h5 class="tsh2">Fundo</h5><div class="pfield">${cf('tcFill', cl.fill === undefined ? 'none' : cl.fill, true)}</div><button type="button" class="btn sm ghost" data-ta="fillreset">Tirar cor (volta ao fundo da tabela)</button>
        <h5 class="tsh2">Texto</h5>
        <label class="pfield"><span>Fonte</span><select data-tf="font">${fontList().map((f) => `<option${f === st.font ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
        <div class="fgrid"><label class="pfield"><span>Tamanho (pt)</span><input type="number" step="0.5" min="2" data-tf="size" value="${st.size}"></label><label class="pfield"><span>Cor</span>${cf('tcColor', st.color, false)}</label></div>
        <div class="fgrid"><label class="pfield"><span>Peso</span><select data-tf="weight">${[[400, 'Normal'], [600, 'Semi-negrito'], [700, 'Negrito']].map(([v, tt]) => `<option value="${v}"${+st.weight === v ? ' selected' : ''}>${tt}</option>`).join('')}</select></label><label class="pfield"><span>Espaço entre letras</span><input type="number" step="0.01" data-tf="ls" value="${st.ls || 0}"></label></div>
        <div class="row"><label class="chk"><input type="checkbox" data-tf="italic"${st.italic ? ' checked' : ''}> Itálico</label><label class="chk"><input type="checkbox" data-tf="under"${st.under ? ' checked' : ''}> Sublinhado</label></div>
        <h5 class="tsh2">Alinhamento</h5>
        <div class="fgrid"><div class="pfield"><span>Horizontal</span>${seg('al', [['left', 'Esq.'], ['center', 'Centro'], ['right', 'Dir.']], st.al)}</div><div class="pfield"><span>Vertical</span>${seg('va', [['top', 'Topo'], ['middle', 'Meio'], ['bottom', 'Base']], st.va)}</div></div>
        ${H4('Contorno da célula')}<div class="fgrid"><label class="pfield"><span>Cor</span>${cf('tbColor', (bd.T && bd.T.c) || e.stroke, false)}</label><label class="pfield"><span>Espessura (mm)</span><input type="number" step="0.05" min="0.05" data-tbk="w" value="${(bd.T && bd.T.w) || e.sw || 0.3}"></label></div>
        <label class="pfield"><span>Tipo de linha</span><select data-tbk="s">${LN.OPTS.map(([v, tt]) => `<option value="${v}"${v === ((bd.T && bd.T.s) || e.lnStyle || 'solid') ? ' selected' : ''}>${tt}</option>`).join('')}</select></label>
        <div class="pfield"><span>Lados da seleção (clique liga ou desliga)</span>${sidesBtn()}</div><button type="button" class="btn sm ghost" data-ta="bdreset">Voltar ao contorno da tabela</button>`;
      after = `${H4('Fórmulas')}<p class="hint">Comece o texto da célula com <b>=</b>: <code>=SOMA(B2:B5)</code>, <code>=B2*C2</code>, <code>=MEDIA(A1:A4)</code>, <code>=MIN</code>, <code>=MAX</code>, <code>=MULT</code>, <code>=CONT</code>, <code>=ARRED(B2;1)</code>. Separe argumentos com ponto e vírgula. A1 é a primeira célula (a do cabeçalho, se houver).</p>`;
    }
    body += H4('Texto da tabela') + fx('_tx2') + H4('Linhas e células') + fx('_tx3') + after;
    const w = block('tab', 'Tabela', body); cont.replaceWith(w); wire(w, e, t);
    /* posição, tamanho, rotação e opacidade passam a viver dentro do bloco Tabela (uma configuração só) */
    const fg = P.querySelector(':scope > .fgrid'), rp2 = P.querySelector(':scope > button[data-a="rep"]'), h2 = P.querySelector(':scope > h2'), wb = w.querySelector('.tpan');
    if (fg && wb) { const h = document.createElement('h4'); h.className = 'tsh'; h.textContent = 'Posição e tamanho'; wb.prepend(...[h, fg, rp2].filter(Boolean)); }
    if (h2) h2.remove();
  }
  function wire(w, e, t) {
    const on = (sel, ev, fn) => w.querySelectorAll(sel).forEach((x) => x.addEventListener(ev, (E) => { E.stopPropagation(); fn(x, E); }));
    on('[data-ta]', 'click', (x) => {
      const a = x.dataset.ta;
      if (a === 'on') { enter(e, 0, 0); return; }
      if (a === 'off') { exit(); return; }
      if (/^(ins|del)/.test(a)) { act(a); return; }
      if (a === 'eqc') mutate((z) => { const L = lay(z), tot = L.cw.reduce((p, q) => p + q, 0), fr = []; let lk = 0; L.cw.forEach((v, i) => { if (z.lockC && z.lockC[i]) lk += v; else fr.push(i); }); if (!fr.length) return false; bake(z); fr.forEach((i) => { z.cwm[i] = r2((tot - lk) / fr.length); }); sumW(z); });
      else if (a === 'eqr') mutate((z) => { const L = lay(z), tot = L.rh.reduce((p, q) => p + q, 0), fr = []; let lk = 0; L.rh.forEach((v, i) => { if (z.lockR && z.lockR[i]) lk += v; else fr.push(i); }); if (!fr.length) return false; bake(z); fr.forEach((i) => { z.rh[i] = r2((tot - lk) / fr.length); }); sumH(z); });
      else if (a === 'lockcell') { const all = cellKeys(e, t).every(([r, c]) => (cellOf(e, r, c) || {}).lock); mutate((z) => { cellKeys(z, t).forEach(([r, c]) => setCell(z, r, c, { lock: all ? undefined : true })); }); }
      else if (a === 'lockrow') { const q = rng(t); mutate((z) => { let all = true; for (let r = q.r0; r <= q.r1; r++) if (!(z.lockR && z.lockR[r])) all = false; bake(z); z.lockR = z.lockR || {}; for (let r = q.r0; r <= q.r1; r++) { if (all) delete z.lockR[r]; else z.lockR[r] = true; } }); }
      else if (a === 'lockcol') { const q = rng(t); mutate((z) => { let all = true; for (let c = q.c0; c <= q.c1; c++) if (!(z.lockC && z.lockC[c])) all = false; bake(z); z.lockC = z.lockC || {}; for (let c = q.c0; c <= q.c1; c++) { if (all) delete z.lockC[c]; else z.lockC[c] = true; } }); }
      else if (a === 'fillreset') applyFill('none');
      else if (a === 'bdreset') fmtApply((z, r, c) => setCell(z, r, c, { bd: undefined }));
    });
    on('[data-tsz]', 'change', (x) => { x.blur(); const ax = x.dataset.tsz[0], i = +x.dataset.tsz.slice(1), v = parseFloat(x.value); if (!(v > 0)) return; mutate((z) => { const ok = ax === 'c' ? sizeCol(z, i, v, false) : sizeRow(z, i, v, false); if (!ok) { toast(ax === 'c' ? 'Coluna travada.' : 'Linha travada.'); return false; } }); });
    on('[data-tlk]', 'change', (x) => { x.blur(); const ax = x.dataset.tlk[0], i = +x.dataset.tlk.slice(1); mutate((z) => { bake(z); const k = ax === 'c' ? 'lockC' : 'lockR'; z[k] = z[k] || {}; if (x.checked) z[k][i] = true; else delete z[k][i]; }); });
    // linha do título
    const ti = (fn) => mutate((z) => { if (!(z.wx && z.wx.hd)) return false; fn(z.wx.hd, z); });
    w.querySelectorAll('input[data-ti],button[data-ti]').forEach((x) => {
      const k = x.dataset.ti;
      if (x.tagName !== 'BUTTON') x.addEventListener('change', () => x.blur());
      if (x.tagName === 'BUTTON') x.addEventListener('click', (E) => { E.stopPropagation(); const [kk, v] = k.split(':'); ti((hd) => { hd[kk] = v; }); });
      else x.addEventListener('change', (E) => { E.stopPropagation(); if (k === 'text') ti((hd) => { hd.text = x.value; }); else if (k === 'lock') ti((hd) => { hd.lock = x.checked || undefined; }); else if (k === 'h') { const v = Math.max(3, parseFloat(x.value) || 0); if (!v) return; ti((hd, z) => { if (hd.lock) { toast('Linha do título travada.'); return false; } bake(z); const d = v - (hd.h || 7); hd.h = v; z.h = r2(z.h + d); }); } else ti((hd) => { hd[k] = x.value; }); });
      x.addEventListener('input', (E) => E.stopPropagation());
    });
    // texto
    const tf = (k, v) => fmtApply((z, r, c) => setCell(z, r, c, { [k]: v }));
    on('[data-tf]', 'change', (x) => { const k = x.dataset.tf; if (x.type === 'checkbox') tf(k, x.checked ? true : undefined); else if (k === 'size' || k === 'ls' || k === 'weight') tf(k, parseFloat(x.value) || undefined); else tf(k, x.value); });
    on('[data-tal]', 'click', (x) => { const [k, v] = x.dataset.tal.split(':'); tf(k, v); });
    // cores
    const colorOf = (k) => { const i = w.querySelector(`[data-tk="${k}"]`); return i ? (i.dataset.gv || i.value) : null; };
    w.querySelectorAll('input[type=color][data-tk]').forEach((i) => { const k = i.dataset.tk; i.addEventListener('change', (E) => { E.stopPropagation(); const v = i.value; if (k === 'tcFill') applyFill(v); else if (k === 'tcColor') tf('color', v); }); i.addEventListener('input', (E) => E.stopPropagation()); });
    on('[data-tset]', 'click', (x) => { const k = x.dataset.tset, v = x.dataset.v; if (k === 'tcFill') applyFill(v); else if (k === 'tcColor') tf('color', v); else if (k === 'tbColor') { const i = w.querySelector('[data-tk="tbColor"]'); if (i) i.value = v; } });
    // bordas
    on('[data-tb]', 'click', (x) => {
      const s2 = x.dataset.tb, tg = bdTargets(e, t, s2), turnOn = !tg.every(([r, c, sd]) => bdOn(e, r, c, sd));
      const spec = { w: parseFloat(w.querySelector('[data-tbk="w"]').value) || 0.3, c: colorOf('tbColor') || e.stroke, s: w.querySelector('[data-tbk="s"]').value || 'solid' };
      const by = {}; tg.forEach(([r, c, sd]) => { (by[key(r, c)] = by[key(r, c)] || []).push(sd); });
      fmtApply((z, r, c) => { const sds = by[key(r, c)]; if (!sds) return; const cur = Object.assign({}, (cellOf(z, r, c) || {}).bd || {}); sds.forEach((sd) => { cur[sd] = turnOn ? Object.assign({}, spec) : 0; }); setCell(z, r, c, { bd: cur }); });
    });
  }
  const sep = window.setElProp;
  if (typeof sep === 'function') window.setElProp = function (e, k, v) { const r = sep.apply(this, arguments); if (e && e.type === 'table') { if (k === 'cols') { e.cwm = null; e.lockC = {}; } if (k === 'rows') { e.rh = null; e.lockR = {}; } } return r; };

  /* ---------- barra rápida (menu flutuante) no modo células ---------- */
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
  const effFill = (e, r, c) => { const x = cellOf(e, r, c); if (x && x.fill !== undefined) return x.fill === 'none' ? null : x.fill; if (hasH(e) && r === 0) return e.headFill && e.headFill !== 'none' ? e.headFill : null; const z = e.cellFill2 && e.cellFill2 !== 'none' && (r - (hasH(e) ? 1 : 0)) % 2 === 1 ? e.cellFill2 : (e.cellFill && e.cellFill !== 'none' ? e.cellFill : null); return z; };
  const QA = { l: 'M4 6h16M4 10h10M4 14h16M4 18h10', c: 'M4 6h16M7 10h10M4 14h16M7 18h10', r: 'M4 6h16M10 10h10M4 14h16M10 18h10', t: 'M4 5h16M8 9h8M8 13h8', m: 'M8 8h8M4 12h16M8 16h8', b: 'M8 11h8M8 15h8M4 19h16' };
  const qsvg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${d}"/></svg>`;
  const qb = (a, t, inner, on) => `<button type="button" data-tq="${a}" title="${t}" aria-label="${t}" class="${on ? 'on' : ''}">${inner}</button>`;
  const qsep = '<span class="qs"></span>';
  function barHTML(e) {
    const t = TS(); if (!t || t.id !== e.id) return '';
    if (t.title) { const hd = (e.wx && e.wx.hd) || {}, c1 = tokc(hd.c, '#3E3550'), f1 = tokc(hd.fill, '#F7E5E7');
      return `<span class="qlab">Título</span>` + `<label class="qc qf" title="Fundo do título"><span>▦</span><b style="background:${f1}"></b><input type="color" data-tq="ti:fill" value="${f1}" aria-label="Fundo do título"></label><label class="qc" title="Cor do texto do título"><span>A</span><b style="background:${c1}"></b><input type="color" data-tq="ti:c" value="${c1}" aria-label="Cor do texto do título"></label>` + qsep + qb('ti:al:left', 'Alinhar à esquerda', qsvg(QA.l), hd.align === 'left') + qb('ti:al:center', 'Centralizar', qsvg(QA.c), !hd.align || hd.align === 'center') + qb('ti:al:right', 'Alinhar à direita', qsvg(QA.r), hd.align === 'right') + qsep + qb('exit', 'Sair da edição de células', 'Sair'); }
    const a = clampRC(e, t.a[0], t.a[1]), st = cellStyle(e, a[0], a[1]), fl = effFill(e, a[0], a[1]), fh = isHex(fl) ? fl : '#ffffff', ch = isHex(st.color) ? st.color : '#3E3550', cl = cellOf(e, a[0], a[1]) || {};
    return `<span class="qlab">${esc(label(e, t))}</span>` +
      `<label class="qc qf" title="Cor de fundo da célula${fl ? ' (' + fl + ')' : ' (sem cor)'}"><span>▦</span><b style="background:${fh}${fl ? '' : ';background-image:linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%),linear-gradient(45deg,#ddd 25%,#fff 25%,#fff 75%,#ddd 75%);background-size:8px 8px;background-position:0 0,4px 4px'}"></b><input type="color" data-tq="fill" value="${fh}" aria-label="Cor de fundo da célula"></label>` +
      qb('nofill', 'Sem cor de fundo', '∅') +
      `<label class="qc" title="Cor do texto (${ch})"><span>A</span><b style="background:${ch}"></b><input type="color" data-tq="color" value="${ch}" aria-label="Cor do texto"></label>` + qsep +
      `<input class="qn" type="number" step="0.5" min="2" data-tq="size" value="${st.size}" title="Tamanho da fonte (pt)" aria-label="Tamanho da fonte">` +
      qb('bold', 'Negrito', '<b>B</b>', +st.weight >= 600).replace('<button', '<button class="qg"') + qb('italic', 'Itálico', '<i>I</i>', st.italic).replace('<button', '<button class="qg"') + qsep +
      qb('al:left', 'Alinhar à esquerda', qsvg(QA.l), st.al === 'left') + qb('al:center', 'Centralizar', qsvg(QA.c), st.al === 'center') + qb('al:right', 'Alinhar à direita', qsvg(QA.r), st.al === 'right') +
      qb('va:top', 'Alinhar em cima', qsvg(QA.t), st.va === 'top') + qb('va:middle', 'Alinhar ao meio', qsvg(QA.m), st.va === 'middle') + qb('va:bottom', 'Alinhar embaixo', qsvg(QA.b), st.va === 'bottom') + qsep +
      qb('lock', cl.lock ? 'Destravar célula' : 'Travar célula', ico(cl.lock ? 'unlock' : 'lock')) + qb('exit', 'Sair da edição de células', 'Sair');
  }
  function barSig(e) { const t = TS(); if (!t || t.id !== e.id) return ''; const a = clampRC(e, t.a[0], t.a[1]); return JSON.stringify([t.a, t.b, !!t.title, cellOf(e, a[0], a[1]), e.wx && e.wx.hd, e.headFill, e.cellFill, e.cellFill2, e.color, e.size]); }
  const QBAR = document.getElementById('qbar'); let qhist = null;
  if (QBAR) {
    QBAR.addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-tq]'); if (!b) return; ev.stopPropagation(); const a = b.dataset.tq, e = curEl(), t = TS(); if (!e || !t) return;
      if (a === 'exit') { exit(); return; }
      if (a.startsWith('ti:al:')) { mutate((z) => { if (!(z.wx && z.wx.hd)) return false; z.wx.hd.align = a.slice(6); }); return; }
      if (a === 'nofill') applyFill('none');
      else if (a === 'bold') { const A = clampRC(e, t.a[0], t.a[1]), on = +cellStyle(e, A[0], A[1]).weight >= 600; fmtApply((z, r, c) => setCell(z, r, c, { weight: on ? 400 : 700 })); }
      else if (a === 'italic') { const A = clampRC(e, t.a[0], t.a[1]), on = cellStyle(e, A[0], A[1]).italic; fmtApply((z, r, c) => setCell(z, r, c, { italic: on ? undefined : true })); }
      else if (a.startsWith('al:') || a.startsWith('va:')) { const [k, v] = a.split(':'); fmtApply((z, r, c) => setCell(z, r, c, { [k]: v })); }
      else if (a === 'lock') { const all = cellKeys(e, t).every(([r, c]) => (cellOf(e, r, c) || {}).lock); mutate((z) => { cellKeys(z, t).forEach(([r, c]) => setCell(z, r, c, { lock: all ? undefined : true })); }); }
    });
    QBAR.addEventListener('input', (ev) => {
      const i = ev.target; const a = i.dataset && i.dataset.tq; if (!a || i.type !== 'color') return; ev.stopPropagation(); const e = curEl(), t = TS(), p = curPage(); if (!e || !t || !p) return;
      qhist = qhist || snapOf([p.id]); const v = i.value;
      if (a === 'ti:fill' || a === 'ti:c') { if (e.wx && e.wx.hd) e.wx.hd[a.slice(3)] = v; }
      else if (a === 'fill') fillCore(e, t, v); else cellKeys(e, t).forEach(([r, c]) => { const cl = cellOf(e, r, c); if (cl && cl.lock) return; setCell(e, r, c, { color: v }); });
      const sw = i.parentNode.querySelector('b'); if (sw) sw.style.background = v; scheduleRedraw();
    });
    QBAR.addEventListener('change', (ev) => {
      const i = ev.target, a = i.dataset && i.dataset.tq; if (!a) return; ev.stopPropagation(); const p = curPage(); if (!p) return;
      if (i.type === 'color') { if (qhist) { pushHist(qhist, snapOf([p.id])); qhist = null; thumbRefresh(p.id); } renderProps(); return; }
      if (a === 'size') { const v = parseFloat(i.value); if (v > 0) fmtApply((z, r, c) => setCell(z, r, c, { size: v })); }
    });
  }

  window.Tabela = { panel, bar: barHTML, sig: barSig, lay, disp, raw, evalF, insRow, delRow, insCol, delCol, enter, exit, colName };
})();
