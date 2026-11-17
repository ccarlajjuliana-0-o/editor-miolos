/* Tamanho — escolha do tamanho do projeto dentro do editor (botão na barra de cima).
   O tamanho escolhido vale para as páginas e guia as opções de impressão na exportação. */
(function () {
  'use strict';
  const IN = 25.4;
  const CATS = [
    ['Papel', [['A3', 297, 420], ['A4', 210, 297], ['A5', 148, 210], ['A6', 105, 148], ['A7', 74, 105], ['B5', 176, 250], ['B6', 125, 176], ['Carta', 215.9, 279.4], ['Meia-carta', 139.7, 215.9], ['Ofício', 216, 330], ['Executivo', 184.2, 266.7]]],
    ['Cadernos e planners', [['Colegial', 170, 230], ['A5 Slim', 98, 210], ['Personal', 95, 171], ['Pocket', 81, 120], ['Field Notes', 88.9, 139.7], ['Quadrado 15 cm', 150, 150]]],
    ['Argolas e discos', [['Classic 7 × 9 pol', 177.8, 228.6], ['Mini 4,5 × 6,75 pol', 114.3, 171.45], ['A5 (argolas)', 148, 210], ['Personal (argolas)', 95, 171]]],
    ["Traveller's", [['Standard 110 × 210', 110, 210], ['Passaporte 90 × 125', 90, 125]]],
    ['Tablet e redes', [['Tela de tablet 4:3', 210, 280], ['Post quadrado 1:1', 108, 108], ['Post retrato 4:5', 108, 135], ['Stories 9:16', 108, 192]]],
    ['KDP (Amazon)', [['KDP 5 × 8 pol', 127, 203.2], ['KDP 5,25 × 8 pol', 133.35, 203.2], ['KDP 5,5 × 8,5 pol', 139.7, 215.9], ['KDP 6 × 9 pol', 152.4, 228.6], ['KDP 7 × 10 pol', 177.8, 254], ['KDP 8 × 10 pol', 203.2, 254], ['KDP 8,25 × 11 pol', 209.55, 279.4]]],
  ];
  const ALL = []; CATS.forEach(([c, list]) => list.forEach(([n, w, h]) => ALL.push({ n, w, h, c })));
  const near = (a, b) => Math.abs(a - b) < 0.6;
  /** nome do tamanho (aparece na barra, na exportação, nas páginas) */
  const baseName = window.sizeName;
  window.sizeName = (w, h) => {
    for (const s of ALL) { if (s.c === 'Argolas e discos') continue; if (near(s.w, w) && near(s.h, h)) return s.n; if (near(s.w, h) && near(s.h, w)) return s.n + ' deitado'; }
    return baseName(w, h);
  };
  const fmtN = (v, unit) => { const x = unit === 'in' ? v / IN : v; const r = Math.round(x * 100) / 100; return String(r).replace('.', ','); };
  const dimsTxt = (w, h, unit) => `${fmtN(w, unit)} × ${fmtN(h, unit)} ${unit === 'in' ? 'pol' : 'mm'}`;

  function projectSizes() {
    const m = new Map();
    S.order.forEach((id) => { const p = S.pages[id]; if (!p) return; const n = window.sizeName(p.w, p.h); if (!m.has(n)) m.set(n, { n: 0, w: p.w, h: p.h }); m.get(n).n++; });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }
  function updChip() {
    const t = document.getElementById('bSizeT'), b = document.getElementById('bSize'); if (!t || !S.meta) return;
    const ps = projectSizes(); if (!ps.length) return;
    t.textContent = ps[0][0].replace(' deitado', ' ↔');
    b.title = 'Tamanho do projeto: ' + ps.map(([n, v]) => `${n} (${v.n})`).join(' · ');
    b.classList.toggle('mixed', ps.length > 1);
  }

  function printHint(w, h) {
    const E = window.Exportar; if (!E) return '';
    const out = []; for (const k of E.SHEETS) { const L = E.nupLayout(w, h, k); if (L && L.n >= 2) out.push(`${L.n} por ${E.SH[k][2]}`); }
    return out.length ? 'Imprime ' + out.slice(0, 2).join(' · ') : (E.SHEETS.some((k) => E.nupLayout(w, h, k)) ? 'Cabe em 1 por folha' : 'Só individual');
  }

  function openSizes() {
    if (!S.meta) return;
    const ps = projectSizes(), cur = ps[0] ? { w: ps[0][1].w, h: ps[0][1].h, n: ps[0][0] } : { w: 148, h: 210, n: 'A5' };
    const st = { cat: 'Todos', q: '', unit: 'mm', sel: { w: Math.min(cur.w, cur.h), h: Math.max(cur.w, cur.h) }, land: cur.w > cur.h, custom: false, scale: true };
    modal(`<div class="xroot tmroot">
      <div class="xhead"><div><h2>Tamanho do projeto</h2><p class="hint" id="tmSub"></p></div><button class="btn ghost" data-close aria-label="Fechar">✕</button></div>
      <div class="tmbody">
        <div class="tmtools"><input type="search" id="tmQ" placeholder="Procurar tamanho…" aria-label="Procurar tamanho"><select id="tmUnit" aria-label="Unidade"><option value="mm">mm</option><option value="in">pol</option></select></div>
        <div class="tmcats" id="tmCats"></div>
        <div class="tmgrid" id="tmGrid"></div>
        <details class="xadv" id="tmCustom"><summary>Tamanho personalizado</summary>
          <div class="xrow"><label class="f">Largura<input type="number" id="tmW" step="0.1" min="2"></label><label class="f">Altura<input type="number" id="tmH" step="0.1" min="2"></label><span class="hint" id="tmU">mm</span></div>
        </details>
      </div>
      <div class="tmfoot">
        <div class="xrow"><div class="segf" id="tmOri"><button data-o="p">Em pé</button><button data-o="l">Deitado</button></div><label class="chk"><input type="checkbox" id="tmScale" checked> Ajustar o conteúdo ao novo tamanho</label></div>
        <p class="hint" id="tmInfo"></p>
        <div class="row" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn ghost" data-close>Cancelar</button><button class="btn" id="tmOne">Só na página atual</button><button class="btn pri" id="tmAll">Aplicar em todas as páginas</button></div>
      </div></div>`, (b, close) => {
      const g = (q) => b.querySelector(q);
      const dims = () => { const a = Math.min(st.sel.w, st.sel.h), c = Math.max(st.sel.w, st.sel.h); return st.land ? { w: c, h: a } : { w: a, h: c }; };
      const same = (s) => { const d = dims(); return near(Math.min(s.w, s.h), Math.min(d.w, d.h)) && near(Math.max(s.w, s.h), Math.max(d.w, d.h)); };
      const draw = () => {
        g('#tmSub').textContent = `Hoje: ${cur.n} · ${dimsTxt(cur.w, cur.h, 'mm')} · ${S.order.length} página${S.order.length > 1 ? 's' : ''}${ps.length > 1 ? ' · tamanhos diferentes no projeto' : ''}`;
        g('#tmCats').innerHTML = ['Todos', ...CATS.map((c) => c[0])].map((c) => `<button class="${st.cat === c ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
        const q = st.q.trim().toLowerCase(), list = ALL.filter((s) => (st.cat === 'Todos' || s.c === st.cat) && (!q || s.n.toLowerCase().includes(q) || dimsTxt(s.w, s.h, st.unit).includes(q)));
        g('#tmGrid').innerHTML = list.length ? list.map((s) => {
          const a = Math.min(s.w, s.h), c = Math.max(s.w, s.h), sc = 34 / c, pw = a * sc, ph = c * sc;
          return `<button class="xcard tmcard${same(s) ? ' on' : ''}" data-n="${s.n}" data-w="${s.w}" data-h="${s.h}"><span class="tmic"><i style="width:${pw}px;height:${ph}px"></i></span><span class="xlb">${s.n}</span><span class="tmdim">${dimsTxt(s.w, s.h, st.unit)}</span><span class="tmprn">${printHint(Math.min(s.w, s.h), Math.max(s.w, s.h))}</span></button>`;
        }).join('') : '<p class="hint">Nenhum tamanho com esse nome. Use “Tamanho personalizado”.</p>';
        $$('#tmOri button', b).forEach((x) => x.classList.toggle('on', (x.dataset.o === 'l') === st.land));
        const d = dims(); g('#tmU').textContent = st.unit === 'in' ? 'pol' : 'mm';
        if (document.activeElement !== g('#tmW')) g('#tmW').value = st.unit === 'in' ? Math.round(d.w / IN * 1000) / 1000 : Math.round(d.w * 10) / 10;
        if (document.activeElement !== g('#tmH')) g('#tmH').value = st.unit === 'in' ? Math.round(d.h / IN * 1000) / 1000 : Math.round(d.h * 10) / 10;
        g('#tmInfo').textContent = `Novo tamanho: ${dimsTxt(d.w, d.h, st.unit)} · ${printHint(d.w, d.h)}.`;
      };
      g('#tmQ').oninput = (e) => { st.q = e.target.value; draw(); };
      g('#tmUnit').onchange = (e) => { st.unit = e.target.value; draw(); };
      g('#tmCats').onclick = (e) => { const x = e.target.closest('button'); if (x) { st.cat = x.dataset.c; draw(); } };
      g('#tmGrid').onclick = (e) => { const x = e.target.closest('.tmcard'); if (!x) return; st.sel = { w: +x.dataset.w, h: +x.dataset.h }; draw(); };
      g('#tmOri').onclick = (e) => { const x = e.target.closest('button'); if (x) { st.land = x.dataset.o === 'l'; draw(); } };
      const fromInputs = () => { const k = st.unit === 'in' ? IN : 1, w = (+g('#tmW').value || 0) * k, h = (+g('#tmH').value || 0) * k; if (w >= 5 && h >= 5) { st.sel = { w, h }; st.land = w > h; $$('#tmOri button', b).forEach((x) => x.classList.toggle('on', (x.dataset.o === 'l') === st.land)); g('#tmInfo').textContent = `Novo tamanho: ${dimsTxt(w, h, st.unit)} · ${printHint(Math.min(w, h), Math.max(w, h))}.`; $$('.tmcard', b).forEach((c) => c.classList.toggle('on', same({ w: +c.dataset.w, h: +c.dataset.h }))); } };
      g('#tmW').oninput = fromInputs; g('#tmH').oninput = fromInputs;
      g('#tmScale').onchange = (e) => { st.scale = e.target.checked; };
      const apply = (all) => {
        const d = dims(), w = Math.round(d.w * 100) / 100, h = Math.round(d.h * 100) / 100; if (w < 20 || h < 20 || w > 1000 || h > 1000) { toast('Use medidas entre 20 e 1000 mm.'); return; }
        const ids = all ? S.order.slice() : [S.order[S.cur]];
        resizePage(ids, w, h, st.scale);
        if (all) { S.meta.size = { w, h }; Saver.m(); }
        close(); updChip(); toast(all ? `Todas as páginas agora têm ${dimsTxt(w, h, 'mm')}.` : `Página ${S.cur + 1} agora tem ${dimsTxt(w, h, 'mm')}.`);
      };
      g('#tmAll').onclick = () => apply(true); g('#tmOne').onclick = () => apply(false);
      draw();
    });
  }

  // botão na barra de cima
  function mount() {
    const top = document.getElementById('etop'), nm = document.getElementById('pName'); if (!top || !nm || document.getElementById('bSize')) return;
    const b = document.createElement('button'); b.className = 'btn sm ghost'; b.id = 'bSize'; b.setAttribute('aria-label', 'Tamanho do projeto');
    b.innerHTML = '<svg class="ico" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="1.8"/><path d="M3 8v8M21 8v8"/></svg><span id="bSizeT">A5</span>';
    nm.insertAdjacentElement('afterend', b); b.onclick = openSizes;
  }
  mount();
  const ra = window.refreshAll; if (typeof ra === 'function') window.refreshAll = function () { const r = ra.apply(this, arguments); try { updChip(); } catch (e) { /* segue */ } return r; };
  const op = window.openProject; if (typeof op === 'function') window.openProject = async function () { const r = await op.apply(this, arguments); try { updChip(); } catch (e) { /* segue */ } return r; };
  window.Tamanho = { open: openSizes, update: updChip, CATS };
})();
