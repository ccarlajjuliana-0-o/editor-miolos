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

  /* ---------- 2) edição rápida por duplo clique ---------- */
  let QM = null;
  function closeQM(commit) {
    if (!QM) return; const q = QM; QM = null; document.removeEventListener('pointerdown', q.out, true); document.removeEventListener('keydown', q.key, true); q.el.remove();
    if (commit !== false) { pushHist(q.snap, snapOf([q.p.id])); } redraw(); renderProps(); thumbRefresh(q.p.id);
  }
  const pad = (a, n) => { a = Array.isArray(a) ? a : []; while (a.length < n) a.push(''); return a; };
  function locate(p, pt) {
    const e = hit(p, pt); if (!e) return null;
    const a = -(e.rot || 0) * Math.PI / 180, cx = e.x + e.w / 2, cy = e.y + e.h / 2, dx = pt.x - cx, dy = pt.y - cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + e.w / 2, ly = dx * Math.sin(a) + dy * Math.cos(a) + e.h / 2;
    let L = null, ix = lx, iy = ly, iw = e.w, ih = e.h;
    if (e.wx && window.WX) { L = WX.layout(e); ix = lx - L.ix; iy = ly - L.iy; iw = L.iw; ih = L.ih; }
    return { e, lx, ly, ix, iy, iw, ih, L };
  }
  function targetOf(loc) {
    const { e, ix, iy, iw, ih, L, ly } = loc, t = e.type;
    const hd = e.wx && e.wx.hd;
    if (hd && hd.on && L && ly < L.hd) {
      return { label: 'Título do widget', get: () => hd.text || '', set: (v) => { hd.text = v; }, font: { get: () => hd.font || '@title', set: (v) => { hd.font = v; }, tokens: true }, size: { get: () => hd.size || 8, set: (v) => { hd.size = v; } }, color: { get: () => toHex(hd.c || '@ink'), set: (v) => { hd.c = v; } }, weight: { get: () => hd.weight || 600, set: (v) => { hd.weight = v; } }, align: { get: () => hd.align || 'center', set: (v) => { hd.align = v; } }, hide: () => { hd.on = false; } };
    }
    const base = { font: { get: () => e.font || 'Nunito', set: (v) => { e.font = v; } }, size: { get: () => e.size || '', set: (v) => { e.size = v; }, ph: 'auto' }, color: { get: () => toHex(e.textColor || e.color), set: (v) => { e.textColor = v; } } };
    if (t === 'checklist') { const n = Math.max(1, e.n | 0), rh = ih / n, i = Math.max(0, Math.min(n - 1, Math.floor(iy / rh)));
      return Object.assign({ label: `Item ${i + 1}`, get: () => (e.items || [])[i] || '', set: (v) => { e.items = pad(e.items, n); e.items[i] = v; },
        add: () => { e.items = pad(e.items, n); e.items.splice(i + 1, 0, ''); e.n = n + 1; e.h = r1(e.h + rh); }, del: () => { if (n <= 1) return; e.items = pad(e.items, n); e.items.splice(i, 1); e.n = n - 1; e.h = r1(Math.max(4, e.h - rh)); } }, base); }
    if (t === 'habit') { const rows = Math.max(1, e.rows | 0), rh = ih / (rows + 1), lw = iw * (e.labelW || 0.3), r = Math.floor(iy / rh) - 1; if (ix > lw || r < 0 || r >= rows) return null;
      return Object.assign({ label: `Hábito ${r + 1}`, get: () => (e.labels || [])[r] || '', set: (v) => { e.labels = pad(e.labels, rows); e.labels[r] = v; },
        add: () => { e.labels = pad(e.labels, rows); e.labels.splice(r + 1, 0, ''); e.rows = rows + 1; e.h = r1(e.h + rh); }, del: () => { if (rows <= 1) return; e.labels = pad(e.labels, rows); e.labels.splice(r, 1); e.rows = rows - 1; e.h = r1(Math.max(6, e.h - rh)); } }, base); }
    if (t === 'tabs') { const n = (e.labels || []).length; if (!n) return null; const th = ih / n, i = Math.max(0, Math.min(n - 1, Math.floor(iy / th)));
      return Object.assign({ label: `Aba ${i + 1}`, get: () => e.labels[i] || '', set: (v) => { e.labels[i] = v; }, add: () => { e.labels.splice(i + 1, 0, 'Nova'); }, del: () => { if (n > 1) e.labels.splice(i, 1); } }, base); }
    if (t === 'divider') return Object.assign({ label: 'Texto do divisor', get: () => e.text || '', set: (v) => { e.text = v; } }, base);
    if (t === 'table') { const hasH = Array.isArray(e.header) && e.header.length > 0, rows = e.rows + (hasH ? 1 : 0), rh = ih / rows, r = Math.max(0, Math.min(rows - 1, Math.floor(iy / rh))), cw = colWidths(Object.assign({}, e, { w: iw })); let c = 0, x = 0; for (let k = 0; k < e.cols; k++) { if (ix >= x) c = k; x += cw[k]; }
      const isH = hasH && r === 0, rr0 = r - (hasH ? 1 : 0);
      const cell = isH ? { label: `Cabeçalho ${c + 1}`, get: () => (e.header || [])[c] || '', set: (v) => { e.header = pad(e.header, e.cols); e.header[c] = v; } } : (c === 0 && Array.isArray(e.side) ? { label: `Linha ${rr0 + 1}`, get: () => e.side[rr0] || '', set: (v) => { e.side = pad(e.side, e.rows); e.side[rr0] = v; } } : null);
      if (!cell) return null;
      return Object.assign(cell, { addRow: () => { e.rows += 1; if (Array.isArray(e.side)) e.side.splice(Math.max(0, rr0) + 1, 0, ''); e.h = r1(e.h + rh); }, delRow: () => { if (e.rows <= 1) return; if (Array.isArray(e.side)) e.side.splice(Math.max(0, rr0), 1); e.rows -= 1; e.h = r1(Math.max(6, e.h - rh)); }, add: () => { e.cols += 1; delete e.cw; if (Array.isArray(e.header)) e.header.splice(c + 1, 0, ''); }, del: () => { if (e.cols <= 1) return; delete e.cw; if (Array.isArray(e.header)) e.header.splice(c, 1); if (Array.isArray(e.side) && c === 0) { /* mantém */ } e.cols -= 1; }, addLabel: 'Coluna', delLabel: 'Coluna', rowLabel: true }, base); }
    return null;
  }
  const fOpts = (cur, tokens) => { const L = fontList(), t = tokens ? [['@title', 'Fonte de títulos do projeto'], ['@script', 'Fonte caligráfica do projeto'], ['@body', 'Fonte de texto do projeto']] : []; const all = t.concat(L.map((f) => [f, f])); if (!all.some((x) => x[0] === cur)) all.unshift([cur, cur]); return all.map(([v, n]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(n)}</option>`).join(''); };
  function openQM(ev, w, p, loc, tg) {
    closeQM(); const e = loc.e, snap = snapOf([p.id]);
    const el = document.createElement('div'); el.className = 'qm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Edição rápida');
    const ali = tg.align ? `<div class="segf lvseg" data-qa>${[['left', '⇤'], ['center', '↔'], ['right', '⇥']].map(([v, n]) => `<button type="button" data-qal="${v}" class="${tg.align.get() === v ? 'on' : ''}" aria-label="${v}">${n}</button>`).join('')}</div>` : '';
    el.innerHTML = `<div class="qmh"><b>${esc(tg.label)}</b><button type="button" class="qmx" data-qx aria-label="Fechar">✕</button></div>
      <textarea rows="2" data-qt placeholder="Digite o texto…">${esc(tg.get())}</textarea>
      <div class="qmr"><select data-qf>${fOpts(tg.font.get(), tg.font.tokens)}</select><input type="number" data-qs min="2" max="80" step="0.5" value="${tg.size.get()}" placeholder="${tg.size.ph || ''}" title="Tamanho (pt)"><input type="color" data-qc value="${tg.color.get()}" title="Cor do texto"></div>
      ${tg.align || tg.weight ? `<div class="qmr">${ali}${tg.weight ? `<button type="button" class="lvtg${tg.weight.get() >= 600 ? ' on' : ''}" data-qb title="Negrito"><b>N</b></button>` : ''}</div>` : ''}
      <div class="qmr qmb">${tg.add ? `<button type="button" class="btn sm" data-qadd>＋ ${tg.addLabel ? 'Coluna' : 'Incluir abaixo'}</button>` : ''}${tg.addRow || tg.rowLabel ? '<button type="button" class="btn sm" data-qaddr>＋ Linha</button>' : ''}${tg.del ? `<button type="button" class="btn sm ghost danger" data-qdel>🗑 ${tg.delLabel ? 'Coluna' : 'Excluir'}</button>` : ''}${tg.delRow ? '<button type="button" class="btn sm ghost danger" data-qdelr>🗑 Linha</button>' : ''}${tg.hide ? '<button type="button" class="btn sm ghost" data-qhide>Ocultar título</button>' : ''}</div>`;
    document.body.appendChild(el);
    const W = el.offsetWidth || 300, H = el.offsetHeight || 220; el.style.left = Math.max(8, Math.min(ev.clientX - 20, innerWidth - W - 8)) + 'px'; el.style.top = Math.max(8, Math.min(ev.clientY + 14, innerHeight - H - 8)) + 'px';
    const live = () => { redraw(); };
    const q = { el, p, snap, out: (x) => { if (!el.contains(x.target)) closeQM(); }, key: (x) => { if (x.key === 'Escape') { x.stopPropagation(); closeQM(); } } };
    QM = q; setTimeout(() => { document.addEventListener('pointerdown', q.out, true); document.addEventListener('keydown', q.key, true); }, 0);
    const $q = (s) => el.querySelector(s), act = (fn) => { fn(); closeQM(); };
    const ta = $q('[data-qt]'); ta.oninput = () => { tg.set(ta.value); live(); }; ta.focus(); ta.select();
    ta.onkeydown = (x) => { x.stopPropagation(); if (x.key === 'Escape') closeQM(); else if (x.key === 'Enter' && !x.shiftKey) { x.preventDefault(); closeQM(); } };
    $q('[data-qf]').onchange = (x) => { tg.font.set(x.target.value); live(); };
    $q('[data-qs]').oninput = (x) => { tg.size.set(x.target.value === '' ? undefined : num(x.target.value, 2, 80, 8)); live(); };
    $q('[data-qc]').oninput = (x) => { tg.color.set(x.target.value); live(); };
    $q('[data-qx]').onclick = () => closeQM();
    $$('[data-qal]', el).forEach((b) => b.onclick = () => { tg.align.set(b.dataset.qal); $$('[data-qal]', el).forEach((y) => y.classList.toggle('on', y === b)); live(); });
    const bb = $q('[data-qb]'); if (bb) bb.onclick = () => { const v = tg.weight.get() >= 600 ? 400 : 700; tg.weight.set(v); bb.classList.toggle('on', v >= 600); live(); };
    const bind = (sel, fn) => { const b = $q(sel); if (b) b.onclick = () => act(fn); };
    bind('[data-qadd]', tg.add || (() => { })); bind('[data-qdel]', tg.del || (() => { })); bind('[data-qaddr]', tg.addRow || (() => { })); bind('[data-qdelr]', tg.delRow || (() => { })); bind('[data-qhide]', tg.hide || (() => { }));
  }
  function wireDbl() {
    const st = document.getElementById('stage'); if (!st || st._qm) return; st._qm = 1;
    st.addEventListener('dblclick', (ev) => {
      const w = ev.target.closest('.pg'); if (!w || S.tool || S.ptEdit) return; const p = S.pages[w.dataset.id]; if (!p) return;
      const loc = locate(p, toMM(ev, w)); if (!loc || loc.e.locked) return; if (loc.e.type === 'text' && !loc.e.wx) return;
      if (loc.e.type === 'text') { /* texto com título: deixa a edição normal */ const hd = loc.e.wx && loc.e.wx.hd; if (!(hd && hd.on && loc.L && loc.ly < loc.L.hd)) return; }
      const tg = targetOf(loc); if (!tg) return;
      ev.stopImmediatePropagation(); ev.preventDefault(); S.sel = [loc.e.id]; redraw(); renderProps(); openQM(ev, w, p, loc, tg);
    }, true);
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
    addElements(); wireDbl(); wireGs();
    if (typeof renderProps === 'function' && !renderProps._rp) {
      const r0 = renderProps, f = function () { const out = r0.apply(this, arguments); const P = document.getElementById('props'); if (P && S.meta) { try { section(P); } catch (e) { console.warn(e); } } return out; }; f._rp = 1; f._lv = r0._lv; renderProps = f;
    }
  }
  window.Rapido = { boot, openQM };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50)); else setTimeout(boot, 50);
})();
