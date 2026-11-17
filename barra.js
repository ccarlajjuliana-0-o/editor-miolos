/* Barra rápida: aparece sobre o objeto selecionado, com os ajustes que fazem sentido para ele. */
(function () {
  'use strict';
  const bar = document.createElement('div'); bar.id = 'qbar'; bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Ajustes rápidos');
  document.body.appendChild(bar);
  const AL = { l: 'M4 6h16M4 10h10M4 14h16M4 18h10', c: 'M4 6h16M7 10h10M4 14h16M7 18h10', r: 'M4 6h16M10 10h10M4 14h16M10 18h10' };
  const svg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="${d}"/></svg>`;
  const ALN_ = () => (typeof ALN !== 'undefined' ? ALN : {});
  const btn = (a, t, inner, on) => `<button type="button" data-q="${a}" title="${t}" aria-label="${t}"${on ? ' class="on"' : ''}>${inner}</button>`;
  const ib = (a, t, i) => `<button type="button" class="ib" data-q="${a}" title="${t}" aria-label="${t}">${ico(i)}</button>`;
  const sep = '<span class="qs"></span>';
  const alignBtns = (suf) => ['al', 'ac', 'ar', 'at', 'am', 'ab'].map((a) => ib('al:' + a, ALN_()[a] + suf, a)).join('');

  function html(els) {
    if (els.length > 1) {
      const ung = els.some((e) => e.g);
      return btn('group', 'Agrupar (Ctrl+G)', 'Agrupar') + (ung ? btn('ungroup', 'Desagrupar (Ctrl+Shift+G)', 'Desagrupar') : '') + sep +
        ib('dup', 'Duplicar (Ctrl+D)', 'dup') + ib('del', 'Excluir (Delete)', 'del') + sep + alignBtns(' (entre si)');
    }
    const e = els[0], common = ib('dup', 'Duplicar (Ctrl+D)', 'dup') + ib('lock', e.locked ? 'Destravar' : 'Travar', e.locked ? 'unlock' : 'lock') + ib('front', 'Trazer para a frente', 'front') + ib('back', 'Enviar para trás', 'back') + ib('del', 'Excluir (Delete)', 'del');
    if (e.type === 'text') {
      const fonts = (typeof FONTS !== 'undefined' ? FONTS : []).map(([n]) => `<option value="${n}"${n === e.font ? ' selected' : ''}>${n}</option>`).join('');
      const has = (typeof FONTS !== 'undefined' ? FONTS : []).some(([n]) => n === e.font);
      return `<select data-q="font" title="Fonte" aria-label="Fonte">${has ? '' : `<option selected>${e.font || ''}</option>`}${fonts}</select>` + sep +
        btn('size-', 'Diminuir a fonte', '−') + `<input class="qn" type="number" step="0.5" min="1" data-q="size" value="${Math.round((e.size || 10) * 10) / 10}" title="Tamanho da fonte (pt)" aria-label="Tamanho da fonte">` + btn('size+', 'Aumentar a fonte', '+') + sep +
        `<label class="qc" title="Cor do texto"><span>A</span><b style="background:${/^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : '#3E3550'}"></b><input type="color" data-q="color" value="${/^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : '#3E3550'}" aria-label="Cor do texto"></label>` +
        btn('bold', 'Negrito', 'B', (e.weight || 400) >= 600).replace('<button', '<button class="qg"').replace('class="qg" class="on"', 'class="qg on"') + btn('italic', 'Itálico', '<i>I</i>', e.italic).replace('<button', '<button class="qg"').replace('class="qg" class="on"', 'class="qg on"') + sep +
        btn('ta:left', 'Alinhar o texto à esquerda', svg(AL.l), (e.align || 'left') === 'left') + btn('ta:center', 'Centralizar o texto', svg(AL.c), e.align === 'center') + btn('ta:right', 'Alinhar o texto à direita', svg(AL.r), e.align === 'right') + sep +
        common + sep + alignBtns(' (na página)');
    }
    return common + sep + alignBtns(' (na página)');
  }

  function place(els) {
    const w = document.querySelector('#stage .pg.on'), ws = document.getElementById('ws'); if (!w || !ws) return false;
    const r = w.getBoundingClientRect(), wr = ws.getBoundingClientRect(), k = S.k;
    const B = bb(els), x = r.left + B.x * k, y = r.top + B.y * k, bw = B.w * k, bh = B.h * k;
    bar.hidden = false; bar.style.maxWidth = Math.max(120, wr.width - 12) + 'px';
    const W = bar.offsetWidth, H = bar.offsetHeight;
    let top = y - H - 16; if (top < wr.top + 4) top = y + bh + 14;
    if (top + H > wr.bottom - 4) top = Math.max(wr.top + 4, Math.min(y + 8, wr.bottom - H - 4));
    let left = x + bw / 2 - W / 2; left = Math.max(wr.left + 6, Math.min(left, wr.right - W - 6));
    bar.style.left = Math.round(left) + 'px'; bar.style.top = Math.round(top) + 'px';
    return true;
  }
  let sig = '';
  function update() {
    const p = typeof curPage === 'function' ? curPage() : null;
    const els = p && S.view === 'editor' ? selEls() : [];
    const modal = document.getElementById('modal'), busy = (modal && !modal.hidden) || S.editing || S.tool || (typeof D !== 'undefined' && D && D.moved);
    if (!els.length || busy || (els.length === 1 && S.ptEdit === els[0].id)) { bar.hidden = true; sig = ''; return; }
    if (bar.contains(document.activeElement) && document.activeElement.matches('input,select')) { place(els); return; }
    const key = JSON.stringify(els.map((e) => [e.id, e.type, e.font, e.weight, e.italic, e.align, e.color, e.size, e.locked, e.g]));
    if (key !== sig) { bar.innerHTML = html(els); sig = key; }
    if (!place(els)) bar.hidden = true;
  }

  const p0 = redraw; redraw = function () { const r = p0.apply(this, arguments); update(); return r; };
  const r0 = renderProps; renderProps = function () { const r = r0.apply(this, arguments); update(); return r; };
  const ws = document.getElementById('ws'); if (ws) ws.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => setTimeout(update, 150));
  document.addEventListener('keydown', () => setTimeout(update, 0));

  let hist = null;
  const edit = (fn) => { const p = curPage(), els = selEls().filter((e) => !e.locked); if (!p || !els.length) return; change([p.id], () => els.forEach(fn)); redraw(); renderProps(); thumbRefresh(p.id); };
  bar.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-q]'); if (!b) return; const a = b.dataset.q, p = curPage();
    if (a === 'dup') dupSel(); else if (a === 'del') delSel(); else if (a === 'group') groupSel(); else if (a === 'ungroup') ungroupSel();
    else if (a === 'lock') { change([p.id], () => selEls().forEach((e) => { e.locked = !e.locked; })); redraw(); renderProps(); }
    else if (a === 'front' || a === 'back') orderSel(a);
    else if (a.startsWith('al:')) alignSel(a.slice(3));
    else if (a === 'size+' || a === 'size-') edit((e) => { e.size = Math.max(1, Math.round(((e.size || 10) + (a === 'size+' ? 1 : -1)) * 10) / 10); });
    else if (a === 'bold') edit((e) => { e.weight = (e.weight || 400) >= 600 ? 400 : 700; });
    else if (a === 'italic') edit((e) => { e.italic = !e.italic; });
    else if (a.startsWith('ta:')) edit((e) => { e.align = a.slice(3); });
  });
  bar.addEventListener('change', (ev) => {
    const t = ev.target, a = t.dataset.q, p = curPage(); if (!a || !p) return;
    if (a === 'font') edit((e) => { e.font = t.value; });
    else if (a === 'size') { const v = parseFloat(t.value); if (v > 0) edit((e) => { e.size = Math.round(v * 10) / 10; }); }
    else if (a === 'color') { if (hist) { pushHist(hist, snapOf([p.id])); hist = null; thumbRefresh(p.id); } renderProps(); }
  });
  bar.addEventListener('input', (ev) => {
    const t = ev.target; if (t.dataset.q !== 'color') return; const p = curPage(); if (!p) return;
    hist = hist || snapOf([p.id]); selEls().forEach((e) => { if (!e.locked) e.color = t.value; });
    const sw = t.parentNode.querySelector('b'); if (sw) sw.style.background = t.value; scheduleRedraw();
  });
  // clicar na barra não pode tirar a seleção nem começar a editar o texto
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());
  window.QuickBar = { update };
})();
