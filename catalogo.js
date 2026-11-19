/* Catálogo — banco de dados do estúdio: itens padrão do app + itens do catálogo (envios feitos aqui) + espelho do ModuLab,
   com histórico (data e hora) de tudo que entra, muda ou sai. O que é enviado fora do catálogo fica em "Minhas coisas". */
(function () {
  'use strict';
  const MLK = ['wgt', 'bdr', 'pat', 'tema', 'wsty', 'stk', 'tipos', 'colecao', 'outro'];
  const CATS = [
    ['widgets', 'Widgets', ['widget', 'wgt', 'wsty'], 'widget'],
    ['adesivos', 'Adesivos', ['sticker', 'stk'], 'sticker'],
    ['bordas', 'Bordas e padrões', ['border', 'bdr', 'pat'], 'border'],
    ['fundos', 'Fundos', ['background'], 'background'],
    ['fontes', 'Fontes', ['font', 'tipos'], 'font'],
    ['temas', 'Temas', ['tema'], null],
    ['colecoes', 'Coleções e outros', ['colecao', 'outro'], null],
    ['modelos', 'Modelos de página', ['template'], null],
  ];
  const UPK = [['widget', 'Widget (PNG/JPEG)'], ['sticker', 'Adesivo (PNG/JPEG)'], ['border', 'Borda (PNG/JPEG)'], ['background', 'Fundo de página (PNG/JPEG)'], ['font', 'Fonte (TTF/OTF)']];
  const KN = { widget: 'Widget', wgt: 'Widget', wsty: 'Estilo de widget', sticker: 'Adesivo', stk: 'Adesivo', border: 'Borda', bdr: 'Borda', pat: 'Padrão', background: 'Fundo', font: 'Fonte', tipos: 'Tipografia', tema: 'Tema', colecao: 'Coleção', outro: 'Outro', template: 'Modelo', logo: 'Logo' };
  const SKIP = ['hist', 'config'];
  const st = { view: 'cat', cat: 'todos', hf: 'todos', up: 'widget' };
  const isCat = (x) => !!x.cat || MLK.includes(x.kind);
  const fmt = (t) => { try { return new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return ''; } };
  const catOfKind = (k) => (CATS.find((c) => c[2].includes(k)) || [])[0];

  /* ---------- histórico ---------- */
  let logBusy = Promise.resolve();
  function log(action, it, det) {
    if (!it || SKIP.includes(it.kind)) return;
    logBusy = logBusy.then(async () => {
      const now = Date.now(), last = S.lib.filter((x) => x.kind === 'hist').sort((a, b) => b.at - a.at)[0];
      if (last && last.iid === it.id && last.action === action && now - last.at < 45000) { const u = Object.assign({}, last, { at: now, n: (last.n || 1) + 1, iname: it.name || last.iname }); await IDB.put('lib', u.id, (({ id, ...r }) => r)(u)); Object.assign(last, u); return; }
      const h = { id: uid('h'), kind: 'hist', at: now, action, ik: it.kind, iid: it.id, iname: it.name || it.family || KN[it.kind] || '', inCat: isCat(it), det: det || '' };
      await IDB.put('lib', h.id, (({ id, ...r }) => r)(h)); S.lib.push(h);
      const hs = S.lib.filter((x) => x.kind === 'hist').sort((a, b) => a.at - b.at);
      while (hs.length > 1000) { const o = hs.shift(); await IDB.del('lib', o.id); S.lib.splice(S.lib.indexOf(o), 1); }
    }).catch((e) => console.error(e)).then(() => { if (S.tab === 'catalogo' && st.view === 'hist') try { renderPanel(); } catch (e) { /* */ } });
  }
  const _save = Store.saveLib.bind(Store), _del = Store.delLib.bind(Store);
  let forceCat = false;
  Store.saveLib = function (it) { if (it && forceCat && !S.lib.some((x) => x.id === it.id) && UPK.some((u) => u[0] === it.kind)) it.cat = true; if (it && !SKIP.includes(it.kind) && !(it.kind === 'logo')) { const had = S.lib.some((x) => x.id === it.id); log(had ? 'modificado' : 'criado', it); } return _save(it); };
  Store.delLib = function (it) { if (it) log('excluído', it); return _del(it); };

  /* ---------- envio com resolução mínima ---------- */
  const readDims = (f) => new Promise((res) => { const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); }; im.onerror = () => res(null); im.src = u; });
  function minFor(kind) {
    if (kind === 'sticker' || kind === 'widget') return { w: 300, h: 300, any: true, why: 'o lado maior precisa ter ao menos 300 px para não ficar pixelado' };
    const p = curPage() || { w: 148, h: 210 }; return { w: Math.round(p.w / 25.4 * 150), h: Math.round(p.h / 25.4 * 150), why: 'cobrir uma página do tamanho da atual a 150 dpi' };
  }
  async function upload(files, kind) {
    const ok = [], rule = minFor(kind);
    for (const f of files) {
      if (kind === 'font') { ok.push(f); continue; }
      const d = await readDims(f); if (!d) { ok.push(f); continue; }
      const pass = rule.any ? Math.max(d.w, d.h) >= rule.w : d.w >= rule.w && d.h >= rule.h;
      if (pass) { ok.push(f); continue; }
      const use = await new Promise((res) => modal(`<h2>Imagem pequena demais</h2><p class="hint"><b>${esc(f.name)}</b> tem ${d.w} × ${d.h} px. Para ${esc(rule.why)}, o mínimo é <b>${rule.any ? rule.w + ' px no lado maior' : rule.w + ' × ' + rule.h + ' px'}</b>.</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" id="cgNo">Escolher outra</button><button class="btn" id="cgYes">Usar assim mesmo</button></div>`, (b, close) => { $('#cgNo', b).onclick = () => { close(); res(false); }; $('#cgYes', b).onclick = () => { close(); res(true); }; }));
      if (use) ok.push(f);
    }
    if (!ok.length) return;
    const before = new Set(S.lib.map((x) => x.id));
    forceCat = true; try { await uploadFiles(ok, kind); } finally { forceCat = false; }
    const added = S.lib.filter((x) => !before.has(x.id) && x.kind === kind);
    if (added.length) { toast(`${added.length} item${added.length > 1 ? 's' : ''} no catálogo. 🌸`); renderPanel(); }
  }
  async function move(it, toCat) { const u = Object.assign({}, it, { cat: !!toCat, updatedAt: Date.now() }); await _save(u); Object.assign(it, u); log(toCat ? 'enviado ao catálogo' : 'movido para Minhas coisas', it); renderPanel(); }
  async function rename(it) {
    modal(`<h2>Renomear</h2><label class="f">Nome<input type="text" id="cgNm" value="${esc(it.name || it.family || '')}" maxlength="60"></label><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="cgOk">Salvar</button></div>`, (b, close) => {
      $('#cgOk', b).onclick = async () => { const v = $('#cgNm', b).value.trim(); if (!v) return; const old = it.name; const u = Object.assign({}, it, { name: v, updatedAt: Date.now() }); await Store.saveLib(u); Object.assign(it, u); close(); renderPanel(); };
    });
  }


  /* ---------- nuvem (opcional): mesma conta do estúdio ---------- */
  const sync = { busy: false, msg: '' };
  const synced = () => S.lib.filter((x) => isCat(x) || x.kind === 'hist');
  async function syncNow() {
    if (!window.Cloud || !Cloud.sb || !Cloud.user) { toast('Entre na nuvem primeiro (botão “Entrar na nuvem”).'); return; }
    if (sync.busy) return; sync.busy = true; sync.msg = 'Sincronizando…'; renderPanel();
    const sb = Cloud.sb, uid0 = Cloud.user.id; let up = 0, down = 0;
    try {
      const r = await sb.from('estudio_catalogo').select('id,tipo,dados,arquivo,excluido,atualizado_em').eq('user_id', uid0);
      if (r.error) throw r.error;
      const remote = new Map(r.data.map((x) => [x.id, x]));
      for (const it of synced()) { // envia o que é novo ou mais recente aqui
        const at = it.updatedAt || it.createdAt || it.at || 0, rm = remote.get(it.id);
        if (rm && rm.atualizado_em >= at) continue;
        let arquivo = null;
        if (it.src && ASSET_URL.has(it.src)) { const blob = await IDB.get('assets', it.src); if (blob) { arquivo = `${uid0}/catalogo/${it.src}`; const u = await sb.storage.from('estudio').upload(arquivo, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' }); if (u.error) throw u.error; } }
        const { id, ...dados } = it;
        const w = await sb.from('estudio_catalogo').upsert({ user_id: uid0, id, tipo: it.kind, dados, arquivo, excluido: false, atualizado_em: at || Date.now() }); if (w.error) throw w.error; up++;
      }
      for (const rm of r.data) { // traz o que só existe na nuvem (ou é mais novo lá)
        if (rm.excluido) continue;
        const loc = S.lib.find((x) => x.id === rm.id), lat = loc ? (loc.updatedAt || loc.createdAt || loc.at || 0) : -1;
        if (loc && lat >= rm.atualizado_em) continue;
        const it = Object.assign({}, rm.dados, { id: rm.id });
        if (rm.arquivo && it.src && !ASSET_URL.has(it.src)) { const d = await sb.storage.from('estudio').download(rm.arquivo); if (d.error) throw d.error; await IDB.put('assets', it.src, d.data); ASSET_URL.set(it.src, URL.createObjectURL(d.data)); }
        const { id, ...rest } = it; await IDB.put('lib', id, rest);
        if (loc) Object.assign(loc, it); else S.lib.push(it);
        if (it.kind === 'font' && it.family) { try { await loadUserFont(it); } catch (e) { /* */ } }
        down++;
      }
      sync.msg = `Pronto: ${up} enviado${up === 1 ? '' : 's'}, ${down} recebido${down === 1 ? '' : 's'} · ${fmt(Date.now())}`;
    } catch (e) { console.error(e); sync.msg = 'Não consegui sincronizar. Confira se rodou o arquivo supabase/catalogo.sql no Supabase.'; }
    sync.busy = false; renderPanel();
  }

  /* ---------- miniaturas ---------- */
  function tile(it) {
    const hasImg = !!it.src && it.kind !== 'font';
    const im = hasImg ? `<img src="${esc(srcUrl(it.src))}" alt="" loading="lazy">` : it.kind === 'font' ? `<span style="font-family:'${esc(it.family || '')}';font-size:18px">Aa</span>` : `<canvas data-cpv="${it.id}" width="190" height="120"></canvas>`;
    const mine = !isCat(it) || it.cat;
    const mirror = MLK.includes(it.kind) && !it.cat;
    return `<div class="ctile"><div class="cim" data-cuse="${it.id}" role="button" tabindex="0" title="${esc(it.name || it.family || '')}">${im}</div>
      <div class="cnm" title="${esc(it.name || it.family || '')}">${esc(it.name || it.family || KN[it.kind] || '')}</div>
      <div class="cact"><button type="button" class="btn sm ghost" data-cren="${it.id}" title="Renomear">✎</button>${mirror ? '<span class="cbadge" title="Criado no ModuLab e espelhado aqui">ModuLab</span>' : `<button type="button" class="btn sm ghost" data-cmv="${it.id}" title="${it.cat ? 'Mover para Minhas coisas' : 'Enviar ao catálogo'}">${it.cat ? '↧' : '↥'}</button>`}<button type="button" class="btn sm ghost danger" data-cdl="${it.id}" title="Excluir">×</button></div></div>`;
  }
  const builtin = (key) => {
    if (key === 'widgets' && typeof WIDGETS !== 'undefined') return WIDGETS.map(([k, n]) => `<button type="button" class="ctile bi" data-cbw="${k}"><div class="cim"><canvas data-cbp="${k}"></canvas></div><div class="cnm">${esc(n)}</div></button>`).join('');
    if (key === 'adesivos' && typeof STICKERS !== 'undefined') return STICKERS.map((s, i) => `<button type="button" class="ctile bi" data-cbs="${i}"><div class="cim"><canvas data-cbq="${i}"></canvas></div><div class="cnm">${esc(SHAPES[s[0]] || 'Adesivo')}</div></button>`).join('');
    if (key === 'fontes' && typeof FONTS !== 'undefined') return `<div class="cfonts">${FONTS.map((f) => `<div class="cfont" style="font-family:'${esc(f[0])}'">${esc(f[0])}<small>${esc(f[1] || '')}</small></div>`).join('')}</div>`;
    if (key === 'modelos' && typeof TPL !== 'undefined') return `<div class="cfonts">${Object.keys(TPL).map((k) => `<div class="cfont">${esc(TPL[k].nome || k)}<small>modelo do app</small></div>`).join('')}</div>`;
    return '';
  };
  const section = (id, title, body, open) => { const o = (Pref.acc && Pref.acc['cat_' + id] !== undefined) ? Pref.acc['cat_' + id] : open; return `<div class="wacc${o ? ' open' : ''}" data-cacc="cat_${id}"><button type="button" class="wah" aria-expanded="${o}"><i class="wtri"></i><b>${title}</b></button><div class="wab">${body}</div></div>`; };

  function histHTML() {
    const hs = S.lib.filter((x) => x.kind === 'hist').sort((a, b) => b.at - a.at), acts = ['todos', ...new Set(hs.map((h) => h.action))], list = hs.filter((h) => st.hf === 'todos' || h.action === st.hf);
    const col = (a) => (/exclu/.test(a) ? 'danger' : /cria|envia/.test(a) ? 'ok' : 'mod');
    return `<label class="f">Mostrar<select id="cgHf">${acts.map((a) => `<option value="${esc(a)}"${a === st.hf ? ' selected' : ''}>${a === 'todos' ? 'Tudo' : esc(a)}</option>`).join('')}</select></label>
      ${list.length ? `<div class="chist">${list.map((h) => `<div class="chrow"><span class="chd">${esc(fmt(h.at))}</span><span class="chb ${col(h.action)}">${esc(h.action)}${h.n > 1 ? ' ×' + h.n : ''}</span><span class="chn"><b>${esc(h.iname || '—')}</b> <small>${esc(KN[h.ik] || h.ik)}${h.inCat ? ' · catálogo' : ' · minhas coisas'}</small></span></div>`).join('')}</div>` : '<p class="hint">Ainda não há registros. Tudo que for enviado, criado, alterado ou excluído passa a aparecer aqui, com data e hora.</p>'}`;
  }
  function listHTML(mine) {
    const cats = CATS.filter((c) => st.cat === 'todos' || c[0] === st.cat);
    return cats.map((c) => {
      const items = S.lib.filter((x) => c[2].includes(x.kind) && (mine ? !isCat(x) : isCat(x))), bi = mine ? '' : builtin(c[0]);
      if (!items.length && !bi) return mine ? '' : section(c[0], `${c[1]} · 0`, '<p class="hint">Nada aqui ainda.</p>', false);
      return section(c[0], `${c[1]} · ${items.length}${bi && !mine ? ' + padrão' : ''}`, `${bi ? `<small class="cl">PADRÃO DO APP</small><div class="cgrid">${/cfonts/.test(bi) ? '' : bi}</div>${/cfonts/.test(bi) ? bi : ''}` : ''}${items.length ? `<small class="cl">${mine ? 'MINHAS COISAS' : 'NO CATÁLOGO'}</small><div class="cgrid">${items.map(tile).join('')}</div>` : ''}`, st.cat !== 'todos');
    }).join('') || '<p class="hint">Nada por aqui ainda.</p>';
  }

  PANELS.catalogo = {
    html() {
      const tab = (k, n) => `<button type="button" data-cv="${k}" class="${st.view === k ? 'on' : ''}">${n}</button>`;
      const chips = st.view === 'hist' ? '' : `<div class="bdchips cgchips">${[['todos', 'Tudo'], ...CATS.map((c) => [c[0], c[1]])].map(([k, n]) => `<button type="button" class="chip${st.cat === k ? ' on' : ''}" data-cc="${k}">${n}</button>`).join('')}</div>`;
      const up = st.view === 'cat' ? section('up', 'Enviar ao catálogo', `<div class="fgrid"><label class="pfield"><span>Tipo</span><select id="cgUk">${UPK.map(([k, n]) => `<option value="${k}"${st.up === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div><span class="btn sm upl">Escolher arquivos<input type="file" id="cgUf" multiple accept="${st.up === 'font' ? '.ttf,.otf' : '.png,.jpg,.jpeg,image/png,image/jpeg'}" aria-label="Enviar ao catálogo"></span><p class="hint">${st.up === 'font' ? 'Fontes ficam disponíveis em todos os textos.' : 'Tamanho mínimo: ' + (st.up === 'sticker' || st.up === 'widget' ? '300 px no lado maior' : 'o suficiente para cobrir uma página a 150 dpi') + '. Se for menor, aviso antes de guardar.'}</p>`, true) : '';
      return `<h2>Catálogo</h2><p class="hint">Os itens padrão do app e tudo que você guardar aqui são lidos pelo editor e pelo ModuLab. O que você envia pelas outras abas fica em “Minhas coisas”.</p>
        <div class="segf bdtabs cgtabs">${tab('cat', 'Catálogo')}${tab('mine', 'Minhas coisas')}${tab('hist', 'Histórico')}</div>${chips}${up}
        ${st.view === 'hist' ? histHTML() : listHTML(st.view === 'mine')}
        ${section('cloud', 'Nuvem', `<p class="hint">Guarda o catálogo e o histórico na sua conta (além deste aparelho) e traz o que estiver só lá.</p><button type="button" class="btn sm" id="cgSync"${sync.busy ? ' disabled' : ''}>Sincronizar agora</button><p class="hint">${esc(sync.msg || (window.Cloud && Cloud.user ? '' : 'Entre na nuvem para sincronizar.'))}</p>`, false)}`;
    },
    mount(P) {
      $$('[data-cv]', P).forEach((b) => b.onclick = () => { st.view = b.dataset.cv; renderPanel(); });
      $$('[data-cc]', P).forEach((b) => b.onclick = () => { st.cat = b.dataset.cc; renderPanel(); });
      $$('[data-cacc]', P).forEach((a) => { $('.wah', a).onclick = () => { const o = !a.classList.contains('open'); a.classList.toggle('open', o); Pref.acc = Pref.acc || {}; Pref.acc[a.dataset.cacc] = o; savePref(); }; });
      const sy = $('#cgSync', P); if (sy) sy.onclick = syncNow;
      const hf = $('#cgHf', P); if (hf) hf.onchange = () => { st.hf = hf.value; renderPanel(); };
      const uk = $('#cgUk', P); if (uk) uk.onchange = () => { st.up = uk.value; renderPanel(); };
      const uf = $('#cgUf', P); if (uf) uf.onchange = async () => { const fs = [...uf.files]; uf.value = ''; if (fs.length) await upload(fs, st.up); };
      const paint = () => {
        $$('[data-cbp]', P).forEach((cv) => { const w = WIDGETS.find((x) => x[0] === cv.dataset.cbp); if (w) { const e = w[2](curPage(), styleOf()); e.x = 0; e.y = 0; elPreview(cv, e, 64, 44); } });
        $$('[data-cbq]', P).forEach((cv) => { const e = stickerEl(+cv.dataset.cbq); e.x = 0; e.y = 0; elPreview(cv, e, 64, 44); });
        $$('canvas[data-cpv]', P).forEach((cv) => { const it = S.lib.find((x) => x.id === cv.dataset.cpv); if (it && window.ModuLab && ModuLab.itemPrev) try { ModuLab.itemPrev(cv, it, 190, 120); } catch (e) { /* */ } });
      };
      paint(); S.panelRepaint = paint;
      $$('[data-cbw]', P).forEach((b) => b.onclick = () => { const w = WIDGETS.find((x) => x[0] === b.dataset.cbw); addEl(w[2](curPage(), styleOf()), w[3]); });
      $$('[data-cbs]', P).forEach((b) => b.onclick = () => addEl(stickerEl(+b.dataset.cbs)));
      const get = (id) => S.lib.find((x) => x.id === id);
      $$('[data-cuse]', P).forEach((b) => { const act = () => { const it = get(b.dataset.cuse); if (!it) return; if (it.src && it.kind !== 'font') useLib(it); else if (MLK.includes(it.kind) && window.ModuLab && ModuLab.openEditor && !['pat', 'colecao', 'outro', 'tipos'].includes(it.kind)) ModuLab.openEditor(it.kind, it); else if (it.kind === 'pat' && ModuLab.openPat) ModuLab.openPat(it); else toast('Este item é usado pelo ModuLab e pelas abas correspondentes.'); }; b.onclick = act; b.onkeydown = (e) => { if (e.key === 'Enter') act(); }; });
      $$('[data-cren]', P).forEach((b) => b.onclick = () => { const it = get(b.dataset.cren); if (it) rename(it); });
      $$('[data-cmv]', P).forEach((b) => b.onclick = () => { const it = get(b.dataset.cmv); if (it) move(it, !it.cat); });
      $$('[data-cdl]', P).forEach((b) => b.onclick = async () => { if (!b.dataset.cf) { b.dataset.cf = 1; b.classList.add('cf'); b.textContent = 'confirmar'; return; } const it = get(b.dataset.cdl); if (!it) return; try { await Store.delLib(it); S.lib = S.lib.filter((x) => x.id !== it.id); renderPanel(); } catch (e) { toast('Não consegui excluir.'); } });
    },
  };
  TABS.splice(TABS.findIndex((t) => t[0] === 'biblioteca'), 0, ['catalogo', 'Catálogo']);
  ICON.catalogo = '<path d="M4 4h5a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z"/>';
  try { renderRail(); } catch (e) { /* */ }

  /* itens do catálogo também aparecem nas abas Widgets e Adesivos */
  [['widgets', 'widget', 'DO CATÁLOGO'], ['adesivos', 'sticker', 'DO CATÁLOGO']].forEach(([tab, kind, t]) => {
    const old = PANELS[tab].html;
    PANELS[tab].html = function () { const its = S.lib.filter((x) => x.kind === kind && x.cat); return old.call(this) + (its.length ? `<div class="libsec"><div class="lhd"><h3>${t}</h3></div><div class="litems">${its.map(libItem).join('')}</div></div>` : ''); };
  });

  window.Catalogo = { log, move, st, isCat };
})();
