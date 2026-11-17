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
  menu(!!ui.menu);

  const ed = $('#editor');
  const ICON = { L: ['M15 6l-6 6 6 6', 'M9 6l6 6-6 6'], R: ['M9 6l6 6-6 6', 'M15 6l-6 6 6 6'] };
  const TXT = { L: ['Recolher o painel de ferramentas', 'Mostrar o painel de ferramentas'], R: ['Recolher as propriedades', 'Mostrar as propriedades'] };
  function side(w, hide, silent) {
    ed.classList.toggle(w === 'L' ? 'nopanel' : 'noprops', hide);
    const b = $('#edge' + w), i = hide ? 1 : 0;
    b.querySelector('path').setAttribute('d', ICON[w][i]); b.title = TXT[w][i]; b.setAttribute('aria-label', TXT[w][i]);
    if (!silent) { ui['hide' + w] = hide; save(); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); }
  }
  $('#edgeL').onclick = () => side('L', !ed.classList.contains('nopanel'));
  $('#edgeR').onclick = () => side('R', !ed.classList.contains('noprops'));
  side('L', !!ui.hideL, true); side('R', !!ui.hideR, true);
  function strip(hide, silent) {
    ed.classList.toggle('nostrip', hide);
    const b = $('#edgeB'), t = hide ? 'Mostrar as páginas' : 'Recolher as páginas';
    b.querySelector('path').setAttribute('d', hide ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'); b.title = t; b.setAttribute('aria-label', t);
    if (!silent) { ui.hideB = hide; save(); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); }
  }
  $('#edgeB').onclick = () => strip(!ed.classList.contains('nostrip'));
  strip(!!ui.hideB, true);
  // escolher uma ferramenta no trilho reabre o painel
  $('#rail').addEventListener('click', (e) => { if (e.target.closest('button') && ed.classList.contains('nopanel')) side('L', false); });
  window.Layout = { view, side };
})();
