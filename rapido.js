/* Edição rápida por duplo clique dentro dos widgets, categoria "Elementos" e fundo de conjunto (widgets agrupados). */
(function () {
  'use strict';
  const num = (v, a, b, d) => { v = +v; return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const hexOk = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
  const toHex = (v) => { try { const t = WX.tok(v); return hexOk(t) ? t : '#3E3550'; } catch (_) { return hexOk(v) ? v : '#3E3550'; } };

  /* ---------- 1) categoria Elementos ---------- */
  function addElements() {
    if (!window.WX || !WX.CAT || WX.CAT.some((x) => x.k === 'el-ret')) return;
    if (WX.CATS && !WX.CATS.some((c) => c[0] === 'elementos')) WX.CATS.push(['elementos', 'Elementos']);
    const C = (k, n, kw, fn) => WX.CAT.push({ k, n, cats: ['elementos'], kw: 'elemento forma ' + kw, fn, plain: true });
    const box = (st, o) => Object.assign({ fill: st.pal.soft, stroke: st.pal.a, sw: 0.4 }, o);
    C('el-ret', 'Retângulo', 'retangulo caixa', (p, st) => E('rect', 0, 0, 44, 28, box(st, { radius: 0 })));
    C('el-ret-r', 'Retângulo arredondado', 'retangulo arredondado cantos', (p, st) => E('rect', 0, 0, 44, 28, box(st, { radius: 5 })));
    C('el-quad', 'Quadrado', 'quadrado', (p, st) => E('rect', 0, 0, 28, 28, box(st, { radius: 0 })));
    C('el-quad-r', 'Quadrado arredondado', 'quadrado arredondado', (p, st) => E('rect', 0, 0, 28, 28, box(st, { radius: 6 })));
    C('el-circ', 'Círculo', 'circulo bola', (p, st) => E('ellipse', 0, 0, 28, 28, box(st)));
    C('el-elip', 'Elipse', 'elipse oval', (p, st) => E('ellipse', 0, 0, 44, 26, box(st)));
    C('el-pill', 'Pílula', 'pilula capsula botao', (p, st) => E('rect', 0, 0, 40, 10, box(st, { radius: 5 })));
    C('el-vazado', 'Moldura vazada', 'moldura vazada contorno', (p, st) => E('rect', 0, 0, 44, 28, { fill: 'none', stroke: st.pal.ink, sw: 0.5, radius: 3 }));
    C('el-linha', 'Linha', 'linha reta', (p, st) => E('line', 0, 0, 50, 1, { stroke: st.pal.ink, sw: 0.4, dash: 'solid' }));
    C('el-tracejada', 'Linha tracejada', 'linha tracejada', (p, st) => E('line', 0, 0, 50, 1, { stroke: st.pal.ink, sw: 0.4, dash: 'dash' }));
    C('el-pontilhada', 'Linha pontilhada', 'linha pontilhada', (p, st) => E('line', 0, 0, 50, 1, { stroke: st.pal.ink, sw: 0.5, dash: 'dot' }));
    [['coracao', 'Coração'], ['estrela', 'Estrela'], ['brilho', 'Brilho'], ['flor', 'Flor'], ['folha', 'Folha'], ['gota', 'Gota'], ['hexagono', 'Hexágono'], ['nuvem', 'Nuvem'], ['balao', 'Balão de fala'], ['faixa', 'Faixa'], ['etiqueta', 'Etiqueta'], ['seta', 'Seta'], ['carimbo', 'Selo']].forEach(([k, n]) =>
      C('el-' + k, n, k + ' ' + n.toLowerCase(), (p, st) => E('shape', 0, 0, k === 'faixa' || k === 'etiqueta' || k === 'balao' || k === 'nuvem' ? 36 : 22, k === 'faixa' ? 12 : 22, { kind: k, fill: st.pal.soft, fill2: 'none', stroke: st.pal.ink, sw: 0.35 })));
  }

  /* ---------- 2) edição direta por duplo clique ---------- */
  let QM = null; window.__qe = null;
  (function patchDraw() {
    if (typeof drawEl !== 'function' || drawEl._qe) return; const o = drawEl;
    drawEl = function (c, e, op) { const q = window.__qe; if (q && q.id === e.id) { const sv = q.get(); q.set(''); try { return o.call(this, c, e, op); } finally { q.set(sv); } } return o.call(this, c, e, op); };
    drawEl._qe = 1;
  })();
  function closeQM(commit) {
    if (!QM) return; const q = QM; QM = null; window.__qe = null;
    document.removeEventListener('pointerdown', q.out, true); q.bar.remove(); q.wrap.remove(); document.body.classList.remove('qm-on');
    if (commit !== false) pushHist(q.snap, snapOf([q.p.id]));
    redraw(); renderProps(); thumbRefresh(q.p.id);
  }
  const pad = (a, n) => { a = Array.isArray(a) ? a : []; while (a.length < n) a.push(''); return a; };
  const layOf = (e) => (e.wx && window.WX ? WX.layout(e) : { ix: 0, iy: 0, iw: e.w, ih: e.h, hd: 0, bw: e.w });
  function mkLoc(e, ix, iy) { const L = layOf(e); return { e, L, ix, iy, iw: L.iw, ih: L.ih, ly: iy + L.iy, lx: ix + L.ix }; }
  function locate(p, pt) {
    const e = hit(p, pt); if (!e) return null;
    const a = -(e.rot || 0) * Math.PI / 180, cx = e.x + e.w / 2, cy = e.y + e.h / 2, dx = pt.x - cx, dy = pt.y - cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + e.w / 2, ly = dx * Math.sin(a) + dy * Math.cos(a) + e.h / 2, L = layOf(e);
    return { e, L, lx, ly, ix: lx - L.ix, iy: ly - L.iy, iw: L.iw, ih: L.ih };
  }
  /* centro (coordenadas internas) da linha idx, para reabrir a edição depois de incluir/excluir */
  function ptFor(e, kind, idx) {
    const L = layOf(e);
    if (kind === 'checklist') return { ix: L.iw * 0.5, iy: (idx + 0.5) * L.ih / Math.max(1, e.n | 0) };
    if (kind === 'habit') return { ix: L.iw * (e.labelW || 0.3) * 0.5, iy: (idx + 1.5) * L.ih / (Math.max(1, e.rows | 0) + 1) };
    if (kind === 'tabs') return { ix: L.iw / 2, iy: (idx + 0.5) * L.ih / Math.max(1, (e.labels || []).length) };
    return null;
  }
  function targetOf(loc) {
    const { e, ix, iy, iw, ih, L, ly } = loc, t = e.type, hd = e.wx && e.wx.hd;
    if (hd && hd.on && L && L.hd && ly < L.hd) {
      return { kind: 'hd', label: 'Título do widget', get: () => hd.text || '', set: (v) => { hd.text = v; },
        geo: () => ({ x: 0, y: 0, w: L.bw, h: L.hd, fs: Math.min((hd.size || 8) * PT, L.hd * 0.78), al: hd.align || 'center', outer: true, wt: hd.weight || 600 }),
        font: { get: () => hd.font || '@title', set: (v) => { hd.font = v; }, tokens: true }, size: { get: () => hd.size || 8, set: (v) => { hd.size = v; } },
        color: { get: () => toHex(hd.c || '@ink'), set: (v) => { hd.c = v; } }, bold: { get: () => (hd.weight || 600) >= 600, set: (v) => { hd.weight = v ? 700 : 400; } },
        align: { get: () => hd.align || 'center', set: (v) => { hd.align = v; } }, acts: [{ t: 'Ocultar título', f: () => { hd.on = false; } }] };
    }
    const font = { get: () => e.font || 'Nunito', set: (v) => { e.font = v; } };
    const col = (k) => ({ get: () => toHex(e[k] || e.color), set: (v) => { e[k] = v; } });
    const size = { get: () => e.size || '', set: (v) => { e.size = v; }, ph: 'auto' };
    if (t === 'checklist') {
      const n = Math.max(1, e.n | 0), rh = ih / n, i = Math.max(0, Math.min(n - 1, Math.floor(iy / rh)));
      const ins = (at) => { const nn = Math.max(1, e.n | 0), r = layOf(e).ih / nn; e.items = pad(e.items, nn); e.items.splice(at, 0, ''); e.n = nn + 1; e.h = r1(e.h + r); return at; };
      return { kind: t, idx: i, label: `Item ${i + 1}`, get: () => (e.items || [])[i] || '', set: (v) => { e.items = pad(e.items, n); e.items[i] = v; },
        geo: () => { const sc = e.msize || 1, mk = e.box || 'square', bs = mk === 'none' ? 0 : Math.min(rh * 0.55, 4.2) * sc, gap = mk === 'none' ? 0 : 1.6, fs = e.size ? e.size * PT : Math.min(Math.min(rh * 0.55, 4.2) * 0.95, rh * 0.48), x0 = bs + gap, ly2 = i * rh + (rh - bs) / 2 + bs;
          return e.lines ? { x: x0, y: ly2 - 0.5 + fs * 0.27 - fs * 1.25, w: iw - x0, h: fs * 1.25, fs, al: 'left' } : { x: x0, y: i * rh, w: iw - x0, h: rh, fs, al: 'left', mid: true }; },
        font, size, color: col('textColor'),
        acts: [{ t: '＋ acima', f: () => ins(i) }, { t: '＋ abaixo', f: () => ins(i + 1) }, { t: '✕ linha', danger: true, f: () => { if (n <= 1) return; e.items = pad(e.items, n); e.items.splice(i, 1); e.n = n - 1; e.h = r1(Math.max(4, e.h - rh)); return Math.min(i, n - 2); } }] };
    }
    if (t === 'habit') {
      const rows = Math.max(1, e.rows | 0), rh = ih / (rows + 1), lw = iw * (e.labelW || 0.3), r = Math.floor(iy / rh) - 1; if (ix > lw || r < 0 || r >= rows) return null;
      const ins = (at) => { e.labels = pad(e.labels, rows); e.labels.splice(at, 0, ''); e.rows = rows + 1; e.h = r1(e.h + rh); return at; };
      return { kind: t, idx: r, label: `Hábito ${r + 1}`, get: () => (e.labels || [])[r] || '', set: (v) => { e.labels = pad(e.labels, rows); e.labels[r] = v; },
        geo: () => ({ x: 1, y: rh * (r + 1), w: lw - 2, h: rh, fs: Math.min(rh * 0.42, 3.6), al: 'left', mid: true }), font, color: col('color'),
        acts: [{ t: '＋ acima', f: () => ins(r) }, { t: '＋ abaixo', f: () => ins(r + 1) }, { t: '✕ linha', danger: true, f: () => { if (rows <= 1) return; e.labels = pad(e.labels, rows); e.labels.splice(r, 1); e.rows = rows - 1; e.h = r1(Math.max(6, e.h - rh)); return Math.min(r, rows - 2); } }] };
    }
    if (t === 'tabs') {
      const n = (e.labels || []).length; if (!n) return null; const th = ih / n, i = Math.max(0, Math.min(n - 1, Math.floor(iy / th)));
      return { kind: t, idx: i, label: `Aba ${i + 1}`, get: () => e.labels[i] || '', set: (v) => { e.labels[i] = v; },
        geo: () => ({ x: 0, y: i * th, w: iw, h: th, fs: Math.min(iw * 0.42, (th - Math.min(0.8, th * 0.06)) * 0.26), al: 'center', mid: true, vert: true }), font, color: col('color'),
        acts: [{ t: '＋ acima', f: () => { e.labels.splice(i, 0, 'Nova'); return i; } }, { t: '＋ abaixo', f: () => { e.labels.splice(i + 1, 0, 'Nova'); return i + 1; } }, { t: '✕ aba', danger: true, f: () => { if (n > 1) { e.labels.splice(i, 1); return Math.min(i, n - 2); } } }] };
    }
    if (t === 'divider') return { kind: t, label: 'Texto do divisor', get: () => e.text || '', set: (v) => { e.text = v; }, geo: () => ({ x: 0, y: 0, w: iw, h: ih, fs: Math.min(ih * 0.55, (e.size || 9) * PT), al: 'center', mid: true, ls: 0.15 }), font, size, color: col('color') };
    if (t === 'table') {
      const hasH = Array.isArray(e.header) && e.header.length > 0, rows = e.rows + (hasH ? 1 : 0), rh = ih / rows, r = Math.max(0, Math.min(rows - 1, Math.floor(iy / rh))), cw = colWidths(Object.assign({}, e, { w: iw }));
      let c = 0, x = 0; for (let k = 0; k < e.cols; k++) { if (ix >= x) c = k; x += cw[k]; }
      const isH = hasH && r === 0, rr0 = r - (hasH ? 1 : 0); let cell = null;
      const fs = Math.min((e.size || 8) * PT, rh * 0.5), x0 = cw.slice(0, c).reduce((a, b) => a + b, 0);
      if (isH) cell = { label: `Cabeçalho ${c + 1}`, get: () => (e.header || [])[c] || '', set: (v) => { e.header = pad(e.header, e.cols); e.header[c] = v; }, geo: () => ({ x: x0, y: 0, w: cw[c], h: rh, fs, al: 'center', mid: true }) };
      else if (c === 0 && Array.isArray(e.side)) cell = { label: `Linha ${rr0 + 1}`, get: () => e.side[rr0] || '', set: (v) => { e.side = pad(e.side, e.rows); e.side[rr0] = v; }, geo: () => ({ x: 1.4, y: r * rh, w: cw[0] - 1.4, h: rh, fs, al: 'left', mid: true }) };
      if (!cell) return null;
      return Object.assign(cell, { kind: t, font, size, color: col('color'), acts: [
        { t: '＋ linha', f: () => { e.rows += 1; if (Array.isArray(e.side)) e.side.splice(Math.max(0, rr0) + 1, 0, ''); e.h = r1(e.h + rh); } },
        { t: '＋ coluna', f: () => { e.cols += 1; delete e.cw; if (Array.isArray(e.header)) e.header.splice(c + 1, 0, ''); } },
        { t: '✕ linha', danger: true, f: () => { if (e.rows <= 1) return; if (Array.isArray(e.side)) e.side.splice(Math.max(0, rr0), 1); e.rows -= 1; e.h = r1(Math.max(6, e.h - rh)); } },
        { t: '✕ coluna', danger: true, f: () => { if (e.cols <= 1) return; delete e.cw; if (Array.isArray(e.header)) e.header.splice(c, 1); e.cols -= 1; } }] });
    }
    return null;
  }
  const fOpts = (cur, tokens) => { const L = fontList(), t = tokens ? [['@title', 'Fonte de títulos do projeto'], ['@script', 'Fonte caligráfica do projeto'], ['@body', 'Fonte de texto do projeto']] : []; const all = t.concat(L.map((f) => [f, f])); if (!all.some((x) => x[0] === cur)) all.unshift([cur, cur]); return all.map(([v, n]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(n)}</option>`).join(''); };
  const AL = { left: 'M4 6h16M4 10h10M4 14h16M4 18h10', center: 'M4 6h16M7 10h10M4 14h16M7 18h10', right: 'M4 6h16M10 10h10M4 14h16M10 18h10' };

  function openQM(w, p, loc, tg, snap0) {
    closeQM(false); const e = loc.e, snap = snap0 || snapOf([p.id]), k = S.k;
    const ov = w.querySelector('.ov'), wrap = document.createElement('div'); wrap.className = 'qew';
    Object.assign(wrap.style, { left: e.x * k + 'px', top: e.y * k + 'px', width: e.w * k + 'px', height: e.h * k + 'px', transform: `rotate(${e.rot || 0}deg)` });
    const box = document.createElement('div'), ed = document.createElement('div'); box.className = 'qebox'; ed.className = 'qei'; try { ed.contentEditable = 'plaintext-only'; if (ed.contentEditable !== 'plaintext-only') ed.contentEditable = 'true'; } catch (_) { ed.contentEditable = 'true'; }
    ed.spellcheck = false; ed.textContent = tg.get(); box.appendChild(ed); wrap.appendChild(box); ov.appendChild(wrap);
    const place = () => { const g = tg.geo(), L = layOf(e), ox = g.outer ? 0 : L.ix, oy = g.outer ? 0 : L.iy, f = tg.font.get(), fam = f === '@title' ? styleOf().title : f === '@script' ? styleOf().script : f === '@body' ? styleOf().body : f;
      Object.assign(box.style, { left: (ox + g.x) * k + 'px', top: (oy + g.y) * k + 'px', width: Math.max(g.w, 4) * k + 'px', height: Math.max(g.h, 2) * k + 'px', display: 'flex', alignItems: g.mid || g.outer ? 'center' : 'flex-start', justifyContent: g.al === 'center' ? 'center' : g.al === 'right' ? 'flex-end' : 'flex-start', writingMode: g.vert ? 'vertical-rl' : 'horizontal-tb' });
      Object.assign(ed.style, { fontFamily: `"${fam}", Nunito, sans-serif`, fontSize: g.fs * k + 'px', lineHeight: g.mid || g.outer ? 'normal' : (g.fs * 1.25 * k) + 'px', fontWeight: g.wt || (e.type === 'table' ? 600 : g.vert ? 600 : 400), color: tg.color.get(), letterSpacing: (g.ls || 0) + 'em', textAlign: g.al }); };
    place();
    const bar = document.createElement('div'); bar.className = 'qm'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Edição rápida: ' + tg.label);
    const ib = (a, t, inner, on) => `<button type="button" data-qa="${a}" title="${t}" aria-label="${t}"${on ? ' class="on"' : ''}>${inner}</button>`;
    bar.innerHTML = `<select data-qf title="Fonte">${fOpts(tg.font.get(), tg.font.tokens)}</select>`
      + (tg.size ? `<span class="qs"></span>${ib('s-', 'Diminuir', '−')}<input class="qn" type="number" data-qs min="2" max="80" step="0.5" value="${tg.size.get()}" placeholder="${tg.size.ph || ''}" title="Tamanho (pt)">${ib('s+', 'Aumentar', '+')}` : '')
      + `<span class="qs"></span><label class="qc" title="Cor do texto"><input type="color" data-qc value="${tg.color.get()}"></label>`
      + (tg.bold ? ib('b', 'Negrito', '<b>B</b>', tg.bold.get()) : '')
      + (tg.align ? `<span class="qs"></span>` + ['left', 'center', 'right'].map((v) => ib('al:' + v, 'Alinhar', `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${AL[v]}"/></svg>`, tg.align.get() === v)).join('') : '')
      + ((tg.acts || []).length ? '<span class="qs"></span>' + tg.acts.map((a, i) => `<button type="button" class="qt${a.danger ? ' dg' : ''}" data-qx="${i}">${a.t}</button>`).join('') : '')
      + `<span class="qs"></span>${ib('ok', 'Concluir (Esc)', '✓')}`;
    document.body.appendChild(bar); document.body.classList.add('qm-on');
    const r = wrap.getBoundingClientRect(), bw = bar.offsetWidth, bh = bar.offsetHeight; bar.style.left = Math.max(8, Math.min(r.left, innerWidth - bw - 8)) + 'px'; bar.style.top = (r.top - bh - 10 < 8 ? Math.min(r.bottom + 10, innerHeight - bh - 8) : r.top - bh - 10) + 'px';
    const q = { bar, wrap, p, snap, out: (x) => { if (!bar.contains(x.target) && !wrap.contains(x.target)) closeQM(); } };
    QM = q; window.__qe = { id: e.id, get: tg.get, set: tg.set }; setTimeout(() => document.addEventListener('pointerdown', q.out, true), 0);
    const live = () => { redraw(); place(); }, focusEnd = () => { ed.focus(); const s = getSelection(), rg = document.createRange(); rg.selectNodeContents(ed); rg.collapse(false); s.removeAllRanges(); s.addRange(rg); };
    const reopen = (idx) => { const pt = idx === undefined ? null : ptFor(e, tg.kind, idx); const sn = snap; closeQM(false); if (!pt) { pushHist(sn, snapOf([p.id])); redraw(); renderProps(); thumbRefresh(p.id); return; } const ww = document.querySelector(`.pg[data-id="${p.id}"]`), l2 = mkLoc(e, pt.ix, pt.iy), t2 = targetOf(l2); redraw(); if (ww && t2) openQM(ww, p, l2, t2, sn); else pushHist(sn, snapOf([p.id])); };
    ed.oninput = () => { tg.set(ed.textContent.replace(/\n/g, ' ')); live(); };
    ed.onkeydown = (x) => {
      x.stopPropagation();
      if (x.key === 'Escape') { x.preventDefault(); closeQM(); return; }
      if (x.key === 'Enter') { x.preventDefault(); const add = (tg.acts || []).find((a) => a.t === '＋ abaixo'); if (add && !x.shiftKey) { const i = add.f(); reopen(i); } else closeQM(); return; }
      if (x.key === 'Backspace' && !ed.textContent) { const d = (tg.acts || []).find((a) => /^✕ (linha|aba)/.test(a.t) && tg.kind !== 'table'); if (d) { x.preventDefault(); const i = d.f(); reopen(i); } }
    };
    wrap.onpointerdown = (x) => x.stopPropagation(); wrap.ondblclick = (x) => x.stopPropagation();
    bar.onmousedown = (x) => { if (!/^(SELECT|INPUT|OPTION)$/.test(x.target.tagName)) x.preventDefault(); };
    bar.onclick = (x) => {
      const b = x.target.closest('[data-qa],[data-qx]'); if (!b) return;
      if (b.dataset.qx !== undefined) { const i = tg.acts[+b.dataset.qx].f(); const keepRow = tg.kind === 'hd' || tg.kind === 'table'; if (keepRow || i === undefined) { closeQM(); } else reopen(i); return; }
      const a = b.dataset.qa;
      if (a === 'ok') closeQM(); else if (a === 'b') { const v = !tg.bold.get(); tg.bold.set(v); b.classList.toggle('on', v); live(); focusEnd(); }
      else if (a.startsWith('al:')) { tg.align.set(a.slice(3)); $$('[data-qa^="al:"]', bar).forEach((y) => y.classList.toggle('on', y === b)); live(); focusEnd(); }
      else if (a === 's-' || a === 's+') { const cur = +tg.size.get() || (tg.geo().fs / PT); const v = Math.max(2, Math.min(80, Math.round((cur + (a === 's+' ? 1 : -1)) * 2) / 2)); tg.size.set(v); const inp = $('[data-qs]', bar); inp.value = v; live(); focusEnd(); }
    };
    $('[data-qf]', bar).onchange = (x) => { tg.font.set(x.target.value); live(); focusEnd(); };
    const qs = $('[data-qs]', bar); if (qs) qs.oninput = (x) => { tg.size.set(x.target.value === '' ? undefined : Math.max(2, Math.min(80, +x.target.value || 8))); live(); };
    const cc = $('[data-qc]', bar); cc.oninput = cc.onchange = (x) => { tg.color.set(x.target.value); live(); };
    focusEnd();
  }
  function wireDbl() {
    const st = document.getElementById('stage'); if (!st || st._qm) return; st._qm = 1;
    st.addEventListener('dblclick', (ev) => {
      const w = ev.target.closest('.pg'); if (!w || S.tool || S.ptEdit) return; const p = S.pages[w.dataset.id]; if (!p) return;
      const loc = locate(p, toMM(ev, w)); if (!loc || loc.e.locked) return;
      if (loc.e.type === 'text') { const hd = loc.e.wx && loc.e.wx.hd; if (!(hd && hd.on && loc.L && loc.L.hd && loc.ly < loc.L.hd)) return; }
      const tg = targetOf(loc); if (!tg) return;
      ev.stopImmediatePropagation(); ev.preventDefault(); S.sel = [loc.e.id]; redraw(); renderProps(); openQM(w, p, loc, tg);
    }, true);
  }

  /* ---------- cadeado ao passar o mouse sobre objeto travado ---------- */
  function wireLock() {
    const st = document.getElementById('stage'); if (!st || st._lk) return; st._lk = 1;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'lkHover'; b.hidden = true; b.title = 'Destravar'; b.setAttribute('aria-label', 'Destravar objeto'); b.innerHTML = ico('lock'); document.body.appendChild(b);
    let cur = null, over = false, tmr = 0;
    const inside = (e, pt) => { const a = -(e.rot || 0) * Math.PI / 180, dx = pt.x - (e.x + e.w / 2), dy = pt.y - (e.y + e.h / 2), lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); return Math.abs(lx) <= Math.max(e.w / 2, 1.5) && Math.abs(ly) <= Math.max(e.h / 2, 1.5); };
    const hide = () => { clearTimeout(tmr); tmr = setTimeout(() => { if (!over) { b.hidden = true; cur = null; } }, 280); };
    st.addEventListener('mousemove', (ev) => {
      const w = ev.target.closest('.pg'); if (!w || D_busy()) { hide(); return; } const p = S.pages[w.dataset.id]; if (!p) { hide(); return; }
      const pt = toMM(ev, w); let top = null; for (let i = p.els.length - 1; i >= 0; i--) { const e = p.els[i]; if (!e.hidden && inside(e, pt)) { top = e; break; } }
      if (top && top.locked) { clearTimeout(tmr); cur = { e: top, p }; const r = w.getBoundingClientRect(), k = S.k, sz = 30; b.hidden = false;
        b.style.left = Math.round(r.left + Math.max(top.x * k + 6, 0) + Math.min(0, 0)) + 'px'; b.style.top = Math.round(r.top + top.y * k + 6) + 'px'; if (top.w * k < 60 || top.h * k < 60) { b.style.left = Math.round(r.left + (top.x + top.w / 2) * k - sz / 2) + 'px'; b.style.top = Math.round(r.top + (top.y + top.h / 2) * k - sz / 2) + 'px'; } }
      else hide();
    });
    st.addEventListener('mouseleave', hide);
    b.onmouseenter = () => { over = true; clearTimeout(tmr); }; b.onmouseleave = () => { over = false; hide(); };
    b.onclick = (x) => { x.stopPropagation(); if (!cur) return; const { e, p } = cur; change([p.id], () => { e.locked = false; }); b.hidden = true; cur = null; over = false; S.sel = [e.id]; redraw(); renderProps(); thumbRefresh(p.id); toast('Objeto destravado. 🔓'); };
    const D_busy = () => !!QM || (typeof D !== 'undefined' && D && D.mode);
  }

  /* ---------- zoom: roda do mouse e menu de porcentagem ---------- */
  function wireZoom() {
    const ws = document.getElementById('ws'), zb = document.getElementById('bZfit'); if (!ws || ws._zm) return; ws._zm = 1;
    const zoomAt = (f, px, py) => { const fx = (ws.scrollLeft + px) / Math.max(1, ws.scrollWidth), fy = (ws.scrollTop + py) / Math.max(1, ws.scrollHeight); setZoom(S.k / MM2PX * f); ws.scrollLeft = fx * ws.scrollWidth - px; ws.scrollTop = fy * ws.scrollHeight - py; };
    ws.addEventListener('wheel', (ev) => {
      if (QM) return; const mod = ev.ctrlKey || ev.metaKey; if (!mod && (Pref.wheelZoom === false || ev.shiftKey)) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); const r = ws.getBoundingClientRect(); zoomAt(Math.exp(-Math.max(-120, Math.min(120, ev.deltaY)) * 0.0022), ev.clientX - r.left, ev.clientY - r.top);
    }, { passive: false, capture: true });
    let menu = null; const close = () => { if (menu) { menu.remove(); menu = null; document.removeEventListener('pointerdown', away, true); } }, away = (x) => { if (menu && !menu.contains(x.target) && x.target !== zb) close(); };
    zb.onclick = () => {
      if (menu) { close(); return; } menu = document.createElement('div'); menu.className = 'zmenu'; const cur = Math.round(S.k / MM2PX * 100);
      menu.innerHTML = `<button type="button" data-z="fit">Ajustar à tela</button>` + [50, 75, 100, 125, 150, 200, 300].map((z) => `<button type="button" data-z="${z}"${z === cur ? ' class="on"' : ''}>${z}%</button>`).join('') + `<label class="zchk"><input type="checkbox" data-zw${Pref.wheelZoom !== false ? ' checked' : ''}> Roda do mouse dá zoom</label>`;
      document.body.appendChild(menu); const r = zb.getBoundingClientRect(); menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px'; menu.style.top = r.bottom + 6 + 'px'; setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
      menu.onclick = (x) => { const b = x.target.closest('[data-z]'); if (!b) return; if (b.dataset.z === 'fit') { S.zoom = 0; renderStage(); updNav(); } else setZoom(+b.dataset.z / 100); close(); };
      menu.querySelector('[data-zw]').onchange = (x) => { Pref.wheelZoom = x.target.checked; savePref(); toast(x.target.checked ? 'A roda do mouse agora amplia e reduz. Segure Shift para rolar.' : 'A roda do mouse rola a tela. Use Ctrl + roda para o zoom.'); };
    };
  }

  /* ---------- 3) conjunto de widgets agrupados ---------- */
  const isWl = (e) => !e.gb && ((WX.ACCEPT && WX.ACCEPT.has(e.type) && !['text', 'rect', 'pattern'].includes(e.type)) || !!e.wx);
  function groupInfo() {
    const p = curPage(), sel = selEls(); if (!p || !sel.length) return null;
    const ids = gx(p, sel.map((e) => e.id)), mem = p.els.filter((e) => ids.includes(e.id)), g = mem.find((e) => e.g) && mem.find((e) => e.g).g; if (!g || mem.length < 2) return null;
    const bd = mem.find((e) => e.gb), ws = mem.filter(isWl); if (!bd && ws.length < 2) return null; return { p, mem, bd, g, ws };
  }
  function fitBackdrop(gi) {
    const inner = gi.mem.filter((e) => !e.gb), b = WX.boxOf(inner), pd = gi.bd.gpad ?? 3; gi.bd.x = r1(b.x - pd); gi.bd.y = r1(b.y - pd); gi.bd.w = r1(b.w + 2 * pd); gi.bd.h = r1(b.h + 2 * pd);
  }
  function createBackdrop(gi) {
    const rect = E('rect', 0, 0, 10, 10, { fill: 'none', stroke: 'none', sw: 0, radius: 0, gb: true, g: gi.g, name: 'Fundo do conjunto', gpad: 3 });
    try { WX.applyId(rect, WX.globalId(), { nohd: true }); } catch (_) { /* sem estilo */ }
    change([gi.p.id], () => { const idx = Math.min(...gi.mem.map((e) => gi.p.els.indexOf(e))); gi.p.els.splice(idx, 0, rect); const g2 = { p: gi.p, mem: gi.mem.concat(rect), bd: rect }; fitBackdrop(g2); });
    S.sel = [rect.id]; redraw(); renderProps(); thumbRefresh(gi.p.id); toast('Fundo do conjunto criado. Use Fundo, Borda e Estilo para o conjunto todo. ✨');
  }
  function section(P) {
    P.querySelectorAll('[data-acc="gset"]').forEach((x) => x.remove());
    const sel = selEls(); if (!sel.length) return;
    const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
    let h = '';
    if (sel.length === 1 && sel[0].gb) h = `<p class="hint">Este é o fundo do conjunto. Use as seções abaixo (Fundo, Borda e moldura, Estilo, Título) para o conjunto todo.</p><div class="row"><button type="button" class="btn sm" data-gs="all">← Selecionar o conjunto</button><button type="button" class="btn sm" data-gs="fit">Ajustar ao conjunto</button><button type="button" class="btn sm ghost danger" data-gs="rm">Remover fundo</button></div>`;
    else { const gi = groupInfo(); if (!gi) return;
      h = gi.bd ? `<p class="hint">Estes widgets se comportam como um só. Fundo, borda e estilo do conjunto ficam no fundo dele; os textos continuam individuais.</p><div class="row"><button type="button" class="btn sm pri" data-gs="edit">Editar fundo, borda e estilo do conjunto</button><button type="button" class="btn sm" data-gs="fit">Ajustar ao conjunto</button></div>`
        : `<p class="hint">Widgets agrupados podem ter um fundo, borda, estilo e título em comum, como se fossem um só. Os textos continuam individuais.</p><div class="row"><button type="button" class="btn sm pri" data-gs="new">Criar fundo e borda do conjunto</button></div>`; }
    const open = !(Pref.acc && Pref.acc.gset === false), w = document.createElement('div'); w.className = 'wacc' + (open ? ' open' : ''); w.dataset.acc = 'gset';
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${open}"><i class="wtri"></i><b>Conjunto de widgets</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab">${h}</div>`;
    const first = P.querySelector('.pact') || P.querySelector('h2'); if (first && first.nextSibling) P.insertBefore(w, first.nextSibling); else P.appendChild(w);
  }
  function wireGs() {
    const P0 = document.getElementById('props'); if (!P0 || P0._gs) return; P0._gs = 1;
    P0.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-gs]'); if (!b) return; const a = b.dataset.gs, p = curPage();
      let gi = groupInfo(); if (!gi && selEls()[0] && selEls()[0].gb) { const bd = selEls()[0], ids = gx(p, [bd.id]); gi = { p, mem: p.els.filter((e) => ids.includes(e.id)), bd, g: bd.g }; }
      if (!gi) return;
      if (a === 'new') createBackdrop(gi);
      else if (a === 'edit') { S.sel = [gi.bd.id]; redraw(); renderProps(); }
      else if (a === 'all') { S.sel = gi.mem.map((e) => e.id); redraw(); renderProps(); }
      else if (a === 'fit') { change([p.id], () => fitBackdrop(gi)); redraw(); renderProps(); thumbRefresh(p.id); }
      else if (a === 'rm') { change([p.id], () => { p.els = p.els.filter((e) => e !== gi.bd); }); S.sel = gi.mem.filter((e) => e !== gi.bd).map((e) => e.id); redraw(); renderProps(); thumbRefresh(p.id); }
    });
  }

  function boot() {
    addElements(); wireDbl(); wireGs(); wireLock(); wireZoom();
    if (typeof renderProps === 'function' && !renderProps._rp) {
      const r0 = renderProps, f = function () { const out = r0.apply(this, arguments); const P = document.getElementById('props'); if (P && S.meta) { try { section(P); } catch (e) { console.warn(e); } } return out; }; f._rp = 1; f._lv = r0._lv; renderProps = f;
    }
  }
  window.Rapido = { boot, openQM };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50)); else setTimeout(boot, 50);
})();
