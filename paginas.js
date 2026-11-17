/* Páginas — títulos, copiar design entre páginas e a janela "Inserir páginas".
   Substitui o painel "Páginas" do editor; as opções extras ficam recolhidas em menus. */
(function () {
  'use strict';
  const title = (i) => { const p = S.pages[S.order[i]]; return (p && p.name && p.name.trim()) || 'Página'; };
  const label = (i) => `${i + 1}: ${title(i)}`;
  const opts = (sel, skip) => S.order.map((id, i) => `<option value="${i}"${i === sel ? ' selected' : ''}${i === skip ? ' disabled' : ''}>${esc(label(i))}</option>`).join('');

  /* ---------- copiar design ---------- */
  const GRP = { text: 'text', number: 'text', image: 'img', shape: 'shape', path: 'shape', divider: 'shape' };
  const grp = (e) => GRP[e.type] || 'data';
  const GNAME = { text: 'Textos e números', img: 'Imagens e adesivos', shape: 'Formas, traços e divisores', data: 'Tabelas, calendários e listas' };
  function copyDesign(fromId, toIds, o) {
    o = o || {};
    const s = S.pages[fromId], ids = toIds.filter((id) => id !== fromId && S.pages[id]); if (!s || !ids.length) return 0;
    const P = Object.assign({ bg: true, text: true, img: true, shape: true, data: true, size: false, name: false, mg: false }, o.parts || {});
    change(ids, () => ids.forEach((tid) => {
      const d = S.pages[tid], nw = P.size ? s.w : d.w, nh = P.size ? s.h : d.h, fx = o.fit ? nw / s.w : 1, fy = o.fit ? nh / s.h : 1, fm = Math.min(fx, fy);
      const els = clone(s.els).filter((e) => P[grp(e)]).map((e) => {
        e.id = uid('e');
        if (o.fit && (Math.abs(fx - 1) > 0.001 || Math.abs(fy - 1) > 0.001)) { e.x = r1(e.x * fx); e.y = r1(e.y * fy); e.w = r1(e.w * fx); e.h = r1(e.h * fy); if (e.type === 'text' || e.type === 'table' || e.type === 'divider') e.size = r1((e.size || 9) * fm); if (e.sp) e.sp = r1(e.sp * fm); }
        return e;
      });
      if (o.remap && window.Margens && Margens.remap) Margens.remap(els, s, d);
      if (P.bg) {
        const keep = new Set(['id', 'w', 'h', 'name', 'els', 'mg']);
        Object.keys(d).forEach((k) => { if (!keep.has(k)) delete d[k]; });
        Object.keys(s).forEach((k) => { if (!keep.has(k)) d[k] = clone(s[k]); });
      }
      if (o.replace) d.els = d.els.filter((e) => !P[grp(e)]);
      d.els.push(...els);
      if (P.size) { d.w = s.w; d.h = s.h; }
      if (P.mg) { if (s.mg) d.mg = Object.assign(clone(s.mg), { side: d.mg ? d.mg.side : 'auto', lock: d.mg ? d.mg.lock : s.mg.lock }); else delete d.mg; }
      if (P.name) d.name = s.name;
    }));
    ids.forEach((id) => thumbRefresh(id));
    refreshAll();
    return ids.length;
  }
  function copyModal(from, to) {
    const n = S.order.length, toSet = new Set(to == null ? [] : Array.isArray(to) ? to : [to]);
    modal(`<div class="insroot cdroot"><h2>Copiar design</h2><p class="hint">Escolha de qual página copiar, o que levar e para quais páginas.</p>
      <label class="f">Copiar de<select id="cdFrom">${opts(from)}</select></label>
      <div class="xrow"><h3 style="margin:0">PARA</h3><label class="chk"><input type="checkbox" id="cdAll"> <span id="cdAllT">Selecionar todas</span></label></div>
      ${n > 10 ? '<input type="search" id="cdQ" placeholder="Procurar página…" aria-label="Procurar página">' : ''}
      <div class="cdlist" id="cdList"></div>
      <div class="xrow"><h3 style="margin:0">O QUE COLAR</h3><button type="button" class="btn sm ghost" id="cdDet">Detalhes</button></div>
      <div class="cdparts" id="cdParts"></div>
      <h3>TAMBÉM COPIAR</h3>
      <label class="chk"><input type="checkbox" id="cdSize"> O tamanho da página</label>
      <label class="chk"><input type="checkbox" id="cdName"> O título da página</label>
      <label class="chk"><input type="checkbox" id="cdMg"> Layout: margens, furos, cabeçalho e rodapé</label>
      <h3>COMO</h3>
      <label class="chk"><input type="radio" name="cdMode" value="r" checked> Substituir (troca o que já existe)</label>
      <label class="chk"><input type="radio" name="cdMode" value="a"> Acrescentar sobre o que já existe</label>
      <label class="chk"><input type="checkbox" id="cdFit" checked> Ajustar ao tamanho de cada página</label>
      <p class="hint" id="cdInfo"></p>
      <div class="row cdfoot"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="cdGo">Copiar design</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q), picked = new Set([...toSet].filter((i) => i >= 0 && i < n));
      const part = { bg: true, text: true, img: true, shape: true, data: true }; let det = false, q = '';
      const GK = ['text', 'img', 'shape', 'data'], replace = () => g('input[name=cdMode]:checked').value === 'r';
      const drawParts = () => {
        const f = +g('#cdFrom').value, src = S.pages[S.order[f]], cnt = { text: 0, img: 0, shape: 0, data: 0 }; src.els.forEach((e) => { cnt[grp(e)]++; });
        const on = GK.filter((k) => part[k]).length, all = on === 4;
        const note = (k) => cnt[k] ? `${cnt[k]} nesta página` : (replace() ? 'nenhum aqui · remove os de lá' : 'nenhum aqui');
        g('#cdParts').innerHTML = `<div class="cdp"><label class="chk"><input type="checkbox" data-p="bg"${part.bg ? ' checked' : ''}> Fundo da página</label></div>
        <div class="cdp"><label class="chk"><input type="checkbox" id="cdEl"> Elementos</label><span class="hint">${on} de 4</span><button type="button" class="ib" id="cdOpen" aria-expanded="${det}" aria-label="Ver detalhes dos elementos">${det ? '⌃' : '⌄'}</button></div>
        ${det ? GK.map((k) => `<div class="cdp sub"><label class="chk"><input type="checkbox" data-p="${k}"${part[k] ? ' checked' : ''}> ${GNAME[k]}</label><span class="hint">${note(k)}</span></div>`).join('') : ''}`;
        const el = g('#cdEl'); el.checked = all; el.indeterminate = on > 0 && !all;
      };
      const drawList = () => {
        const f = +g('#cdFrom').value; picked.delete(f);
        const t = q.trim().toLowerCase(), vis = S.order.map((_, i) => i).filter((i) => !t || `${i + 1} ${title(i)}`.toLowerCase().includes(t));
        g('#cdList').innerHTML = vis.map((i) => `<label class="chk${i === f ? ' dis' : ''}"><input type="checkbox" data-i="${i}"${picked.has(i) ? ' checked' : ''}${i === f ? ' disabled' : ''}> ${esc(label(i))}</label>`).join('') || '<span class="hint">Nenhuma página encontrada.</span>';
        const cand = vis.filter((i) => i !== f), k = cand.filter((i) => picked.has(i)).length, all = g('#cdAll');
        all.checked = cand.length > 0 && k === cand.length; all.indeterminate = k > 0 && k < cand.length; all.disabled = !cand.length;
        g('#cdInfo').textContent = picked.size ? `${picked.size} página${picked.size > 1 ? 's' : ''} escolhida${picked.size > 1 ? 's' : ''}.` : 'Escolha para quais páginas copiar.';
        const any = part.bg || GK.some((k2) => part[k2]) || g('#cdSize').checked || g('#cdName').checked || g('#cdMg').checked;
        g('#cdGo').disabled = !picked.size || !any;
      };
      g('#cdFrom').onchange = () => { drawParts(); drawList(); };
      g('#cdList').onchange = (e) => { const i = +e.target.dataset.i; if (e.target.checked) picked.add(i); else picked.delete(i); drawList(); };
      g('#cdAll').onchange = (e) => {
        const f = +g('#cdFrom').value, t = q.trim().toLowerCase();
        S.order.forEach((_, i) => { if (i === f || (t && !`${i + 1} ${title(i)}`.toLowerCase().includes(t))) return; if (e.target.checked) picked.add(i); else picked.delete(i); });
        drawList();
      };
      const qi = g('#cdQ'); if (qi) qi.oninput = () => { q = qi.value; drawList(); };
      g('#cdDet').onclick = () => { det = !det; drawParts(); };
      g('#cdParts').onclick = (e) => { if (e.target.closest('#cdOpen')) { det = !det; drawParts(); } };
      g('#cdParts').onchange = (e) => {
        const t = e.target; if (t.id === 'cdEl') GK.forEach((k) => { part[k] = t.checked; }); else if (t.dataset.p) part[t.dataset.p] = t.checked;
        drawParts(); drawList();
      };
      b.querySelectorAll('input[name=cdMode]').forEach((r) => { r.onchange = drawParts; });
      g('#cdSize').onchange = g('#cdName').onchange = g('#cdMg').onchange = drawList;
      g('#cdGo').onclick = () => {
        const f = +g('#cdFrom').value;
        const k = copyDesign(S.order[f], [...picked].map((i) => S.order[i]), { replace: replace(), fit: g('#cdFit').checked, parts: Object.assign({}, part, { size: g('#cdSize').checked, name: g('#cdName').checked, mg: g('#cdMg').checked }) });
        close(); toast(`Design copiado para ${k} página${k > 1 ? 's' : ''}. Ctrl+Z desfaz.`);
      };
      drawParts(); drawList();
    });
  }

  /* ---------- inserir páginas ---------- */
  function insertModal(pre) {
    pre = pre && pre.at ? pre : null;
    const n = S.order.length, cur = S.cur, ref = curPage();
    modal(`<div class="insroot"><h2>Inserir páginas</h2><p class="hint">Agora na página <b>${cur + 1}</b> de ${n}</p>
      <h3>O QUE INSERIR</h3>
      <div class="segf" id="inMode"><button data-m="v" class="on">Página vazia</button><button data-m="e">Cópia de uma página</button></div>
      <label class="f" id="inSrcL" hidden>Qual página copiar<select id="inSrc">${opts(cur)}</select></label>
      <h3>INSERIR EM</h3>
      <label class="chk"><input type="radio" name="inAt" value="f"> Frente <span class="hint">(será a página 1)</span></label>
      <label class="chk"><input type="radio" name="inAt" value="t"> Trás <span class="hint">(será a página ${n + 1})</span></label>
      <label class="chk"><input type="radio" name="inAt" value="b"> Antes da página <select id="inBef">${opts(cur)}</select></label>
      <label class="chk"><input type="radio" name="inAt" value="a" checked> Depois da página <select id="inAft">${opts(cur)}</select></label>
      <details class="xadv" id="inMore"><summary>Mais opções</summary>
        <label class="f">Título da página<input type="text" id="inName" maxlength="60" placeholder="Ex.: Prioridades"></label>
        <label class="f">Quantas páginas<input type="number" id="inQty" min="1" max="50" value="1"></label>
        <label class="f" id="inSizeL">Tamanho<select id="inSize"><option value="cur" selected>Igual à atual (${esc(sizeName(ref.w, ref.h))})</option>${Object.keys(SIZES).map((k) => `<option>${k}</option>`).join('')}</select></label>
        <label class="f">Copiar o design de<select id="inDes"><option value="">Não copiar (página em branco)</option>${opts(-1)}</select></label>
      </details>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="inGo">Inserir</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q); let mode = 'v';
      if (pre) { b.querySelector(`input[name=inAt][value=${pre.at === 'b' ? 'b' : 'a'}]`).checked = true; (pre.at === 'b' ? g('#inBef') : g('#inAft')).value = String(pre.idx); }
      const paint = () => { $$('#inMode button', b).forEach((x) => x.classList.toggle('on', x.dataset.m === mode)); g('#inSrcL').hidden = mode !== 'e'; g('#inSizeL').hidden = mode === 'e'; g('#inDes').closest('label').hidden = mode === 'e'; };
      g('#inMode').onclick = (e) => { const x = e.target.closest('button'); if (x) { mode = x.dataset.m; paint(); } };
      g('#inBef').onfocus = () => { b.querySelector('input[name=inAt][value=b]').checked = true; }; g('#inAft').onfocus = () => { b.querySelector('input[name=inAt][value=a]').checked = true; };
      g('#inGo').onclick = () => {
        const at = b.querySelector('input[name=inAt]:checked').value, qty = cl(+g('#inQty').value || 1, 1, 50), nm = g('#inName').value.trim();
        const pos = at === 'f' ? 0 : at === 't' ? S.order.length : at === 'b' ? +g('#inBef').value : +g('#inAft').value + 1;
        const made = [];
        for (let k = 0; k < qty; k++) {
          let pg;
          if (mode === 'e') { const src = S.pages[S.order[+g('#inSrc').value]]; pg = clone(src); pg.id = uid('pg'); pg.els.forEach((e) => { e.id = uid('e'); }); if (nm) pg.name = qty > 1 ? `${nm} ${k + 1}` : nm; }
          else { const sv = g('#inSize').value, wh = sv === 'cur' ? [ref.w, ref.h] : (ref.w > ref.h ? [Math.max(...SIZES[sv]), Math.min(...SIZES[sv])] : SIZES[sv]); pg = blankPage(wh[0], wh[1]); if (nm) pg.name = qty > 1 ? `${nm} ${k + 1}` : nm; }
          made.push(pg);
        }
        change([], () => made.forEach((pg, k) => { S.pages[pg.id] = pg; S.order.splice(pos + k, 0, pg.id); }));
        const des = mode === 'v' ? g('#inDes').value : '';
        if (des !== '') copyDesign(S.order[+des < pos ? +des : +des + qty], made.map((p) => p.id), { replace: true, fit: true });
        S.cur = pos; S.sel = []; refreshAll(); close();
        toast(qty > 1 ? `${qty} páginas inseridas.` : 'Página inserida.');
      };
      paint();
    });
  }

  /* ---------- menu da página ---------- */
  const movePageTo = (i, j) => { if (i === j) return; change([], () => { const [x] = S.order.splice(i, 1); S.order.splice(j, 0, x); }); S.cur = j; refreshAll(); };
  function moveModal(i) {
    const n = S.order.length;
    modal(`<div class="insroot"><h2>Mover página</h2><p class="hint">${esc(label(i))}</p>
      <label class="f">Colocar na posição<select id="mvTo">${S.order.map((_, k) => `<option value="${k}"${k === i ? ' selected' : ''}>${k + 1}${k === i ? ' (atual)' : ''}${k === 0 ? ' · início' : k === n - 1 ? ' · final' : ''}</option>`).join('')}</select></label>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="mvGo">Mover</button></div></div>`, (b, close) => { b.querySelector('#mvGo').onclick = () => { movePageTo(i, +b.querySelector('#mvTo').value); close(); }; });
  }
  let menuEl = null;
  const closeMenu = () => { if (menuEl) { menuEl.remove(); menuEl = null; } document.removeEventListener('pointerdown', onDoc, true); document.removeEventListener('keydown', onKey, true); };
  const onDoc = (e) => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); } };
  function pageMenu(i, anchor, evt) {
    closeMenu(); const n = S.order.length;
    const items = [
      ['Adicionar página antes', () => insertModal({ at: 'b', idx: i })], ['Adicionar página depois', () => insertModal({ at: 'a', idx: i })], ['Duplicar esta página', () => dupPage(i)], '-',
      ['Renomear esta página', () => { setCur(i); if (S.tab !== 'paginas') { S.tab = 'paginas'; } renderPanel(); const b = document.querySelector(`#panel [data-ren="${i}"]`); if (b) b.click(); }], '-',
      ['Mover para cima', () => movePageTo(i, i - 1), i === 0], ['Mover para baixo', () => movePageTo(i, i + 1), i === n - 1], ['Mover página para…', () => moveModal(i)], ['Mover para a primeira', () => movePageTo(i, 0), i === 0], ['Mover para a última', () => movePageTo(i, n - 1), i === n - 1], '-',
      ['Copiar design desta página para…', () => copyModal(i, null), false], ['Usar o design de outra página aqui…', () => copyModal(i === 0 ? Math.min(1, n - 1) : 0, i), n < 2], '-',
      ['Excluir esta página', null, n < 2, true],
    ];
    const m = document.createElement('div'); m.className = 'pgmenu'; m.setAttribute('role', 'menu');
    items.forEach((it) => {
      if (it === '-') { const d = document.createElement('hr'); m.appendChild(d); return; }
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it[0]; b.disabled = !!it[2]; if (it[3]) b.classList.add('danger');
      b.onclick = () => {
        if (it[3]) { if (!b.dataset.cf) { b.dataset.cf = 1; b.textContent = 'Clique de novo para excluir'; return; } closeMenu(); delPage(i); return; }
        closeMenu(); it[1]();
      };
      m.appendChild(b);
    });
    document.body.appendChild(m); menuEl = m;
    const r = anchor ? anchor.getBoundingClientRect() : { left: evt.clientX, right: evt.clientX, top: evt.clientY, bottom: evt.clientY }, mw = m.offsetWidth, mh = m.offsetHeight;
    let x = Math.min(r.right - 8, innerWidth - mw - 8), y = r.bottom + 4; if (anchor) x = Math.min(Math.max(8, r.right - mw), innerWidth - mw - 8); if (y + mh > innerHeight - 8) y = Math.max(8, (anchor ? r.top : evt.clientY) - mh - 4);
    m.style.left = Math.max(8, x) + 'px'; m.style.top = y + 'px';
    setTimeout(() => { document.addEventListener('pointerdown', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
    const f = m.querySelector('button:not(:disabled)'); if (f) f.focus();
  }

  /* ---------- seleção, arrastar e ações em lote ---------- */
  const psel = new Set(); let anchorId = null;
  const prune = () => { [...psel].forEach((id) => { if (!S.pages[id]) psel.delete(id); }); if (anchorId && !S.pages[anchorId]) anchorId = null; };
  function reorder(ids, beforeId) {
    ids = S.order.filter((id) => ids.includes(id));
    const cur = S.order[S.cur], rest = S.order.filter((id) => !ids.includes(id)), at = beforeId == null ? rest.length : rest.indexOf(beforeId);
    if (at < 0) return;
    const next = rest.slice(); next.splice(at, 0, ...ids);
    if (next.every((id, i) => id === S.order[i])) return;
    change([], () => { S.order = next; });
    S.cur = Math.max(0, S.order.indexOf(cur)); refreshAll();
  }
  function delMany(ids) {
    let del = S.order.filter((id) => ids.includes(id)); const all = del.length >= S.order.length;
    if (all) del = del.slice(1);
    if (!del.length) return;
    const cur = S.order[S.cur], idx = S.cur;
    change([], () => { S.order = S.order.filter((id) => !del.includes(id)); });
    psel.clear(); anchorId = null; S.sel = [];
    const ni = S.order.indexOf(cur); S.cur = ni >= 0 ? ni : cl(idx, 0, S.order.length - 1);
    refreshAll();
    toast(`${del.length} página${del.length > 1 ? 's excluídas' : ' excluída'}${all ? ' (mantive a primeira, o projeto precisa de ao menos uma)' : ''}. Ctrl+Z desfaz.`);
  }
  function dupMany(ids) {
    const cur = S.order[S.cur];
    change([], () => { const out = []; S.order.forEach((id) => { out.push(id); if (ids.includes(id)) { const pg = clone(S.pages[id]); pg.id = uid('pg'); pg.els.forEach((e) => { e.id = uid('e'); }); S.pages[pg.id] = pg; out.push(pg.id); } }); S.order = out; });
    S.cur = Math.max(0, S.order.indexOf(cur)); refreshAll();
    toast(`${ids.length} página${ids.length > 1 ? 's duplicadas' : ' duplicada'}.`);
  }
  function delModal(ids) {
    const k = ids.length, all = k >= S.order.length;
    modal(`<div class="insroot"><h2>Excluir ${k} página${k > 1 ? 's' : ''}?</h2><p class="hint">${all ? 'Você escolheu todas as páginas. Vou manter a primeira, porque o projeto precisa de pelo menos uma. ' : ''}Dá para desfazer com Ctrl+Z.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="dmGo" style="background:var(--danger);border-color:var(--danger)">Excluir</button></div></div>`, (b, close) => { b.querySelector('#dmGo').onclick = () => { close(); delMany(ids); }; });
  }
  function moveManyModal(ids) {
    const rest = S.order.filter((id) => !ids.includes(id));
    modal(`<div class="insroot"><h2>Mover ${ids.length} página${ids.length > 1 ? 's' : ''}</h2><p class="hint">Elas ficam juntas, na ordem em que estão agora.</p>
      <label class="f">Colocar<select id="mmTo"><option value="">No início</option>${rest.map((id) => { const i = S.order.indexOf(id); return `<option value="${id}">Antes de ${esc(label(i))}</option>`; }).join('')}<option value="__end" ${rest.length ? '' : 'selected'}>No final</option></select></label>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="mmGo">Mover</button></div></div>`, (b, close) => {
      b.querySelector('#mmGo').onclick = () => { const v = b.querySelector('#mmTo').value; close(); reorder(ids, v === '__end' ? null : v === '' ? rest[0] : v); };
    });
  }

  /* ---------- o painel ---------- */
  const rename = (i, v) => { const id = S.order[i], pg = S.pages[id]; v = v.trim(); if ((pg.name || '') === v) return; change([id], () => { pg.name = v; }); renderStage(); renderStrip(); };
  const scroller = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p; } return document.scrollingElement || document.documentElement; };
  const getView = () => { try { return localStorage.getItem('cnu.estudio.pgview') === 'mini' ? 'mini' : 'lista'; } catch (_) { return 'lista'; } };
  const setView = (v) => { try { localStorage.setItem('cnu.estudio.pgview', v); } catch (_) { /* ok */ } };
  const drawMini = (cv) => { const p = S.pages[cv.dataset.id]; if (!p) return; const W = Math.min(cv.parentElement.clientWidth || 220, 260), k = Math.min(W / p.w, 150 / p.h), d = window.devicePixelRatio || 1; cv.width = Math.round(p.w * k * d); cv.height = Math.round(p.h * k * d); cv.style.width = p.w * k + 'px'; cv.style.height = p.h * k + 'px'; drawPage(cv.getContext('2d'), p, k * d); };
  PANELS.paginas = {
    html() {
      prune();
      const n = S.order.length, mini = getView() === 'mini';
      return `<h2>Páginas <span class="hint">${S.cur + 1} / ${n}</span><span class="pgview" role="group" aria-label="Modo de visualização"><button type="button" class="ib${mini ? '' : ' on'}" data-view="lista" title="Lista" aria-label="Lista" aria-pressed="${!mini}">☰</button><button type="button" class="ib${mini ? ' on' : ''}" data-view="mini" title="Miniaturas" aria-label="Miniaturas" aria-pressed="${mini}">▦</button></span></h2>
      <div class="row"><button class="btn sm pri" id="pgIns">+ Inserir página</button><button class="btn sm" id="pgCopy">Copiar design…</button></div>
      <details class="xadv"><summary>Visualização dupla</summary><label class="chk"><input type="checkbox" id="coverAlone"${S.meta.coverAlone !== false ? ' checked' : ''}> A primeira página fica sozinha (capa)</label></details>
      ${n > 10 ? '<input type="search" id="pgQ" placeholder="Procurar página…" aria-label="Procurar página">' : ''}
      <div class="pgtools"><label class="chk"><input type="checkbox" id="pgAll"> <span>Selecionar todas</span></label><span class="hint" id="pgCnt"></span></div>
      <div class="pgbar" id="pgBar" hidden><button class="btn sm" id="pgBCopy">Copiar design…</button><button class="btn sm" id="pgBDup">Duplicar</button><button class="btn sm" id="pgBMove">Mover…</button><button class="btn sm" id="pgBDel" style="color:var(--danger)">Excluir</button><button class="btn sm ghost" id="pgBClr">Limpar</button></div>
      <p class="hint" id="pgHelp">Marque as páginas para agir em várias de uma vez (Shift marca um intervalo). Arraste o ⠿ para reorganizar.</p>
      <div class="plist${mini ? ' mini' : ''}" id="pgList">${S.order.map((id, i) => { const pg = S.pages[id]; return `<div class="pwrap" data-i="${i}"><div class="prow${i === S.cur ? ' on' : ''}"><button type="button" class="pgrip" title="Arraste para reorganizar (ou use as setas ↑ ↓)" aria-label="Reorganizar página ${i + 1}">⠿</button><input type="checkbox" class="pck" aria-label="Selecionar página ${i + 1}"><span class="n" data-go="${i}">${i + 1}</span><span class="t" data-go="${i}" title="Duplo clique para renomear">${esc(pg.name && pg.name.trim() ? pg.name : 'Página')}</span><span class="z">${esc(sizeName(pg.w, pg.h).replace(' deitado', ' ↔'))}</span><button class="ib" data-ren="${i}" title="Dar um título" aria-label="Dar um título">✎</button><button class="ib" data-more="${i}" title="Mais opções" aria-label="Mais opções" aria-expanded="false">⋯</button>${mini ? `<div class="pthumb" data-go="${i}" title="Abrir esta página"><canvas data-id="${id}"></canvas></div>${i === S.cur ? `<button class="btn sm pgcd" data-cd="${i}">Copiar design…</button>` : ''}` : ''}</div></div>`; }).join('')}</div>`;
    },
    mount(P) {
      const idOf = (w) => S.order[+w.dataset.i], list = $('#pgList', P);
      const visible = () => $$('.pwrap', P).filter((w) => !w.hidden);
      const paint = () => {
        prune();
        $$('.pwrap', P).forEach((w) => { const on = psel.has(idOf(w)); w.classList.toggle('sel', on); w.querySelector('.pck').checked = on; });
        const vis = visible().map(idOf), k = vis.filter((id) => psel.has(id)).length, all = $('#pgAll', P);
        all.checked = vis.length > 0 && k === vis.length; all.indeterminate = k > 0 && k < vis.length;
        const t = psel.size; $('#pgCnt', P).textContent = t ? `${t} selecionada${t > 1 ? 's' : ''}` : ''; $('#pgBar', P).hidden = !t; $('#pgHelp', P).hidden = !!t;
      };
      const range = (id) => { const a = S.order.indexOf(anchorId), b = S.order.indexOf(id), vis = new Set(visible().map(idOf)); for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (vis.has(S.order[i])) psel.add(S.order[i]); };
      const toggle = (id, e, force) => {
        if (e && e.shiftKey && anchorId && S.pages[anchorId]) range(id);
        else { const on = force == null ? !psel.has(id) : force; if (on) psel.add(id); else psel.delete(id); anchorId = id; }
        paint();
      };
      const ids = () => S.order.filter((id) => psel.has(id));
      $$('[data-view]', P).forEach((b) => { b.onclick = () => { if (getView() === b.dataset.view) return; setView(b.dataset.view); renderPanel(); }; });
      $$('[data-cd]', P).forEach((b) => { b.onclick = () => copyModal(+b.dataset.cd, null); });
      const cvs = $$('canvas[data-id]', P);
      if (cvs.length) { const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { io.unobserve(x.target); drawMini(x.target); } }), { root: null, rootMargin: '200px' }) : null; cvs.forEach((c) => { if (io) io.observe(c); else drawMini(c); }); }
      $('#coverAlone', P).onchange = (e) => { S.meta.coverAlone = e.target.checked; Saver.m(); renderStage(); updNav(); markStrip(); };
      $('#pgIns', P).onclick = insertModal; $('#pgCopy', P).onclick = () => copyModal(S.cur, null);
      const q = $('#pgQ', P); if (q) q.oninput = () => { const t = q.value.trim().toLowerCase(); $$('.pwrap', P).forEach((w) => { const i = +w.dataset.i; w.hidden = !!t && !(`${i + 1} ${title(i)}`.toLowerCase().includes(t)); }); paint(); };
      $('#pgAll', P).onchange = (e) => { visible().forEach((w) => { if (e.target.checked) psel.add(idOf(w)); else psel.delete(idOf(w)); }); paint(); };
      $$('.pck', P).forEach((c) => { c.onclick = (e) => { e.stopPropagation(); toggle(idOf(c.closest('.pwrap')), e, c.checked); }; });
      $('#pgBClr', P).onclick = () => { psel.clear(); paint(); };
      $('#pgBDel', P).onclick = () => delModal(ids());
      $('#pgBDup', P).onclick = () => dupMany(ids());
      $('#pgBMove', P).onclick = () => moveManyModal(ids());
      $('#pgBCopy', P).onclick = () => { const sel = ids(), from = psel.has(S.order[S.cur]) ? S.order.findIndex((id) => !psel.has(id)) : S.cur; copyModal(from < 0 ? S.cur : from, sel.map((id) => S.order.indexOf(id))); };
      $$('[data-go]', P).forEach((b) => {
        b.onclick = (e) => { const id = idOf(b.closest('.pwrap')); if (e.ctrlKey || e.metaKey || e.shiftKey) { toggle(id, e); return; } setCur(+b.dataset.go); };
        if (b.classList.contains('t')) b.ondblclick = () => startRename(+b.dataset.go);
      });
      const startRename = (i) => {
        const row = $(`.pwrap[data-i="${i}"] .t`, P); if (!row || row.querySelector('input')) return;
        const pg = S.pages[S.order[i]], inp = document.createElement('input'); inp.type = 'text'; inp.value = pg.name || ''; inp.maxLength = 60; inp.placeholder = 'Título da página'; inp.className = 'pren';
        row.textContent = ''; row.appendChild(inp); inp.focus(); inp.select();
        let done = false; const end = (save) => { if (done) return; done = true; if (save) rename(i, inp.value); else renderPanel(); };
        inp.onkeydown = (e) => { if (e.key === 'Enter') end(true); else if (e.key === 'Escape') end(false); e.stopPropagation(); }; inp.onblur = () => end(true); inp.onclick = (e) => e.stopPropagation();
      };
      $$('[data-ren]', P).forEach((b) => { b.onclick = () => startRename(+b.dataset.ren); });
      $$('[data-more]', P).forEach((b) => { b.onclick = (e) => { e.stopPropagation(); pageMenu(+b.dataset.more, b); }; });
      $$('.prow', P).forEach((r) => { r.oncontextmenu = (e) => { e.preventDefault(); pageMenu(+r.closest('.pwrap').dataset.i, null, e); }; });

      /* arrastar para reorganizar (mouse, caneta e toque); move o grupo todo se a página estiver marcada */
      list.addEventListener('pointerdown', (e) => {
        const h = e.target.closest('.pgrip'); if (!h || (e.button != null && e.button > 0)) return;
        e.preventDefault();
        const wrap = h.closest('.pwrap'), id0 = idOf(wrap), mv = psel.has(id0) && psel.size > 1 ? S.order.filter((id) => psel.has(id)) : [id0];
        const sc = scroller(list); let started = false, y = e.clientY, y0 = e.clientY, tgt = undefined, timer = null;
        try { h.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
        const clear = () => $$('.pwrap', list).forEach((w) => w.classList.remove('drop-b', 'drop-a'));
        const upd = () => {
          const cand = visible().filter((w) => !mv.includes(idOf(w))); clear(); tgt = undefined; if (!cand.length) return;
          const nxt = cand.find((w) => { const r = w.getBoundingClientRect(); return y < r.top + r.height / 2; });
          if (nxt) { nxt.classList.add('drop-b'); tgt = idOf(nxt); } else { cand[cand.length - 1].classList.add('drop-a'); tgt = null; }
        };
        const tick = () => { const r = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0, bottom: innerHeight }, top = sc === document.scrollingElement ? 0 : r.top, bot = sc === document.scrollingElement ? innerHeight : r.bottom; let d = 0; if (y < top + 36) d = -Math.ceil((top + 36 - y) / 4); else if (y > bot - 36) d = Math.ceil((y - (bot - 36)) / 4); if (d) { sc.scrollTop += cl(d, -18, 18); upd(); } };
        const move = (ev) => {
          y = ev.clientY;
          if (!started) { if (Math.abs(y - y0) < 5) return; started = true; list.classList.add('dragging'); mv.forEach((id) => { const w = $$('.pwrap', list).find((x) => idOf(x) === id); if (w) w.classList.add('drag'); }); timer = setInterval(tick, 30); }
          upd();
        };
        const end = (ev) => {
          h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', end); h.removeEventListener('pointercancel', end);
          clearInterval(timer); list.classList.remove('dragging'); $$('.pwrap', list).forEach((w) => w.classList.remove('drag')); clear();
          if (started && ev.type === 'pointerup' && tgt !== undefined) reorder(mv, tgt);
        };
        h.addEventListener('pointermove', move); h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
      });
      list.addEventListener('keydown', (e) => {
        const h = e.target.closest && e.target.closest('.pgrip'); if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
        e.preventDefault(); const w = h.closest('.pwrap'), i = +w.dataset.i, j = i + (e.key === 'ArrowUp' ? -1 : 1); if (j < 0 || j >= S.order.length) return;
        movePageTo(i, j); const nh = document.querySelector(`#panel .pwrap[data-i="${j}"] .pgrip`); if (nh) nh.focus();
      });
      paint();
      const on = $('.prow.on', P); if (on) on.scrollIntoView({ block: 'nearest' });
    },
  };
  // o "+" da tira de páginas também abre a janela de inserção
  const rs = window.renderStrip;
  window.renderStrip = function () { const r = rs.apply(this, arguments); const a = document.getElementById('stripAdd'); if (a) a.onclick = insertModal; return r; };
  document.addEventListener('contextmenu', (e) => { const t = e.target.closest && e.target.closest('#strip .tb'); if (t && S.view === 'editor') { e.preventDefault(); pageMenu(+t.dataset.i, null, e); } });
  window.Paginas = { insertModal, copyModal, copyDesign, pageMenu, selected: () => S.order.filter((id) => psel.has(id)) };
})();
