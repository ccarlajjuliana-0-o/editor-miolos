/* Layout do Estúdio: menu lateral na tela de projetos (igual ao app do ateliê)
   e painéis recolhíveis dentro do editor. */
(function () {
  'use strict';
  const LSK = 'cnu.estudio.ui';
  let ui = {};
  try { ui = JSON.parse(localStorage.getItem(LSK) || '{}') || {}; } catch (e) { ui = {}; }
  const save = () => { try { localStorage.setItem(LSK, JSON.stringify(ui)); } catch (e) { /* sem armazenamento */ } };
  const VIEWS = { projetos: '#vProjetos', aparencia: '#vAparencia', nuvem: '#vNuvem' };

  function view(n) {
    for (const [k, sel] of Object.entries(VIEWS)) { const el = $(sel); if (el) el.hidden = k !== n; }
    $$('.menu [data-view]').forEach((b) => (b.dataset.view === n ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
    if (n === 'aparencia') Apar.montar($('#aparBox')); else Apar.fechar();
    const c = $('#home .conteudo'); if (c) c.scrollTop = 0;
  }
  $$('.menu [data-view]').forEach((b) => { b.onclick = () => view(b.dataset.view); });

  function menu(rec) {
    $('#shell').classList.toggle('recolhido', rec);
    $('#menuAba').hidden = !rec;
    ui.menu = rec; save();
  }
  $('#menuRec').onclick = () => menu(true);
  $('#menuAbrir').onclick = () => menu(false);
  menu(ui.menu === undefined ? window.innerWidth <= 900 : !!ui.menu);

  const ed = $('#editor');
  const mq = window.matchMedia('(max-width:1400px), (max-height:820px)');
  const compact = () => ed.classList.contains('compact');
  const CL = { L: ['nopanel', 'showpanel'], R: ['noprops', 'showprops'] };
  const ICON = { L: ['M15 6l-6 6 6 6', 'M9 6l6 6-6 6'], R: ['M9 6l6 6-6 6', 'M15 6l-6 6 6 6'] };
  const TXT = { L: ['Recolher o painel de ferramentas', 'Mostrar o painel de ferramentas'], R: ['Recolher as propriedades', 'Mostrar as propriedades'] };
  const hidden = (w) => (compact() ? !ed.classList.contains(CL[w][1]) : ed.classList.contains(CL[w][0]));
  function syncEdges() {
    for (const w of ['L', 'R']) {
      const b = $('#edge' + w), h = hidden(w) ? 1 : 0;
      b.querySelector('path').setAttribute('d', ICON[w][h]); b.title = TXT[w][h]; b.setAttribute('aria-label', TXT[w][h]);
      if (w === 'R' && ui.pinR) { b.title = 'Barra fixa. Dois cliques para soltar'; b.setAttribute('aria-label', b.title); }
      if (w === 'R') b.classList.toggle('pinned', !!ui.pinR);
    }
    const bb = $('#edgeB'), hb = ed.classList.contains('nostrip');
    bb.querySelector('path').setAttribute('d', hb ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6');
    bb.title = hb ? 'Mostrar as páginas' : 'Recolher as páginas'; bb.setAttribute('aria-label', bb.title);
  }
  const refit = () => setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  function setHidden(w, hide) {
    if (compact()) { ed.classList.toggle(CL[w][1], !hide); }
    else { ed.classList.toggle(CL[w][0], hide); ui['hide' + w] = hide; save(); }
    if (w === 'R' && compact()) { ui.noAutoProps = hide; save(); }
    syncEdges(); refit();
  }
  $('#edgeL').onclick = () => setHidden('L', !hidden('L'));
  // barra da direita: dois cliques na seta (ou o botão de alfinete) fixam; fixa, ela não fecha sozinha
  const pinned = () => !!ui.pinR;
  const PIN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 15v6"/></svg>';
  function setPin(v, quiet) {
    ui.pinR = !!v; save(); ed.classList.toggle('pinR', !!v);
    if (v && hidden('R')) setHidden('R', false);
    if (v) { ui.noAutoProps = false; save(); if (compact()) { ed.classList.add('showprops'); } }
    const b = document.getElementById('pinBtn'); if (b) { b.classList.toggle('on', !!v); b.setAttribute('aria-pressed', String(!!v)); b.title = v ? 'Barra fixa: não fecha sozinha (clique para soltar)' : 'Fixar a barra para ela não fechar sozinha'; }
    syncEdges(); refit();
    if (!quiet && typeof toast === 'function') toast(v ? 'Barra fixa: ela não fecha sozinha. Dois cliques na seta, ou no alfinete, soltam.' : 'Barra solta.');
  }
  // um clique recolhe/mostra (após um instante, para dar tempo do segundo); dois cliques fixam ou soltam
  let ck = null;
  $('#edgeR').onclick = () => {
    if (ck) { clearTimeout(ck); ck = null; setPin(!pinned()); return; }
    ck = setTimeout(() => { ck = null; if (!pinned()) setHidden('R', !hidden('R')); }, 280);
  };
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#pinBtn'); if (b) setPin(!pinned()); });
  function strip(hide, silent) {
    ed.classList.toggle('nostrip', hide);
    if (!silent) { ui.hideB = hide; save(); refit(); }
    syncEdges();
  }
  $('#edgeB').onclick = () => strip(!ed.classList.contains('nostrip'));

  function aplicarModo() {
    ed.classList.toggle('compact', mq.matches);
    ed.classList.remove('showpanel', 'showprops');
    if (mq.matches) { ed.classList.remove('nopanel', 'noprops'); }
    else { ed.classList.toggle('nopanel', !!ui.hideL); ed.classList.toggle('noprops', !!ui.hideR); }
    strip(ui.hideB === undefined ? mq.matches : !!ui.hideB, true);
    ed.classList.toggle('pinR', !!ui.pinR);
    if (ui.pinR) { ed.classList.remove('noprops'); if (mq.matches) ed.classList.add('showprops'); }
    refit();
  }
  if (mq.addEventListener) mq.addEventListener('change', aplicarModo); else if (mq.addListener) mq.addListener(aplicarModo);
  new MutationObserver(syncEdges).observe(ed, { attributes: true, attributeFilter: ['class'] });
  aplicarModo();

  // menu "⋯" (só no modo compacto): guarda régua, grade, versões e o link do app
  const more = $('#moreMenu');
  function fechaMais() { more.hidden = true; }
  function abreMais() {
    const on = (id) => $(id).classList.contains('on');
    const app = $('#appLinkTop'), nuvem = $('#cloudSt');
    more.innerHTML = `<button data-go="#bRuler" role="menuitem" class="${on('#bRuler') ? 'on' : ''}">Régua e guias<span>${on('#bRuler') ? '✓' : ''}</span></button>
      <button data-go="#bGrid" role="menuitem" class="${on('#bGrid') ? 'on' : ''}">Grade<span>${on('#bGrid') ? '✓' : ''}</span></button>
      <button data-go="#bVers" role="menuitem">Versões do projeto</button>
      ${app && !app.hidden ? `<a href="${app.href}" target="_blank" rel="noopener" role="menuitem">App do ateliê ↗</a>` : ''}
      ${nuvem && nuvem.title ? `<hr><div class="info">${nuvem.title}</div>` : ''}`;
    $$('[data-go]', more).forEach((x) => { x.onclick = () => { fechaMais(); $(x.dataset.go).click(); }; });
    const r = $('#bMore').getBoundingClientRect();
    more.style.top = r.bottom + 6 + 'px'; more.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    more.hidden = false;
  }
  $('#bMore').onclick = (e) => { e.stopPropagation(); if (more.hidden) abreMais(); else fechaMais(); };
  document.addEventListener('click', (e) => { if (!more.hidden && !more.contains(e.target)) fechaMais(); });

  // Esc fecha as janelinhas; tocar na página fecha a de ferramentas
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !compact() || ui.pinR) return;
    const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (!more.hidden) { fechaMais(); return; }
    if ($('#modal') && !$('#modal').hidden) return;
    ed.classList.remove('showpanel', 'showprops');
  });
  $('#wsw').addEventListener('pointerdown', () => { if (compact()) ed.classList.remove('showpanel'); fechaMais(); });
  // escolher uma ferramenta no trilho reabre o painel (modo amplo)
  $('#rail').addEventListener('click', (e) => { if (e.target.closest('button') && !compact() && ed.classList.contains('nopanel')) setHidden('L', false); });

  // modo compacto: ao selecionar um objeto, as propriedades abrem sozinhas; ao soltar, fecham (a menos que você as tenha fechado de propósito)
  const rp0 = renderProps; let tinha = false, auto = false;
  renderProps = function () {
    rp0.apply(this, arguments);
    const PP = document.getElementById('props');
    if (PP && !PP.querySelector('#pinBtn')) { PP.insertAdjacentHTML('afterbegin', `<button type="button" class="ppin${ui.pinR ? ' on' : ''}" id="pinBtn" aria-pressed="${!!ui.pinR}" title="${ui.pinR ? 'Barra fixa: não fecha sozinha (clique para soltar)' : 'Fixar a barra para ela não fechar sozinha'}">${PIN}</button>`); }
    { const bar = PP && PP.querySelector('#pgBarC'), pb = PP && PP.querySelector('#pinBtn'); if (bar && pb && pb.parentNode !== bar) bar.appendChild(pb); }
    if (!compact() || S.view !== 'editor') return;
    const tem = !!(S.sel && S.sel.length);
    if (tem && !tinha && !ui.noAutoProps) { ed.classList.add('showprops'); auto = true; }
    if (!tem && tinha && auto && !ui.pinR) { ed.classList.remove('showprops'); auto = false; }
    tinha = tem;
  };
  window.Layout = { view };
})();
