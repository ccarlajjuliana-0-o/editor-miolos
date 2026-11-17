/* Páginas — títulos, copiar design entre páginas e a janela "Inserir páginas".
   Substitui o painel "Páginas" do editor; as opções extras ficam recolhidas em menus. */
(function () {
  'use strict';
  const title = (i) => { const p = S.pages[S.order[i]]; return (p && p.name && p.name.trim()) || 'Página'; };
  const label = (i) => `${i + 1}: ${title(i)}`;
  const opts = (sel, skip) => S.order.map((id, i) => `<option value="${i}"${i === sel ? ' selected' : ''}${i === skip ? ' disabled' : ''}>${esc(label(i))}</option>`).join('');

  /* ---------- copiar design ---------- */
  function copyDesign(fromId, toIds, o) {
    const s = S.pages[fromId], ids = toIds.filter((id) => id !== fromId && S.pages[id]); if (!s || !ids.length) return 0;
    change(ids, () => ids.forEach((tid) => {
      const d = S.pages[tid], fx = o.fit ? d.w / s.w : 1, fy = o.fit ? d.h / s.h : 1, fm = Math.min(fx, fy);
      const els = clone(s.els).map((e) => {
        e.id = uid('e');
        if (o.fit && (Math.abs(fx - 1) > 0.001 || Math.abs(fy - 1) > 0.001)) { e.x = r1(e.x * fx); e.y = r1(e.y * fy); e.w = r1(e.w * fx); e.h = r1(e.h * fy); if (e.type === 'text' || e.type === 'table' || e.type === 'divider') e.size = r1((e.size || 9) * fm); if (e.sp) e.sp = r1(e.sp * fm); }
        return e;
      });
      if (o.replace) {
        const keep = new Set(['id', 'w', 'h', 'name', 'els']);
        Object.keys(d).forEach((k) => { if (!keep.has(k)) delete d[k]; });
        Object.keys(s).forEach((k) => { if (!keep.has(k)) d[k] = clone(s[k]); });
        d.els = els;
      } else d.els.push(...els);
    }));
    ids.forEach((id) => thumbRefresh(id));
    refreshAll();
    return ids.length;
  }
  function copyModal(from, to) {
    const n = S.order.length;
    modal(`<div class="insroot"><h2>Copiar design</h2><p class="hint">Leva o fundo e os elementos de uma página para outras.</p>
      <label class="f">Copiar de<select id="cdFrom">${opts(from)}</select></label>
      <div class="xrow"><h3 style="margin:0">PARA</h3><button class="btn sm ghost" id="cdAll">Todas as outras</button><button class="btn sm ghost" id="cdNone">Nenhuma</button></div>
      <div class="cdlist" id="cdList"></div>
      <h3>COMO</h3>
      <label class="chk"><input type="radio" name="cdMode" value="r" checked> Substituir o design da página (fundo e elementos)</label>
      <label class="chk"><input type="radio" name="cdMode" value="a"> Acrescentar sobre o que já existe</label>
      <label class="chk"><input type="checkbox" id="cdFit" checked> Ajustar ao tamanho de cada página</label>
      <p class="hint" id="cdInfo"></p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="cdGo">Copiar design</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q), picked = new Set(to == null ? [] : [to]);
      const draw = () => {
        const f = +g('#cdFrom').value; picked.delete(f);
        g('#cdList').innerHTML = S.order.map((id, i) => `<label class="chk${i === f ? ' dis' : ''}"><input type="checkbox" data-i="${i}"${picked.has(i) ? ' checked' : ''}${i === f ? ' disabled' : ''}> ${esc(label(i))}</label>`).join('');
        g('#cdInfo').textContent = picked.size ? `${picked.size} página${picked.size > 1 ? 's' : ''} escolhida${picked.size > 1 ? 's' : ''}.` : 'Escolha para quais páginas copiar.';
        g('#cdGo').disabled = !picked.size;
      };
      g('#cdFrom').onchange = draw;
      g('#cdList').onchange = (e) => { const i = +e.target.dataset.i; if (e.target.checked) picked.add(i); else picked.delete(i); draw(); };
      g('#cdAll').onclick = () => { const f = +g('#cdFrom').value; picked.clear(); S.order.forEach((_, i) => { if (i !== f) picked.add(i); }); draw(); };
      g('#cdNone').onclick = () => { picked.clear(); draw(); };
      g('#cdGo').onclick = () => {
        const f = +g('#cdFrom').value, r = b.querySelector('input[name=cdMode]:checked').value === 'r';
        const k = copyDesign(S.order[f], [...picked].map((i) => S.order[i]), { replace: r, fit: g('#cdFit').checked });
        close(); toast(`Design copiado para ${k} página${k > 1 ? 's' : ''}. Ctrl+Z desfaz.`);
      };
      draw();
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

  /* ---------- o painel ---------- */
  const rename = (i, v) => { const id = S.order[i], pg = S.pages[id]; v = v.trim(); if ((pg.name || '') === v) return; change([id], () => { pg.name = v; }); renderStage(); renderStrip(); };
  PANELS.paginas = {
    html() {
      const n = S.order.length;
      return `<h2>Páginas <span class="hint">${S.cur + 1} / ${n}</span></h2>
      <div class="row"><button class="btn sm pri" id="pgIns">+ Inserir página</button><button class="btn sm" id="pgCopy">Copiar design…</button></div>
      <details class="xadv"><summary>Visualização dupla</summary><label class="chk"><input type="checkbox" id="coverAlone"${S.meta.coverAlone !== false ? ' checked' : ''}> A primeira página fica sozinha (capa)</label></details>
      ${n > 10 ? '<input type="search" id="pgQ" placeholder="Procurar página…" aria-label="Procurar página">' : ''}
      <div class="plist" id="pgList">${S.order.map((id, i) => { const pg = S.pages[id]; return `<div class="pwrap" data-i="${i}"><div class="prow${i === S.cur ? ' on' : ''}"><span class="n">${i + 1}</span><span class="t" data-go="${i}" title="Duplo clique para renomear">${esc(pg.name && pg.name.trim() ? pg.name : 'Página')}</span><span class="z">${esc(sizeName(pg.w, pg.h).replace(' deitado', ' ↔'))}</span><button class="ib" data-ren="${i}" title="Dar um título" aria-label="Dar um título">✎</button><button class="ib" data-more="${i}" title="Mais opções" aria-label="Mais opções" aria-expanded="false">⋯</button></div>
</div></div>`; }).join('')}</div>`;
    },
    mount(P) {
      $('#coverAlone', P).onchange = (e) => { S.meta.coverAlone = e.target.checked; Saver.m(); renderStage(); updNav(); markStrip(); };
      $('#pgIns', P).onclick = insertModal; $('#pgCopy', P).onclick = () => copyModal(S.cur, null);
      const q = $('#pgQ', P); if (q) q.oninput = () => { const t = q.value.trim().toLowerCase(); $$('.pwrap', P).forEach((w) => { const i = +w.dataset.i; w.hidden = !!t && !(`${i + 1} ${title(i)}`.toLowerCase().includes(t)); }); };
      $$('[data-go]', P).forEach((b) => { b.onclick = () => setCur(+b.dataset.go); b.ondblclick = () => startRename(+b.dataset.go); });
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
      const on = $('.prow.on', P); if (on) on.scrollIntoView({ block: 'nearest' });
    },
  };
  // o "+" da tira de páginas também abre a janela de inserção
  const rs = window.renderStrip;
  window.renderStrip = function () { const r = rs.apply(this, arguments); const a = document.getElementById('stripAdd'); if (a) a.onclick = insertModal; return r; };
  document.addEventListener('contextmenu', (e) => { const t = e.target.closest && e.target.closest('#strip .tb'); if (t && S.view === 'editor') { e.preventDefault(); pageMenu(+t.dataset.i, null, e); } });
  window.Paginas = { insertModal, copyModal, copyDesign, pageMenu };
})();
