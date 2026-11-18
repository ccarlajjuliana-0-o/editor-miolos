/* Aba Tema — paleta livre, fontes, estilo dos widgets, moldura e borda das páginas, aplicados onde você escolher.
   Fica no menu da esquerda do editor, como Páginas. Temas criados no ModuLab aparecem aqui. */
(function () {
  'use strict';
  const NAMES = [['a', 'Cor A (destaque)'], ['b', 'Cor B (apoio)'], ['ink', 'Tinta (títulos)'], ['soft', 'Suave'], ['soft2', 'Suave 2'], ['line', 'Linhas'], ['text', 'Texto']];
  const KEYS = NAMES.map((n) => n[0]);
  const W = { pid: null };
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');

  if (typeof ICON !== 'undefined') ICON.tema = '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" fill-opacity=".3"/>';
  if (typeof TABS !== 'undefined' && !TABS.some((t) => t[0] === 'tema')) TABS.splice(1, 0, ['tema', 'Tema']);

  const palOf = (st) => { const p = st.pal; const o = {}; KEYS.forEach((k) => { o[k] = p[k]; }); return o; };
  function init() {
    const st = styleOf();
    W.pid = S.pid; W.pal = palOf(st); W.fonts = { script: st.script, title: st.title, body: st.body };
    W.frame = false; W.bdr = ''; W.recolor = true; W.restyle = true;
  }
  const presetKey = (pal) => Object.keys(PALS).find((k) => KEYS.every((x) => String(PALS[k][x]).toLowerCase() === String(pal[x]).toLowerCase())) || 'custom';
  const pairKey = (f) => Object.keys(PAIRS).find((k) => PAIRS[k].script === f.script && PAIRS[k].title === f.title && PAIRS[k].body === f.body) || '';

  /* ---------- trocar cores e fontes que já estão nas páginas ---------- */
  const SKIP = new Set(['id', 'src', 'text', 'name', 'link', 'labels', 'links', 'dayLinks', 'monthLinks', 'g']);
  function recolor(pg, cmap, fmap) {
    const walk = (o, key) => {
      if (typeof o === 'string') { if (isHex(o)) return cmap[o.toLowerCase()] || o; if (key && /font/i.test(key) && fmap[o]) return fmap[o]; return o; }
      if (Array.isArray(o)) return o.map((x) => walk(x, key));
      if (o && typeof o === 'object') { Object.keys(o).forEach((k) => { if (!SKIP.has(k)) o[k] = walk(o[k], k); }); }
      return o;
    };
    if (isHex(pg.bg)) pg.bg = cmap[pg.bg.toLowerCase()] || pg.bg;
    if (pg.border) walk(pg.border, 'border'); if (pg.frame) walk(pg.frame, 'frame');
    pg.els.forEach((e) => walk(e, ''));
  }

  function apply(P) {
    const old = styleOf(), oldPal = palOf(old), newPal = Object.assign({}, W.pal);
    const cmap = {}, fmap = {};
    KEYS.forEach((k) => { const a = String(oldPal[k]).toLowerCase(), b = newPal[k]; if (a !== b.toLowerCase()) cmap[a] = b; });
    [['script', old.script], ['title', old.title], ['body', old.body]].forEach(([k, f]) => { if (W.fonts[k] && W.fonts[k] !== f) fmap[f] = W.fonts[k]; });
    const pk = presetKey(newPal), pr = pairKey(W.fonts);
    const st = Object.assign({}, S.meta.style, { pal: pk, pair: pr || S.meta.style.pair || 'assinatura', fontsC: pr ? undefined : Object.assign({}, W.fonts) });
    if (pk === 'custom' || /^u_/.test(pk)) st.palC = Object.assign({}, newPal); else delete st.palC;
    if (!st.fontsC) delete st.fontsC;
    const ids = readScope(P, 'th'); if (!ids.length) { toast('Escolha pelo menos uma página.'); return; }
    const wst = st.wst, bd = W.bdr && W.bdr !== 'none' ? S.lib.find((x) => x.id === W.bdr) : null;
    S.meta.style = st; Saver.m();
    change(ids, () => ids.forEach((id) => {
      const p = S.pages[id];
      if (W.recolor && (Object.keys(cmap).length || Object.keys(fmap).length)) recolor(p, cmap, fmap);
      if (W.restyle && wst) p.els.forEach((e) => { if (window.WX && WX.ACCEPT.has(e.type) && e.wx) WX.applyId(e, wst); });
      if (W.frame && wst && window.WX) WX.applyPage(p, wst);
      if (W.bdr === 'none') p.border = null; else if (bd) p.border = clone(bd.border);
    }));
    S.sel = []; redraw(); refreshThumbs && refreshThumbs(); renderProps();
    init(); renderPanel(); toast(`Tema aplicado em ${ids.length} página${ids.length === 1 ? '' : 's'}. Ctrl+Z desfaz. 🌸`);
  }

  const macc = (id, title, inner) => { const open = (Pref.macc || {})[id] !== false; return `<div class="macc${open ? ' open' : ''}" data-macc="${id}"><button class="wah" type="button" aria-expanded="${open}"><i class="wtri"></i><b>${title}</b></button><div class="mab">${inner}</div></div>`; };

  PANELS.tema = {
    html() {
      if (W.pid !== S.pid || !W.pal) init();
      const ths = S.lib.filter((x) => x.kind === 'tema'), bds = S.lib.filter((x) => x.kind === 'bdr');
      const fl = (typeof fontList === 'function' ? fontList() : ['Quicksand', 'Nunito', 'Great Vibes']);
      const fsel = (k, label) => `<label class="pfield"><span>${label}</span><select data-tf="${k}">${[...new Set([W.fonts[k]].concat(fl))].map((f) => `<option${f === W.fonts[k] ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label>`;
      const cur = pairKey(W.fonts);
      return `<h2>Tema</h2><p class="hint">Paleta, fontes, estilo dos widgets, moldura e borda: escolha e diga onde aplicar.</p>
      <div class="tmprev" style="background:${W.pal.soft};color:${W.pal.text}"><div class="tmsw">${KEYS.map((k) => `<i style="background:${W.pal[k]}"></i>`).join('')}</div><b style="font-family:'${W.fonts.script}',cursive;color:${W.pal.ink};font-size:26px;font-weight:400">Meu planner</b><span style="font-family:'${W.fonts.title}';color:${W.pal.a};font-weight:700">Título em ${esc(W.fonts.title)}</span><span style="font-family:'${W.fonts.body}'">Texto corrido em ${esc(W.fonts.body)}</span></div>
      ${ths.length ? macc('tmt', 'Meus temas (ModuLab)', `<div class="chips">${ths.map((t) => `<button type="button" class="chip" data-th="${t.id}" title="Carregar ${esc(t.name)}"><i style="background:linear-gradient(135deg,${t.pal.a} 50%,${t.pal.b} 50%)"></i>${esc(t.name)}</button>`).join('')}</div><p class="hint">Escolher um tema só o carrega aqui. Ele vale depois de “Aplicar tema”.</p>`) : ''}
      ${macc('tmp', 'Paleta', `<div class="chips">${Object.entries(PALS).map(([k, p]) => `<button type="button" class="chip" data-tp="${k}"><i style="background:linear-gradient(135deg,${p.a} 50%,${p.b} 50%)"></i>${esc(p.nome)}</button>`).join('')}</div>
        <p class="hint">Ou escolha cada cor do jeito que quiser:</p><div class="mlrow">${NAMES.map(([k, n]) => `<label class="pfield"><span>${n}</span><input type="color" data-pc="${k}" value="${W.pal[k]}"></label>`).join('')}</div>`)}
      ${macc('tmf', 'Fontes', `<label class="pfield"><span>Combinações prontas</span><select id="tmPair"><option value=""${cur ? '' : ' selected'}>Personalizada</option>${Object.entries(PAIRS).map(([k, p]) => `<option value="${k}"${cur === k ? ' selected' : ''}>${p.nome} · ${p.script} + ${p.title}</option>`).join('')}</select></label>${fsel('script', 'Manuscrita (títulos grandes)')}${fsel('title', 'Títulos')}${fsel('body', 'Texto')}`)}
      ${macc('tmw', 'Estilo dos widgets', `<div class="pfield"><span>Estilo atual</span><button class="btn sm" id="tmWst" type="button">${window.WX ? esc(WX.globalName()) : 'Escolher'} · trocar…</button></div>${S.lib.some((x) => x.kind === 'wsty') ? '' : '<p class="hint">Crie estilos próprios no ModuLab.</p>'}<label class="chk"><input type="checkbox" id="tmFr"${W.frame ? ' checked' : ''}> Colocar a moldura do estilo nas páginas</label>`)}
      ${macc('tmb', 'Borda das páginas', `<label class="pfield"><span>Borda</span><select id="tmBd"><option value="">Não mudar</option><option value="none"${W.bdr === 'none' ? ' selected' : ''}>Remover a borda</option>${bds.map((b) => `<option value="${b.id}"${W.bdr === b.id ? ' selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label><p class="hint">Mais bordas na aba Bordas ou no ModuLab.</p>`)}
      ${macc('tma', 'Aplicar em', `${scopeHTML('th', true)}<label class="chk"><input type="checkbox" id="tmRc"${W.recolor ? ' checked' : ''}> Trocar as cores e fontes que já estão nas páginas</label><label class="chk"><input type="checkbox" id="tmRs"${W.restyle ? ' checked' : ''}> Trocar o estilo dos widgets que já estão nas páginas</label>`)}
      <div class="row" style="margin-top:12px"><button class="btn pri" id="tmGo" type="button">Aplicar tema</button><button class="btn" id="tmSave" type="button">Salvar no ModuLab</button></div>`;
    },
    mount(P) {
      $$('[data-macc] .wah', P).forEach((b) => b.onclick = () => { const a = b.parentNode, o = !a.classList.contains('open'); a.classList.toggle('open', o); b.setAttribute('aria-expanded', o); Pref.macc = Object.assign({}, Pref.macc, { [a.dataset.macc]: o }); savePref(); });
      mountScope(P, 'th'); $('#thSc', P).value = 'all'; $('#thSc', P).onchange();
      const keepScope = () => { const v = $('#thSc', P).value; return v; };
      const again = () => { const v = keepScope(); renderPanel(); const s = $('#thSc'); if (s) { s.value = v; s.onchange && s.onchange(); } };
      $$('[data-tp]', P).forEach((b) => b.onclick = () => { const p = PALS[b.dataset.tp]; KEYS.forEach((k) => { W.pal[k] = p[k]; }); again(); });
      $$('[data-th]', P).forEach((b) => b.onclick = () => { const t = S.lib.find((x) => x.id === b.dataset.th); if (!t) return; KEYS.forEach((k) => { W.pal[k] = t.pal[k]; }); const pr = PAIRS[t.pair]; if (pr) W.fonts = { script: pr.script, title: pr.title, body: pr.body }; if (t.bdr) W.bdr = t.bdr; if (t.frame) W.frame = true; again(); });
      $$('[data-pc]', P).forEach((i) => { i.oninput = () => { W.pal[i.dataset.pc] = i.value; const pv = $('.tmprev', P); if (pv) { pv.style.background = W.pal.soft; pv.style.color = W.pal.text; $$('.tmsw i', pv).forEach((s, n) => { s.style.background = W.pal[KEYS[n]]; }); } }; });
      $('#tmPair', P).onchange = (e) => { const p = PAIRS[e.target.value]; if (p) { W.fonts = { script: p.script, title: p.title, body: p.body }; again(); } };
      $$('[data-tf]', P).forEach((s) => s.onchange = () => { W.fonts[s.dataset.tf] = s.value; again(); });
      $('#tmWst', P).onclick = () => WX.openGlobal(() => again());
      $('#tmFr', P).onchange = (e) => { W.frame = e.target.checked; };
      $('#tmBd', P).onchange = (e) => { W.bdr = e.target.value; };
      $('#tmRc', P).onchange = (e) => { W.recolor = e.target.checked; }; $('#tmRs', P).onchange = (e) => { W.restyle = e.target.checked; };
      $('#tmGo', P).onclick = () => apply(P);
      $('#tmSave', P).onclick = async () => {
        const it = { id: uid('l'), kind: 'tema', name: 'Tema ' + (S.meta.name || 'do projeto'), pal: Object.assign({}, W.pal), pair: pairKey(W.fonts) || 'assinatura', wst: (S.meta.style && S.meta.style.wst) || '', frame: !!W.frame, bdr: W.bdr && W.bdr !== 'none' ? W.bdr : '', createdAt: Date.now(), updatedAt: Date.now() };
        await Store.saveLib(it); S.lib.push(it); if (window.ModuLab) ModuLab.sync(); toast('Tema salvo no ModuLab. 💜'); renderPanel();
      };
    },
  };
  window.TemaTab = { init, apply, recolor };
})();
