/* Margens e áreas da página — margens internas/externas, lombada (ao meio), cabeçalho e rodapé.
   Guias no editor (arrastáveis, com trava), ajuste do conteúdo e lado do impresso.
   Padrão: a página da DIREITA do editor representa a página da ESQUERDA no impresso. */
(function () {
  'use strict';
  const MIN = 20, DEF_HF = 12;
  const num = (v, d) => (Number.isFinite(+v) ? +v : d);

  /* ---------- modelo ---------- */
  // lado impresso: true = página da esquerda do caderno (lado de dentro = direita da folha)
  const autoLeft = (p) => {
    const i = S.order.indexOf(p.id), off = S.meta.coverAlone !== false ? 1 : 0;
    const e = i < off ? true : (i - off) % 2 === 1; // direita do editor = esquerda do impresso
    return S.meta.mgFlip ? !e : e;
  };
  const isLeft = (p, m) => (m && m.side === 'e' ? true : m && m.side === 'd' ? false : autoLeft(p));
  const defaults = (p) => { const s = Math.min(p.w, p.h), r = (v) => Math.round(v * 2) / 2; return { top: r(s * 0.06), bottom: r(s * 0.06), inner: r(s * 0.08), outer: r(s * 0.05), gutter: 0, hdr: 0, ftr: 0, lock: false, side: 'auto' }; };
  function geom(p, m) {
    if (!m) return { full: true, x0: 0, x1: p.w, top: 0, bot: p.h, y0: 0, y1: p.h, hasH: false, hasF: false, e: false, g: 0 };
    const e = isLeft(p, m), g = num(m.gutter, 0) / 2, hdr = num(m.hdr, 0), ftr = num(m.ftr, 0);
    const L = e ? num(m.outer, 0) : num(m.inner, 0) + g, R = e ? num(m.inner, 0) + g : num(m.outer, 0);
    const top = num(m.top, 0), bot = p.h - num(m.bottom, 0);
    return { x0: L, x1: p.w - R, top, bot, y0: top + hdr, y1: bot - ftr, hasH: hdr > 0, hasF: ftr > 0, e, g };
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
  function applyMg(ids, nm, o) {
    o = o || {};
    ids = ids.filter((id) => S.pages[id]); if (!ids.length) return;
    change(ids, () => ids.forEach((id) => {
      const p = S.pages[id], a = geom(p, p.mg);
      const m = nm ? Object.assign({}, nm, { side: p.mg ? p.mg.side : 'auto', lock: o.keepLock !== false && p.mg ? p.mg.lock : !!nm.lock }) : null;
      if (o.fit !== false && fitOn()) fit(p, a, geom(p, m));
      if (m) p.mg = m; else delete p.mg;
    }));
    ids.forEach((id) => thumbRefresh(id)); redraw(); renderProps();
  }
  const patchMg = (p, patch, o) => { if (!p.mg) return; applyMg([p.id], Object.assign({}, p.mg, patch), Object.assign({ keepLock: true }, o)); };
  function setLock(p, on) { if (!p.mg) return; change([p.id], () => { p.mg.lock = on; }); redraw(); renderProps(); }

  /* ---------- desenho no palco ---------- */
  function overlay(p, k) {
    const m = p.mg; if (!m || !show()) return '';
    const g = geom(p, m), lock = !!m.lock, W = p.w * k, H = p.h * k, pid = p.id;
    let h = '';
    if (g.g > 0) h += `<div class="mgband" style="${g.e ? 'right' : 'left'}:0;width:${g.g * k}px"></div>`;
    h += `<div class="mgl h" style="top:${g.top * k}px"></div><div class="mgl h" style="top:${g.bot * k}px"></div><div class="mgl v" style="left:${g.x0 * k}px"></div><div class="mgl v" style="left:${g.x1 * k}px"></div>`;
    if (g.hasH) h += `<div class="mgl h sub" style="top:${g.y0 * k}px"></div><span class="mgtag" style="top:${g.top * k + 2}px;left:${g.x0 * k + 4}px">cabeçalho</span>`;
    if (g.hasF) h += `<div class="mgl h sub" style="top:${g.y1 * k}px"></div><span class="mgtag" style="top:${g.bot * k - 15}px;left:${g.x0 * k + 4}px">rodapé</span>`;
    if (!lock) {
      const hd = (line, st) => `<i class="mgh ${line === 'top' || line === 'bottom' || line === 'hdr' || line === 'ftr' ? 'h' : 'v'}" data-line="${line}" style="${st}" title="Arraste para ajustar"></i>`;
      h += hd('top', `left:50%;top:${g.top * k}px`) + hd('bottom', `left:50%;top:${g.bot * k}px`) + hd('left', `left:${g.x0 * k}px;top:50%`) + hd('right', `left:${g.x1 * k}px;top:50%`);
      if (g.hasH) h += hd('hdr', `left:30%;top:${g.y0 * k}px`);
      if (g.hasF) h += hd('ftr', `left:30%;top:${g.y1 * k}px`);
    }
    h += `<div class="mgchip" style="top:-26px;right:0" data-pid="${pid}"><button type="button" data-mgact="lock" title="${lock ? 'Desbloquear' : 'Bloquear'} as margens" aria-pressed="${lock}">${lock ? '🔒' : '🔓'}</button><span class="mgside" title="${g.e ? 'Esta página fica na ESQUERDA do caderno impresso' : 'Esta página fica na DIREITA do caderno impresso'}">${g.e ? 'esq.' : 'dir.'}</span>${lock ? '' : g.hasH ? '<button type="button" data-mgact="hdr-off" title="Remover o cabeçalho">✕ Cabeçalho</button>' : '<button type="button" data-mgact="hdr">+ Cabeçalho</button>'}</div>`;
    if (!lock) h += `<div class="mgchip" style="top:${H + 8}px;left:50%;transform:translateX(-50%)" data-pid="${pid}">${g.hasF ? '<button type="button" data-mgact="ftr-off" title="Remover o rodapé">✕ Rodapé</button>' : '<button type="button" data-mgact="ftr">+ Mostrar rodapé</button>'}</div>`;
    return h;
  }
  /* botão da barra superior: liga/desliga as margens do projeto (os valores ficam guardados) */
  const isOn = () => { if (!S.meta) return false; if (S.meta.mgOn !== undefined) return !!S.meta.mgOn; return S.order.some((id) => S.pages[id] && S.pages[id].mg); };
  const show = isOn;
  const paintBtn = () => { const b = document.getElementById('bMg'); if (b) { const on = isOn(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Desligar margens' : 'Ligar margens'; } };
  function toggle() {
    const msg = (t) => { if (typeof toast === 'function') toast(t); };
    if (isOn()) { S.meta.mgOn = false; Saver.m(); paintBtn(); redraw(); renderProps(); msg('Margens desligadas. Os valores ficam guardados.'); return; }
    S.meta.mgOn = true; Saver.m();
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
    const e = isLeft(p, m), g = num(m.gutter, 0) / 2, hdr = num(m.hdr, 0), ftr = num(m.ftr, 0);
    const vMax = (a) => p.h - a - hdr - ftr - MIN, hMax = (inn, out) => p.w - inn - out - MIN;
    if (line === 'top') m.top = r1v(cl(y, 0, vMax(m.bottom)));
    else if (line === 'bottom') m.bottom = r1v(cl(p.h - y, 0, vMax(m.top)));
    else if (line === 'left') { if (e) m.outer = r1v(cl(x, 0, hMax(m.inner + g, 0))); else m.inner = r1v(cl(x - g, 0, hMax(g, m.outer))); }
    else if (line === 'right') { const d = p.w - x; if (e) m.inner = r1v(cl(d - g, 0, hMax(g, m.outer))); else m.outer = r1v(cl(d, 0, hMax(m.inner + g, 0))); }
    else if (line === 'hdr') m.hdr = r1v(cl(y - m.top, 3, p.h - m.top - m.bottom - ftr - MIN));
    else if (line === 'ftr') m.ftr = r1v(cl(p.h - m.bottom - y, 3, p.h - m.top - m.bottom - hdr - MIN));
  }
  document.addEventListener('pointerdown', (ev) => {
    const t = ev.target; if (!t.closest) return;
    if (t.closest('.mgchip')) { ev.stopPropagation(); return; }
    const hd = t.closest('.mgh'); if (!hd) return;
    const o = pageOf(hd); if (!o || !o.p || !o.p.mg || o.p.mg.lock) return;
    ev.preventDefault(); ev.stopPropagation();
    const { w, p } = o, old = Object.assign({}, p.mg), line = hd.dataset.line; let moved = false;
    const mv = (e) => { const r = w.getBoundingClientRect(); setLine(p, p.mg, line, Math.round(((e.clientX - r.left) / S.k) * 2) / 2, Math.round(((e.clientY - r.top) / S.k) * 2) / 2); moved = true; scheduleRedraw(); };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      const nm = Object.assign({}, p.mg); p.mg = old;
      if (moved && JSON.stringify(nm) !== JSON.stringify(old)) applyMg([p.id], nm); else redraw();
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
  }, true);

  /* ---------- ímãs: elementos encostam nas margens ---------- */
  window.Margens = {
    snapLines(p) { const xs = [], ys = []; if (!p || !p.mg || !isOn()) return { xs, ys }; const g = geom(p, p.mg); xs.push(g.x0, g.x1); ys.push(g.top, g.bot); if (g.hasH) ys.push(g.y0); if (g.hasF) ys.push(g.y1); return { xs, ys }; },
    geom, applyMg, defaults, isLeft,
  };

  /* ---------- painel (propriedades da página) ---------- */
  const f = (k, label, v, dis) => `<label class="pfield"><span>${label}</span><input type="number" step="0.5" min="0" data-mg="${k}" value="${r1v(num(v, 0))}"${dis ? ' disabled' : ''}></label>`;
  function panelHTML(p) {
    const m = p.mg;
    if (!m) return `<div class="pgrp" id="mgPanel"><h3 style="font-size:12px;color:var(--muted)">MARGENS E ÁREAS</h3><p class="hint">Esta página está sem margens. Adicione para ver as guias, reservar a lombada e ter cabeçalho e rodapé.</p><div class="row"><button class="btn sm pri" id="mgAdd">Adicionar margens</button>${S.order.length > 1 ? '<button class="btn sm" id="mgAddAll">Em todas</button>' : ''}</div><label class="chk"><input type="checkbox" id="mgFit"${fitOn() ? ' checked' : ''}> Ajustar o conteúdo à área</label></div>`;
    const g = geom(p, m), dis = !!m.lock, hdrOn = num(m.hdr, 0) > 0, ftrOn = num(m.ftr, 0) > 0;
    return `<div class="pgrp" id="mgPanel"><h3 style="font-size:12px;color:var(--muted)">MARGENS E ÁREAS</h3>
      <label class="chk"><input type="checkbox" id="mgLock"${dis ? ' checked' : ''}> Bloquear margens${dis ? ' 🔒' : ''}</label>
      ${dis ? '<p class="hint">Desbloqueie para arrastrar as guias ou editar os valores.</p>' : ''}
      <div class="fgrid">${f('top', 'Topo (mm)', m.top, dis)}${f('bottom', 'Base (mm)', m.bottom, dis)}${f('inner', 'Interna (mm)', m.inner, dis)}${f('outer', 'Externa (mm)', m.outer, dis)}</div>
      ${f('gutter', 'Lombada, total ao meio (mm)', m.gutter, dis)}
      <div class="row mgrow"><label class="chk"><input type="checkbox" id="mgHOn"${hdrOn ? ' checked' : ''}${dis ? ' disabled' : ''}> Cabeçalho</label><input type="number" step="0.5" min="3" data-mg="hdr" value="${hdrOn ? r1v(m.hdr) : DEF_HF}"${hdrOn && !dis ? '' : ' disabled'} aria-label="Altura do cabeçalho (mm)"><span class="hint">mm</span></div>
      <div class="row mgrow"><label class="chk"><input type="checkbox" id="mgFOn"${ftrOn ? ' checked' : ''}${dis ? ' disabled' : ''}> Rodapé</label><input type="number" step="0.5" min="3" data-mg="ftr" value="${ftrOn ? r1v(m.ftr) : DEF_HF}"${ftrOn && !dis ? '' : ' disabled'} aria-label="Altura do rodapé (mm)"><span class="hint">mm</span></div>
      <label class="pfield"><span>Lado no impresso</span><select data-mg="side"${dis ? ' disabled' : ''}><option value="auto"${m.side === 'e' || m.side === 'd' ? '' : ' selected'}>Automático (agora: ${g.e ? 'esquerda' : 'direita'})</option><option value="e"${m.side === 'e' ? ' selected' : ''}>Página da esquerda</option><option value="d"${m.side === 'd' ? ' selected' : ''}>Página da direita</option></select></label>
      <label class="chk"><input type="checkbox" id="mgFlip"${S.meta.mgFlip ? ' checked' : ''}> Inverter o padrão do projeto</label>
      <p class="hint">Padrão: a página da direita do editor é a da esquerda no impresso (a margem interna fica do lado da lombada).</p>
      <label class="chk"><input type="checkbox" id="mgFit"${fitOn() ? ' checked' : ''}> Ajustar o conteúdo à área</label>
      <div class="row"><button class="btn sm" id="mgAll">Aplicar em todas</button><button class="btn sm ghost danger" id="mgRm">Remover margens</button></div>
      ${S.order.length > 1 ? '<button class="btn sm ghost danger" id="mgRmAll">Remover de todas as páginas</button>' : ''}</div>`;
  }
  function mount(p, P) {
    const $q = (s) => P.querySelector(s), on = (s, fn) => { const e = $q(s); if (e) e.onclick = fn; };
    const blur = () => { if (document.activeElement && P.contains(document.activeElement)) document.activeElement.blur(); };
    const toast2 = (t) => { if (typeof toast === 'function') toast(t); };
    on('#mgAdd', () => { applyMg([p.id], defaults(p)); toast2('Margens adicionadas. Ctrl+Z desfaz.'); });
    on('#mgAddAll', () => { applyMg(S.order.slice(), defaults(p)); toast2('Margens adicionadas em todas as páginas.'); });
    const fitEl = $q('#mgFit'); if (fitEl) fitEl.onchange = () => { S.meta.mgFit = fitEl.checked; Saver.m(); };
    const lk = $q('#mgLock'); if (lk) lk.onchange = () => { setLock(p, lk.checked); };
    on('#mgAll', () => { applyMg(S.order.slice(), p.mg); toast2('Margens aplicadas em todas as páginas.'); });
    on('#mgRm', () => { applyMg([p.id], null); });
    on('#mgRmAll', () => { applyMg(S.order.slice(), null); toast2('Margens removidas de todas as páginas.'); });
    const fl = $q('#mgFlip'); if (fl) fl.onchange = () => {
      const ids = S.order.filter((id) => S.pages[id].mg), pre = {}; ids.forEach((id) => { pre[id] = geom(S.pages[id], S.pages[id].mg); });
      change(ids, () => { S.meta.mgFlip = fl.checked; ids.forEach((id) => { const q = S.pages[id]; if (fitOn()) fit(q, pre[id], geom(q, q.mg)); }); }); Saver.m();
      ids.forEach((id) => thumbRefresh(id)); redraw(); renderProps();
    };
    const hOn = $q('#mgHOn'), fOn = $q('#mgFOn');
    if (hOn) hOn.onchange = () => { blur(); patchMg(p, { hdr: hOn.checked ? num($q('[data-mg=hdr]').value, DEF_HF) || DEF_HF : 0 }); };
    if (fOn) fOn.onchange = () => { blur(); patchMg(p, { ftr: fOn.checked ? num($q('[data-mg=ftr]').value, DEF_HF) || DEF_HF : 0 }); };
    P.querySelectorAll('[data-mg]').forEach((el) => {
      el.onchange = () => {
        const k = el.dataset.mg; let v = el.value;
        if (k !== 'side') { v = Math.max(0, +v || 0); if (k === 'hdr' || k === 'ftr') v = Math.max(3, v); }
        const nm = Object.assign({}, p.mg, { [k]: v }), g = geom(p, nm);
        if (k !== 'side' && (g.x1 - g.x0 < MIN || g.y1 - g.y0 < MIN)) { toast2('Esse valor deixa pouco espaço para o conteúdo.'); blur(); renderProps(); return; }
        blur(); applyMg([p.id], nm);
      };
    });
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
    } catch (e) { console.error(e); }
    return r;
  };
})();
