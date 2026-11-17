/* Layout da página — margens internas/externas, furos, lombada, cabeçalho, rodapé e divisórias.
   Guias no editor (arrastáveis, com trava) e ajuste do conteúdo.
   O lado de DENTRO (margem interna, furos e lombada) fica no encontro das duas páginas, no meio da dupla. */
(function () {
  'use strict';
  const MIN = 20, DEF_HF = 12;
  const num = (v, d) => (Number.isFinite(+v) ? +v : d);

  /* ---------- modelo ---------- */
  // true = página da ESQUERDA da dupla no editor (o lado de dentro fica na sua borda direita, no meio da dupla)
  const autoLeft = (p) => {
    const i = S.order.indexOf(p.id), off = S.meta.coverAlone !== false ? 1 : 0;
    const e = i < off ? false : (i - off) % 2 === 0; // capa sozinha aparece à direita
    return S.meta.mgFlip ? !e : e;
  };
  const isLeft = (p, m) => (m && m.side === 'e' ? true : m && m.side === 'd' ? false : autoLeft(p));
  const BIND = {
    spiral: { name: 'Espiral plástico', mm: 15, d: 7, obs: 'Furo redondo e próximo da borda (cerca de 6 a 8 mm). Sobram uns 7 a 9 mm de respiro.' },
    wire: { name: 'Wire-o (duplo anel)', mm: 18, d: 9, obs: 'Furo quadrado ou redondo (8 a 10 mm). Recomendado de 15 a 18 mm, para o anel girar sem rasgar o papel.' },
    disc: { name: 'Caderno de discos', mm: 20, d: 11, obs: 'O furo em cogumelo avança mais para dentro da folha (10 a 12 mm). Pede a maior margem: 18 a 20 mm.' },
  };
  const bindOf = (m) => (m && BIND[m.bind] ? m.bind : m && m.bind === undefined && num(m.holes, 0) === 20 ? 'disc' : 'custom');
  const defaults = (p) => { const s = Math.min(p.w, p.h), r = (v) => Math.round(v * 2) / 2; return { top: r(s * 0.05), bottom: r(s * 0.05), inner: r(s * 0.04), outer: r(s * 0.04), gutter: 0, holes: 20, bind: 'disc', hdr: 0, ftr: 0, tabs: { on: false, pos: 'side', n: 4, w: 12, r: 3, bg: 'none' }, lock: false, side: 'auto' }; };
  const tabsOf = (m) => Object.assign({ on: false, pos: 'side', n: 4, w: 12, r: 3, bg: 'none' }, m && m.tabs);
  function extras(m) { const t = tabsOf(m), w = t.on ? Math.max(0, num(t.w, 12)) : 0; return { side: t.pos === 'side' ? w : 0, top: t.pos === 'top' ? w : 0, bot: t.pos === 'bottom' ? w : 0, t }; }
  function geom(p, m) {
    if (!m) return { full: true, x0: 0, x1: p.w, top: 0, bot: p.h, y0: 0, y1: p.h, hasH: false, hasF: false, e: false, g: 0, holes: 0, X: { side: 0, top: 0, bot: 0, t: tabsOf(null) } };
    const e = isLeft(p, m), g = num(m.gutter, 0) / 2, hdr = num(m.hdr, 0), ftr = num(m.ftr, 0), holes = Math.max(0, num(m.holes, 0)), X = extras(m);
    const L = e ? num(m.outer, 0) + X.side : num(m.inner, 0) + g + holes, R = e ? num(m.inner, 0) + g + holes : num(m.outer, 0) + X.side;
    const top = num(m.top, 0) + X.top, bot = p.h - num(m.bottom, 0) - X.bot;
    return { x0: L, x1: p.w - R, top, bot, y0: top + hdr, y1: bot - ftr, hasH: hdr > 0, hasF: ftr > 0, e, g, holes, X };
  }
  const r1v = (v) => Math.round(v * 10) / 10;

  /* ---------- ajusta o conteúdo da área antiga para a nova ---------- */
  function fit(p, a, b) {
    const sx = (b.x1 - b.x0) / (a.x1 - a.x0), sy = (b.y1 - b.y0) / (a.y1 - a.y0);
    if (!isFinite(sx) || !isFinite(sy) || sx <= 0 || sy <= 0) return;
    const fm = Math.min(sx, sy);
    p.els.forEach((e) => {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      if (cx < a.x0) e.x = r1(e.x + (b.x0 - a.x0)); else if (cx > a.x1) e.x = r1(e.x + (b.x1 - a.x1));
      else { e.x = r1(b.x0 + (e.x - a.x0) * sx); e.w = r1(e.w * sx); }
      if (cy < a.y0) e.y = r1(e.y + (b.top - a.top));
      else if (cy <= a.y1) {
        e.y = r1(b.y0 + (e.y - a.y0) * sy); e.h = r1(e.h * sy);
        if (e.type === 'text' || e.type === 'table' || e.type === 'divider') e.size = r1((e.size || 9) * fm);
        if (e.sp) e.sp = r1(e.sp * fm);
      } else e.y = r1(e.y + (b.bot - a.bot));
    });
  }

  /* ---------- aplicar (com histórico) ---------- */
  const fitOn = () => S.meta.mgFit !== false;
  const PAIR = { top: 'bottom', bottom: 'top', inner: 'outer', outer: 'inner' };
  const linkOn = (k) => (k === 'top' || k === 'bottom' ? S.meta.mgLinkTB === true : S.meta.mgLinkLR === true);
  const spreadOn = () => S.meta.mgLinkSpread !== false;
  const NUMK = ['top', 'bottom', 'inner', 'outer', 'gutter', 'holes', 'hdr', 'ftr'], SPK = ['inner', 'holes', 'gutter'];
  const toast2 = (t) => { if (typeof toast === 'function') toast(t); };
  function partnerOf(p) { // a outra página da mesma dupla (a capa fica sozinha)
    const i = S.order.indexOf(p.id), off = S.meta.coverAlone !== false ? 1 : 0; if (i < off) return null;
    const q = S.order[(i - off) % 2 === 0 ? i + 1 : i - 1]; return q ? S.pages[q] : null;
  }
  const scopeOf = () => (S.meta.mgScope === 'page' ? 'page' : S.meta.mgScope === 'sel' ? 'sel' : 'all');
  const selected = () => (window.Paginas && Paginas.selected ? Paginas.selected() : []);
  function scopeIds(p) {
    const sc = scopeOf(); let ids;
    if (sc === 'page') ids = [p.id]; else if (sc === 'sel' && selected().length) ids = selected(); else ids = S.order.slice();
    if (!ids.includes(p.id)) ids.push(p.id); return ids;
  }
  function linkFix(p, m, old, key) { // margens vinculadas ficam proporcionais
    const q = PAIR[key]; if (!q || !linkOn(key)) return;
    m[q] = r1v(old[key] > 0 ? num(old[q], 0) * (m[key] / old[key]) : m[key]);
    const g = geom(p, m); if (g.x1 - g.x0 < MIN || g.y1 - g.y0 < MIN) m[q] = old[q];
  }
  const okGeom = (q, m) => { const g = geom(q, m); return g.x1 - g.x0 >= MIN && g.y1 - g.y0 >= MIN; };
  function applyMap(map, o) {
    o = o || {}; const ids = Object.keys(map).filter((id) => S.pages[id]); if (!ids.length) return 0;
    change(ids, () => ids.forEach((id) => {
      const p = S.pages[id], a = geom(p, p.mg), nm = map[id];
      const m = nm ? Object.assign({}, nm, { tabs: Object.assign({}, nm.tabs || {}), side: nm.side || 'auto', lock: !!nm.lock }) : null;
      if (o.fit !== false && fitOn()) fit(p, a, geom(p, m));
      if (m) p.mg = m; else delete p.mg;
    }));
    ids.forEach((id) => thumbRefresh(id)); redraw(); renderProps(); return ids.length;
  }
  // edita campos (patch) no escopo escolhido, respeitando vínculos
  function edit(p, patch, primary, o) {
    o = o || {}; const ids = o.ids || scopeIds(p), map = {};
    ids.forEach((id) => {
      const q = S.pages[id]; if (!q) return; const base = q.mg || defaults(q);
      const nm = Object.assign({}, base, patch, patch.tabs ? { tabs: Object.assign({}, tabsOf(base), patch.tabs) } : {});
      if (primary) linkFix(q, nm, base, primary);
      if (okGeom(q, nm)) map[id] = nm;
    });
    if (spreadOn()) ids.slice().forEach((id) => {
      const q = S.pages[id], r = q && partnerOf(q); if (!r || !r.mg || map[r.id] || !map[id]) return;
      const sp = {}; SPK.forEach((k) => { if (k in patch) sp[k] = map[id][k]; });
      if (Object.keys(sp).length) { const nm = Object.assign({}, r.mg, sp); if (okGeom(r, nm)) map[r.id] = nm; }
    });
    const n = applyMap(map, o); if (!n) { toast2('Esse valor deixa pouco espaço para o conteúdo.'); renderProps(); }
    return n;
  }
  const patchMg = (p, patch, o) => { edit(p, patch, null, o); };
  function setLock(p, on) { const ids = scopeIds(p).filter((id) => S.pages[id].mg); if (!ids.length) return; change(ids, () => ids.forEach((id) => { S.pages[id].mg.lock = on; })); redraw(); renderProps(); }

  /* ---------- desenho no palco ---------- */
  function overlay(p, k) {
    const m = p.mg; if (!m || !show()) return '';
    const g = geom(p, m), lock = !!m.lock, W = p.w * k, H = p.h * k, pid = p.id;
    let h = '';
    if (g.g > 0) h += `<div class="mgband" style="${g.e ? 'right' : 'left'}:0;width:${g.g * k}px"></div>`;
    if (g.holes > 0) {
      const hx = g.e ? p.w - g.g - g.holes : g.g, n = Math.max(2, Math.round(p.h / 30)), dia = BIND[bindOf(m)] ? BIND[bindOf(m)].d : 6;
      h += `<div class="mghole" style="left:${hx * k}px;width:${g.holes * k}px"></div>`;
      for (let i = 0; i < n; i++) h += `<i class="mgdot" style="left:${(hx + g.holes / 2) * k}px;top:${((i + 0.5) * p.h / n) * k}px;width:${Math.max(4, dia * k)}px;height:${Math.max(4, dia * k)}px"></i>`;
    }
    if (g.X.t.on) {
      const t = g.X.t, n = cl(Math.round(num(t.n, 4)), 1, 30), w = num(t.w, 12), r = Math.max(0, num(t.r, 3)) * k, gap = 1;
      const sl = (x, y, ww, hh, i) => `<div class="mgtab${t.bg === 'white' ? ' w' : ''}" style="left:${x * k}px;top:${y * k}px;width:${ww * k}px;height:${hh * k}px;border-radius:${r}px"><b>${i + 1}</b></div>`;
      if (t.pos === 'side') { const x = g.e ? 0 : p.w - w, hh = (g.bot - g.top) / n; for (let i = 0; i < n; i++) h += sl(x, g.top + i * hh + gap / 2, w, hh - gap, i); }
      else { const y = t.pos === 'top' ? 0 : p.h - w, ww = (g.x1 - g.x0) / n; for (let i = 0; i < n; i++) h += sl(g.x0 + i * ww + gap / 2, y, ww - gap, w, i); }
    }
    h += `<div class="mgl h" style="top:${g.top * k}px"></div><div class="mgl h" style="top:${g.bot * k}px"></div><div class="mgl v" style="left:${g.x0 * k}px"></div><div class="mgl v" style="left:${g.x1 * k}px"></div>`;
    if (g.hasH) h += `<div class="mgl h sub" style="top:${g.y0 * k}px"></div><span class="mgtag" style="top:${g.top * k + 2}px;left:${g.x0 * k + 4}px">cabeçalho</span>`;
    if (g.hasF) h += `<div class="mgl h sub" style="top:${g.y1 * k}px"></div><span class="mgtag" style="top:${g.bot * k - 15}px;left:${g.x0 * k + 4}px">rodapé</span>`;
    if (!lock) {
      const hd = (line, st) => `<i class="mgh ${line === 'top' || line === 'bottom' || line === 'hdr' || line === 'ftr' ? 'h' : 'v'}" data-line="${line}" style="${st}" title="Arraste para ajustar"></i>`;
      h += hd('top', `left:50%;top:${g.top * k}px`) + hd('bottom', `left:50%;top:${g.bot * k}px`) + hd('left', `left:${g.x0 * k}px;top:50%`) + hd('right', `left:${g.x1 * k}px;top:50%`);
      if (g.hasH) h += hd('hdr', `left:30%;top:${g.y0 * k}px`);
      if (g.hasF) h += hd('ftr', `left:30%;top:${g.y1 * k}px`);
    }
    h += `<div class="mgchip" style="top:-26px;right:0" data-pid="${pid}"><button type="button" data-mgact="lock" title="${lock ? 'Desbloquear' : 'Bloquear'} as margens" aria-pressed="${lock}">${lock ? '🔒' : '🔓'}</button><span class="mgside" title="${g.e ? 'Página da ESQUERDA da dupla: furos e margem interna na borda direita (meio da dupla)' : 'Página da DIREITA da dupla: furos e margem interna na borda esquerda (meio da dupla)'}">${g.e ? 'esq.' : 'dir.'}</span>${lock ? '' : g.hasH ? '<button type="button" data-mgact="hdr-off" title="Remover o cabeçalho">✕ Cabeçalho</button>' : '<button type="button" data-mgact="hdr">+ Cabeçalho</button>'}</div>`;
    if (!lock) h += `<div class="mgchip" style="top:${H + 8}px;left:50%;transform:translateX(-50%)" data-pid="${pid}">${g.hasF ? '<button type="button" data-mgact="ftr-off" title="Remover o rodapé">✕ Rodapé</button>' : '<button type="button" data-mgact="ftr">+ Mostrar rodapé</button>'}</div>`;
    const r = partnerOf(p);
    if (r && r.mg && S.order.indexOf(r.id) > S.order.indexOf(p.id) && S.meta.view === 'spread') {
      const on = spreadOn();
      h += `<div class="mgchip mgchain${on ? ' on' : ''}" style="left:${W}px;top:50%;transform:translate(-50%,-50%)" data-pid="${pid}"><button type="button" data-mgact="spread" aria-pressed="${on}" title="${on ? 'Lado de dentro das duas páginas vinculado (clique para soltar)' : 'Lado de dentro das duas páginas solto (clique para vincular)'}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/></svg></button></div>`;
    }
    return h;
  }
  /* botão da barra superior: liga/desliga as margens do projeto (os valores ficam guardados) */
  const isOn = () => { if (!S.meta) return false; if (S.meta.mgOn !== undefined) return !!S.meta.mgOn; return S.order.some((id) => S.pages[id] && S.pages[id].mg); };
  const show = isOn;
  const paintBtn = () => { const b = document.getElementById('bMg'); if (b) { const on = isOn(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Desligar layout (margens e margem de segurança)' : 'Ligar layout (margens e margem de segurança)'; } };
  function toggle() {
    const msg = (t) => { if (typeof toast === 'function') toast(t); };
    if (isOn()) { S.meta.mgOn = false; S.guides = false; Saver.m(); paintBtn(); redraw(); renderProps(); msg('Margens desligadas. Os valores ficam guardados.'); return; }
    S.meta.mgOn = true; S.guides = true; Saver.m();
    const need = S.order.filter((id) => S.pages[id] && !S.pages[id].mg);
    if (need.length) {
      change(need, () => need.forEach((id) => { const p = S.pages[id], m = defaults(p); if (fitOn()) fit(p, geom(p, null), geom(p, m)); p.mg = m; }));
      need.forEach((id) => thumbRefresh(id));
    }
    paintBtn(); redraw(); renderProps(); msg('Margens ligadas.' + (need.length ? ' Ctrl+Z desfaz o ajuste do conteúdo.' : ''));
  }
  const bm = document.getElementById('bMg'); if (bm) bm.onclick = toggle;
  paintBtn();
  const eo = window.extraOverlay;
  window.extraOverlay = function (p, k) { return eo(p, k) + overlay(p, k); };

  /* ---------- interação no palco ---------- */
  const pageOf = (el) => { const w = el.closest('.pg'); return w ? { w, p: S.pages[w.dataset.id] } : null; };
  function setLine(p, m, line, x, y) {
    const g0 = geom(p, m), e = g0.e, hdr = num(m.hdr, 0), ftr = num(m.ftr, 0), X = g0.X, gh = g0.g + g0.holes;
    const vMax = (a, ex) => p.h - a - ex - hdr - ftr - MIN, hMax = (a, b) => p.w - a - b - MIN;
    let key = null;
    if (line === 'top') { key = 'top'; m.top = r1v(cl(y - X.top, 0, vMax(m.bottom, X.top + X.bot))); }
    else if (line === 'bottom') { key = 'bottom'; m.bottom = r1v(cl(p.h - y - X.bot, 0, vMax(m.top, X.top + X.bot))); }
    else if (line === 'left') { if (e) { key = 'outer'; m.outer = r1v(cl(x - X.side, 0, hMax(X.side + m.inner + gh, 0))); } else { key = 'inner'; m.inner = r1v(cl(x - gh, 0, hMax(gh + m.outer + X.side, 0))); } }
    else if (line === 'right') { const d = p.w - x; if (e) { key = 'inner'; m.inner = r1v(cl(d - gh, 0, hMax(gh + m.outer + X.side, 0))); } else { key = 'outer'; m.outer = r1v(cl(d - X.side, 0, hMax(X.side + m.inner + gh, 0))); } }
    else if (line === 'hdr') m.hdr = r1v(cl(y - g0.top, 3, g0.bot - g0.top - ftr - MIN));
    else if (line === 'ftr') m.ftr = r1v(cl(g0.bot - y, 3, g0.bot - g0.top - hdr - MIN));
    return key;
  }
  document.addEventListener('pointerdown', (ev) => {
    const t = ev.target; if (!t.closest) return;
    if (t.closest('.mgchip')) { ev.stopPropagation(); return; }
    const hd = t.closest('.mgh'); if (!hd) return;
    const o = pageOf(hd); if (!o || !o.p || !o.p.mg || o.p.mg.lock) return;
    ev.preventDefault(); ev.stopPropagation();
    const { w, p } = o, old = Object.assign({}, p.mg), line = hd.dataset.line; let moved = false, lastKey = null;
    const mv = (e) => { const r = w.getBoundingClientRect(); const cur = p.mg; Object.assign(cur, old); const key = setLine(p, cur, line, Math.round(((e.clientX - r.left) / S.k) * 2) / 2, Math.round(((e.clientY - r.top) / S.k) * 2) / 2); lastKey = key; if (key) linkFix(p, cur, old, key); moved = true; scheduleRedraw(); };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      const nm = Object.assign({}, p.mg); p.mg = old;
      const patch = {}; NUMK.forEach((k) => { if (nm[k] !== old[k]) patch[k] = nm[k]; });
      if (moved && Object.keys(patch).length) edit(p, patch, lastKey); else redraw();
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }, true);
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-mgact]'); if (!b) return;
    const c = b.closest('.mgchip'), p = c && S.pages[c.dataset.pid]; if (!p || !p.mg) return;
    ev.stopPropagation();
    const a = b.dataset.mgact;
    if (a === 'lock') setLock(p, !p.mg.lock);
    else if (a === 'hdr') patchMg(p, { hdr: DEF_HF });
    else if (a === 'ftr') patchMg(p, { ftr: DEF_HF });
    else if (a === 'hdr-off') patchMg(p, { hdr: 0 });
    else if (a === 'ftr-off') patchMg(p, { ftr: 0 });
    else if (a === 'spread') { S.meta.mgLinkSpread = !spreadOn(); Saver.m(); if (spreadOn()) edit(p, { inner: p.mg.inner, holes: p.mg.holes, gutter: p.mg.gutter }, null, { ids: [p.id] }); else { redraw(); renderProps(); } }
  }, true);

  /* ---------- ímãs: elementos encostam nas margens ---------- */
  window.Margens = {
    edit,
    snapLines(p) { const xs = [], ys = []; if (!p || !p.mg || !isOn()) return { xs, ys }; const g = geom(p, p.mg); xs.push(g.x0, g.x1); ys.push(g.top, g.bot); if (g.hasH) ys.push(g.y0); if (g.hasF) ys.push(g.y1); return { xs, ys }; },
    geom, applyMap, defaults, isLeft,
  };

  /* ---------- painel (propriedades da página) ---------- */
  const LAYOUT_ICON = '<svg class="ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M11 3v18M11 12h10"/></svg>';
  const UNITS = { mm: [1, 1], cm: [0.1, 2], in: [1 / 25.4, 3] };
  const getUnit = () => { try { const u = localStorage.getItem('cnu.estudio.mgunit'); return UNITS[u] ? u : 'mm'; } catch (_) { return 'mm'; } };
  const toU = (v) => +(num(v, 0) * UNITS[getUnit()][0]).toFixed(UNITS[getUnit()][1]);
  const fromU = (v) => num(v, 0) / UNITS[getUnit()][0];
  const stepU = () => ({ mm: 0.5, cm: 0.05, in: 0.01 }[getUnit()]);
  const IC = { top: '⤒', bottom: '⤓', outer: '⇤', inner: '⇥', holes: '◎', gutter: '⇔', hdr: '▭', ftr: '▭', w: '↔', r: '◜' };
  const row = (key, label, val, max, dis, o) => { o = o || {}; const v = num(val, 0); return `<div class="mrow"><span class="mi">${IC[o.ic || key] || ''}</span><span class="ml">${label}</span><input type="range" min="${o.min || 0}" max="${max}" step="0.5" value="${Math.min(v, max)}" data-mgr="${key}" aria-label="${label}"${dis ? ' disabled' : ''}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(v)}" data-mgn="${key}" aria-label="${label} (${getUnit()})"${dis ? ' disabled' : ''}></div>`; };
  const chain = (id, on, dis) => `<button type="button" class="mchain${on ? ' on' : ''}" id="${id}" aria-pressed="${on}" title="${on ? 'Vinculadas: mudam juntas (clique para soltar)' : 'Soltas (clique para vincular)'}"${dis ? ' disabled' : ''}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/></svg></button>`;
  const sw = (id, on, dis) => `<label class="mgsw"><input type="checkbox" id="${id}"${on ? ' checked' : ''}${dis ? ' disabled' : ''}><span></span></label>`;
  function tabsHTML(m, dis, p) {
    const t = tabsOf(m), d = dis ? ' disabled' : '', pb = (v, l) => `<button type="button" data-tpos="${v}" class="${t.pos === v ? 'on' : ''}"${d}>${l}</button>`;
    const body = t.on ? `<div class="mgsub">POSIÇÃO</div><div class="segf" id="mgTbPos">${pb('top', '⬒ Topo')}${pb('bottom', '⬓ Base')}${pb('side', '◧ Lateral')}</div>
      <div class="mrow"><span class="mi">#</span><span class="ml">Quantidade</span><span class="mstep"><button type="button" data-tn="-1"${d}>−</button><input type="number" min="1" max="30" step="1" data-mgt="n" value="${t.n}"${d}><button type="button" data-tn="1"${d}>+</button></span></div>
      <div class="mgsub">TAMANHO E FORMA</div>
      <div class="mrow"><span class="mi">↔</span><span class="ml">${t.pos === 'side' ? 'Largura' : 'Altura'}</span><input type="range" min="3" max="40" step="0.5" value="${Math.min(num(t.w, 12), 40)}" data-mgtr="w"${d}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(t.w)}" data-mgtn="w"${d}></div>
      <div class="mrow"><span class="mi">◜</span><span class="ml">Raio</span><input type="range" min="0" max="15" step="0.5" value="${Math.min(num(t.r, 3), 15)}" data-mgtr="r"${d}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(t.r)}" data-mgtn="r"${d}></div>
      <div class="mgsub">PLANO DE FUNDO</div><div class="segf" id="mgTbBgSel"><button type="button" data-tbg="none" class="${t.bg === 'white' ? '' : 'on'}"${d}>Transparente</button><button type="button" data-tbg="white" class="${t.bg === 'white' ? 'on' : ''}"${d}>Branco</button></div>
      ${t.pos === 'side' ? `<button type="button" class="btn sm" id="mgTbMake"${d}>Inserir abas na lateral</button>` : ''}` : '';
    return `<div class="mgcard${t.on ? ' on' : ''}"><div class="mgcard-h"><span class="mi">▤</span><b>Divisórias</b>${sw('mgTbOn', t.on, dis)}</div>${body ? `<div class="mgcard-b">${body}</div>` : ''}</div>`;
  }
  function panelHTML(p) {
    const m = p.mg, n = S.order.length, sc = scopeOf(), nsel = selected().length;
    const scope = `<label class="mgscope"><small>AS ALTERAÇÕES VALEM PARA</small><select id="mgScope"><option value="all"${sc === 'all' ? ' selected' : ''}>Todas as páginas · ${n} página${n > 1 ? 's' : ''}</option><option value="page"${sc === 'page' ? ' selected' : ''}>Só esta página</option>${nsel ? `<option value="sel"${sc === 'sel' ? ' selected' : ''}>Páginas selecionadas · ${nsel}</option>` : ''}</select></label>`;
    if (!m) return `<div class="pgrp" id="mgPanel"><h3 class="mgh3">${LAYOUT_ICON} LAYOUT</h3>${scope}<p class="hint">Esta página está sem margens. Adicione para ver as guias, reservar furos e lombada e ter cabeçalho, rodapé e divisórias.</p><button class="btn sm pri" id="mgAdd">Adicionar margens</button><label class="chk"><input type="checkbox" id="mgFit"${fitOn() ? ' checked' : ''}> Ajustar o conteúdo à área</label></div>`;
    const g = geom(p, m), dis = !!m.lock, un = getUnit(), allLinked = linkOn('inner') && linkOn('top') && spreadOn();
    return `<div class="pgrp" id="mgPanel"><h3 class="mgh3">${LAYOUT_ICON} LAYOUT</h3>${scope}
      <div class="mghead"><b>Preenchimentos e Margens</b><span class="mgtools"><button type="button" class="btn sm ghost" id="mgLinkAll" aria-pressed="${allLinked}">⛓ Vincular tudo</button><button type="button" class="btn sm ghost" id="mgReset"${dis ? ' disabled' : ''}>↺ Redefinir</button><select id="mgUnit" aria-label="Unidade">${Object.keys(UNITS).map((u) => `<option${u === un ? ' selected' : ''}>${u}</option>`).join('')}</select></span></div>
      <div class="mgpair"><div class="mgrows">${row('top', 'Topo', m.top, 60, dis)}${row('bottom', 'Base', m.bottom, 60, dis)}</div>${chain('mgLkTB', linkOn('top'), dis)}</div>
      <div class="mgpair"><div class="mgrows">${row('outer', 'Externa', m.outer, 60, dis)}${row('inner', 'Interna', m.inner, 60, dis)}</div>${chain('mgLkLR', linkOn('inner'), dis)}</div>
      <label class="pfield mgbind"><span>Tipo de encadernação</span><select id="mgBind"${dis ? ' disabled' : ''}>${Object.keys(BIND).map((k) => `<option value="${k}"${bindOf(m) === k ? ' selected' : ''}>${BIND[k].name} · ${BIND[k].mm} mm</option>`).join('')}<option value="custom"${bindOf(m) === 'custom' ? ' selected' : ''}>Personalizado</option></select></label>
      ${BIND[bindOf(m)] ? `<p class="hint">${BIND[bindOf(m)].obs}</p>` : ''}
      <div class="mgpair"><div class="mgrows">${row('holes', 'Furos', m.holes, 40, dis)}${row('gutter', 'Lombada', m.gutter, 30, dis)}</div>${chain('mgLkSp', spreadOn(), dis)}</div>
      <p class="hint">Furos: espaço no lado de dentro de cada página, no meio da dupla. Lombada: total ao meio. O ⛓ de baixo mantém o lado de dentro das duas páginas da dupla iguais.</p>
      <label class="chk"><input type="checkbox" id="mgSafe"${S.guides ? ' checked' : ''}> Mostrar margem de segurança</label>
      <div class="mrow mgsw-row"><span class="mi">🔒</span><span class="ml" style="flex:1">Bloquear margens no editor</span>${sw('mgLock', dis, false)}</div>
      <div class="mghead"><b>Espaçamento</b></div>
      ${row('hdr', 'Cabeçalho', m.hdr, 40, dis, { ic: 'hdr' })}${row('ftr', 'Rodapé', m.ftr, 40, dis, { ic: 'ftr' })}
      <p class="hint">Altura 0 = sem cabeçalho ou rodapé.</p>
      ${tabsHTML(m, dis, p)}
      <label class="pfield"><span>Posição na dupla</span><select id="mgSide"${dis ? ' disabled' : ''}><option value="auto"${m.side === 'e' || m.side === 'd' ? '' : ' selected'}>Automático (agora: ${g.e ? 'esquerda' : 'direita'})</option><option value="e"${m.side === 'e' ? ' selected' : ''}>Página da esquerda (dentro à direita)</option><option value="d"${m.side === 'd' ? ' selected' : ''}>Página da direita (dentro à esquerda)</option></select></label>
      <label class="chk"><input type="checkbox" id="mgFlip"${S.meta.mgFlip ? ' checked' : ''}> Inverter o lado de dentro no projeto</label>
      <p class="hint">Padrão: o lado de dentro (furos, lombada e margem interna) fica no encontro das duas páginas, no meio da dupla, para o corte e a furação ficarem sempre à mesma distância.</p>
      <label class="chk"><input type="checkbox" id="mgFit"${fitOn() ? ' checked' : ''}> Ajustar o conteúdo à área</label>
      <button class="btn sm ghost danger" id="mgRm">Remover margens</button></div>`;
  }
  function mount(p, P) {
    const $q = (s) => P.querySelector(s), on = (s, fn) => { const e = $q(s); if (e) e.onclick = fn; };
    const blur = () => { if (document.activeElement && P.contains(document.activeElement)) document.activeElement.blur(); };
    const bd = $q('#mgBind'); if (bd) bd.onchange = () => { blur(); const v = bd.value; edit(p, v === 'custom' ? { bind: 'custom' } : { bind: v, holes: BIND[v].mm }, null); };
    const commit = (k, v) => { blur(); if (k === 'holes') { edit(p, { holes: v, bind: BIND[bindOf(p.mg)] && BIND[bindOf(p.mg)].mm === v ? bindOf(p.mg) : 'custom' }); return; } if (k === 'hdr' || k === 'ftr') v = v > 0 ? Math.max(3, v) : 0; edit(p, { [k]: v }, PAIR[k] ? k : null); };
    const sc = $q('#mgScope'); if (sc) sc.onchange = () => { S.meta.mgScope = sc.value; Saver.m(); };
    on('#mgAdd', () => { const n = edit(p, {}, null); if (n) toast2('Margens adicionadas. Ctrl+Z desfaz.'); });
    const fitEl = $q('#mgFit'); if (fitEl) fitEl.onchange = () => { S.meta.mgFit = fitEl.checked; Saver.m(); };
    on('#mgRm', () => { const map = {}; scopeIds(p).forEach((id) => { map[id] = null; }); applyMap(map); });
    on('#mgReset', () => { const map = {}; scopeIds(p).forEach((id) => { map[id] = defaults(S.pages[id]); }); applyMap(map); toast2('Margens redefinidas. Ctrl+Z desfaz.'); });
    const un = $q('#mgUnit'); if (un) un.onchange = () => { try { localStorage.setItem('cnu.estudio.mgunit', un.value); } catch (_) { /* ok */ } renderProps(); };
    on('#mgLinkAll', () => { const all = linkOn('inner') && linkOn('top') && spreadOn(); S.meta.mgLinkLR = S.meta.mgLinkTB = S.meta.mgLinkSpread = !all; Saver.m(); renderProps(); redraw(); });
    on('#mgLkTB', () => { S.meta.mgLinkTB = !linkOn('top'); Saver.m(); renderProps(); });
    on('#mgLkLR', () => { S.meta.mgLinkLR = !linkOn('inner'); Saver.m(); renderProps(); });
    on('#mgLkSp', () => { S.meta.mgLinkSpread = !spreadOn(); Saver.m(); if (spreadOn()) edit(p, { inner: p.mg.inner, holes: p.mg.holes, gutter: p.mg.gutter }, null, { ids: [p.id] }); else { renderProps(); redraw(); } });
    const sf = $q('#mgSafe'); if (sf) sf.onchange = () => { S.guides = sf.checked; redraw(); };
    const lk = $q('#mgLock'); if (lk) lk.onchange = () => setLock(p, lk.checked);
    const sd = $q('#mgSide'); if (sd) sd.onchange = () => { edit(p, { side: sd.value }, null, { ids: [p.id] }); };
    const fl = $q('#mgFlip'); if (fl) fl.onchange = () => {
      const ids = S.order.filter((id) => S.pages[id].mg), pre = {}; ids.forEach((id) => { pre[id] = geom(S.pages[id], S.pages[id].mg); });
      change(ids, () => { S.meta.mgFlip = fl.checked; ids.forEach((id) => { const q = S.pages[id]; if (fitOn()) fit(q, pre[id], geom(q, q.mg)); }); }); Saver.m();
      ids.forEach((id) => thumbRefresh(id)); redraw(); renderProps();
    };
    P.querySelectorAll('[data-mgr]').forEach((r) => { const k = r.dataset.mgr, nb = $q(`[data-mgn=${k}]`); r.oninput = () => { nb.value = toU(+r.value); }; r.onchange = () => commit(k, +r.value); });
    P.querySelectorAll('[data-mgn]').forEach((nb) => { nb.onchange = () => commit(nb.dataset.mgn, Math.max(0, fromU(nb.value))); });
    // divisórias
    const tbOn = $q('#mgTbOn'); if (tbOn) tbOn.onchange = () => { blur(); edit(p, { tabs: { on: tbOn.checked } }); };
    const tp = $q('#mgTbPos'); if (tp) tp.onclick = (e) => { const b = e.target.closest('[data-tpos]'); if (b && !b.disabled) edit(p, { tabs: { pos: b.dataset.tpos } }); };
    const tcommit = (k, v) => { blur(); if (k === 'n') v = cl(Math.round(+v || 1), 1, 30); else if (k === 'w') v = Math.max(3, v || 12); else if (k === 'r') v = Math.max(0, v || 0); edit(p, { tabs: { [k]: v } }); };
    P.querySelectorAll('[data-mgtr]').forEach((r) => { const k = r.dataset.mgtr, nb = $q(`[data-mgtn=${k}]`); r.oninput = () => { nb.value = toU(+r.value); }; r.onchange = () => tcommit(k, +r.value); });
    P.querySelectorAll('[data-mgtn]').forEach((nb) => { nb.onchange = () => tcommit(nb.dataset.mgtn, fromU(nb.value)); });
    const nIn = $q('[data-mgt=n]'); if (nIn) nIn.onchange = () => tcommit('n', nIn.value);
    P.querySelectorAll('[data-tn]').forEach((b) => { b.onclick = () => tcommit('n', num(tabsOf(p.mg).n, 4) + +b.dataset.tn); });
    const bs = $q('#mgTbBgSel'); if (bs) bs.onclick = (e) => { const b = e.target.closest('[data-tbg]'); if (b && !b.disabled) edit(p, { tabs: { bg: b.dataset.tbg } }); };
    const mk = $q('#mgTbMake'); if (mk) mk.onclick = () => {
      const g = geom(p, p.mg), t = tabsOf(p.mg), w = num(t.w, 12), n = cl(Math.round(num(t.n, 4)), 1, 30);
      const el = E('tabs', g.e ? 0 : p.w - w, g.top, w, g.bot - g.top, { labels: Array.from({ length: n }, (_, i) => String(i + 1)), links: [], active: -1, font: 'Quicksand', color: '#3E3550', fill1: '#C398C8', fill2: '#92A8D1', activeFill: '#4A4E79' });
      change([p.id], () => p.els.push(el)); S.sel = [el.id]; redraw(); renderProps(); thumbRefresh(p.id); toast2('Abas inseridas. Clique nelas para trocar os nomes.');
    };
  }
  /* ---------- organização da coluna da direita ---------- */
  let pgOpen = false; // configuração da página expandida enquanto há outra janela de configuração ativa
  const otherCfgActive = () => isOn() || (typeof Pref !== 'undefined' && (Pref.rulers || Pref.grid));
  function decorate(P) {
    if (!P || !S.meta) return;
    const isPage = !!P.querySelector('#psz');
    if (!isPage) { // elemento selecionado: botão para voltar à janela anterior
      if (P.children.length && !P.querySelector('#pBack') && !P.querySelector('#mgPanel')) {
        P.insertAdjacentHTML('afterbegin', '<button type="button" class="pback" id="pBack" title="Voltar para as configurações da página">← Voltar</button>');
        P.querySelector('#pBack').onclick = () => { S.sel = []; redraw(); renderProps(); };
      }
      return;
    }
    if (P.querySelector('#pgCore')) return;
    const kids = [...P.children].filter((n) => n.id !== 'mgPanel' && !n.querySelector('#gRul'));
    if (!kids.length) return;
    const core = document.createElement('div'); core.id = 'pgCore'; P.insertBefore(core, kids[0]); kids.forEach((k) => core.appendChild(k));
    if (!otherCfgActive()) return;
    const p = curPage(), title = `Página ${S.cur + 1}`;
    core.hidden = !pgOpen;
    core.insertAdjacentHTML('beforebegin', `<div class="pgbarc" id="pgBarC" role="group" aria-label="Configuração da página"><button type="button" id="pgcHide" class="${pgOpen ? 'on' : ''}" title="Ocultar a configuração da página">⌄ Ocultar</button><button type="button" id="pgcShow" class="${pgOpen ? '' : 'on'}" title="Mostrar a configuração da página">⌃ Expandir</button></div>`);
    void p;
    P.querySelector('#pgcHide').onclick = () => { pgOpen = false; renderProps(); };
    P.querySelector('#pgcShow').onclick = () => { pgOpen = true; renderProps(); };
  }
  const rp = window.renderProps;
  window.renderProps = function () {
    const r = rp.apply(this, arguments);
    try {
      const P = document.getElementById('props'), p = curPage();
      paintBtn();
      const old = P && P.querySelector('#mgPanel'); if (old && !isOn()) old.remove();
      if (P && p && isOn() && P.querySelector('#psz') && !P.querySelector('#mgPanel')) {
        const anchor = P.querySelector('#pGuides'), grp = anchor && anchor.closest('.pgrp');
        if (grp) { grp.insertAdjacentHTML('beforebegin', panelHTML(p)); mount(p, P); }
      }
      decorate(P);
    } catch (e) { console.error(e); }
    return r;
  };
})();
