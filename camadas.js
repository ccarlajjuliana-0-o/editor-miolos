/* Camadas — painel com todos os elementos da página, do mais à frente para o mais atrás.
   Dá para selecionar, arrastar para mudar a ordem, ocultar (olho), travar a posição (cadeado), renomear e agrupar.
   Elemento travado não é selecionado por clique na página (Alt + clique seleciona) e não se move. */
(function () {
  'use strict';
  const ROW = 38;
  const st = { q: '', f: 'all', collapsed: new Set(), anchor: null, drag: null, sig: '', top: 0, rename: null };
  const SVG = (d, w) => `<svg viewBox="0 0 24 24" width="${w || 16}" height="${w || 16}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    eye: SVG('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: SVG('<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6A16.5 16.5 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    lock: SVG('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    unlock: SVG('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
    grip: SVG('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>', 14),
    chev: SVG('<path d="M6 9l6 6 6-6"/>', 14),
    layers: '<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  };
  if (typeof ICON !== 'undefined') ICON.camadas = I.layers;
  if (typeof TABS !== 'undefined' && !TABS.some((t) => t[0] === 'camadas')) TABS.splice(1, 0, ['camadas', 'Camadas']);

  const nameOf = (e) => e.name || (e.type === 'text' ? (String(e.text || '').replace(/\s+/g, ' ').trim().slice(0, 30) || 'Texto vazio') : (TYPE_NAME[e.type] || 'Elemento'));
  const colorOf = (e) => { const c = [e.fill, e.color, e.stroke, e.accent, e.fill1].find((v) => v && v !== 'none' && /^(#|rgb)/.test(v)); return c || ''; };
  const esc2 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lockClick = () => (typeof Pref !== 'undefined' ? Pref.lockClick !== false : true);

  function build(p) {
    const els = p.els, q = st.q.trim().toLowerCase(), rows = [], seen = new Set();
    const pass = (e) => (st.f === 'lock' ? e.locked : st.f === 'hid' ? e.hidden : true) && (!q || nameOf(e).toLowerCase().includes(q) || (TYPE_NAME[e.type] || '').toLowerCase().includes(q));
    for (let i = els.length - 1; i >= 0; i--) {
      const e = els[i];
      if (e.g) {
        if (seen.has(e.g)) continue; seen.add(e.g);
        const mem = els.filter((x) => x.g === e.g).reverse(), vis = mem.filter(pass); if (!vis.length) continue;
        rows.push({ k: 'g', g: e.g, mem }); if (!st.collapsed.has(e.g)) vis.forEach((m) => rows.push({ k: 'e', e: m, ind: 1 }));
      } else if (pass(e)) rows.push({ k: 'e', e, ind: 0 });
    }
    return rows;
  }
  const rowIds = (p, r) => (r.k === 'g' ? r.mem.map((x) => x.id) : gx(p, [r.e.id]));

  /* ---------- painel ---------- */
  function html() {
    const p = curPage();
    return `<h2>Camadas</h2><p class="hint" style="margin-top:-6px">${p ? esc2((p.name || 'Página') + ' · ' + p.els.length + ' elemento' + (p.els.length === 1 ? '' : 's')) : ''}</p>
    <div class="lytools"><input type="search" id="lyQ" placeholder="Procurar camada…" aria-label="Procurar camada" value="${esc2(st.q)}">
      <div class="lyflt" id="lyF" role="group" aria-label="Mostrar"><button type="button" data-f="all" class="${st.f === 'all' ? 'on' : ''}">Todas</button><button type="button" data-f="lock" class="${st.f === 'lock' ? 'on' : ''}">Travadas</button><button type="button" data-f="hid" class="${st.f === 'hid' ? 'on' : ''}">Ocultas</button></div></div>
    <div class="lybulk"><button type="button" class="btn sm ghost" data-b="lockall">${I.lock} Travar tudo</button><button type="button" class="btn sm ghost" data-b="unlockall">${I.unlock} Destravar tudo</button><button type="button" class="btn sm ghost" data-b="showall">${I.eye} Mostrar tudo</button></div>
    <div id="lySel"></div>
    <div id="lyList" tabindex="0" aria-label="Lista de camadas"><div id="lyIn"></div></div>
    <label class="chk lyopt"><input type="checkbox" id="lyLC"${lockClick() ? ' checked' : ''}> Camadas travadas não são selecionadas ao clicar na página <span class="hint">(Alt + clique seleciona)</span></label>
    <p class="hint">Arraste pelas bolinhas ⋮⋮ para mudar a ordem: o topo da lista fica na frente. Dois cliques no nome renomeiam.</p>`;
  }

  let P = null;
  function mount(panel) {
    P = panel; st.sig = ''; paint(true);
    const g = (q) => P.querySelector(q);
    g('#lyQ').oninput = (e) => { st.q = e.target.value; st.top = 0; paint(true); };
    g('#lyF').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; st.f = b.dataset.f; g('#lyF').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); st.top = 0; paint(true); };
    P.querySelector('.lybulk').onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return; const p = curPage(); if (!p) return;
      const a = b.dataset.b;
      change([p.id], () => p.els.forEach((x) => { if (a === 'lockall') x.locked = true; else if (a === 'unlockall') x.locked = false; else x.hidden = false; }));
      afterChange(p);
    };
    g('#lyLC').onchange = (e) => { Pref.lockClick = e.target.checked; savePref(); };
    const list = g('#lyList'); list.onscroll = () => { st.top = list.scrollTop; paint(false); };
    list.onclick = onClick; list.onpointerdown = onDown;
    list.onpointerover = (e) => { const r = e.target.closest('.lyr'); hover(r ? r.dataset.id : null); }; list.onpointerleave = () => hover(null);
    list.onkeydown = (e) => { if (e.key === 'Delete' || e.key === 'Backspace') { if (S.sel.length) { e.preventDefault(); delSel(); } } };
  }
  function afterChange(p) { S.sel = S.sel.filter((id) => { const e = p.els.find((x) => x.id === id); return e && !e.hidden; }); redraw(); renderProps(); thumbRefresh(p.id); }

  /* ---------- lista (só desenha as linhas visíveis) ---------- */
  let rowsCache = [];
  function paint(full) {
    if (!P || !P.isConnected) return; const p = curPage(); if (!p) return;
    const list = P.querySelector('#lyList'), inn = P.querySelector('#lyIn'); if (!list || !inn) return;
    if (full) rowsCache = build(p);
    const n = rowsCache.length, H = Math.min(Math.max(220, innerHeight - 420), 520);
    list.style.height = Math.min(H, Math.max(n * ROW + 8, 96)) + 'px'; inn.style.height = n * ROW + 'px';
    if (!n) { inn.innerHTML = `<p class="hint" style="padding:14px">${p.els.length ? 'Nenhuma camada com esse filtro.' : 'Esta página ainda não tem elementos.'}</p>`; paintSel(p); return; }
    const vh = list.clientHeight || H, a = Math.max(0, Math.floor(st.top / ROW) - 4), b = Math.min(n, Math.ceil((st.top + vh) / ROW) + 4);
    let h = '';
    for (let i = a; i < b; i++) {
      const r = rowsCache[i], y = i * ROW;
      if (r.k === 'g') {
        const all = (f) => r.mem.every((x) => x[f]), open = !st.collapsed.has(r.g), sel = r.mem.every((x) => S.sel.includes(x.id));
        h += `<div class="lyr lyg${sel ? ' sel' : ''}${all('hidden') ? ' hid' : ''}" style="top:${y}px" data-i="${i}" data-g="${r.g}" data-id="${r.mem[0].id}">
          <button type="button" class="lyt${open ? ' open' : ''}" data-act="fold" aria-label="${open ? 'Recolher' : 'Expandir'} grupo">${I.chev}</button><span class="lyh" data-act="grip">${I.grip}</span>
          <span class="lyc grp" aria-hidden="true">▣</span><span class="lyn">Grupo <small>${r.mem.length} itens</small></span>
          <button type="button" class="lyb${all('hidden') ? ' on' : ''}" data-act="eye" aria-label="${all('hidden') ? 'Mostrar' : 'Ocultar'} grupo">${all('hidden') ? I.eyeOff : I.eye}</button>
          <button type="button" class="lyb${all('locked') ? ' on' : ''}" data-act="lock" aria-label="${all('locked') ? 'Destravar' : 'Travar'} grupo">${all('locked') ? I.lock : I.unlock}</button></div>`;
      } else {
        const e = r.e, sel = S.sel.includes(e.id), c = colorOf(e), isImg = e.type === 'image' && e.src, editing = st.rename === e.id;
        h += `<div class="lyr${sel ? ' sel' : ''}${e.locked ? ' lk' : ''}${e.hidden ? ' hid' : ''}${r.ind ? ' ind' : ''}" style="top:${y}px" data-i="${i}" data-id="${e.id}">
          <span class="lyh" data-act="grip">${I.grip}</span>
          <span class="lyc" style="${isImg ? '' : c ? 'background:' + c : ''}">${isImg ? `<img alt="" loading="lazy" src="${esc2(srcUrl(e.src))}">` : e.type === 'text' ? '<b>T</b>' : ''}</span>
          ${editing ? `<input class="lyren" type="text" value="${esc2(e.name || nameOf(e))}" maxlength="60" aria-label="Nome da camada">` : `<span class="lyn" title="${esc2(nameOf(e))}">${esc2(nameOf(e))}</span>`}
          <button type="button" class="lyb${e.hidden ? ' on' : ''}" data-act="eye" aria-label="${e.hidden ? 'Mostrar' : 'Ocultar'}" title="${e.hidden ? 'Mostrar' : 'Ocultar'}">${e.hidden ? I.eyeOff : I.eye}</button>
          <button type="button" class="lyb${e.locked ? ' on' : ''}" data-act="lock" aria-label="${e.locked ? 'Destravar posição' : 'Travar posição'}" title="${e.locked ? 'Destravar posição' : 'Travar posição'}">${e.locked ? I.lock : I.unlock}</button></div>`;
      }
    }
    inn.innerHTML = h;
    const ren = inn.querySelector('.lyren'); if (ren) { ren.focus(); ren.select(); ren.onkeydown = (ev) => { if (ev.key === 'Enter') commitRename(ren.value); else if (ev.key === 'Escape') { st.rename = null; paint(true); } }; ren.onblur = () => commitRename(ren.value); }
    paintSel(p);
  }
  function commitRename(v) {
    const id = st.rename; if (!id) return; st.rename = null; const p = curPage(), e = p && p.els.find((x) => x.id === id);
    if (e) { v = v.trim(); const cur = e.name || ''; if (v !== cur && v !== nameOf(e)) { change([p.id], () => { if (v) e.name = v; else delete e.name; }); } }
    paint(true);
  }
  function widgetLay(els) {
    const W = window.WX; if (!W || !W.isW) return ''; const ws = els.filter((e) => W.isW(e)); if (!ws.length) return '';
    const same = (f) => ws.every((e) => f(e) === f(ws[0])), pin = same((e) => e.pin || '') ? (ws[0].pin || '') : null, no = same((e) => !!W.isNoOver(e)) ? !!W.isNoOver(ws[0]) : null, lk = ws.every((e) => e.locked);
    return `<div class="lywl"><div class="lywt">Posição do widget${ws.length > 1 ? ' (' + ws.length + ')' : ''}</div><div class="segf">${[['', 'Normal'], ['top', 'Sempre na frente'], ['back', 'Sempre atrás']].map(([v, n]) => `<button type="button" data-lp="${v}" class="${pin === v ? 'on' : ''}">${n}</button>`).join('')}</div>
      <label class="chk"><input type="checkbox" data-ln="1"${no ? ' checked' : ''}> Não deixar outros widgets por cima</label>
      <p class="hint">“Sempre na frente/atrás” vale mesmo quando você muda a ordem na lista. Textos, adesivos e imagens podem ficar por cima de widgets.</p></div>`;
  }
  function paintSel(p) {
    const box = P && P.querySelector('#lySel'); if (!box) return;
    const els = selEls(); if (!els.length) { box.innerHTML = ''; return; }
    const allL = els.every((e) => e.locked), allH = els.every((e) => e.hidden), grp = els.length > 1 && els.every((e) => e.g && e.g === els[0].g);
    box.innerHTML = `<div class="lysel"><b>${els.length} selecionado${els.length > 1 ? 's' : ''}</b>
      <button type="button" class="ib" data-s="front" title="Trazer para a frente" aria-label="Trazer para a frente">⤒</button><button type="button" class="ib" data-s="up" title="Subir uma camada" aria-label="Subir uma camada">↑</button><button type="button" class="ib" data-s="down" title="Descer uma camada" aria-label="Descer uma camada">↓</button><button type="button" class="ib" data-s="back" title="Enviar para trás" aria-label="Enviar para trás">⤓</button>
      <button type="button" class="ib" data-s="lock" title="${allL ? 'Destravar' : 'Travar'}" aria-label="${allL ? 'Destravar' : 'Travar'}">${allL ? I.lock : I.unlock}</button><button type="button" class="ib" data-s="hide" title="${allH ? 'Mostrar' : 'Ocultar'}" aria-label="${allH ? 'Mostrar' : 'Ocultar'}">${allH ? I.eyeOff : I.eye}</button>
      <button type="button" class="ib" data-s="group" title="${grp ? 'Desagrupar' : 'Agrupar'}" aria-label="${grp ? 'Desagrupar' : 'Agrupar'}">${grp ? '⊟' : '⊞'}</button></div>${widgetLay(els)}`;
    box.onchange = (ev) => { if (ev.target.dataset && ev.target.dataset.ln) { WX.setLay('noOver', ev.target.checked); paintSel(curPage()); } };
    box.onclick = (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.lp !== undefined) { WX.setLay('pin', b.dataset.lp); paintSel(curPage()); return; } const a = b.dataset.s, p2 = curPage(), ids = S.sel.slice();
      if (a === 'front' || a === 'back') orderSel(a);
      else if (a === 'up' || a === 'down') stepOrder(p2, ids, a === 'up' ? 1 : -1);
      else if (a === 'lock') { const v = !selEls().every((e) => e.locked); change([p2.id], () => selEls().forEach((e) => { e.locked = v; })); }
      else if (a === 'hide') { const v = !selEls().every((e) => e.hidden); change([p2.id], () => selEls().forEach((e) => { e.hidden = v; })); S.sel = v ? [] : S.sel; }
      else if (a === 'group') { if (grp) ungroupSel(); else groupSel(); }
      redraw(); renderProps(); thumbRefresh(p2.id);
    };
  }
  function stepOrder(p, ids, d) { // sobe/desce o bloco selecionado uma posição
    change([p.id], () => {
      const set = new Set(ids), a = p.els;
      if (d > 0) { for (let i = a.length - 2; i >= 0; i--) if (set.has(a[i].id) && !set.has(a[i + 1].id)) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; } }
      else { for (let i = 1; i < a.length; i++) if (set.has(a[i].id) && !set.has(a[i - 1].id)) { const t = a[i]; a[i] = a[i - 1]; a[i - 1] = t; } }
    });
  }

  /* ---------- cliques ---------- */
  function onClick(ev) {
    const row = ev.target.closest('.lyr'); if (!row) return; const p = curPage(); if (!p || ev.target.closest('.lyren')) return;
    const r = rowsCache[+row.dataset.i]; if (!r) return;
    const act = ev.target.closest('[data-act]'), a = act && act.dataset.act;
    if (a === 'grip') return;
    if (a === 'fold') { if (st.collapsed.has(r.g)) st.collapsed.delete(r.g); else st.collapsed.add(r.g); paint(true); return; }
    if (a === 'eye' || a === 'lock') {
      const mem = r.k === 'g' ? r.mem : [r.e], f = a === 'eye' ? 'hidden' : 'locked', v = !mem.every((x) => x[f]);
      change([p.id], () => mem.forEach((x) => { x[f] = v; })); afterChange(p); return;
    }
    if (r.k === 'e' && ev.target.closest('.lyn') && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey) { // dois cliques no nome = renomear
      const now = Date.now(), l = st.lastClick; st.lastClick = { t: now, id: r.e.id };
      if (l && l.id === r.e.id && now - l.t < 450) { st.lastClick = null; st.rename = r.e.id; paint(true); return; }
    }
    const ids = rowIds(p, r), meta = ev.ctrlKey || ev.metaKey;
    if (ev.shiftKey && st.anchor != null && rowsCache[st.anchor]) {
      const [lo, hi] = [Math.min(st.anchor, +row.dataset.i), Math.max(st.anchor, +row.dataset.i)], out = new Set(S.sel);
      for (let i = lo; i <= hi; i++) rowIds(p, rowsCache[i]).forEach((x) => out.add(x)); S.sel = [...out];
    } else if (meta) { S.sel = ids.every((x) => S.sel.includes(x)) ? S.sel.filter((x) => !ids.includes(x)) : [...new Set([...S.sel, ...ids])]; st.anchor = +row.dataset.i; }
    else { S.sel = ids; st.anchor = +row.dataset.i; }
    st.fromPanel = true; redraw(); renderProps();
  }
  function onDbl(ev) {
    const n = ev.target.closest('.lyn'); if (!n) return; const row = n.closest('.lyr'), r = rowsCache[+row.dataset.i]; if (!r || r.k === 'g') return;
    st.rename = r.e.id; paint(true);
  }

  /* ---------- arrastar para reordenar ---------- */
  function onDown(ev) {
    const grip = ev.target.closest('[data-act=grip]'); if (!grip || ev.button > 0) return; const row = grip.closest('.lyr'), p = curPage(), r = rowsCache[+row.dataset.i]; if (!p || !r) return;
    ev.preventDefault();
    let ids = rowIds(p, r); if (S.sel.length > 1 && ids.some((x) => S.sel.includes(x))) ids = [...new Set([...S.sel, ...ids])];
    const list = P.querySelector('#lyList'); st.drag = { ids, list, to: null, pos: 'above', moved: false, y0: ev.clientY };
    row.classList.add('drag'); list.setPointerCapture && list.setPointerCapture(ev.pointerId);
    list.onpointermove = onMove; list.onpointerup = onUp; list.onpointercancel = onUp;
  }
  function onMove(ev) {
    const d = st.drag; if (!d) return; if (Math.abs(ev.clientY - d.y0) > 4) d.moved = true; if (!d.moved) return;
    const rect = d.list.getBoundingClientRect();
    if (ev.clientY < rect.top + 24) d.list.scrollTop -= 14; else if (ev.clientY > rect.bottom - 24) d.list.scrollTop += 14;
    const y = ev.clientY - rect.top + d.list.scrollTop, i = Math.max(0, Math.min(rowsCache.length - 1, Math.floor(y / ROW)));
    d.to = i; d.pos = (y - i * ROW) < ROW / 2 ? 'above' : 'below';
    let ind = P.querySelector('.lydrop'); if (!ind) { ind = document.createElement('div'); ind.className = 'lydrop'; P.querySelector('#lyIn').appendChild(ind); }
    ind.style.top = (d.pos === 'above' ? i * ROW : (i + 1) * ROW) + 'px';
  }
  function onUp() {
    const d = st.drag; st.drag = null; const list = d && d.list; if (list) { list.onpointermove = list.onpointerup = list.onpointercancel = null; }
    const ind = P && P.querySelector('.lydrop'); if (ind) ind.remove();
    if (!d || !d.moved || d.to == null) { paint(true); return; }
    const p = curPage(), tr = rowsCache[d.to]; if (!p || !tr) { paint(true); return; }
    const tmem = tr.k === 'g' ? tr.mem : [tr.e]; // mem está do mais à frente para o mais atrás
    const dset = new Set(d.ids); if (tmem.every((x) => dset.has(x.id))) { paint(true); return; }
    const ref = d.pos === 'above' ? tmem.find((x) => !dset.has(x.id)) : [...tmem].reverse().find((x) => !dset.has(x.id));
    change([p.id], () => {
      const moving = p.els.filter((x) => dset.has(x.id)), rest = p.els.filter((x) => !dset.has(x.id)), at = rest.findIndex((x) => x.id === ref.id);
      rest.splice(d.pos === 'above' ? at + 1 : at, 0, ...moving); p.els = rest;
    });
    redraw(); renderProps(); thumbRefresh(p.id); toast('Ordem das camadas alterada. Ctrl+Z desfaz.');
  }

  /* ---------- destaque na página ao passar o mouse ---------- */
  function hover(id) { if (S.hoverEl === id) return; S.hoverEl = id; try { drawOverlaysOnly(); } catch (e) { /* segue */ } }
  const dov = window.drawOverlay;
  if (typeof dov === 'function') window.drawOverlay = function (w, p) {
    const r = dov.apply(this, arguments);
    try {
      if (S.hoverEl && S.tab === 'camadas') {
        const rows = [S.hoverEl], el = p.els.find((x) => x.id === S.hoverEl); const set = el && el.g ? p.els.filter((x) => x.g === el.g) : el ? [el] : [];
        void rows; const sc = w.querySelector('.selc'), k = S.k;
        set.forEach((e) => { sc.insertAdjacentHTML('beforeend', `<div class="lyhov" style="left:${e.x * k}px;top:${e.y * k}px;width:${Math.max(e.w * k, 3)}px;height:${Math.max(e.h * k, 3)}px;transform:rotate(${e.rot || 0}deg)"></div>`); });
      }
    } catch (e) { /* segue */ }
    return r;
  };

  /* ---------- clique na página: travadas e ocultas ficam de fora ---------- */
  const sg = document.getElementById('stage');
  if (sg) sg.addEventListener('pointerdown', (e) => { window.__alt = !!e.altKey; }, true);

  /* ---------- atualiza o painel quando algo muda ---------- */
  let raf = 0;
  const rp = window.renderProps;
  window.renderProps = function () {
    const r = rp.apply(this, arguments);
    if (S.tab === 'camadas' && P && P.isConnected && !st.drag) {
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
        const p = curPage(); if (!p) return;
        const head = P.querySelector('.hint'); if (head) head.textContent = (p.name || 'Página') + ' · ' + p.els.length + ' elemento' + (p.els.length === 1 ? '' : 's');
        paint(true);
        if (!st.fromPanel && S.sel.length) { const i = rowsCache.findIndex((r2) => r2.k === 'e' && r2.e.id === S.sel[0]); const list = P.querySelector('#lyList'); if (i >= 0 && list && (i * ROW < list.scrollTop || (i + 1) * ROW > list.scrollTop + list.clientHeight)) { list.scrollTop = Math.max(0, i * ROW - ROW * 2); st.top = list.scrollTop; paint(false); } }
        st.fromPanel = false;
      });
    }
    return r;
  };
  if (typeof PANELS !== 'undefined') PANELS.camadas = { html, mount };
  window.Camadas = { paint: () => paint(true) };
})();
