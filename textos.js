/* Textos por nível (H1–H6), Fontes e edição em conjunto.
   Cada texto pode ter um nível (e.role): h1 título do widget, h2 cabeçalho do widget, h3 corpo, h4 textos de apoio,
   h5 cabeçalho da página, h6 rodapé da página. Mudar um texto muda todos do mesmo nível no mesmo grupo/página/projeto.
   Vale para qualquer coisa do editor (widgets soltos, adesivos, textos soltos…). */
(function () {
  'use strict';
  const LV = { h1: ['H1', 'Título do widget', 'o que vai por cima do widget (ex.: Calendário mensal)'], h2: ['H2', 'Cabeçalho do widget', 'a primeira linha (ex.: nome do mês, dias da semana)'], h3: ['H3', 'Corpo', 'componentes dentro do widget (ex.: números do calendário)'], h4: ['H4', 'Textos de apoio', 'o que não é componente (ex.: nomes de feriados, textos extras)'], h5: ['H5', 'Cabeçalho da página', 'texto do alto de cada página'], h6: ['H6', 'Rodapé da página', 'texto do pé de cada página'] };
  const KEYS = Object.keys(LV);
  const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
  const num = (v, a, b, d) => { v = +v; return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const DEFHS = { h1: { size: 12, weight: 700 }, h2: { size: 8, weight: 600 }, h3: { size: 8, weight: 400 }, h4: { size: 6, weight: 400 }, h5: { size: 7, weight: 400, align: 'center' }, h6: { size: 6.5, weight: 400, align: 'center' } };
  const hs = (k) => Object.assign({}, DEFHS[k], (S.meta && S.meta.hs && S.meta.hs[k]) || {});

  /* ---------- sublinhado e tachado no texto ---------- */
  (function patchText() {
    if (typeof R === 'undefined' || !R.text || R.text._ul) return; const orig = R.text;
    R.text = function (c, e) {
      orig(c, e); if (!e.ul && !e.st) return;
      try {
        const fs = e.size * PT, lines = wrap(c, e.text ?? '', e.w + .01), lh = fs * (e.lh || 1.2), tot = lines.length * lh, y0 = e.valign === 'middle' ? (e.h - tot) / 2 : e.valign === 'bottom' ? e.h - tot : 0;
        c.save(); c.strokeStyle = e.color; c.lineWidth = Math.max(0.12, fs * 0.055); c.lineCap = 'butt';
        lines.forEach((ln, i) => { const w = c.measureText(ln).width / F, ax = e.align === 'center' ? e.w / 2 - w / 2 : e.align === 'right' ? e.w - w : 0, cy = y0 + i * lh + lh / 2;
          if (e.ul) { c.beginPath(); c.moveTo(ax, cy + fs * 0.42); c.lineTo(ax + w, cy + fs * 0.42); c.stroke(); }
          if (e.st) { c.beginPath(); c.moveTo(ax, cy - fs * 0.04); c.lineTo(ax + w, cy - fs * 0.04); c.stroke(); } });
        c.restore();
      } catch (err) { /* sem linha */ }
    };
    R.text._ul = 1;
  })();

  /* ---------- alvos de uma edição ---------- */
  const SC = () => (S._lvScope || 'auto');
  function targets(role, sel, scope) {
    const p = curPage(), isT = (e) => e.type === 'text', same = (e) => (e.role || '') === role;
    const base = sel.filter((e) => isT(e) && same(e));
    if (scope === 'sel') return { ids: [p.id], els: base };
    if (scope === 'auto') scope = base.some((e) => e.g) ? 'group' : 'sel';
    if (scope === 'sel') return { ids: [p.id], els: base };
    if (scope === 'group') { const gs = new Set(sel.filter((e) => e.g).map((e) => e.g)); return { ids: [p.id], els: p.els.filter((e) => isT(e) && same(e) && (gs.has(e.g) || base.includes(e))) }; }
    if (scope === 'page') return { ids: [p.id], els: p.els.filter((e) => isT(e) && same(e)) };
    const ids = S.order.filter((id) => S.pages[id]); return { ids, els: ids.flatMap((id) => S.pages[id].els.filter((e) => isT(e) && same(e))) };
  }
  function setKey(e, k, v) {
    if (k === 'bold') e.weight = v ? 700 : 400; else if (k === 'ul' || k === 'st' || k === 'italic') { if (v) e[k] = true; else delete e[k]; } else if (k === 'role') { if (v) e.role = v; else delete e.role; } else e[k] = v;
  }
  let snap = null;
  function apply(role, k, v, live) {
    const sel = selEls(), t = targets(role, sel, SC()); if (!t.els.length) return;
    if (live) { snap = snap || snapOf(t.ids); t.els.forEach((e) => setKey(e, k, v)); redraw(); return; }
    if (snap) { t.els.forEach((e) => setKey(e, k, v)); pushHist(snap, snapOf(t.ids)); snap = null; } else change(t.ids, () => t.els.forEach((e) => setKey(e, k, v)));
    redraw(); t.ids.forEach((id) => thumbRefresh(id)); if (k === 'role') renderProps();
  }

  /* ---------- controles de um nível ---------- */
  const optF = (cur) => { const L = fontList(); if (cur && !L.includes(cur)) L.unshift(cur); return L.map((f) => `<option value="${esc(f)}"${f === cur ? ' selected' : ''} style="font-family:'${esc(f)}'">${esc(f)}</option>`).join(''); };
  const seg = (r, k, v, opts) => `<div class="segf lvseg">${opts.map(([a, n, t]) => `<button type="button" data-lvr="${r}" data-lvk="${k}" data-v="${a}" class="${String(v) === String(a) ? 'on' : ''}" title="${t || n}" aria-label="${t || n}">${n}</button>`).join('')}</div>`;
  const tog = (r, k, on, l, t, st) => `<button type="button" data-lvr="${r}" data-lvk="${k}" data-tg="1" class="lvtg${on ? ' on' : ''}" title="${t}" aria-label="${t}" style="${st || ''}">${l}</button>`;
  function controls(r, o, opt) {
    opt = opt || {};
    const hex = /^#[0-9a-f]{6}$/i.test(o.color || '') ? o.color : '#3E3550';
    return `<div class="lvc"><label class="pfield"><span>Fonte</span><select data-lvr="${r}" data-lvk="font">${optF(o.font)}</select></label>
      <div class="lvrow"><label class="pfield"><span>Tamanho (pt)</span><input type="number" data-lvr="${r}" data-lvk="size" data-n="1" value="${o.size ?? ''}" min="2" max="200" step="0.5"></label>
      <label class="pfield"><span>Cor</span><input type="color" data-lvr="${r}" data-lvk="color" value="${hex}" aria-label="Cor do texto"></label>
      <label class="pfield"><span>Espaço entre letras</span><input type="number" data-lvr="${r}" data-lvk="ls" data-n="1" value="${o.ls ?? 0}" min="-0.2" max="1" step="0.01"></label></div>
      <div class="lvrow">${tog(r, 'bold', (o.weight || 400) >= 600, '<b>N</b>', 'Negrito')}${tog(r, 'italic', !!o.italic, '<i>I</i>', 'Itálico')}${tog(r, 'ul', !!o.ul, '<u>S</u>', 'Sublinhado')}${tog(r, 'st', !!o.st, '<s>T</s>', 'Tachado')}</div>
      <div class="pfield"><span>Alinhar na caixa</span>${seg(r, 'align', o.align || 'left', [['left', '⇤', 'Esquerda'], ['center', '↔', 'Centro'], ['right', '⇥', 'Direita']])}</div>
      <div class="pfield"><span>Posição vertical na caixa</span>${seg(r, 'valign', o.valign || 'top', [['top', '⤒', 'Em cima'], ['middle', '↕', 'Ao centro'], ['bottom', '⤓', 'Embaixo']])}</div>
      ${opt.noOpacity ? '' : `<label class="pfield"><span>Opacidade</span><input type="range" data-lvr="${r}" data-lvk="opacity" data-n="1" min="0.05" max="1" step="0.05" value="${o.opacity ?? 1}"></label>`}</div>`;
  }

  /* ---------- seção no painel direito ---------- */
  function section(P) {
    const els = selEls(), texts = els.filter((e) => e.type === 'text'), shapes = els.filter((e) => ['line', 'rect', 'ellipse', 'path'].includes(e.type));
    if (!texts.length && !(shapes.length && els.length > 1)) return;
    let h = '';
    if (texts.length) {
      const roles = [...new Set(texts.map((e) => e.role || ''))].sort();
      if (texts.length === 1) h += `<div class="row"><button type="button" class="btn sm pri" data-lvrich>Texto com várias cores e fontes…</button></div>`;
      h += `<label class="pfield"><span>Mudar vale para</span><select data-lvscope><option value="auto"${SC() === 'auto' ? ' selected' : ''}>Todos do mesmo nível no grupo</option><option value="sel"${SC() === 'sel' ? ' selected' : ''}>Só os selecionados</option><option value="page"${SC() === 'page' ? ' selected' : ''}>Todos do nível nesta página</option><option value="proj"${SC() === 'proj' ? ' selected' : ''}>Todos do nível no projeto</option></select></label>`;
      h += roles.map((r) => { const grp = texts.filter((e) => (e.role || '') === r), o = grp[0], nm = r ? `${LV[r][0]} · ${LV[r][1]}` : 'Sem nível';
        return `<div class="lvg"><div class="lvh"><b>${nm}</b><small>${grp.length} texto${grp.length > 1 ? 's' : ''}${r ? '' : ''}</small></div>
          <label class="pfield"><span>Nível</span><select data-lvr="${r}" data-lvk="role"><option value=""${r ? '' : ' selected'}>Sem nível</option>${KEYS.map((k) => `<option value="${k}"${k === r ? ' selected' : ''}>${LV[k][0]} · ${LV[k][1]}</option>`).join('')}</select></label>
          ${controls(r, o)}</div>`; }).join('');
    }
    if (shapes.length && els.length > 1) {
      const ln = shapes.filter((e) => e.type === 'line'), bx = shapes.filter((e) => e.type === 'rect');
      if (ln.length) h += `<div class="lvg"><div class="lvh"><b>Linhas</b><small>${ln.length}</small></div><div class="lvrow"><label class="pfield"><span>Cor</span><input type="color" data-lvs="line" data-lvk="stroke" value="${/^#[0-9a-f]{6}$/i.test(ln[0].stroke) ? ln[0].stroke : '#C398C8'}"></label><label class="pfield"><span>Espessura (mm)</span><input type="number" data-lvs="line" data-lvk="sw" data-n="1" value="${ln[0].sw ?? 0.3}" min="0" max="5" step="0.05"></label><label class="pfield"><span>Estilo</span><select data-lvs="line" data-lvk="dash"><option value="solid"${(ln[0].dash || 'solid') === 'solid' ? ' selected' : ''}>Contínua</option><option value="dash"${ln[0].dash === 'dash' ? ' selected' : ''}>Tracejada</option><option value="dot"${ln[0].dash === 'dot' ? ' selected' : ''}>Pontilhada</option></select></label></div></div>`;
      if (bx.length) h += `<div class="lvg"><div class="lvh"><b>Caixas</b><small>${bx.length}</small></div><div class="lvrow"><label class="pfield"><span>Preenchimento</span><input type="color" data-lvs="rect" data-lvk="fill" value="${/^#[0-9a-f]{6}$/i.test(bx[0].fill) ? bx[0].fill : '#F7E5E7'}"></label><label class="pfield"><span>Contorno</span><input type="color" data-lvs="rect" data-lvk="stroke" value="${/^#[0-9a-f]{6}$/i.test(bx[0].stroke) ? bx[0].stroke : '#C398C8'}"></label><label class="pfield"><span>Espessura</span><input type="number" data-lvs="rect" data-lvk="sw" data-n="1" value="${bx[0].sw ?? 0.3}" min="0" max="5" step="0.05"></label><label class="pfield"><span>Cantos (mm)</span><input type="number" data-lvs="rect" data-lvk="radius" data-n="1" value="${bx[0].radius ?? 0}" min="0" max="40" step="0.5"></label></div><div class="row"><button type="button" class="btn sm ghost" data-lvs="rect" data-lvk="fill" data-v="none">Sem preenchimento</button><button type="button" class="btn sm ghost" data-lvs="rect" data-lvk="stroke" data-v="none">Sem contorno</button></div></div>`;
    }
    const open = !(Pref.acc && Pref.acc.lvl === false);
    const w = document.createElement('div'); w.className = 'wacc' + (open ? ' open' : ''); w.dataset.acc = 'lvl';
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${open}"><i class="wtri"></i><b>Textos por nível${texts.length ? '' : ' e formas'}</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab">${h}</div>`;
    const first = P.querySelector('.pact') || P.querySelector('h2'); if (first && first.nextSibling) P.insertBefore(w, first.nextSibling); else P.appendChild(w);
  }
  function hfSection(P) {
    const open = !(Pref.acc && Pref.acc.hfx === false); const w = document.createElement('div'); w.className = 'wacc' + (open ? ' open' : ''); w.dataset.acc = 'hfx';
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${open}"><i class="wtri"></i><b>Cabeçalho, rodapé e numeração</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab">${hfHTML()}</div>`; P.appendChild(w);
  }
  function applyShapes(kind, k, v, live) {
    const p = curPage(), sel = selEls(); const gs = new Set(sel.filter((e) => e.g).map((e) => e.g));
    const els = p.els.filter((e) => e.type === kind && (sel.includes(e) || (e.g && gs.has(e.g) && SC() !== 'sel')));
    if (!els.length) return; if (live) { snap = snap || snapOf([p.id]); els.forEach((e) => { e[k] = v; }); redraw(); return; }
    if (snap) { els.forEach((e) => { e[k] = v; }); pushHist(snap, snapOf([p.id])); snap = null; } else change([p.id], () => els.forEach((e) => { e[k] = v; }));
    redraw(); thumbRefresh(p.id); renderProps();
  }
  function readVal(i) { return i.type === 'number' || i.type === 'range' ? num(i.value, -9999, 9999, 0) : i.value; }
  function wireProps() {
    const P0 = document.getElementById('props'); if (!P0 || P0._lv) return; P0._lv = 1;
    P0.addEventListener('input', (ev) => { const i = ev.target; if (!i.dataset) return; if (i.dataset.lvr !== undefined && ['number', 'range', 'color'].includes(i.type)) apply(i.dataset.lvr, i.dataset.lvk, readVal(i), true); else if (i.dataset.lvs && ['number', 'color'].includes(i.type)) applyShapes(i.dataset.lvs, i.dataset.lvk, readVal(i), true); });
    P0.addEventListener('change', (ev) => {
      const i = ev.target; if (!i.dataset) return;
      if (i.dataset.lvscope !== undefined) { S._lvScope = i.value; return; }
      if (i.dataset.lvr !== undefined && !i.dataset.tg) { let v = readVal(i); apply(i.dataset.lvr, i.dataset.lvk, v, false); if (i.dataset.lvk === 'role') return; }
      else if (i.dataset.lvs) applyShapes(i.dataset.lvs, i.dataset.lvk, readVal(i), false);
    });
    P0.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b || !b.dataset) return;
      if (b.dataset.lvrich !== undefined) { const e = selEls()[0]; if (e && e.type === 'text') richModal(e); return; }
      if (b.dataset.lvr !== undefined && b.dataset.lvk) { const r = b.dataset.lvr, k = b.dataset.lvk, v = b.dataset.tg ? !b.classList.contains('on') : b.dataset.v; apply(r, k, v, false); renderProps(); }
      else if (b.dataset.lvs && b.dataset.lvk) { applyShapes(b.dataset.lvs, b.dataset.lvk, b.dataset.v, false); }
    });
  }

  /* ---------- editor de nível (Texto → Fontes) ---------- */
  function levelEditor(P) {
    const k = S.lvEdit; if (!k) return false; const o = hs(k), L = LV[k];
    P.innerHTML = `<h2>${L[0]} · ${L[1]}</h2><p class="hint">${L[2]}. O que você mudar aqui vale para todos os textos deste nível no projeto e para os próximos que você criar.</p>
      <div class="lvg" data-lvlev="${k}">${controls('@' + k, o)}</div>
      ${k === 'h5' || k === 'h6' ? `<div class="row"><button type="button" class="btn sm pri" data-lvins="${k}">Inserir ${k === 'h5' ? 'cabeçalho' : 'rodapé'} nesta página</button><button type="button" class="btn sm" data-lvins="${k}all">Em todas as páginas</button></div><p class="hint">Cria uma caixa de texto de ${k === 'h5' ? 'cabeçalho no alto' : 'rodapé no pé'} da página (use a numeração como {pagina} se quiser).</p>` : ''}
      <div class="row"><button type="button" class="btn sm" data-lvsave>Guardar esta configuração como padrão…</button><button type="button" class="btn sm ghost" data-lvback>Voltar</button></div>`;
    return true;
  }
  function setLevel(k, key, v, live) {
    S.meta.hs = S.meta.hs || {}; S.meta.hs[k] = Object.assign({}, hs(k)); if (key === 'bold') S.meta.hs[k].weight = v ? 700 : 400; else if (['ul', 'st', 'italic'].includes(key)) { if (v) S.meta.hs[k][key] = true; else delete S.meta.hs[k][key]; } else S.meta.hs[k][key] = v;
    const ids = S.order.filter((id) => S.pages[id]), els = ids.flatMap((id) => S.pages[id].els.filter((e) => e.type === 'text' && e.role === k));
    if (live) { snap = snap || snapOf(ids); els.forEach((e) => setKey(e, key, v)); redraw(); return; }
    if (snap) { els.forEach((e) => setKey(e, key, v)); pushHist(snap, snapOf(ids)); snap = null; } else change(ids, () => els.forEach((e) => setKey(e, key, v)));
    Saver.m(); redraw(); ids.forEach((id) => thumbRefresh(id));
  }
  function wireLevel() {
    const P0 = document.getElementById('props'); if (!P0 || P0._lv2) return; P0._lv2 = 1;
    const rk = (i) => String(i.dataset.lvr || '').replace('@', '');
    P0.addEventListener('input', (ev) => { const i = ev.target; if (S.lvEdit && i.dataset && i.dataset.lvr && i.dataset.lvr[0] === '@' && ['number', 'range', 'color'].includes(i.type)) { ev.stopImmediatePropagation(); setLevel(rk(i), i.dataset.lvk, readVal(i), true); } }, true);
    P0.addEventListener('change', (ev) => { const i = ev.target; if (S.lvEdit && i.dataset && i.dataset.lvr && i.dataset.lvr[0] === '@' && !i.dataset.tg) { ev.stopImmediatePropagation(); setLevel(rk(i), i.dataset.lvk, readVal(i), false); } }, true);
    P0.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b || !b.dataset || !S.lvEdit) return;
      if (b.dataset.lvr && b.dataset.lvr[0] === '@' && b.dataset.lvk) { ev.stopImmediatePropagation(); const v = b.dataset.tg ? !b.classList.contains('on') : b.dataset.v; setLevel(rk(b), b.dataset.lvk, v, false); renderProps(); return; }
      if (b.dataset.lvback !== undefined) { S.lvEdit = null; renderProps(); return; }
      if (b.dataset.lvsave !== undefined) { presetSave(); return; }
      if (b.dataset.lvins) { insertHF(b.dataset.lvins); }
    }, true);
  }
  function insertHF(w) {
    const all = w.endsWith('all'), k = w.slice(0, 2), ids = all ? S.order.filter((id) => S.pages[id]) : [curPage().id];
    change(ids, () => ids.forEach((id) => { const p = S.pages[id], o = hs(k), hh = 7, y = k === 'h5' ? 4 : p.h - hh - 4;
      const e = tx(p.w * 0.1, y, p.w * 0.8, hh, k === 'h5' ? 'Cabeçalho da página' : 'Rodapé da página', Object.assign({ font: 'Nunito', color: '#3E3550', valign: 'middle' }, o, { role: k })); p.els.push(e); }));
    redraw(); ids.forEach((id) => thumbRefresh(id)); toast(all ? 'Inseri em todas as páginas. Edite o texto em cada uma. ✨' : 'Inserido. Dê dois cliques para mudar o texto.');
  }
  async function presetSave() {
    modal(`<h2>Guardar configuração de textos</h2><label class="f">Nome<input type="text" id="tpN" value="Meus textos"></label><p class="hint">Guarda os níveis H1 a H6 e a combinação de fontes. Fica em Texto → Fontes → Minhas configurações, para usar em qualquer projeto e no ModuLab.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="tpGo" type="button">Guardar</button></div>`, (b, close) => {
      $('#tpGo', b).onclick = async () => { const name = ($('#tpN', b).value || '').trim() || 'Meus textos'; const it = { id: uid('l'), kind: 'tipos', name, hs: Object.fromEntries(KEYS.map((k) => [k, hs(k)])), fontsC: (S.meta.style && S.meta.style.fontsC) || null, pair: (S.meta.style && S.meta.style.pair) || null, hf: S.meta.hf ? clone(S.meta.hf) : null, createdAt: Date.now() }; close(); try { await Store.saveLib(it); S.lib.push(it); toast('Configuração guardada. 💜'); renderPanel(); } catch (e) { toast('Não consegui guardar agora.'); } };
    });
  }
  function useLevels(it) {
    S.meta.hs = clone(it.hs || {}); if (it.hf) S.meta.hf = clone(it.hf); const st = Object.assign({}, S.meta.style || {}); if (it.fontsC) st.fontsC = clone(it.fontsC); if (it.pair) st.pair = it.pair; S.meta.style = st;
    const ids = S.order.filter((id) => S.pages[id]); change(ids, () => ids.forEach((id) => S.pages[id].els.forEach((e) => { if (e.type === 'text' && e.role && S.meta.hs[e.role]) { const o = hs(e.role); ['font', 'size', 'color', 'weight', 'italic', 'ul', 'st', 'ls', 'align', 'valign', 'opacity'].forEach((k) => { if (o[k] !== undefined) setKey(e, k, o[k]); else if (['ul', 'st', 'italic'].includes(k)) delete e[k]; }); } })));
    Saver.m(); redraw(); refreshThumbs(); renderPanel(); toast('Configuração aplicada. 🌸');
  }

  /* ---------- painel Fontes ---------- */
  function fontesHTML() {
    const cur = styleOf(), combos = Object.entries(PAIRS || {}), mine = S.lib.filter((x) => x.kind === 'fontes'), tipos = S.lib.filter((x) => x.kind === 'tipos'), fu = S.lib.filter((x) => x.kind === 'font');
    const combo = (k, n, f) => { const on = S.fcSel === k; return `<button type="button" class="tcard fcb${on ? ' on' : ''}" data-fcb="${k}"><span style="font-family:'${esc(f.title)}';font-size:20px;line-height:1.1">${esc(n)}</span><span style="font-family:'${esc(f.script)}';font-size:18px">Planner</span><span class="hint" style="font-family:'${esc(f.body)}'">To-do · Habits</span></button>`; };
    const back = (t) => `<h2>${t}</h2><button type="button" class="btn sm ghost" data-fsback>← Voltar para Fonte</button>`;
    if (S.txSub === 'combo' && S.fcSel) return `${back('Combinação de fontes')}${comboDetail()}`;
    if (S.txSub === 'fontes') return `${back('Minhas fontes')}<p class="hint">As fontes enviadas aparecem em todas as listas de fonte e nas combinações.</p><div class="row"><span class="btn sm upl">Enviar fontes (TTF/OTF)<input type="file" accept=".ttf,.otf,font/ttf,font/otf" multiple data-fup aria-label="Enviar fontes"></span></div>
      ${fu.length ? fu.map((f) => `<div class="fontrow"><span class="pvw" style="font-family:'${esc(f.family)}'">${esc(f.family)} · Aa Bb 123</span><button class="btn sm ghost danger" data-ld="${f.id}">Excluir</button></div>`).join('') : '<p class="hint">Você ainda não enviou nenhuma fonte.</p>'}`;
    if (S.txSub === 'comb') return `${back('Minhas combinações')}<button type="button" class="btn sm pri" data-fnew>Nova combinação…</button>
      <h3>COMBINAÇÕES DE FONTES</h3>${mine.length ? `<div class="plist">${mine.map((m) => combo('m:' + m.id, m.name, m.f)).join('')}</div>` : '<p class="hint">Suas combinações guardadas aparecem aqui.</p>'}
      <h3>CONFIGURAÇÕES DE NÍVEIS</h3>${tipos.length ? tipos.map((t) => `<div class="fontrow"><span>${esc(t.name)}</span><span><button class="btn sm" data-ftu="${t.id}">Aplicar</button> <button class="btn sm ghost danger" data-ftd="${t.id}">Excluir</button></span></div>`).join('') : '<p class="hint">Configure os níveis e use “Guardar esta configuração como padrão…”.</p>'}`;
    return `<h2>Fonte</h2><div class="row fsub"><button type="button" class="btn sm" data-fsub="fontes">Minhas fontes</button><button type="button" class="btn sm" data-fsub="comb">Minhas combinações</button></div>
      <h3>COMBINAÇÃO DE FONTES</h3><p class="hint">Clique numa combinação para ver as fontes e escolher onde aplicar.</p>
      <div class="plist">${combos.map(([k, v]) => combo(k, v.nome || k, v)).join('')}</div>
      <h3>NÍVEIS DE TEXTO</h3><p class="hint">Clique num nível para configurar fonte, tamanho, cor e mais. Vale para todo o projeto.</p>
      <div class="plist">${KEYS.map((k) => { const o = hs(k); return `<button type="button" class="tcard lvcard${S.lvEdit === k ? ' on' : ''}" data-flv="${k}"><span style="font-family:'${esc(o.font || (k === 'h1' || k === 'h2' ? cur.title : cur.body))}';font-size:${Math.min(26, (o.size || 8) * 1.6)}px;font-weight:${o.weight || 400};${o.italic ? 'font-style:italic;' : ''}text-decoration:${[o.ul ? 'underline' : '', o.st ? 'line-through' : ''].join(' ').trim() || 'none'};color:${o.color || 'var(--text)'}">${LV[k][0]} · ${LV[k][1]}</span><span class="hint">${LV[k][2]}</span></button>`; }).join('')}</div>
      <p class="hint">Os modelos de texto (título, citação, caixa…) ficam em Widgets › Textos.</p>`;
  }
  function fontesMount(P) {
    $$('[data-fsback]', P).forEach((b) => b.onclick = () => { S.txSub = null; S.fcDraft = null; renderPanel(); });
    $$('[data-fsub]', P).forEach((b) => b.onclick = () => { S.txSub = b.dataset.fsub; renderPanel(); });
    comboMount(P);
    $$('[data-flv]', P).forEach((b) => b.onclick = () => { S.lvEdit = b.dataset.flv; S.sel = []; redraw(); renderPanel(); renderProps(); });
    const nw = $('[data-fnew]', P); if (nw) nw.onclick = () => comboModal();
    $$('[data-ftu]', P).forEach((b) => b.onclick = () => { const it = S.lib.find((x) => x.id === b.dataset.ftu); if (it) useLevels(it); });
    $$('[data-ftd]', P).forEach((b) => b.onclick = async () => { try { await Store.delLib(b.dataset.ftd); S.lib = S.lib.filter((x) => x.id !== b.dataset.ftd); renderPanel(); } catch (e) { toast('Não consegui excluir.'); } });
    const fu = $('[data-fup]', P); if (fu) fu.onchange = async () => { await uploadFiles([...fu.files], 'font'); renderPanel(); };
    if (typeof mountLib === 'function') $$('[data-ld]', P).forEach((b) => b.onclick = async () => { try { await Store.delLib(b.dataset.ld); S.lib = S.lib.filter((x) => x.id !== b.dataset.ld); renderPanel(); } catch (e) { toast('Não consegui excluir.'); } });
  }
  function comboModal(f0) {
    const st = f0 || styleOf(), L = fontList(), op = (v) => L.map((f) => `<option value="${esc(f)}"${f === v ? ' selected' : ''}>${esc(f)}</option>`).join('');
    modal(`<h2>Nova combinação de fontes</h2><label class="f">Nome<input type="text" id="fcN" value="Minha combinação"></label>
      <label class="f">Títulos<select id="fcT">${op(st.title)}</select></label><label class="f">Caligrafia<select id="fcS">${op(st.script)}</select></label><label class="f">Corpo<select id="fcB">${op(st.body)}</select></label>
      <p class="hint">Suas fontes enviadas também aparecem na lista.</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="fcGo" type="button">Guardar e usar</button></div>`, (b, close) => {
      $('#fcGo', b).onclick = async () => { const it = { id: uid('l'), kind: 'fontes', name: ($('#fcN', b).value || '').trim() || 'Minha combinação', f: { title: $('#fcT', b).value, script: $('#fcS', b).value, body: $('#fcB', b).value }, createdAt: Date.now() }; close(); try { await Store.saveLib(it); S.lib.push(it); } catch (e) { /* segue sem guardar na nuvem */ } const stl = Object.assign({}, S.meta.style || {}, { fontsC: clone(it.f) }); S.meta.style = stl; Saver.m(); redraw(); refreshThumbs(); renderPanel(); toast('Combinação aplicada. ✨'); };
    });
  }


  /* =====================================================================
     Texto com várias cores e fontes (runs)
     ===================================================================== */
  const SYM = ['♡', '♥', '✦', '✧', '✿', '❀', '❁', '✾', '★', '☆', '☾', '☀', '✂', '✎', '✉', '☎', '♪', '♫', '❖', '❥', '➳', '✔', '✘', '➜', '•', '◦', '❝', '❞', '☺', '☻'];
  const SYMF = 'Noto Sans Symbols 2';
  if (typeof FONTS !== 'undefined' && !FONTS.some((f) => f[0] === SYMF)) FONTS.push([SYMF, 'símbolos'], ['Noto Emoji', 'símbolos']);
  function drawRuns(c, e) {
    const fs = e.size * PT, runs = e.runs, items = [];
    const setF = (r) => { font(c, r.size ? r.size * PT : fs, r.font || e.font, r.weight ?? e.weight, r.italic ?? e.italic); setLS(c, (e.ls || 0) * (r.size ? r.size * PT : fs) * F); };
    runs.forEach((r) => { String(r.t ?? '').split(/(\n|[ \t]+)/).forEach((tk) => { if (tk === '') return; if (tk === '\n') items.push({ nl: true, r }); else { setF(r); items.push({ s: tk, r, sp: /^[ \t]+$/.test(tk), w: c.measureText(tk).width / F, fs: r.size ? r.size * PT : fs }); } }); });
    const lines = [[]]; let cw = 0;
    items.forEach((it) => { if (it.nl) { lines.push([]); cw = 0; return; } const L = lines[lines.length - 1]; if (!it.sp && L.length && cw + it.w > e.w + 0.01) { lines.push([]); cw = 0; } const LL = lines[lines.length - 1]; if (it.sp && !LL.length) return; LL.push(it); cw += it.w; });
    const lhm = e.lh || 1.2, lhs = lines.map((L) => Math.max(fs, ...L.map((i) => i.fs || 0)) * lhm), tot = lhs.reduce((a, b) => a + b, 0), y0 = e.valign === 'middle' ? (e.h - tot) / 2 : e.valign === 'bottom' ? e.h - tot : 0;
    let y = y0;
    lines.forEach((L, li) => { while (L.length && L[L.length - 1].sp) L.pop(); const tw = L.reduce((a, i) => a + i.w, 0), cy = y + lhs[li] / 2; let x = e.align === 'center' ? (e.w - tw) / 2 : e.align === 'right' ? e.w - tw : 0;
      L.forEach((it) => { setF(it.r); c.fillStyle = it.r.color || e.color; T(c, it.s, x, cy, 'left', 'middle');
        const ul = it.r.ul ?? e.ul, st = it.r.st ?? e.st; if (ul || st) { c.save(); c.strokeStyle = it.r.color || e.color; c.lineWidth = Math.max(0.12, it.fs * 0.055); if (ul) { c.beginPath(); c.moveTo(x, cy + it.fs * 0.42); c.lineTo(x + it.w, cy + it.fs * 0.42); c.stroke(); } if (st) { c.beginPath(); c.moveTo(x, cy - it.fs * 0.04); c.lineTo(x + it.w, cy - it.fs * 0.04); c.stroke(); } c.restore(); }
        x += it.w; }); y += lhs[li]; });
    setLS(c, 0);
  }
  (function patchRuns() { if (typeof R === 'undefined' || R.text._runs) return; const prev = R.text; R.text = function (c, e) { if (e.runs && e.runs.length) { try { drawRuns(c, e); } catch (err) { console.warn(err); } return; } return prev.apply(this, arguments); }; R.text._runs = 1; R.text._ul = 1; })();

  const rgbHex = (s) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s || ''); return m ? '#' + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, '0')).join('') : null; };
  function runsFromDom(root, e) {
    const out = [], base = { font: e.font, color: String(e.color || '').toLowerCase(), weight: (e.weight || 400) >= 600 ? 700 : 400, italic: !!e.italic };
    const add = (t, el) => { if (!t) return; const cs = getComputedStyle(el), fam = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim(), col = rgbHex(cs.color), w = (+cs.fontWeight || 400) >= 600 ? 700 : 400, it = cs.fontStyle === 'italic', tdl = cs.textDecorationLine || cs.textDecoration || '';
      const r = { t }; if (fam && fam !== base.font) r.font = fam; if (col && col !== base.color) r.color = col; if (w !== base.weight) r.weight = w; if (it !== base.italic) r.italic = it; if (/underline/.test(tdl) && !e.ul) r.ul = true; if (/line-through/.test(tdl) && !e.st) r.st = true;
      const L = out[out.length - 1]; if (L && ['font', 'color', 'weight', 'italic', 'ul', 'st'].every((k) => L[k] === r[k])) L.t += t; else out.push(r); };
    const walk = (n, first) => { n.childNodes.forEach((ch, i) => { if (ch.nodeType === 3) add(ch.nodeValue.replace(/ /g, ' '), ch.parentElement); else if (ch.nodeName === 'BR') add('\n', n.nodeType === 1 ? n : root); else if (ch.nodeType === 1) { const blk = /^(DIV|P)$/.test(ch.nodeName); if (blk && out.length && !/\n$/.test(out[out.length - 1].t)) add('\n', n.nodeType === 1 ? n : root); walk(ch); } }); };
    walk(root); if (out.length) out[out.length - 1].t = out[out.length - 1].t.replace(/\n+$/, ''); return out.filter((r) => r.t !== '');
  }
  function richModal(e, cb) {
    const base = `font-family:'${e.font}';color:${e.color};font-weight:${(e.weight || 400) >= 600 ? 700 : 400};font-style:${e.italic ? 'italic' : 'normal'};text-align:${e.align || 'left'};line-height:${e.lh || 1.25}`;
    const runs = e.runs && e.runs.length ? e.runs : [{ t: e.text ?? '' }];
    const html = runs.map((r) => `<span style="${r.font ? `font-family:'${esc(r.font)}';` : ''}${r.color ? `color:${r.color};` : ''}${r.weight ? `font-weight:${r.weight};` : ''}${r.italic !== undefined ? `font-style:${r.italic ? 'italic' : 'normal'};` : ''}${r.ul || r.st ? `text-decoration:${[r.ul ? 'underline' : '', r.st ? 'line-through' : ''].join(' ').trim()};` : ''}">${esc(r.t).replace(/\n/g, '<br>')}</span>`).join('');
    modal(`<h2>Texto com várias cores e fontes</h2><p class="hint">Escreva e selecione um pedaço do texto para mudar só ele. O resto segue o nível e o estilo do texto.</p>
      <div class="rtbar"><select id="rtF" title="Fonte do trecho selecionado"><option value="">Fonte…</option>${fontList().map((f) => `<option value="${esc(f)}" style="font-family:'${esc(f)}'">${esc(f)}</option>`).join('')}</select>
      <input type="color" id="rtC" value="${/^#[0-9a-f]{6}$/i.test(e.color) ? e.color : '#3E3550'}" title="Cor do trecho selecionado"><button type="button" class="lvtg" data-rt="bold"><b>N</b></button><button type="button" class="lvtg" data-rt="italic"><i>I</i></button><button type="button" class="lvtg" data-rt="underline"><u>S</u></button><button type="button" class="lvtg" data-rt="strikeThrough"><s>T</s></button><button type="button" class="lvtg" data-rt="removeFormat" title="Limpar estilo do trecho">✕</button></div>
      <div id="rtBox" contenteditable="true" spellcheck="false" style="${base}">${html}</div>
      <p class="hint" style="margin:8px 0 4px">Símbolos (clique para inserir):</p><div class="rtsym">${SYM.map((s) => `<button type="button" data-ins="${s}" style="font-family:'${SYMF}','Nunito'">${s}</button>`).join('')}</div>
      <div class="row" style="justify-content:space-between"><button type="button" class="btn sm ghost" id="rtSymF" title="Aplica a fonte de símbolos ao trecho selecionado">Fonte de símbolos no trecho</button><span><button class="btn ghost" data-close>Cancelar</button> <button class="btn pri" id="rtGo" type="button">Aplicar</button></span></div>`, (b, close) => {
      const box = $('#rtBox', b); try { document.execCommand('styleWithCSS', false, true); } catch (_) { /* segue */ }
      let saved = null; const keep = () => { const s = window.getSelection(); if (s.rangeCount && box.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); };
      const back = () => { box.focus(); if (saved) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); } };
      ['keyup', 'mouseup', 'focus'].forEach((ev) => box.addEventListener(ev, keep));
      $$('[data-rt]', b).forEach((x) => { x.onmousedown = (ev) => ev.preventDefault(); x.onclick = () => { back(); document.execCommand(x.dataset.rt); keep(); }; });
      $('#rtF', b).onchange = (ev) => { const v = ev.target.value; if (!v) return; back(); document.execCommand('fontName', false, v); keep(); ev.target.value = ''; };
      $('#rtC', b).oninput = (ev) => { back(); document.execCommand('foreColor', false, ev.target.value); keep(); };
      $('#rtSymF', b).onclick = () => { back(); document.execCommand('fontName', false, SYMF); keep(); };
      $$('[data-ins]', b).forEach((x) => { x.onmousedown = (ev) => ev.preventDefault(); x.onclick = () => { back(); document.execCommand('insertText', false, x.dataset.ins); keep(); }; });
      $('#rtGo', b).onclick = () => {
        const r = runsFromDom(box, e), plain = r.map((q) => q.t).join(''), p = curPage(), only = r.length === 1 && Object.keys(r[0]).length === 1;
        if (cb) { close(); cb(only ? null : r, plain); return; }
        change([p.id], () => { e.text = plain; if (only) delete e.runs; else e.runs = r; }); close(); redraw(); renderProps(); thumbRefresh(p.id); toast(only ? 'Texto sem estilos especiais.' : 'Texto com vários estilos aplicado. ✨');
      };
      box.focus();
    }, true);
  }

  /* =====================================================================
     Combinações de fontes: detalhes + onde aplicar
     ===================================================================== */
  const comboList = () => Object.entries(PAIRS || {}).map(([k, v]) => ({ key: k, name: v.nome || k, f: { title: v.title, script: v.script, body: v.body } })).concat(S.lib.filter((x) => x.kind === 'fontes').map((m) => ({ key: 'm:' + m.id, name: m.name, f: clone(m.f), mine: m.id })));
  const SCOPES = [['page', 'Esta página'], ['widget', 'Widget selecionado'], ['pages', 'Todas as páginas'], ['widgets', 'Todos os widgets'], ['all', 'Tudo (projeto)']];
  function mapFontFn(newF, explicit) {
    const cur = styleOf(), map = {}; [['body', cur.body], ['title', cur.title], ['script', cur.script]].forEach(([k, name]) => { if (name) map[name] = newF[k]; });
    const tok = { '@title': newF.title, '@script': newF.script, '@body': newF.body };
    return (f) => (map[f] !== undefined ? map[f] : (explicit && tok[f]) || f);
  }
  const FONTKEYS = ['font', 'titleFont', 'labelFont'];
  function mapEl(e, fn) {
    let n = 0; FONTKEYS.forEach((k) => { if (typeof e[k] === 'string') { const v = fn(e[k]); if (v !== e[k]) { e[k] = v; n++; } } });
    if (Array.isArray(e.runs)) e.runs.forEach((r) => { if (r.font) { const v = fn(r.font); if (v !== r.font) { r.font = v; n++; } } });
    if (e.wx && e.wx.hd && typeof e.wx.hd.font === 'string') { const v = fn(e.wx.hd.font); if (v !== e.wx.hd.font) { e.wx.hd.font = v; n++; } }
    return n;
  }
  const isWidgetEl = (e) => (WX.ACCEPT && WX.ACCEPT.has(e.type) && e.type !== 'text' && e.type !== 'rect' && e.type !== 'pattern') || !!e.wx || (e.type === 'text' && e.role && e.g);
  function applyCombo(f, scope) {
    const p = curPage(); let pagesIds, pick;
    if (scope === 'page') { pagesIds = [p.id]; pick = () => true; }
    else if (scope === 'widget') { const sel = selEls(); if (!sel.length) { toast('Selecione um widget (ou peça) na página primeiro.'); return false; } const ids = new Set(gx(p, sel.map((e) => e.id))); pagesIds = [p.id]; pick = (e) => ids.has(e.id); }
    else if (scope === 'pages') { pagesIds = S.order.filter((id) => S.pages[id]); pick = () => true; }
    else if (scope === 'widgets') { pagesIds = S.order.filter((id) => S.pages[id]); pick = isWidgetEl; }
    else { pagesIds = S.order.filter((id) => S.pages[id]); pick = () => true; }
    const fn = mapFontFn(f, scope !== 'all'); let n = 0;
    change(pagesIds, () => pagesIds.forEach((id) => S.pages[id].els.forEach((e) => { if (pick(e)) n += mapEl(e, fn); })));
    if (scope === 'all') { const st = Object.assign({}, S.meta.style || {}); st.fontsC = clone(f); S.meta.style = st; Saver.m(); }
    redraw(); pagesIds.forEach((id) => thumbRefresh(id)); renderProps(); return n;
  }
  function comboDetail() {
    const k = S.fcSel; if (!k) return ''; const c = comboList().find((x) => x.key === k); if (!c) return '';
    const dr = S.fcDraft && S.fcDraft.key === k ? S.fcDraft.f : c.f, L = fontList(), op = (v) => L.map((f) => `<option value="${esc(f)}"${f === v ? ' selected' : ''}>${esc(f)}</option>`).join('');
    const sc = S.fcScope || 'pages';
    return `<div class="lvg fcdet"><div class="lvh"><b>Combinação · ${esc(c.name)}</b><button type="button" class="btn sm ghost" data-fcx>Fechar</button></div>
      <div class="fcsamp"><span style="font-family:'${esc(dr.script)}';font-size:30px;line-height:1.1">Planner</span><span style="font-family:'${esc(dr.title)}';font-size:18px;font-weight:700">Título da seção</span><span style="font-family:'${esc(dr.body)}';font-size:14px">To-do · Habits · texto do corpo</span></div>
      <label class="pfield"><span>Títulos</span><select data-fcf="title">${op(dr.title)}</select></label><label class="pfield"><span>Caligrafia</span><select data-fcf="script">${op(dr.script)}</select></label><label class="pfield"><span>Corpo</span><select data-fcf="body">${op(dr.body)}</select></label>
      <div class="pfield"><span>Onde aplicar</span><div class="chips fcscope">${SCOPES.map(([v, n]) => `<button type="button" class="chip${sc === v ? ' on' : ''}" data-fcs="${v}">${n}</button>`).join('')}</div></div>
      <div class="row"><button type="button" class="btn pri" data-fcgo>Aplicar</button><button type="button" class="btn sm" data-fcsave>Guardar como nova combinação…</button></div>
      <p class="hint">A troca substitui as fontes da combinação atual do projeto pelas desta, só onde você escolher. “Tudo” também muda a combinação do projeto.</p></div>`;
  }
  function comboMount(P) {
    $$('[data-fcb]', P).forEach((b) => b.onclick = () => { S.fcSel = b.dataset.fcb; S.fcDraft = null; S.txSub = 'combo'; renderPanel(); });
    const x = $('[data-fcx]', P); if (x) x.onclick = () => { S.fcSel = null; S.fcDraft = null; S.txSub = null; renderPanel(); };
    $$('[data-fcf]', P).forEach((s) => s.onchange = () => { const c = comboList().find((q) => q.key === S.fcSel); if (!c) return; S.fcDraft = S.fcDraft && S.fcDraft.key === c.key ? S.fcDraft : { key: c.key, f: clone(c.f) }; S.fcDraft.f[s.dataset.fcf] = s.value; renderPanel(); });
    $$('[data-fcs]', P).forEach((s) => s.onclick = () => { S.fcScope = s.dataset.fcs; renderPanel(); });
    const go = $('[data-fcgo]', P); if (go) go.onclick = () => { const c = comboList().find((q) => q.key === S.fcSel); if (!c) return; const f = (S.fcDraft && S.fcDraft.key === c.key ? S.fcDraft.f : c.f); const n = applyCombo(f, S.fcScope || 'pages'); if (n === false) return; toast(n ? `Combinação aplicada (${n} ${n > 1 ? 'trocas' : 'troca'}). ✨` : 'Combinação aplicada. Nada precisou mudar nesse alvo.'); renderPanel(); };
    const sv = $('[data-fcsave]', P); if (sv) sv.onclick = () => comboModal(S.fcDraft ? S.fcDraft.f : (comboList().find((q) => q.key === S.fcSel) || {}).f);
  }

  /* =====================================================================
     Cabeçalho e rodapé da página (com numeração automática)
     ===================================================================== */
  const HFD = () => ({ on: false, text: '', showText: true, align: 'center', font: 'Nunito', size: 7, color: '#3E3550', weight: 400, opacity: 1, valign: 'middle', num: { on: false, pos: 'right', fmt: 'n', sym: '♡', font: '', size: 0, own: false, color: '#9168A0', weight: 400, italic: false, shadow: false, start: 1, skipCover: true } });
  const hfOf = (k) => { const m = S.meta; m.hf = m.hf || {}; if (!m.hf[k]) m.hf[k] = HFD(); const o = m.hf[k]; o.num = Object.assign(HFD().num, o.num || {}); return o; };
  function pageNo(pg, z) {
    const ids = S.order.filter((id) => S.pages[id]), idx = ids.findIndex((id) => S.pages[id] === pg || id === pg.id); if (idx < 0) return null;
    const n = z.num, last = idx === ids.length - 1, back = typeof isBackCover === 'function' && isBackCover(pg);
    if (n.skipCover && (idx === 0 || back)) return null;
    return { n: idx + 1 - (n.skipCover ? 1 : 0) + (num(n.start, -99, 9999, 1) - 1), total: ids.length - (n.skipCover ? 1 : 0) - (ids.length > 1 && typeof isBackCover === 'function' && isBackCover(S.pages[ids[ids.length - 1]]) ? 1 : 0), idx };
  }
  const fmtNo = (z, no) => { const n = z.num, v = no.n, s = n.sym || '♡'; return n.fmt === '-n-' ? `- ${v} -` : n.fmt === 'sym' ? `${s} ${v} ${s}` : n.fmt === 'pg' ? `Página ${v}` : n.fmt === 'de' ? `${v} / ${no.total}` : n.fmt === 'dot' ? `· ${v} ·` : String(v); };
  function hfZone(p, k) {
    const m = p.mg, on = !!(m && (typeof Margens !== 'undefined')); let g = null; try { if (on && S.meta.mgOn) g = Margens.geom(p, m); } catch (_) { g = null; }
    const hh = 8;
    if (g) { const y = k === 'hdr' ? (g.hasH ? [g.top, g.y0] : [g.top, g.top + hh]) : (g.hasF ? [g.y1, g.bot] : [g.bot - hh, g.bot]); return { x0: g.x0, x1: g.x1, y0: y[0], y1: y[1], left: g.e }; }
    return { x0: Math.min(10, p.w * 0.08), x1: p.w - Math.min(10, p.w * 0.08), y0: k === 'hdr' ? 3 : p.h - 3 - hh, y1: k === 'hdr' ? 3 + hh : p.h - 3, left: null };
  }
  function drawHF(c, pg) {
    const hf = S.meta && S.meta.hf; if (!hf) return;
    ['hdr', 'ftr'].forEach((k) => {
      const z = hf[k]; if (!z || !z.on) return; const Z = hfZone(pg, k), w = Z.x1 - Z.x0, h = Math.max(4, Z.y1 - Z.y0);
      const base = { font: z.font, size: z.size, color: z.color, weight: z.weight, italic: !!z.italic, ul: z.ul, st: z.st, ls: z.ls || 0, valign: 'middle', lh: 1.2, opacity: z.opacity ?? 1 };
      const no = z.num && z.num.on ? pageNo(pg, z) : null; let pos = z.num ? z.num.pos : 'right';
      if (pos === 'outer' || pos === 'inner') { const left = Z.left ?? ((S.order.indexOf(pg.id) % 2) === 1); pos = (pos === 'outer') === left ? 'left' : 'right'; }
      const hasTxt = z.showText !== false && (z.text || (z.runs && z.runs.length));
      const draw = (e) => { try { drawEl(c, e); } catch (err) { /* sem desenho */ } };
      if (hasTxt) draw(tx(Z.x0, Z.y0, w, h, z.text || '', Object.assign({}, base, { align: z.align || 'center', runs: z.runs && z.runs.length ? z.runs : undefined })));
      if (no) {
        const n = z.num, str = fmtNo(z, no), nf = n.font || z.font, ns = n.size || z.size, col = n.own ? n.color : z.color;
        const nb = { font: nf, size: ns, color: col, weight: n.weight, italic: !!n.italic, valign: 'middle', lh: 1.2, align: pos, opacity: z.opacity ?? 1 };
        if (n.shadow) draw(tx(Z.x0 + 0.35, Z.y0 + 0.35, w, h, str, Object.assign({}, nb, { color: '#00000055', opacity: (z.opacity ?? 1) * 0.5 })));
        draw(tx(Z.x0, Z.y0, w, h, str, nb));
      }
    });
  }
  (function patchPage() { if (typeof drawPage !== 'function' || drawPage._hf) return; const orig = drawPage; drawPage = function (c, pg, k, ox, oy, o) { const r = orig.apply(this, arguments); try { if (S.meta && S.meta.hf && (S.meta.hf.hdr && S.meta.hf.hdr.on || S.meta.hf.ftr && S.meta.hf.ftr.on)) { c.save(); c.setTransform(k, 0, 0, k, ox || 0, oy || 0); drawHF(c, pg); c.restore(); } } catch (e) { console.warn(e); } return r; }; drawPage._hf = 1; })();

  function hfHTML() {
    const sec = (k, t) => { const z = hfOf(k), n = z.num;
      return `<div class="lvg" data-hf="${k}"><div class="lvh"><b>${t}</b><label class="chk" style="margin:0"><input type="checkbox" data-hfk="${k}.on"${z.on ? ' checked' : ''}> Ligado</label></div>
      ${z.on ? `<label class="chk"><input type="checkbox" data-hfk="${k}.showText"${z.showText !== false ? ' checked' : ''}> Mostrar o texto</label>
      <label class="pfield"><span>Texto (igual em todas as páginas)</span><input type="text" data-hfk="${k}.text" value="${esc(z.text || '')}" placeholder="${k === 'hdr' ? 'Ex.: Meu planner 2026' : 'Ex.: Craft Notes Unique'}"></label>
      <div class="row"><button type="button" class="btn sm" data-hfrich="${k}">Texto com várias cores e fontes…</button></div>
      ${controls('#' + k, z)}
      <h4 class="lvh4">Numeração automática</h4>
      <label class="chk"><input type="checkbox" data-hfk="${k}.num.on"${n.on ? ' checked' : ''}> Mostrar o número da página</label>
      ${n.on ? `<div class="lvrow"><label class="pfield"><span>Formato</span><select data-hfk="${k}.num.fmt">${[['n', '3'], ['-n-', '- 3 -'], ['sym', 'Entre símbolos (♡ 3 ♡)'], ['dot', '· 3 ·'], ['pg', 'Página 3'], ['de', '3 / 20']].map(([v, l]) => `<option value="${v}"${n.fmt === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="pfield"><span>Posição</span><select data-hfk="${k}.num.pos">${[['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita'], ['outer', 'Lado de fora'], ['inner', 'Lado de dentro (lombada)']].map(([v, l]) => `<option value="${v}"${n.pos === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
        ${n.fmt === 'sym' ? `<div class="pfield"><span>Símbolo</span><div class="rtsym">${SYM.map((s) => `<button type="button" class="${n.sym === s ? 'on' : ''}" data-hfsym="${k}" data-v="${s}" style="font-family:'${SYMF}','Nunito'">${s}</button>`).join('')}</div></div>` : ''}
        <div class="lvrow"><label class="pfield"><span>Fonte do número</span><select data-hfk="${k}.num.font"><option value="">(a do texto)</option>${fontList().map((f) => `<option value="${esc(f)}"${n.font === f ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label><label class="pfield"><span>Tamanho (pt)</span><input type="number" data-hfk="${k}.num.size" data-n="1" value="${n.size || ''}" placeholder="${z.size}" min="2" max="80" step="0.5"></label></div>
        <div class="lvrow">${tog('#hfn' + k, 'bold', (n.weight || 400) >= 600, '<b>N</b>', 'Negrito')}${tog('#hfn' + k, 'italic', !!n.italic, '<i>I</i>', 'Itálico')}${tog('#hfn' + k, 'shadow', !!n.shadow, 'Sombra', 'Sombreado', 'width:auto;padding:0 10px')}</div>
        <div class="lvrow"><label class="chk" style="margin:0"><input type="checkbox" data-hfk="${k}.num.own"${n.own ? ' checked' : ''}> Cor diferente do texto</label>${n.own ? `<input type="color" data-hfk="${k}.num.color" value="${n.color || '#9168A0'}">` : ''}</div>
        <div class="lvrow"><label class="pfield"><span>Começar a contar em</span><input type="number" data-hfk="${k}.num.start" data-n="1" value="${n.start}" min="-99" max="9999" step="1"></label><label class="chk" style="margin:0"><input type="checkbox" data-hfk="${k}.num.skipCover"${n.skipCover ? ' checked' : ''}> Sem número na capa e contracapa</label></div>` : ''}` : '<p class="hint">Ligue para escrever um texto e/ou o número das páginas. Vale para todas as páginas.</p>'}</div>`; };
    return sec('hdr', 'Cabeçalho da página (H5)') + sec('ftr', 'Rodapé da página (H6)');
  }
  const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setP = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] = a[k] || {}), o); t[last] = v; };
  function ensureZones(k) { const ids = S.order.filter((id) => S.pages[id] && S.pages[id].mg); if (!ids.length || !S.meta.mgOn) return; change(ids, () => ids.forEach((id) => { const m = S.pages[id].mg; const key = k === 'hdr' ? 'hdr' : 'ftr'; if ((+m[key] || 0) < 8) m[key] = 8; })); }
  function hfSet(path, v, live) {
    const [k] = path.split('.'); hfOf(k); const was = path === `${k}.on` ? getP(S.meta.hf, path) : null; setP(S.meta.hf, path, v);
    if (path === `${k}.on` && v) ensureZones(k);
    Saver.m(); redraw(); S.order.forEach((id) => S.pages[id] && thumbRefresh(id)); if (!live) renderProps();
  }
  function hfWire() {
    const P0 = document.getElementById('props'); if (!P0 || P0._hf) return; P0._hf = 1;
    const val = (i) => (i.type === 'checkbox' ? i.checked : i.type === 'number' ? (i.value === '' ? 0 : +i.value) : i.value);
    P0.addEventListener('input', (ev) => { const i = ev.target; if (!i.dataset) return;
      if (i.dataset.hfk && (i.type === 'text' || i.type === 'number' || i.type === 'color')) hfSet(i.dataset.hfk, val(i), true);
      else if (i.dataset.lvr && i.dataset.lvr[0] === '#' && ['number', 'range', 'color'].includes(i.type)) { ev.stopImmediatePropagation(); hfSet(i.dataset.lvr.slice(1) + '.' + i.dataset.lvk, readVal(i), true); } }, true);
    P0.addEventListener('change', (ev) => { const i = ev.target; if (!i.dataset) return;
      if (i.dataset.hfk) hfSet(i.dataset.hfk, val(i), false);
      else if (i.dataset.lvr && i.dataset.lvr[0] === '#' && !i.dataset.tg) { ev.stopImmediatePropagation(); hfSet(i.dataset.lvr.slice(1) + '.' + i.dataset.lvk, readVal(i), false); } }, true);
    P0.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b || !b.dataset) return;
      if (b.dataset.lvr && b.dataset.lvr[0] === '#') { ev.stopImmediatePropagation(); let r = b.dataset.lvr.slice(1); const k = b.dataset.lvk, isNum = r.startsWith('hfn'); if (isNum) r = r.slice(3); const z = hfOf(r), tgt = isNum ? z.num : z, key = k === 'bold' ? 'weight' : k; let v;
        if (k === 'bold') v = (tgt.weight || 400) >= 600 ? 400 : 700; else if (b.dataset.tg) v = !tgt[k]; else v = b.dataset.v; hfSet(`${r}${isNum ? '.num' : ''}.${key}`, v, false); return; }
      if (b.dataset.hfsym) { hfSet(`${b.dataset.hfsym}.num.sym`, b.dataset.v, false); return; }
      if (b.dataset.hfrich) { const z = hfOf(b.dataset.hfrich); const tmp = tx(0, 0, 100, 10, z.text || '', { font: z.font, size: z.size, color: z.color, weight: z.weight, italic: z.italic, align: z.align, lh: 1.2, runs: z.runs }); richModal(tmp, (r, plain) => { z.text = plain; if (r) z.runs = r; else delete z.runs; Saver.m(); redraw(); S.order.forEach((id) => S.pages[id] && thumbRefresh(id)); renderProps(); }); } }, true);
  }

  /* =====================================================================
     Widgets só de texto (aba Widgets → Textos)
     ===================================================================== */
  function addTextWidgets() {
    if (!window.WX || !WX.CAT || WX.CAT.some((x) => x.k === 'txt-titulo')) return;
    if (WX.CATS && !WX.CATS.some((c) => c[0] === 'textos')) WX.CATS.push(['textos', 'Textos']);
    const wide = (p, f) => Math.min(p.w * f, 150), sty = (e, t) => (WX.styled ? WX.styled(e, t) : e);
    const T0 = (st, x, y, w, h, t, o) => tx(x, y, w, h, t, Object.assign({ font: st.body, size: 9, color: st.pal.text, valign: 'top', lh: 1.35 }, o));
    const C = (k, n, kw, fn) => WX.CAT.push({ k, n, cats: ['textos'], kw: 'texto ' + kw, fn });
    C('txt-titulo', 'Título e subtítulo', 'titulo cabecalho manuscrito', (p, st) => { const w = wide(p, 0.8); return [T0(st, 0, 0, w, 16, 'Meu título', { font: st.script, size: 30, color: st.pal.a, align: 'center', valign: 'middle', lh: 1, role: 'h1' }), T0(st, 0, 17, w, 7, 'subtítulo ou data', { font: st.title, size: 9, color: st.pal.ink, align: 'center', valign: 'middle', ls: 0.12, role: 'h2' })]; });
    C('txt-citacao', 'Citação', 'frase citacao aspas', (p, st) => { const w = wide(p, 0.7); return [T0(st, 0, 0, 14, 14, '❝', { font: SYMF, size: 22, color: st.pal.b, align: 'left', role: 'h4' }), T0(st, 6, 8, w - 6, 26, 'Escreva aqui uma frase que inspire o seu dia.', { font: st.script, size: 17, color: st.pal.ink, lh: 1.25, role: 'h3' }), T0(st, 6, 36, w - 6, 6, '— quem disse', { size: 8, color: st.pal.a, align: 'right', role: 'h4' })]; });
    C('txt-caixa', 'Caixa de texto com título', 'caixa titulo anotacao', (p, st) => sty(T0(st, 0, 0, wide(p, 0.7), 34, 'Escreva aqui…', { size: 9 }), 'Título'));
    C('txt-frase', 'Frase do dia', 'frase dia motivacao', (p, st) => sty(T0(st, 0, 0, wide(p, 0.7), 24, 'Hoje eu vou…', { font: st.script, size: 16, color: st.pal.ink, align: 'center', valign: 'middle' }), 'Frase do dia'));
    C('txt-topicos', 'Lista de tópicos', 'lista topicos marcadores bullet', (p, st) => sty(T0(st, 0, 0, wide(p, 0.7), 40, '• primeiro item\n• segundo item\n• terceiro item', { size: 9, lh: 1.7 }), 'Tópicos'));
    C('txt-etiqueta', 'Etiqueta', 'etiqueta tag rotulo', (p, st) => [E('rect', 0, 0, 44, 10, { fill: st.pal.soft, stroke: st.pal.a, sw: 0.35, radius: 5 }), T0(st, 0, 0, 44, 10, 'etiqueta', { font: st.title, size: 8, color: st.pal.ink, align: 'center', valign: 'middle', ls: 0.1, role: 'h2' })]);
    C('txt-recado', 'Recado com símbolos', 'recado simbolos coracao estrela', (p, st) => { const w = wide(p, 0.7); return [T0(st, 0, 0, w, 20, '', { font: st.script, size: 16, align: 'center', valign: 'middle', color: st.pal.ink, runs: [{ t: '♡ ', font: SYMF, color: st.pal.b }, { t: 'um recado ' }, { t: 'para você', color: st.pal.a }, { t: ' ✦', font: SYMF, color: st.pal.b }] }) , E('line', w * 0.2, 22, w * 0.6, 1, { stroke: st.pal.line, sw: 0.3, dash: 'solid' })]; });
    C('txt-colunas', 'Duas colunas de texto', 'colunas duas texto', (p, st) => { const w = wide(p, 0.8), c = (w - 4) / 2; return [sty(T0(st, 0, 0, c, 40, 'Escreva aqui…', { size: 9 }), 'Coluna 1'), sty(T0(st, c + 4, 0, c, 40, 'Escreva aqui…', { size: 9 }), 'Coluna 2')]; });
    C('txt-destaque', 'Destaque misto', 'destaque misto fontes cores', (p, st) => [T0(st, 0, 0, wide(p, 0.8), 18, '', { font: st.script, size: 24, align: 'center', valign: 'middle', color: st.pal.a, runs: [{ t: 'Meu ' }, { t: 'planner', font: 'Playfair Display', color: st.pal.ink, italic: true }] })]);
  }

  function moveTextp() {
    if (!window.WX || typeof TEXTP === 'undefined' || WX.CAT.some((x) => x.k === 'tp-0')) return;
    TEXTP.forEach((t, i) => WX.CAT.unshift({ k: 'tp-' + i, n: t[0], cats: ['textos'], kw: 'texto modelo ' + t[0].toLowerCase(), fn: (p, st) => { const o = t[1], f = o.font === '@script' ? st.script : o.font === '@title' ? st.title : o.font === '@body' ? st.body : o.font; return tx(0, 0, o.w, o.h, o.text, Object.assign({}, o, { font: f, color: o.color === '@a' ? st.pal.a : o.color === '@ink' ? st.pal.ink : '#3E3550' })); } }));
  }

  /* =====================================================================
     Configuração de texto no ModuLab (níveis + combinação de fontes)
     ===================================================================== */
  function tiposPrev(cv, it, bw, bh) {
    const d = window.devicePixelRatio || 1; cv.width = bw * d; cv.height = bh * d; cv.style.width = bw + 'px'; cv.style.height = bh + 'px'; const c = cv.getContext('2d'); c.scale(d, d); c.fillStyle = '#FBF7F4'; c.fillRect(0, 0, bw, bh);
    const H = it.hs || {}; let y = 14; KEYS.forEach((k) => { const o = Object.assign({}, DEFHS[k], H[k] || {}), s = Math.max(8, Math.min(16, (o.size || 8) * 1.4)); c.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${s}px "${o.font || 'Nunito'}", sans-serif`; c.fillStyle = o.color || '#3E3550'; c.textBaseline = 'middle'; c.fillText(`${LV[k][0]} ${LV[k][1]}`, 10, y + 4); y += 17; });
  }
  function tiposModal(item) {
    const st = item ? clone(item) : { kind: 'tipos', name: 'Minha configuração de texto', hs: Object.fromEntries(KEYS.map((k) => [k, hs(k)])), fontsC: null, hf: null };
    let lv = 'h1'; const cur = styleOf(); st.fontsC = st.fontsC || { title: cur.title, script: cur.script, body: cur.body };
    const L = fontList(), op = (v) => L.map((f) => `<option value="${esc(f)}"${f === v ? ' selected' : ''}>${esc(f)}</option>`).join('');
    const body = () => `<div class="lvrow"><label class="pfield"><span>Títulos</span><select data-tf="title">${op(st.fontsC.title)}</select></label><label class="pfield"><span>Caligrafia</span><select data-tf="script">${op(st.fontsC.script)}</select></label><label class="pfield"><span>Corpo</span><select data-tf="body">${op(st.fontsC.body)}</select></label></div>
      <div class="chips">${KEYS.map((k) => `<button type="button" class="chip${lv === k ? ' on' : ''}" data-tl="${k}">${LV[k][0]} · ${LV[k][1]}</button>`).join('')}</div>
      <p class="hint">${LV[lv][2]}</p><div class="lvg">${controls('~' + lv, Object.assign({}, DEFHS[lv], st.hs[lv] || {}))}</div>
      <div class="tpprev">${KEYS.map((k) => { const o = Object.assign({}, DEFHS[k], st.hs[k] || {}); return `<div style="font-family:'${esc(o.font || 'Nunito')}';font-size:${Math.min(26, (o.size || 8) * 1.5)}px;font-weight:${o.weight || 400};font-style:${o.italic ? 'italic' : 'normal'};text-decoration:${[o.ul ? 'underline' : '', o.st ? 'line-through' : ''].join(' ').trim() || 'none'};text-align:${o.align || 'left'};color:${o.color || '#3E3550'};opacity:${o.opacity ?? 1}">${LV[k][0]} · ${LV[k][1]}</div>`; }).join('')}</div>`;
    modal(`<h2>${item ? 'Editar' : 'Nova'} configuração de texto</h2><label class="f">Nome<input type="text" id="tpName" value="${esc(st.name)}"></label><div id="tpBody">${body()}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="tpSv" type="button">Salvar no ModuLab</button></div>`, (b, close) => {
      const re = () => { const sc = $('#tpBody', b).scrollTop; $('#tpBody', b).innerHTML = body(); }; const set = (k, v) => { st.hs[lv] = Object.assign({}, DEFHS[lv], st.hs[lv] || {}); if (k === 'bold') st.hs[lv].weight = v ? 700 : 400; else if (['ul', 'st', 'italic'].includes(k)) { if (v) st.hs[lv][k] = true; else delete st.hs[lv][k]; } else st.hs[lv][k] = v; };
      const prevOnly = () => { const t = $('.tpprev', b); if (t) t.outerHTML = body().match(/<div class="tpprev">[\s\S]*<\/div>$/)[0]; };
      b.addEventListener('input', (ev) => { const i = ev.target; if (i.dataset && i.dataset.lvr && i.dataset.lvr[0] === '~' && ['number', 'range', 'color'].includes(i.type)) { set(i.dataset.lvk, readVal(i)); prevOnly(); } });
      b.addEventListener('change', (ev) => { const i = ev.target; if (!i.dataset) return; if (i.dataset.tf) { st.fontsC[i.dataset.tf] = i.value; return; } if (i.dataset.lvr && i.dataset.lvr[0] === '~' && !i.dataset.tg) { set(i.dataset.lvk, readVal(i)); re(); } });
      b.addEventListener('click', (ev) => { const x = ev.target.closest('button'); if (!x || !x.dataset) return; if (x.dataset.tl) { lv = x.dataset.tl; re(); return; } if (x.dataset.lvr && x.dataset.lvr[0] === '~' && x.dataset.lvk) { const v = x.dataset.tg ? !x.classList.contains('on') : x.dataset.v; set(x.dataset.lvk, v); re(); } });
      $('#tpSv', b).onclick = async () => { const it = Object.assign({}, item || {}, { id: item ? item.id : uid('l'), kind: 'tipos', name: ($('#tpName', b).value || '').trim() || 'Minha configuração', hs: st.hs, fontsC: st.fontsC, hf: st.hf || null, createdAt: item ? item.createdAt : Date.now(), updatedAt: Date.now() }); close(); try { await Store.saveLib(it); const i = S.lib.findIndex((q) => q.id === it.id); if (i >= 0) S.lib[i] = it; else S.lib.push(it); toast('Configuração de texto salva no ModuLab. 💜'); if (window.ModuLab && ModuLab.refresh) ModuLab.refresh(); } catch (e) { toast('Não consegui salvar agora.'); } };
    }, true);
  }

  /* ---------- encaixes ---------- */
  function boot() {
    wireProps(); wireLevel(); hfWire(); addTextWidgets(); moveTextp();
    if (typeof PANELS !== 'undefined' && PANELS.texto && !PANELS.texto._lv) {
      const t = PANELS.texto, h0 = t.html, m0 = t.mount;
      t.html = function () { return fontesHTML(); };
      t.mount = function (P) { fontesMount(P); };
      t._lv = 1;
    }
    if (typeof renderProps === 'function' && !renderProps._lv) {
      const r0 = renderProps; const r1p = function () {
        const P = document.getElementById('props');
        if (S.lvEdit && selEls().length === 0 && P && levelEditor(P)) return;
        if (selEls().length) S.lvEdit = null;
        const out = r0.apply(this, arguments); if (P && S.meta) { P.querySelectorAll('[data-acc="lvl"],[data-acc="hfx"]').forEach((x) => x.remove()); try { section(P); if (!selEls().length) hfSection(P); } catch (e) { console.warn(e); } } return out;
      }; r1p._lv = 1; renderProps = r1p;
    }
    if (typeof renderPanel === 'function' && !window._lvRP) { window._lvRP = 1; }
  }
  window.Textos = { LV, hs, boot, apply, prev: tiposPrev, openTipos: tiposModal, richModal, applyCombo };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();
