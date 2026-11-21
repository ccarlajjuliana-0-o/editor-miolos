/* Estúdio de Miolos · Configuração da página (Ajuste 73)
   Painel da direita quando nada está selecionado: nome, visualização, tamanho/orientação,
   estilo da página inteira, fundo (seletor completo), duplicar (com mudança de datas), régua/grade. */
(function () {
  'use strict';
  const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
  const CAL = ['calendar', 'yearcal', 'datebox'];
  const PRESETS = [1, 4, 5, 7, 28, 29, 30, 31, 52, 65, 100, 150, 200, 365, 1500];
  const MAXN = 1500;
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const hasCal = (p) => p.els.some((e) => CAL.includes(e.type));
  const scopeIds = (sc) => {
    if (sc === 'all') return S.order.slice();
    if ((S.meta.view || 'single') === 'spread') { try { return curSpread().map((i) => S.order[i]).filter(Boolean); } catch (_) { /* */ } }
    return [curPage().id];
  };
  const orient = (p) => (p.w > p.h ? 'land' : 'port');

  const block = (id, title, body, openDef) => {
    const o = Pref.acc && Pref.acc[id] !== undefined ? Pref.acc[id] !== false : openDef !== false;
    const w = document.createElement('div'); w.className = 'wacc' + (o ? ' open' : ''); w.dataset.acc = id;
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${o}"><i class="wtri"></i><b>${title}</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab"><div class="pgrp tpan">${body}</div></div>`;
    const hd = w.querySelector('.wah');
    hd.onclick = () => { w.classList.toggle('open'); const on = w.classList.contains('open'); hd.setAttribute('aria-expanded', on); Pref.acc = Pref.acc || {}; Pref.acc[id] = on; try { savePref(); } catch (_) { /* */ } };
    return w;
  };
  const seg = (name, items, cur) => `<div class="segf pgseg" data-pgseg="${name}">${items.map(([v, l, dis, tt]) => `<button type="button" data-v="${v}" class="${cur === v ? 'on' : ''}"${dis ? ' disabled' : ''}${tt ? ` title="${tt}"` : ''}>${l}</button>`).join('')}</div>`;

  /* ---------- estilo dominante da página ---------- */
  function pageStyleId(p) {
    if (p.frame && p.frame.st) return p.frame.st;
    const n = {}; p.els.forEach((e) => { if (e.wx && e.wx.st && e.wx.st !== '_pv') n[e.wx.st] = (n[e.wx.st] || 0) + 1; });
    const k = Object.keys(n).sort((a, b) => n[b] - n[a])[0]; return k || null;
  }
  const styleName = (id) => (id && WX.STY[id] ? WX.STY[id].colName + ' · ' + WX.STY[id].n : 'Nenhum');

  /* ---------- aplicar estilo na página inteira ---------- */
  function applyPageStyle(ids, id, o) {
    change(ids, () => ids.forEach((pid) => {
      const pg = S.pages[pid]; if (!pg) return;
      if (o.widgets) pg.els.forEach((x) => { if (WX.ACCEPT.has(x.type) && (x.wx || !['text', 'rect', 'pattern', 'divider'].includes(x.type))) WX.applyId(x, id); });
      if (o.frame) WX.applyPage(pg, id);
    }));
    redraw(); try { refreshThumbs(); } catch (_) { /* */ }
  }
  function styleModal() {
    const p = curPage(), cols = WX.COLS; let col = null; const cur = pageStyleId(p);
    const startCol = cur ? cur.split('/')[0] : cols[0].id; col = startCol;
    modal(`<h2>Estilo da página inteira</h2><p class="hint">Troca o estilo de todos os widgets desta página de uma vez (e, se quiser, a moldura da página).</p>
      <label class="pfield"><span>Coleção</span><select id="psCol">${cols.map((c) => `<option value="${c.id}"${c.id === col ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
      <div class="stgrid two" id="psGrid" style="max-height:46vh;overflow:auto"></div>
      <div class="wgs"><span class="wglab">APLICAR EM</span><label class="chk"><input type="radio" name="psSc" value="one" checked> Só nesta página${(S.meta.view || 'single') === 'spread' ? '/dupla' : ''}</label><label class="chk"><input type="radio" name="psSc" value="all"> Todas as páginas</label>
      <label class="chk"><input type="checkbox" id="psW" checked> Nos widgets</label><label class="chk"><input type="checkbox" id="psF" checked> Na moldura da página</label></div>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button></div>`, (b, close) => {
      const grid = $('#psGrid', b);
      const draw = () => {
        const c = cols.find((x) => x.id === col), now = pageStyleId(curPage());
        grid.innerHTML = c.s.map(([sid]) => { const id = c.id + '/' + sid; return `<button class="stcard${now === id ? ' on' : ''}" data-sty="${id}"><canvas class="big" data-sc="${id}"></canvas><span>${esc(WX.STY[id].n)}</span></button>`; }).join('');
        const list = $$('canvas[data-sc]', grid); let i = 0;
        const step = () => { for (let n = 0; n < 8 && i < list.length; n++, i++) { const cv = list[i]; if (cv.isConnected) elPreview(cv, WX.sample(cv.dataset.sc), 300, 208); } if (i < list.length) requestAnimationFrame(step); };
        step();
        $$('[data-sty]', grid).forEach((bt) => { bt.onclick = () => { const sc = ($('[name=psSc]:checked', b) || {}).value || 'one'; applyPageStyle(scopeIds(sc), bt.dataset.sty, { widgets: $('#psW', b).checked, frame: $('#psF', b).checked }); toast('Estilo aplicado.'); draw(); renderProps(); }; });
      };
      $('#psCol', b).onchange = (e) => { col = e.target.value; draw(); };
      draw(); void close;
    }, true);
  }

  /* ---------- datas em sequência ---------- */
  function autoUnit(p) {
    if (p.els.some((e) => e.type === 'calendar')) return 'mes';
    if (p.els.some((e) => e.type === 'yearcal')) return 'ano';
    const d = p.els.find((e) => e.type === 'datebox'); if (d) return d.fmt === 'semana' ? 'semana' : d.fmt === 'mes' ? 'mes' : 'dia';
    return 'mes';
  }
  function shiftDate(iso, unit, n) {
    const d = fromIso(iso); if (!d || !n) return iso;
    if (unit === 'ano') d.setFullYear(d.getFullYear() + n); else if (unit === 'mes') d.setMonth(d.getMonth() + n); else d.setDate(d.getDate() + n * (unit === 'semana' ? 7 : 1));
    return isoOf(d);
  }
  function shiftEl(e, unit, n) {
    if (e.type === 'calendar') { const m = unit === 'ano' ? 12 * n : unit === 'mes' ? n : 0; if (m) { const t = e.year * 12 + e.month + m; e.year = Math.floor(t / 12); e.month = ((t % 12) + 12) % 12; } }
    else if (e.type === 'yearcal') { if (unit === 'ano') e.year += n; else if (unit === 'mes') e.year += Math.floor(n / 12); }
    else if (e.type === 'datebox' && e.date) e.date = shiftDate(e.date, unit, n);
  }
  const labelOf = (p, unit, n) => {
    const c = p.els.find((e) => e.type === 'calendar'); if (c) { const q = clone(c); shiftEl(q, unit, n); return `${MES[q.month]} ${q.year}`; }
    const y = p.els.find((e) => e.type === 'yearcal'); if (y) { const q = clone(y); shiftEl(q, unit, n); return String(q.year); }
    const d = p.els.find((e) => e.type === 'datebox' && e.date); if (d) { const iso = shiftDate(d.date, unit, n); const q = fromIso(iso); return q ? q.toLocaleDateString('pt-BR') : ''; }
    return '';
  };
  function duplicate(count, dates, unit) {
    const src = curPage(), at = S.cur, ids = [];
    const u = unit === 'auto' ? autoUnit(src) : unit;
    change([], () => {
      for (let k = 1; k <= count; k++) {
        const pg = clone(src); pg.id = uid('pg'); pg.els.forEach((e) => { e.id = uid('e'); if (dates) shiftEl(e, u, k); });
        S.pages[pg.id] = pg; ids.push(pg.id);
      }
      S.order.splice(at + 1, 0, ...ids);
    });
    S.cur = at + 1; S.sel = []; refreshAll();
    toast(count === 1 ? 'Página duplicada.' : `${count} páginas criadas.`);
  }
  function dupModal(withDates) {
    const p = curPage(); let n = 1;
    modal(`<h2>${withDates ? 'Duplicar páginas e mudar as datas' : 'Duplicar página'}</h2>
      <p class="hint">${withDates ? 'Tudo o que está nesta página (widgets, objetos, adesivos, bordas, estilos…) é copiado e os calendários avançam em sequência. Depois você edita cada página normalmente.' : 'Tudo o que está nesta página é copiado para páginas novas logo depois dela.'}</p>
      <div class="dupn"><button type="button" class="btn sm" id="dnM" aria-label="Menos">−</button><input type="number" id="dnV" min="1" max="${MAXN}" value="1" aria-label="Quantidade de páginas"><button type="button" class="btn sm" id="dnP" aria-label="Mais">+</button><span class="hint">páginas novas</span></div>
      <div class="dpre">${PRESETS.map((v) => `<button type="button" class="btn sm ghost" data-n="${v}">${v}</button>`).join('')}</div>
      ${withDates ? `<label class="pfield"><span>Avançar a data a cada página</span><select id="dnU"><option value="auto">Automático (pelo calendário)</option><option value="dia">1 dia</option><option value="semana">1 semana</option><option value="mes">1 mês</option><option value="ano">1 ano</option></select></label><p class="hint" id="dnPrev"></p>` : ''}
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="dnGo"></button></div>`, (b, close) => {
      const v = $('#dnV', b), go = $('#dnGo', b), pv = $('#dnPrev', b), un = $('#dnU', b);
      const sync = () => {
        n = Math.max(1, Math.min(MAXN, Math.round(+v.value || 1))); if (document.activeElement !== v) v.value = n;
        go.textContent = n === 1 ? 'Criar 1 página' : `Criar ${n} páginas`;
        $$('[data-n]', b).forEach((x) => x.classList.toggle('on', +x.dataset.n === n));
        if (pv) { const u = un.value === 'auto' ? autoUnit(p) : un.value, a = labelOf(p, u, 1), z = labelOf(p, u, n); pv.textContent = a ? `Páginas ${S.cur + 2}${n > 1 ? '–' + (S.cur + 1 + n) : ''} · ${a}${n > 1 ? ' → ' + z : ''}` : ''; }
      };
      v.oninput = sync; if (un) un.onchange = sync;
      $('#dnM', b).onclick = () => { v.value = Math.max(1, n - 1); sync(); }; $('#dnP', b).onclick = () => { v.value = Math.min(MAXN, n + 1); sync(); };
      $$('[data-n]', b).forEach((x) => { x.onclick = () => { v.value = x.dataset.n; sync(); }; });
      go.onclick = () => { sync(); close(); duplicate(n, !!withDates, withDates ? un.value : 'auto'); };
      sync();
    });
  }

  /* ---------- tamanho / orientação ---------- */
  function applySize(ids, w, h) { resizePage(ids, w, h, $('#pScale') ? $('#pScale').checked : true); }

  /* ---------- painel ---------- */
  function build(P, p) {
    const sn = sizeName(p.w, p.h).replace(' deitado', ''), spread = (S.meta.view || 'single') === 'spread', cal = hasCal(p), sid = pageStyleId(p), o = orient(p);
    const bgField = colorField('bg', p.bg, true).replace(/data-cset="bg"/g, 'data-pcset="bg"').replace('data-k="bg"', 'data-pk="bg"');
    P.innerHTML = `<h2>Configuração da página</h2><p class="hint" style="margin-top:-4px">Página ${S.cur + 1} de ${S.order.length}</p>`;
    const root = document.createElement('div'); P.appendChild(root);

    root.appendChild(block('pg_ger', 'Página', `
      <label class="pfield"><span>Nome</span><input type="text" data-pk="name" value="${esc(p.name || '')}"></label>
      <div class="pfield"><span>Visualização</span>${seg('view', [['single', 'Página única'], ['spread', 'Página dupla']], spread ? 'spread' : 'single')}</div>
      <div class="pfield"><span>Conteúdo da página</span>${seg('mode', [['free', 'Livre'], ['sections', 'Por seções', true, 'Chega no próximo ajuste']], p.layout || 'free')}<small class="hint">Livre: arraste e redimensione qualquer coisa. “Por seções” (espaços prontos para encaixar widgets) chega em breve.</small></div>`));

    root.appendChild(block('pg_tam', 'Tamanho e orientação', `
      <label class="pfield"><span>Formato</span><select id="psz">${Object.keys(SIZES).map((n) => `<option${n === sn ? ' selected' : ''}>${n}</option>`).join('')}<option value="custom"${SIZES[sn] ? '' : ' selected'}>Personalizado</option></select></label>
      <div class="fgrid"><label class="pfield"><span>Largura (mm)</span><input type="number" id="pw" step="0.5" value="${r1(p.w)}"></label><label class="pfield"><span>Altura (mm)</span><input type="number" id="ph" step="0.5" value="${r1(p.h)}"></label></div>
      <div class="pfield"><span>Orientação</span>${seg('ori', [['port', '▯ Retrato'], ['land', '▭ Paisagem']], o)}</div>
      <div class="pfield"><span>Aplicar em</span>${seg('scope', [['one', spread ? 'Esta dupla' : 'Esta página'], ['all', 'Todas as páginas']], Pref.pgScope === 'all' ? 'all' : 'one')}</div>
      <label class="chk"><input type="checkbox" id="pScale" checked> Ajustar o conteúdo ao novo tamanho</label>
      <button class="btn sm pri" id="pApply">Aplicar tamanho</button>`));

    root.appendChild(block('pg_est', 'Estilo da página', `
      <p class="hint">Estilo atual: <b>${esc(styleName(sid))}</b></p>
      <button class="btn sm" id="pStyle">Mudar o estilo da página inteira…</button>`));

    root.appendChild(block('pg_bg', 'Fundo da página', `
      <label class="pfield"><span>Cor de fundo</span>${bgField}</label>
      ${p.bgImg ? `<div class="row"><span class="hint">Fundo com imagem</span><select id="pbfit"><option value="cover"${p.bgImg.fit === 'cover' ? ' selected' : ''}>Preencher</option><option value="contain"${p.bgImg.fit === 'contain' ? ' selected' : ''}>Inteira</option><option value="stretch"${p.bgImg.fit === 'stretch' ? ' selected' : ''}>Esticar</option></select><button class="btn sm ghost danger" id="pbRm">Remover</button></div><label class="pfield"><span>Opacidade do fundo</span><input type="range" id="pbop" min="0.05" max="1" step="0.05" value="${p.bgImg.opacity ?? 1}"></label>` : '<p class="hint">Para usar uma imagem como fundo, envie em Uploads → Fundos e temas.</p>'}`));

    root.appendChild(block('pg_dup', 'Duplicar', cal
      ? `<p class="hint">Esta página tem calendário: dá para copiar tudo e avançar as datas em sequência.</p><button class="btn sm pri" id="pDupD">Duplicar páginas e mudar datas…</button><button class="btn sm" id="pDup1">Só duplicar esta página</button>`
      : `<button class="btn sm pri" id="pDup1">Duplicar página</button><button class="btn sm ghost" id="pDupN">Várias cópias…</button>`));

    if (typeof gridControlsHTML === 'function') { const g = gridControlsHTML(); if (g) P.insertAdjacentHTML('beforeend', g); }
    P.insertAdjacentHTML('beforeend', `<div class="pgrp"><label class="chk"><input type="checkbox" id="pGuides"${S.guides ? ' checked' : ''}> Mostrar margem de segurança</label><button class="btn sm" id="pSaveTpl">Salvar página como meu modelo</button></div>
      <p class="hint">Atalhos: Delete exclui, Ctrl+D duplica, setas movem 1 mm (Shift: 5 mm), Ctrl+Z desfaz, Ctrl + roda do mouse dá zoom.</p>`);

    /* ligações */
    const pw = $('#pw', P), ph = $('#ph', P);
    $('#psz', P).onchange = () => { const v = $('#psz', P).value; if (SIZES[v]) { const land = +pw.value > +ph.value, [a, b] = SIZES[v]; pw.value = land ? Math.max(a, b) : a; ph.value = land ? Math.min(a, b) : b; } };
    const dims = () => [cl(+pw.value || p.w, 20, 1000), cl(+ph.value || p.h, 20, 1000)];
    const scopeNow = () => (Pref.pgScope === 'all' ? 'all' : 'one');
    $('#pApply', P).onclick = () => applySize(scopeIds(scopeNow()), ...dims());
    $$('[data-pgseg]', P).forEach((g) => {
      g.addEventListener('click', (ev) => {
        const b = ev.target.closest('button'); if (!b || b.disabled) return; const v = b.dataset.v;
        if (g.dataset.pgseg === 'view') { S.meta.view = v; Saver.m(); renderStage(); updNav(); markStrip(); renderProps(); }
        else if (g.dataset.pgseg === 'scope') { Pref.pgScope = v; try { savePref(); } catch (_) { /* */ } $$('button', g).forEach((x) => x.classList.toggle('on', x === b)); }
        else if (g.dataset.pgseg === 'ori') {
          const ids = scopeIds(scopeNow()), big = Math.max(p.w, p.h), sm = Math.min(p.w, p.h), w = v === 'land' ? big : sm, h = v === 'land' ? sm : big;
          if (Math.abs(w - p.w) > .01 || ids.length > 1) resizePage(ids, w, h, $('#pScale', P).checked);
          renderProps();
        }
      });
    });
    $('#pStyle', P).onclick = styleModal;
    const d1 = $('#pDup1', P); if (d1) d1.onclick = () => duplicate(1, false, 'auto');
    const dN = $('#pDupN', P); if (dN) dN.onclick = () => dupModal(false);
    const dD = $('#pDupD', P); if (dD) dD.onclick = () => dupModal(true);
    mountGridControls(P); $('#pGuides', P).onchange = (e) => { S.guides = e.target.checked; redraw(); }; $('#pSaveTpl', P).onclick = saveTplModal;
    if (p.bgImg) {
      $('#pbRm', P).onclick = () => { change([p.id], () => { p.bgImg = null; }); redraw(); renderProps(); thumbRefresh(p.id); };
      $('#pbfit', P).onchange = (e) => { change([p.id], () => { p.bgImg.fit = e.target.value; }); redraw(); thumbRefresh(p.id); };
      let b0 = null; $('#pbop', P).oninput = (e) => { b0 = b0 || snapOf([p.id]); p.bgImg.opacity = +e.target.value; redraw(); };
      $('#pbop', P).onchange = () => { if (b0) pushHist(b0, snapOf([p.id])); b0 = null; thumbRefresh(p.id); };
    }
  }

  window.PageCfg = { build, duplicate, shiftEl, hasCal, styleModal };
})();
