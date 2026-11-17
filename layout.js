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
  $('#edgeR').onclick = () => setHidden('R', !hidden('R'));
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
    if (e.key !== 'Escape' || !compact()) return;
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
    if (!compact() || S.view !== 'editor') return;
    const tem = !!(S.sel && S.sel.length);
    if (tem && !tinha && !ui.noAutoProps) { ed.classList.add('showprops'); auto = true; }
    if (!tem && tinha && auto) { ed.classList.remove('showprops'); auto = false; }
    tinha = tem;
  };
  window.Layout = { view };
})();
