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
      $('#tpGo', b).onclick = async () => { const name = ($('#tpN', b).value || '').trim() || 'Meus textos'; const it = { id: uid('l'), kind: 'tipos', name, hs: Object.fromEntries(KEYS.map((k) => [k, hs(k)])), fontsC: (S.meta.style && S.meta.style.fontsC) || null, pair: (S.meta.style && S.meta.style.pair) || null, createdAt: Date.now() }; close(); try { await Store.saveLib(it); S.lib.push(it); toast('Configuração guardada. 💜'); renderPanel(); } catch (e) { toast('Não consegui guardar agora.'); } };
    });
  }
  function useLevels(it) {
    S.meta.hs = clone(it.hs || {}); const st = Object.assign({}, S.meta.style || {}); if (it.fontsC) st.fontsC = clone(it.fontsC); if (it.pair) st.pair = it.pair; S.meta.style = st;
    const ids = S.order.filter((id) => S.pages[id]); change(ids, () => ids.forEach((id) => S.pages[id].els.forEach((e) => { if (e.type === 'text' && e.role && S.meta.hs[e.role]) { const o = hs(e.role); ['font', 'size', 'color', 'weight', 'italic', 'ul', 'st', 'ls', 'align', 'valign', 'opacity'].forEach((k) => { if (o[k] !== undefined) setKey(e, k, o[k]); else if (['ul', 'st', 'italic'].includes(k)) delete e[k]; }); } })));
    Saver.m(); redraw(); refreshThumbs(); renderPanel(); toast('Configuração aplicada. 🌸');
  }

  /* ---------- painel Fontes ---------- */
  function fontesHTML() {
    const st = S.meta.style || {}, cur = styleOf(), combos = Object.entries(PAIRS || {}), mine = S.lib.filter((x) => x.kind === 'fontes'), tipos = S.lib.filter((x) => x.kind === 'tipos'), fu = S.lib.filter((x) => x.kind === 'font');
    const combo = (k, n, f, on) => `<button type="button" class="tcard fcb${on ? ' on' : ''}" data-fcb="${k}"><span style="font-family:'${esc(f.title)}';font-size:20px;line-height:1.1">${esc(n)}</span><span style="font-family:'${esc(f.script)}';font-size:18px">Planner</span><span class="hint" style="font-family:'${esc(f.body)}'">To-do · Habits</span></button>`;
    return `<h2>Fontes</h2><button type="button" class="btn sm ghost" data-fback>← Voltar para Texto</button>
      <h3>COMBINAÇÃO DE FONTES</h3><p class="hint">Título, caligrafia e corpo do projeto. Os widgets e textos que seguem a combinação mudam juntos.</p>
      <div class="plist">${combos.map(([k, v]) => combo(k, v.nome || k, v, !st.fontsC && (st.pair || 'assinatura') === k)).join('')}${mine.map((m) => combo('m:' + m.id, m.name, m.f, st.fontsC && st.fontsC.title === m.f.title && st.fontsC.script === m.f.script && st.fontsC.body === m.f.body)).join('')}</div>
      <button type="button" class="btn sm pri" data-fnew>Nova combinação…</button>
      <h3>NÍVEIS DE TEXTO</h3><p class="hint">Clique num nível para configurar fonte, tamanho, cor e mais. Vale para todo o projeto.</p>
      <div class="plist">${KEYS.map((k) => { const o = hs(k); return `<button type="button" class="tcard lvcard${S.lvEdit === k ? ' on' : ''}" data-flv="${k}"><span style="font-family:'${esc(o.font || (k === 'h1' || k === 'h2' ? cur.title : cur.body))}';font-size:${Math.min(26, (o.size || 8) * 1.6)}px;font-weight:${o.weight || 400};${o.italic ? 'font-style:italic;' : ''}text-decoration:${[o.ul ? 'underline' : '', o.st ? 'line-through' : ''].join(' ').trim() || 'none'};color:${o.color || 'var(--text)'}">${LV[k][0]} · ${LV[k][1]}</span><span class="hint">${LV[k][2]}</span></button>`; }).join('')}</div>
      <h3>MINHAS CONFIGURAÇÕES</h3>${tipos.length ? tipos.map((t) => `<div class="fontrow"><span>${esc(t.name)}</span><span><button class="btn sm" data-ftu="${t.id}">Aplicar</button> <button class="btn sm ghost danger" data-ftd="${t.id}">Excluir</button></span></div>`).join('') : '<p class="hint">Configure os níveis e use “Guardar esta configuração como padrão…”.</p>'}
      <h3>MINHAS FONTES</h3><div class="row"><span class="btn sm upl">Enviar fontes (TTF/OTF)<input type="file" accept=".ttf,.otf,font/ttf,font/otf" multiple data-fup aria-label="Enviar fontes"></span></div>
      ${fu.length ? fu.map((f) => `<div class="fontrow"><span class="pvw" style="font-family:'${esc(f.family)}'">${esc(f.family)} · Aa Bb 123</span><button class="btn sm ghost danger" data-ld="${f.id}">Excluir</button></div>`).join('') : '<p class="hint">As fontes enviadas aparecem em todas as listas de fonte e nas combinações.</p>'}`;
  }
  function fontesMount(P) {
    $$('[data-fback]', P).forEach((b) => b.onclick = () => { S.txView = null; S.lvEdit = null; renderPanel(); renderProps(); });
    $$('[data-fcb]', P).forEach((b) => b.onclick = () => { const k = b.dataset.fcb, st = Object.assign({}, S.meta.style || {}); if (k.startsWith('m:')) { const m = S.lib.find((x) => x.id === k.slice(2)); if (!m) return; st.fontsC = clone(m.f); } else { st.pair = k; delete st.fontsC; } S.meta.style = st; Saver.m(); redraw(); refreshThumbs(); renderPanel(); });
    $$('[data-flv]', P).forEach((b) => b.onclick = () => { S.lvEdit = b.dataset.flv; S.sel = []; redraw(); renderPanel(); renderProps(); });
    const nw = $('[data-fnew]', P); if (nw) nw.onclick = () => comboModal();
    $$('[data-ftu]', P).forEach((b) => b.onclick = () => { const it = S.lib.find((x) => x.id === b.dataset.ftu); if (it) useLevels(it); });
    $$('[data-ftd]', P).forEach((b) => b.onclick = async () => { try { await Store.delLib(b.dataset.ftd); S.lib = S.lib.filter((x) => x.id !== b.dataset.ftd); renderPanel(); } catch (e) { toast('Não consegui excluir.'); } });
    const fu = $('[data-fup]', P); if (fu) fu.onchange = async () => { await uploadFiles([...fu.files], 'font'); renderPanel(); };
    if (typeof mountLib === 'function') $$('[data-ld]', P).forEach((b) => b.onclick = async () => { try { await Store.delLib(b.dataset.ld); S.lib = S.lib.filter((x) => x.id !== b.dataset.ld); renderPanel(); } catch (e) { toast('Não consegui excluir.'); } });
  }
  function comboModal() {
    const st = styleOf(), L = fontList(), op = (v) => L.map((f) => `<option value="${esc(f)}"${f === v ? ' selected' : ''}>${esc(f)}</option>`).join('');
    modal(`<h2>Nova combinação de fontes</h2><label class="f">Nome<input type="text" id="fcN" value="Minha combinação"></label>
      <label class="f">Títulos<select id="fcT">${op(st.title)}</select></label><label class="f">Caligrafia<select id="fcS">${op(st.script)}</select></label><label class="f">Corpo<select id="fcB">${op(st.body)}</select></label>
      <p class="hint">Suas fontes enviadas também aparecem na lista.</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="fcGo" type="button">Guardar e usar</button></div>`, (b, close) => {
      $('#fcGo', b).onclick = async () => { const it = { id: uid('l'), kind: 'fontes', name: ($('#fcN', b).value || '').trim() || 'Minha combinação', f: { title: $('#fcT', b).value, script: $('#fcS', b).value, body: $('#fcB', b).value }, createdAt: Date.now() }; close(); try { await Store.saveLib(it); S.lib.push(it); } catch (e) { /* segue sem guardar na nuvem */ } const stl = Object.assign({}, S.meta.style || {}, { fontsC: clone(it.f) }); S.meta.style = stl; Saver.m(); redraw(); refreshThumbs(); renderPanel(); toast('Combinação aplicada. ✨'); };
    });
  }

  /* ---------- encaixes ---------- */
  function boot() {
    wireProps(); wireLevel();
    if (typeof PANELS !== 'undefined' && PANELS.texto && !PANELS.texto._lv) {
      const t = PANELS.texto, h0 = t.html, m0 = t.mount;
      t.html = function () { if (S.txView === 'fontes') return fontesHTML(); return h0.apply(this, arguments).replace('<h2>Texto</h2>', '<h2>Texto</h2><button type="button" class="btn sm" data-fopen style="margin-bottom:10px">Fontes e níveis de texto (H1–H6)</button>'); };
      t.mount = function (P) { if (S.txView === 'fontes') { fontesMount(P); return; } m0.apply(this, arguments); const o = $('[data-fopen]', P); if (o) o.onclick = () => { S.txView = 'fontes'; renderPanel(); }; };
      t._lv = 1;
    }
    if (typeof renderProps === 'function' && !renderProps._lv) {
      const r0 = renderProps; const r1p = function () {
        const P = document.getElementById('props');
        if (S.lvEdit && selEls().length === 0 && P && levelEditor(P)) return;
        if (selEls().length) S.lvEdit = null;
        const out = r0.apply(this, arguments); if (P && S.meta) { P.querySelectorAll('[data-acc="lvl"]').forEach((x) => x.remove()); try { section(P); } catch (e) { console.warn(e); } } return out;
      }; r1p._lv = 1; renderProps = r1p;
    }
    if (typeof renderPanel === 'function' && !window._lvRP) { window._lvRP = 1; }
  }
  window.Textos = { LV, hs, boot, apply };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();
