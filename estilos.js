/* Estilos — coleções de molduras + título para widgets e páginas.
   Um estilo é só dados (moldura, título, fundo). As cores usam "@" (@a, @ink…) e por isso acompanham a paleta do projeto. */
(function () {
  'use strict';
  const hd = (o) => Object.assign({ on: true, h: 7, fill: '@soft', c: '@ink', font: '@title', size: 8, weight: 700, align: 'center', ls: 0.06, line: false, lc: '@ink', lw: 0.3 }, o);
  const COLS = [
    { id: 'neutro', n: 'Neutro', s: [
      ['original', 'Original', { fr: { k: 'solid', w: 0.35, c: '@ink', r: 1.5 }, hd: hd({}), pad: 1.8 }],
      ['jovial', 'Jovial', { fr: { k: 'solid', w: 0.8, c: '@ink', r: 3.5 }, hd: hd({ fill: '@line', h: 7.5 }), pad: 2 }],
      ['mellow', 'Mellow', { fr: { k: 'solid', w: 0.45, c: '@ink', r: 3 }, hd: hd({ fill: '@soft' }), pad: 2 }],
      ['delicado', 'Delicado', { fr: { k: 'solid', w: 0.25, c: '@a', r: 2.5 }, hd: hd({ fill: 'none', c: '@a', font: '@script', size: 14, weight: 400, h: 8.5, ls: 0 }), pad: 2 }],
      ['fino', 'Fino', { fr: { k: 'solid', w: 0.2, c: '@ink', r: 0 }, hd: hd({ fill: 'none', line: true, lw: 0.2, weight: 600, size: 7.5, align: 'left' }), pad: 1.8 }],
      ['aquarela', 'Aquarela', { fr: { k: 'solid', w: 0.3, c: '@b', r: 4 }, hd: hd({ fill: '@soft2' }), bg: { t: 'cor', c: '@soft2', op: 0.5 }, pad: 2 }]] },
    { id: 'minimal', n: 'Minimalista', s: [
      ['linha', 'Linha', { fr: { k: 'none' }, hd: hd({ fill: 'none', line: true, lw: 0.35, align: 'left' }), pad: 1.5 }],
      ['sublinhado', 'Sublinhado', { fr: { k: 'b', w: 0.4, c: '@ink' }, hd: hd({ fill: 'none', align: 'left' }), pad: 1.5 }],
      ['plano', 'Plano', { fr: { k: 'none', r: 2.5 }, bg: { t: 'cor', c: '@soft', op: 1 }, hd: hd({ fill: 'none', align: 'left' }), pad: 2 }],
      ['barra', 'Barra lateral', { fr: { k: 'l', w: 1.2, c: '@a' }, hd: hd({ fill: 'none', align: 'left' }), pad: 2.5 }],
      ['sem', 'Só conteúdo', { fr: { k: 'none' }, hd: null, pad: 0 }]] },
    { id: 'decorativo', n: 'Decorativo', s: [
      ['vintage', 'Vintage', { fr: { k: 'notch', w: 0.4, c: '@ink', gap: 1.1 }, hd: hd({ fill: 'none', font: '@script', size: 13, weight: 400, ls: 0, h: 8 }), pad: 3 }],
      ['vintage2', 'Vintage 2', { fr: { k: 'double', w: 0.3, c: '@ink', r: 0, gap: 1 }, hd: hd({ fill: 'none', line: true, lw: 0.25 }), pad: 3 }],
      ['elegante', 'Elegante', { fr: { k: 'double', w: 0.25, c: '@a', r: 3, gap: 0.9 }, hd: hd({ fill: 'none', c: '@a', font: '@script', size: 14, weight: 400, ls: 0, h: 9 }), pad: 3 }],
      ['cantos', 'Cantos', { fr: { k: 'corners', w: 0.5, c: '@ink' }, hd: hd({ fill: 'none' }), pad: 2.5 }]] },
    { id: 'negrito', n: 'Negrito', s: [
      ['bold', 'Negrito', { fr: { k: 'solid', w: 1.3, c: '@ink', r: 1 }, hd: hd({ fill: '@a', c: '@ink' }), pad: 2 }],
      ['bold3d', 'Negrito 3D', { fr: { k: 'offset', w: 0.6, c: '@ink', gap: 1.6, r: 0 }, bg: { t: 'cor', c: '#FFFFFF', op: 1 }, hd: hd({ fill: '@a' }), pad: 2 }],
      ['grossa', 'Moldura grossa', { fr: { k: 'bold', w: 1.6, c: '@ink', r: 2 }, hd: hd({ fill: 'none' }), pad: 3 }],
      ['selo', 'Selo', { fr: { k: 'solid', w: 0.5, c: '@ink', r: 0 }, hd: hd({ fill: '@ink', c: '#FFFFFF' }), pad: 2 }]] },
    { id: 'editorial', n: 'Editorial', s: [
      ['folio', 'Fólio', { fr: { k: 'tb', w: 0.6, c: '@ink' }, hd: hd({ fill: 'none', align: 'left', size: 8.5, ls: 0.14 }), pad: 2 }],
      ['coluna', 'Coluna', { fr: { k: 'l', w: 0.6, c: '@ink' }, hd: hd({ fill: 'none', align: 'left' }), pad: 2.5 }],
      ['masthead', 'Masthead', { fr: { k: 'tb', w: 1, c: '@ink' }, hd: hd({ fill: 'none', font: '@script', size: 16, weight: 400, ls: 0, h: 10, line: true, lw: 0.3 }), pad: 2 }]] },
    { id: 'galeria', n: 'Galeria', s: [
      ['passe', 'Passe-partout', { fr: { k: 'double', w: 0.25, c: '@ink', r: 0, gap: 2.6 }, bg: { t: 'cor', c: '#FFFFFF', op: 1 }, hd: null, pad: 4.5 }],
      ['tela', 'Tela', { fr: { k: 'solid', w: 0.3, c: '@line', r: 0 }, bg: { t: 'cor', c: '#FFFFFF', op: 1 }, hd: hd({ fill: 'none', size: 7, ls: 0.2, align: 'left' }), pad: 3 }],
      ['cavalete', 'Cavalete', { fr: { k: 'b', w: 2.2, c: '@ink' }, hd: hd({ fill: 'none', size: 7.5 }), pad: 2 }]] },
    { id: 'pop', n: 'Pop', s: [
      ['fanzine', 'Fanzine', { fr: { k: 'dash', w: 0.7, c: '@ink', r: 0 }, hd: hd({ fill: '@a' }), pad: 2 }],
      ['quadrinhos', 'Quadrinhos', { fr: { k: 'offset', w: 0.7, c: '@ink', gap: 1.4, r: 2 }, bg: { t: 'cor', c: '#FFFFFF', op: 1 }, hd: hd({ fill: '@b' }), pad: 2 }],
      ['neon', 'Neon suave', { fr: { k: 'solid', w: 0.9, c: '@a', r: 3 }, hd: hd({ fill: 'none', c: '@a' }), pad: 2 }]] },
    { id: 'bolhas', n: 'Bolhas', s: [
      ['bolha', 'Bolha', { fr: { k: 'scallop', w: 0.4, c: '@ink', bump: 4.5 }, bg: { t: 'cor', c: '#FFFFFF', op: 1 }, hd: hd({ fill: 'none' }), pad: 2 }],
      ['blob', 'Blob', { fr: { k: 'solid', w: 0.6, c: '@ink', r: 9 }, hd: hd({ fill: '@soft' }), pad: 3 }],
      ['soda', 'Soda', { fr: { k: 'solid', w: 0.9, c: '@b', r: 6 }, bg: { t: 'cor', c: '@soft2', op: 0.6 }, hd: hd({ fill: '@b', c: '#FFFFFF' }), pad: 2.5 }]] },
    { id: 'doce', n: 'Doce', s: [
      ['pirulito', 'Pirulito', { fr: { k: 'dash', w: 1, c: '@a', r: 3.5 }, hd: hd({ fill: '@soft' }), pad: 2.5 }],
      ['pimenta', 'Pimenta', { fr: { k: 'dot', w: 0.9, c: '@a', r: 3 }, hd: hd({ fill: 'none', c: '@a' }), pad: 2.5 }],
      ['sakura', 'Sakura', { fr: { k: 'solid', w: 0.4, c: '@a', r: 5 }, bg: { t: 'cor', c: '@soft', op: 0.7 }, hd: hd({ fill: '@a', c: '#FFFFFF', font: '@script', size: 13, weight: 400, ls: 0, h: 8 }), pad: 2.5 }]] }
  ];
  const STY = {}; COLS.forEach((c) => c.s.forEach(([id, n, spec]) => { STY[c.id + '/' + id] = { id: c.id + '/' + id, col: c.id, colName: c.n, n, spec }; }));
  const REC = ['neutro/original', 'neutro/jovial'];
  const ACCEPT = new Set(['text', 'rect', 'calendar', 'yearcal', 'table', 'checklist', 'habit', 'hours', 'water', 'mood', 'pattern', 'divider', 'progress', 'numgrid', 'rate']);

  const globalId = () => { const i = S.meta && S.meta.style && S.meta.style.wst; return STY[i] ? i : 'neutro/original'; };
  const globalName = () => STY[globalId()].colName + ' · ' + STY[globalId()].n;
  const defTitle = (e) => e.wxT || (e.type === 'text' ? 'Título' : (TYPE_NAME[e.type] || ''));

  function applyId(e, id, o) {
    const sp = STY[id] && STY[id].spec; if (!sp) return;
    o = o || {};
    const keep = e.wx && e.wx.hd && e.wx.hd.text;
    const w = clone({ fr: sp.fr, pad: sp.pad || 0, bg: sp.bg || { t: 'none' }, hd: sp.hd, sh: sp.sh ? 1 : 0 });
    if (!w.hd || o.nohd) delete w.hd; else w.hd.text = keep || o.title || defTitle(e);
    w.st = id; e.wx = w;
  }
  /* widget novo: aplica o estilo e cresce para o conteúdo manter o tamanho pensado */
  function styled(e, title, o) {
    o = o || {};
    const id = o.st || globalId(); if (o.none) return e;
    applyId(e, id, { title, nohd: o.nohd });
    const L = WX.layout(Object.assign({}, e));
    e.w = r1(e.w + 2 * L.pad + L.off); e.h = r1(e.h + L.hd + 2 * L.pad + L.off);
    return e;
  }
  const pageInset = (p) => r1(Math.min(p.w, p.h) * 0.035);
  function applyPage(p, id) {
    const sp = STY[id] && STY[id].spec; if (!sp) return;
    const f = clone(sp.fr); if (f.k === 'offset') f.k = 'bold';
    p.frame = Object.assign({}, f, { inset: p.frame && p.frame.inset != null ? p.frame.inset : pageInset(p), st: id });
  }

  /* ---------- prévia ---------- */
  function sample(id) {
    const sp = STY[id].spec, e = E('text', 0, 0, 38, 25, { text: 'Escreva aqui\nsuas ideias', font: 'Nunito', size: 6.2, color: '#3E3550', lh: 1.35 });
    applyId(e, id, { title: 'Título' });
    const L = WX.layout(e); e.w = r1(e.w + 2 * L.pad + L.off); e.h = r1(e.h + L.hd + 2 * L.pad + L.off);
    void sp; return e;
  }
  function paintCards(root) {
    const list = $$('canvas[data-sc]', root); let i = 0;
    const step = () => { for (let n = 0; n < 8 && i < list.length; n++, i++) { const cv = list[i]; if (!cv.isConnected) continue; const big = cv.classList.contains('big'); elPreview(cv, sample(cv.dataset.sc), big ? 300 : 128, big ? 208 : 92); } if (i < list.length) requestAnimationFrame(step); };
    step();
  }

  /* ---------- galeria (vale para painel da direita e para janela) ---------- */
  function curStyleId(ctx) {
    if (ctx.t === 'el') { const e = selEls()[0]; return e && e.wx && e.wx.st; }
    if (ctx.t === 'page') { const p = curPage(); return p && p.frame && p.frame.st; }
    return globalId();
  }
  function scopeHTML(ctx) {
    const sc = Pref.wscope || 'one';
    if (ctx.t === 'el') return `<div class="wgs"><span class="wglab">APLICAR EM</span>${[['one', 'Só neste widget'], ['type', 'Todos deste tipo nesta página'], ['page', 'Todos os widgets desta página'], ['all', 'Todos os widgets do projeto']].map(([v, l]) => `<label class="chk"><input type="radio" name="wgs" value="${v}"${sc === v ? ' checked' : ''}> ${l}</label>`).join('')}</div>`;
    if (ctx.t === 'page') return `<div class="wgs"><span class="wglab">APLICAR EM</span>${[['one', 'Só nesta página'], ['all', 'Todas as páginas']].map(([v, l]) => `<label class="chk"><input type="radio" name="wgs" value="${v}"${(sc === 'all' ? 'all' : 'one') === v ? ' checked' : ''}> ${l}</label>`).join('')}</div><p class="hint">A moldura da página não mexe nas margens: ela fica por cima do fundo, no afastamento que você definir.</p>`;
    return `<div class="wgs"><label class="chk"><input type="checkbox" id="gW"> Aplicar também nos widgets que já estão no projeto</label><label class="chk"><input type="checkbox" id="gP"> Colocar a moldura em todas as páginas</label></div>`;
  }
  function galHTML(ctx) {
    const cur = curStyleId(ctx), st = STY[cur];
    const card = (id, big) => `<button class="stcard${cur === id ? ' on' : ''}" data-sty="${id}"><canvas class="${big ? 'big' : ''}" data-sc="${id}"></canvas><span>${esc(STY[id].n)}</span></button>`;
    let body;
    if (!ctx.col) {
      body = `<div class="wglab">★ RECOMENDADO</div><div class="stgrid two">${REC.map((id) => card(id, true)).join('')}</div>
        <div class="wglab">PROCURAR POR ESTILO <b>${COLS.length} coleções</b></div>
        <div class="stcols">${COLS.map((c) => `<button class="stcol" data-col="${c.id}"><div class="mini">${c.s.slice(0, 4).map(([id]) => `<canvas data-sc="${c.id}/${id}"></canvas>`).join('')}</div><b>${esc(c.n)}</b><small>${c.s.length} estilos</small></button>`).join('')}</div>`;
    } else {
      const c = COLS.find((x) => x.id === ctx.col);
      body = `<div class="wglab"><button class="btn sm ghost" data-gcol="">← Coleções</button> <b>${esc(c.n)}</b> · ${c.s.length} estilos</div><div class="stgrid two">${c.s.map(([id]) => card(c.id + '/' + id, true)).join('')}</div>`;
    }
    const title = ctx.t === 'el' ? 'Estilo do widget' : ctx.t === 'page' ? 'Moldura da página' : 'Estilo padrão';
    return `<div class="wgal">${ctx.t === 'global' ? '' : `<div class="wgh"><button class="ib" data-gback title="Voltar" aria-label="Voltar">←</button><h2>${title}</h2></div>`}
      <div class="wgbody">${body}</div>
      <div class="wgfoot"><div class="wgcur"><span>Estilo · <b>${st ? esc(st.colName + ' · ' + st.n) : 'nenhum'}</b></span><button class="btn sm ghost" data-greset>${ctx.t === 'global' ? 'Sem estilo' : 'Redefinir'}</button></div>${scopeHTML(ctx)}</div></div>`;
  }
  function pagesFor(ctx, scope) { return scope === 'all' ? S.order.slice() : [curPage().id]; }
  function pick(ctx, id) {
    const p = curPage();
    if (ctx.t === 'el') {
      const e = selEls()[0]; if (!e) return; const sc = Pref.wscope || 'one';
      const ids = sc === 'all' ? S.order.slice() : [p.id];
      change(ids, () => {
        if (sc === 'one') applyId(e, id);
        else ids.forEach((pid) => S.pages[pid].els.forEach((x) => { if (ACCEPT.has(x.type) && (sc !== 'type' || x.type === e.type)) applyId(x, id); }));
        applyId(e, id);
      });
    } else if (ctx.t === 'page') {
      const sc = Pref.wscope === 'all' ? 'all' : 'one', ids = pagesFor(ctx, sc);
      change(ids, () => ids.forEach((pid) => applyPage(S.pages[pid], id)));
    } else {
      S.meta.style = Object.assign({}, S.meta.style, { wst: id }); Saver.m();
      const gW = $('#gW', ctx.root), gP = $('#gP', ctx.root);
      if (gW && gW.checked) change(S.order.slice(), () => S.order.forEach((pid) => S.pages[pid].els.forEach((x) => { if (ACCEPT.has(x.type) && x.wx) applyId(x, id); })));
      if (gP && gP.checked) change(S.order.slice(), () => S.order.forEach((pid) => applyPage(S.pages[pid], id)));
    }
    redraw(); refreshThumbs && refreshThumbs();
  }
  function reset(ctx) {
    const p = curPage();
    if (ctx.t === 'el') { const e = selEls()[0]; if (!e) return; const sc = Pref.wscope || 'one'; const ids = sc === 'all' ? S.order.slice() : [p.id]; change(ids, () => { if (sc === 'one') delete e.wx; else ids.forEach((pid) => S.pages[pid].els.forEach((x) => { if (ACCEPT.has(x.type) && (sc !== 'type' || x.type === e.type)) delete x.wx; })); delete e.wx; }); }
    else if (ctx.t === 'page') { const ids = pagesFor(ctx, Pref.wscope === 'all' ? 'all' : 'one'); change(ids, () => ids.forEach((pid) => { delete S.pages[pid].frame; })); }
    else { S.meta.style = Object.assign({}, S.meta.style, { wst: 'minimal/sem' }); Saver.m(); }
    redraw(); refreshThumbs && refreshThumbs();
  }
  function mountGallery(root, ctx, rerender) {
    ctx.root = root; paintCards(root);
    $$('[data-sty]', root).forEach((b) => { b.onclick = () => { pick(ctx, b.dataset.sty); rerender(); if (ctx.t !== 'global') renderPanel && S.tab === 'widgets' && 0; }; });
    $$('[data-col]', root).forEach((b) => { b.onclick = () => { ctx.col = b.dataset.col; rerender(); }; });
    $$('[data-gcol]', root).forEach((b) => { b.onclick = () => { ctx.col = null; rerender(); }; });
    $$('[name=wgs]', root).forEach((r) => { r.onchange = () => { Pref.wscope = r.value; savePref(); }; });
    const rs = $('[data-greset]', root); if (rs) rs.onclick = () => { reset(ctx); rerender(); };
    const bk = $('[data-gback]', root); if (bk) bk.onclick = () => { S.wxView = null; renderProps(); };
  }
  function galleryInto(P, ctx) {
    const render = () => { P.innerHTML = galHTML(ctx); mountGallery(P, ctx, render); };
    render();
  }
  function openGlobal(after) {
    const ctx = { t: 'global', col: null };
    modal(`<h2>Estilo dos widgets e molduras</h2><p class="hint">Vale para os próximos widgets que você colocar. Cada widget ainda pode ter o seu próprio estilo depois.</p><div id="gx"></div><div class="row" style="justify-content:flex-end"><button class="btn pri" data-close>Pronto</button></div>`, (b) => {
      const root = $('#gx', b); const render = () => { const keepW = $('#gW', root) && $('#gW', root).checked, keepP = $('#gP', root) && $('#gP', root).checked; root.innerHTML = galHTML(ctx); mountGallery(root, ctx, () => { render(); after && after(); }); if (keepW) $('#gW', root).checked = true; if (keepP) $('#gP', root).checked = true; };
      render();
    }, true);
  }

  Object.assign(window.WX, { COLS, STY, ACCEPT, globalId, globalName, applyId, styled, applyPage, pageInset, galleryInto, openGlobal, sample, defTitle });
})();
