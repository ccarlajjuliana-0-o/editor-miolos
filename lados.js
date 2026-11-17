/* Lados — botão da barra de cima: copiar e trocar conteúdo entre as duas páginas da dupla (ou entre quaisquer páginas). */
(function () {
  'use strict';
  const ALL = { bg: true, text: true, img: true, shape: true, data: true };
  const KEEP = new Set(['id', 'w', 'h', 'els', 'mg', 'name']);
  const pn = (i) => { const p = S.pages[S.order[i]]; return `${i + 1}: ${(p && p.name && p.name.trim()) || 'Página'}`; };
  const opts = (sel) => S.order.map((_, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${esc(pn(i))}</option>`).join('');
  const pair = () => { // [esquerda, direita] da dupla da página atual
    const p = curPage(), q = p && window.Margens && Margens.partnerOf ? Margens.partnerOf(p) : null; if (!q) return null;
    return S.order.indexOf(p.id) < S.order.indexOf(q.id) ? [p, q] : [q, p];
  };
  function copy(from, to) {
    const k = Paginas.copyDesign(from.id, [to.id], { replace: true, fit: true, remap: true, parts: ALL });
    if (k) toast('Conteúdo copiado para a página ' + (S.order.indexOf(to.id) + 1) + '. Ctrl+Z desfaz.');
  }
  function pack(pg) { const o = { els: clone(pg.els), name: pg.name, w: pg.w, h: pg.h, props: {} }; Object.keys(pg).forEach((k) => { if (!KEEP.has(k)) o.props[k] = clone(pg[k]); }); return o; }
  function put(d, o, srcPg) {
    const fx = d.w / o.w, fy = d.h / o.h, fm = Math.min(fx, fy), sc = Math.abs(fx - 1) > 0.001 || Math.abs(fy - 1) > 0.001;
    const els = o.els.map((e) => {
      e.id = uid('e');
      if (sc) { e.x = r1(e.x * fx); e.y = r1(e.y * fy); e.w = r1(e.w * fx); e.h = r1(e.h * fy); if (e.type === 'text' || e.type === 'table' || e.type === 'divider') e.size = r1((e.size || 9) * fm); if (e.sp) e.sp = r1(e.sp * fm); }
      return e;
    });
    if (window.Margens && Margens.remap) Margens.remap(els, srcPg, d);
    Object.keys(d).forEach((k) => { if (!KEEP.has(k)) delete d[k]; });
    Object.keys(o.props).forEach((k) => { d[k] = o.props[k]; });
    d.els = els; d.name = o.name;
  }
  function swap(a, b) {
    if (!a || !b || a.id === b.id) return;
    const A = pack(a), B = pack(b), sa = { w: a.w, h: a.h, id: a.id, mg: a.mg }, sb = { w: b.w, h: b.h, id: b.id, mg: b.mg };
    change([a.id, b.id], () => { put(a, B, sb); put(b, A, sa); });
    thumbRefresh(a.id); thumbRefresh(b.id); refreshAll();
    toast('Páginas ' + (S.order.indexOf(a.id) + 1) + ' e ' + (S.order.indexOf(b.id) + 1) + ' trocadas. Ctrl+Z desfaz.');
  }
  function swapModal() {
    const n = S.order.length, cur = S.cur, other = cur + 1 < n ? cur + 1 : Math.max(0, cur - 1);
    modal(`<div class="insroot"><h2>Trocar com outra página</h2><p class="hint">Troca todo o conteúdo e o estilo entre duas páginas quaisquer.</p>
      <label class="f">Página A<select id="swA">${opts(cur)}</select></label><label class="f">Página B<select id="swB">${opts(other)}</select></label>
      <p class="hint" id="swI"></p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="swGo">Trocar</button></div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q), chk = () => { const same = g('#swA').value === g('#swB').value; g('#swGo').disabled = same; g('#swI').textContent = same ? 'Escolha duas páginas diferentes.' : ''; };
      g('#swA').onchange = g('#swB').onchange = chk; chk();
      g('#swGo').onclick = () => { const a = S.pages[S.order[+g('#swA').value]], c = S.pages[S.order[+g('#swB').value]]; close(); swap(a, c); };
    });
  }
  let menu = null;
  const close = () => { if (menu) { menu.remove(); menu = null; } document.removeEventListener('pointerdown', onDoc, true); document.removeEventListener('keydown', onKey, true); };
  const onDoc = (e) => { if (menu && !menu.contains(e.target) && !e.target.closest('#bLados')) close(); };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  function open(anchor) {
    if (menu) { close(); return; }
    const pr = pair(), n = S.order.length, no = !pr;
    const it = (t, s, fn, dis) => ({ t, s, fn, dis });
    const items = [['COPIAR',
      it('Copiar esquerda → direita', 'Sobrescreve o lado direito', () => copy(pr[0], pr[1]), no),
      it('Copiar direita → esquerda', 'Sobrescreve o lado esquerdo', () => copy(pr[1], pr[0]), no),
      it('Copiar para outra página…', 'Escolha páginas de origem e destino', () => Paginas.copyModal(S.cur, null), n < 2)],
    ['TROCAR',
      it('Trocar lados da página', 'Trocar esquerda e direita', () => swap(pr[0], pr[1]), no),
      it('Trocar com outra página…', 'Trocar qualquer dois lados', swapModal, n < 2)]];
    const m = document.createElement('div'); m.className = 'pgmenu lmenu'; m.setAttribute('role', 'menu');
    items.forEach((g, gi) => {
      if (gi) m.appendChild(document.createElement('hr'));
      const h = document.createElement('small'); h.textContent = g[0]; m.appendChild(h);
      g.slice(1).forEach((x) => {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.disabled = !!x.dis;
        b.innerHTML = `<b>${x.t}</b><span>${x.s}</span>`; b.onclick = () => { close(); x.fn(); }; m.appendChild(b);
      });
    });
    if (no) { const h = document.createElement('p'); h.className = 'hint'; h.textContent = 'Esta página não tem par (capa ou página sozinha): use as opções “outra página”.'; m.appendChild(h); }
    document.body.appendChild(m); menu = m;
    const r = anchor.getBoundingClientRect(), mw = m.offsetWidth;
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - mw - 8)) + 'px'; m.style.top = (r.bottom + 6) + 'px';
    setTimeout(() => { document.addEventListener('pointerdown', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
    const f = m.querySelector('button:not(:disabled)'); if (f) f.focus();
  }
  function mount() {
    const sz = document.getElementById('bSize'); if (!sz || document.getElementById('bLados')) return;
    const b = document.createElement('button'); b.className = 'btn sm ghost'; b.id = 'bLados'; b.setAttribute('aria-label', 'Copiar e trocar páginas'); b.title = 'Copiar ou trocar o conteúdo entre páginas';
    b.innerHTML = '<svg class="ico" viewBox="0 0 24 24"><rect x="2.5" y="5" width="8" height="14" rx="1.6"/><rect x="13.5" y="5" width="8" height="14" rx="1.6"/><path d="M10.5 10h3M12.3 8.4 13.9 10l-1.6 1.6M13.5 14h-3M11.7 12.4 10.1 14l1.6 1.6"/></svg><span class="lbl">Lados</span><span aria-hidden="true">⌄</span>';
    sz.insertAdjacentElement('afterend', b); b.onclick = () => open(b);
  }
  mount();
  window.Lados = { open, swap, copy };
})();
