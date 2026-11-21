/* Estúdio de Miolos · Conteúdo da página por seções (Ajuste 74)
   Página dividida em linhas × colunas; cada seção recebe um widget/adesivo/objeto que se encaixa sozinho.
   p.layout = 'free' | 'sections'; p.sec = { m, g, cw[], rh[], rot{"r,c":deg}, unit, dim }; e.slot = "r,c" */
(function () {
  'use strict';
  const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
  const MINMM = 6;
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const on = (p) => !!(p && p.layout === 'sections' && p.sec);
  const keyOf = (r, c) => r + ',' + c;
  const unkey = (k) => k.split(',').map(Number);
  const def = (p) => ({ m: r1(Math.min(p.w, p.h) * 0.04), g: 3, cw: [1, 1], rh: [1, 1], rot: {}, unit: 'mm', dim: true });

  function geom(p) {
    const s = p.sec, nC = s.cw.length, nR = s.rh.length;
    const aw = Math.max(10, p.w - 2 * s.m - (nC - 1) * s.g), ah = Math.max(10, p.h - 2 * s.m - (nR - 1) * s.g), sw = sum(s.cw), sh = sum(s.rh);
    const xs = [], ws = [], ys = [], hs = []; let x = s.m, y = s.m;
    s.cw.forEach((v) => { const w = aw * v / sw; xs.push(x); ws.push(w); x += w + s.g; });
    s.rh.forEach((v) => { const h = ah * v / sh; ys.push(y); hs.push(h); y += h + s.g; });
    return { xs, ws, ys, hs, aw, ah, sw, sh, nC, nR };
  }
  const rectOf = (G, r, c) => ({ x: G.xs[c], y: G.ys[r], w: G.ws[c], h: G.hs[r] });
  function cellAt(p, G, pt) {
    const g = p.sec.g / 2; let c = -1, r = -1;
    for (let i = 0; i < G.nC; i++) if (pt.x >= G.xs[i] - g && pt.x < G.xs[i] + G.ws[i] + g) c = i;
    for (let i = 0; i < G.nR; i++) if (pt.y >= G.ys[i] - g && pt.y < G.ys[i] + G.hs[i] + g) r = i;
    return c < 0 || r < 0 ? null : { r, c };
  }
  const ctr = (e) => ({ x: e.x + e.w / 2, y: e.y + e.h / 2 });

  /* coloca o elemento dentro da seção */
  function place(e, R, rot, setRot) {
    const sw = rot === 90 || rot === 270, cw = sw ? R.h : R.w, ch = sw ? R.w : R.h;
    let w = cw, h = ch;
    if (e.type === 'image') { const sc = Math.min(cw / Math.max(0.5, e.w), ch / Math.max(0.5, e.h)); w = e.w * sc; h = e.h * sc; }
    e.w = r1(w); e.h = r1(h); e.x = r1(R.x + R.w / 2 - e.w / 2); e.y = r1(R.y + R.h / 2 - e.h / 2);
    if (setRot) e.rot = rot;
  }

  /* encaixa: ids = elementos "tocados" que podem trocar de seção; os já encaixados só são reajustados */
  function fit(p, ids, fresh) {
    if (!on(p)) return; const s = p.sec, G = geom(p), valid = (k) => { const [r, c] = unkey(k); return r < G.nR && c < G.nC; };
    p.els.forEach((e) => { if (e.slot && !valid(e.slot)) delete e.slot; });
    const occ = (k, self) => p.els.find((o) => o !== self && o.slot === k);
    if (ids && ids.size) {
      p.els.forEach((e) => {
        if (!ids.has(e.id) || e.locked || e.free) return;
        if (fresh && fresh.has(e.id)) { for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.nC; c++) { const kk = keyOf(r, c); if (!e.slot && !occ(kk, e)) e.slot = kk; } if (e.slot) return; }
        const cell = cellAt(p, G, ctr(e));
        if (!cell) { delete e.slot; return; }
        const k = keyOf(cell.r, cell.c), other = occ(k, e);
        if (!other) { e.slot = k; return; }
        if (e.slot && e.slot !== k && !ids.has(other.id)) { other.slot = e.slot; e.slot = k; return; }
        if (e.slot === k) return;
        let best = null, bd = 1e9; const c0 = ctr(e);
        for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.nC; c++) { const kk = keyOf(r, c); if (occ(kk, e)) continue; const R = rectOf(G, r, c), d = Math.hypot(R.x + R.w / 2 - c0.x, R.y + R.h / 2 - c0.y); if (d < bd) { bd = d; best = kk; } }
        if (best) e.slot = best; else delete e.slot;
      });
    }
    p.els.forEach((e) => { if (!e.slot || e.free) return; const [r, c] = unkey(e.slot), rot = ((s.rot[e.slot] || 0) % 360 + 360) % 360; place(e, rectOf(G, r, c), rot, e.slot in s.rot); });
  }

  /* ---------- mudanças ---------- */
  function edit(p, fn, ids) {
    change([p.id], () => { fn(p.sec); fit(p, ids); });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    redraw(); renderProps(); thumbRefresh(p.id);
  }
  function setMode(p, mode) {
    if (mode === 'sections') change([p.id], () => { p.layout = 'sections'; if (!p.sec) p.sec = def(p); fit(p); });
    else change([p.id], () => { p.layout = 'free'; });
    S.secSel = null; redraw(); renderProps(); thumbRefresh(p.id);
  }
  function remap(p, f) {
    const s = p.sec, rot = {};
    Object.keys(s.rot).forEach((k) => { const [r, c] = unkey(k), n = f(r, c); if (n) rot[keyOf(n[0], n[1])] = s.rot[k]; });
    s.rot = rot;
    p.els.forEach((e) => { if (!e.slot) return; const [r, c] = unkey(e.slot), n = f(r, c); if (n) e.slot = keyOf(n[0], n[1]); else delete e.slot; });
  }
  function addRow(p, at) { const s = p.sec, avg = sum(s.rh) / s.rh.length; s.rh.splice(at, 0, avg); remap(p, (r, c) => [r >= at ? r + 1 : r, c]); }
  function addCol(p, at) { const s = p.sec, avg = sum(s.cw) / s.cw.length; s.cw.splice(at, 0, avg); remap(p, (r, c) => [r, c >= at ? c + 1 : c]); }
  function delRow(p, i) { const s = p.sec; if (s.rh.length <= 1) return; s.rh.splice(i, 1); remap(p, (r, c) => (r === i ? null : [r > i ? r - 1 : r, c])); }
  function delCol(p, i) { const s = p.sec; if (s.cw.length <= 1) return; s.cw.splice(i, 1); remap(p, (r, c) => (c === i ? null : [r, c > i ? c - 1 : c])); }
  function setSize(p, ax, i, mm) {
    const s = p.sec, G = geom(p), a = ax === 'c' ? s.cw : s.rh, A = ax === 'c' ? G.aw : G.ah, S0 = ax === 'c' ? G.sw : G.sh, n = a.length;
    if (n < 2) return; const v = a.map((x) => A * x / S0), old = v[i]; mm = Math.max(MINMM, Math.min(A - MINMM * (n - 1), mm));
    const rest = A - mm, others = A - old; v.forEach((_, j) => { if (j !== i) v[j] = others > 0.01 ? v[j] * rest / others : rest / (n - 1); }); v[i] = mm;
    if (ax === 'c') s.cw = v; else s.rh = v;
  }
  const rotKey = (s, k, d) => { s.rot[k] = (((s.rot[k] || 0) + d) % 360 + 360) % 360; };
  const fmt = (s, v) => (s.unit === 'cm' ? (Math.round(v) / 10).toFixed(1).replace('.', ',') + ' cm' : (Math.round(v * 10) / 10).toString().replace('.', ',') + ' mm');

  /* ---------- painel (bloco "Seções") ---------- */
  function block(p) {
    const s = p.sec, G = geom(p), o = Pref.acc && Pref.acc.pg_sec !== undefined ? Pref.acc.pg_sec !== false : true;
    const sel = S.secSel && (() => { const [r, c] = unkey(S.secSel); return r < G.nR && c < G.nC ? { r, c } : null; })();
    const stp = (k, l, n) => `<div class="pfield"><span>${l}</span><div class="stp"><button type="button" class="btn sm" data-sa="${k}-" aria-label="Menos">−</button><b>${n}</b><button type="button" class="btn sm" data-sa="${k}+" aria-label="Mais">＋</button></div></div>`;
    const sizes = (ax, arr, ws) => arr.map((_, i) => `<label class="szi"><span>${ax === 'c' ? 'Col.' : 'Lin.'} ${i + 1}</span><input type="number" step="0.5" min="${MINMM}" data-ss="${ax}${i}" value="${r1(ws[i])}"></label>`).join('');
    const w = document.createElement('div'); w.className = 'wacc' + (o ? ' open' : ''); w.dataset.acc = 'pg_sec';
    w.innerHTML = `<button class="wah" type="button" aria-expanded="${o}"><i class="wtri"></i><b>Seções da página</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab"><div class="pgrp tpan">
      <div class="fgrid">${stp('r', 'Linhas', G.nR)}${stp('c', 'Colunas', G.nC)}</div>
      <div class="fgrid"><label class="pfield"><span>Espaço entre seções (mm)</span><input type="number" step="0.5" min="0" data-sn="g" value="${r1(s.g)}"></label><label class="pfield"><span>Margem da página (mm)</span><input type="number" step="0.5" min="0" data-sn="m" value="${r1(s.m)}"></label></div>
      <div class="pfield"><span>Medidas</span><div class="segf pgseg"><button type="button" data-sa="u-mm" class="${s.unit !== 'cm' ? 'on' : ''}">mm</button><button type="button" data-sa="u-cm" class="${s.unit === 'cm' ? 'on' : ''}">cm</button><button type="button" data-sa="dim" class="${s.dim !== false ? 'on' : ''}">${s.dim !== false ? 'Mostrando' : 'Ocultas'}</button></div></div>
      <div class="pfield"><span>Largura das colunas (mm)</span><div class="szl">${sizes('c', s.cw, G.ws)}</div></div>
      <div class="pfield"><span>Altura das linhas (mm)</span><div class="szl">${sizes('r', s.rh, G.hs)}</div></div>
      <p class="hint">Dica: arraste as linhas tracejadas entre as seções para mudar largura e altura.</p>
      <div class="row"><button type="button" class="btn sm" data-sa="eq">Igualar tamanhos</button><button type="button" class="btn sm" data-sa="rotall">↻ Girar todas</button></div>
      ${sel ? `<div class="secsel"><b>Seção selecionada · linha ${sel.r + 1}, coluna ${sel.c + 1}</b><small>${fmt(s, G.ws[sel.c])} × ${fmt(s, G.hs[sel.r])}</small>
        <div class="row"><button type="button" class="btn sm pri" data-sa="rot1">↻ Girar seção</button><button type="button" class="btn sm" data-sa="clr">Soltar o conteúdo</button></div>
        <div class="row"><button type="button" class="btn sm" data-sa="ra">＋ linha acima</button><button type="button" class="btn sm" data-sa="rb">＋ linha abaixo</button></div>
        <div class="row"><button type="button" class="btn sm" data-sa="ca">＋ coluna à esquerda</button><button type="button" class="btn sm" data-sa="cb">＋ coluna à direita</button></div>
        <div class="row"><button type="button" class="btn sm ghost danger" data-sa="dr">Excluir esta linha</button><button type="button" class="btn sm ghost danger" data-sa="dc">Excluir esta coluna</button></div></div>` : '<p class="hint">Clique numa seção da página para girar, inserir ou excluir linhas e colunas.</p>'}
      </div></div>`;
    const hd = w.querySelector('.wah');
    hd.onclick = () => { w.classList.toggle('open'); const v = w.classList.contains('open'); hd.setAttribute('aria-expanded', v); Pref.acc = Pref.acc || {}; Pref.acc.pg_sec = v; try { savePref(); } catch (_) { /* */ } };
    w.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-sa]'); if (!b) return; const a = b.dataset.sa, k = S.secSel, [r, c] = k ? unkey(k) : [0, 0];
      const run = (fn, ids) => edit(p, fn, ids);
      if (a === 'r+') run(() => addRow(p, G.nR)); else if (a === 'r-') run(() => delRow(p, G.nR - 1));
      else if (a === 'c+') run(() => addCol(p, G.nC)); else if (a === 'c-') run(() => delCol(p, G.nC - 1));
      else if (a === 'u-mm') run((x) => { x.unit = 'mm'; }); else if (a === 'u-cm') run((x) => { x.unit = 'cm'; });
      else if (a === 'dim') run((x) => { x.dim = x.dim === false; });
      else if (a === 'eq') run((x) => { x.cw = x.cw.map(() => 1); x.rh = x.rh.map(() => 1); });
      else if (a === 'rotall') run((x) => { for (let i = 0; i < G.nR; i++) for (let j = 0; j < G.nC; j++) rotKey(x, keyOf(i, j), 90); });
      else if (!k) return;
      else if (a === 'rot1') run((x) => rotKey(x, k, 90));
      else if (a === 'clr') run(() => { p.els.forEach((e) => { if (e.slot === k) { delete e.slot; e.free = true; } }); });
      else if (a === 'ra') run(() => { addRow(p, r); }); else if (a === 'rb') run(() => { addRow(p, r + 1); S.secSel = keyOf(r, c); });
      else if (a === 'ca') run(() => { addCol(p, c); }); else if (a === 'cb') run(() => { addCol(p, c + 1); S.secSel = keyOf(r, c); });
      else if (a === 'dr') { run(() => delRow(p, r)); S.secSel = null; } else if (a === 'dc') { run(() => delCol(p, c)); S.secSel = null; }
      if (a === 'ra') S.secSel = keyOf(r + 1, c); else if (a === 'ca') S.secSel = keyOf(r, c + 1);
      renderProps();
    });
    w.addEventListener('change', (ev) => {
      const i = ev.target; if (i.dataset.sn) { const v = Math.max(0, +i.value || 0); edit(p, (x) => { x[i.dataset.sn] = Math.min(v, 40); }); }
      else if (i.dataset.ss) { const ax = i.dataset.ss[0], n = +i.dataset.ss.slice(1); edit(p, () => setSize(p, ax, n, +i.value || MINMM)); }
    });
    return w;
  }

  /* ---------- sobreposição: seções, medidas e alças ---------- */
  const eo = window.extraOverlay;
  window.extraOverlay = function (p, k) {
    let h = eo(p, k); if (!on(p)) return h;
    const s = p.sec, G = geom(p), cur = p === curPage(), sel = cur ? S.secSel : null;
    for (let r = 0; r < G.nR; r++) for (let c = 0; c < G.nC; c++) {
      const R = rectOf(G, r, c), key = keyOf(r, c), full = p.els.some((e) => e.slot === key), rot = s.rot[key] || 0;
      h += `<div class="sxc${sel === key ? ' on' : ''}${full ? ' full' : ''}" style="left:${R.x * k}px;top:${R.y * k}px;width:${R.w * k}px;height:${R.h * k}px">${full ? '' : `<span style="transform:rotate(${rot}deg)">＋</span>`}${rot ? `<em>${rot}°</em>` : ''}</div>`;
    }
    if (s.dim !== false) {
      for (let c = 0; c < G.nC; c++) h += `<div class="sxw" style="left:${G.xs[c] * k}px;top:${G.ys[0] * k + 2}px;width:${G.ws[c] * k}px"><b>${fmt(s, G.ws[c])}</b></div>`;
      for (let r = 0; r < G.nR; r++) h += `<div class="sxh" style="left:${G.xs[0] * k + 2}px;top:${G.ys[r] * k}px;height:${G.hs[r] * k}px"><b>${fmt(s, G.hs[r])}</b></div>`;
    }
    if (cur) {
      for (let c = 0; c < G.nC - 1; c++) h += `<i class="sdv v" data-sdv="c${c}" title="Arraste para mudar a largura" style="left:${(G.xs[c] + G.ws[c] + s.g / 2) * k - 7}px;top:${s.m * k}px;height:${(p.h - 2 * s.m) * k}px"></i>`;
      for (let r = 0; r < G.nR - 1; r++) h += `<i class="sdv hz" data-sdv="r${r}" title="Arraste para mudar a altura" style="top:${(G.ys[r] + G.hs[r] + s.g / 2) * k - 7}px;left:${s.m * k}px;width:${(p.w - 2 * s.m) * k}px"></i>`;
    }
    return h;
  };

  /* ---------- arrastar divisões / escolher seção ---------- */
  const stage = document.getElementById('stage'); let drag = null;
  stage.addEventListener('pointerdown', (ev) => {
    const tg = ev.target, w = tg.closest && tg.closest('.pg'); if (!w || ev.button > 0) return;
    const p = S.pages[w.dataset.id]; if (!on(p) || p !== curPage()) return;
    const dv = tg.closest && tg.closest('[data-sdv]');
    if (dv) {
      ev.preventDefault(); ev.stopPropagation(); try { w.setPointerCapture(ev.pointerId); } catch (_) { /* */ }
      const ax = dv.dataset.sdv[0], i = +dv.dataset.sdv.slice(1), s = p.sec, pt = toMM(ev, w);
      drag = { ax, i, p, w, b: snapOf([p.id]), a0: (ax === 'c' ? s.cw : s.rh).slice(), p0: ax === 'c' ? pt.x : pt.y, G: geom(p), moved: false };
      return;
    }
    if (tg.closest && tg.closest('.sb,.hd,[data-tact],.tcedit')) return;
    const cell = cellAt(p, geom(p), toMM(ev, w)); S.secSel = cell ? keyOf(cell.r, cell.c) : null;
    setTimeout(() => { drawOverlaysOnly(); renderProps(); }, 0);
  }, true);
  stage.addEventListener('pointermove', (ev) => {
    if (!drag) return; const d = drag, s = d.p.sec, pt = toMM(ev, d.w), G = d.G, ax = d.ax;
    const A = ax === 'c' ? G.aw : G.ah, tot = sum(d.a0), u = tot / A, delta = ((ax === 'c' ? pt.x : pt.y) - d.p0) * u, a = ax === 'c' ? s.cw : s.rh, lo = MINMM * u;
    const pair = d.a0[d.i] + d.a0[d.i + 1], na = Math.max(lo, Math.min(pair - lo, d.a0[d.i] + delta));
    if (Math.abs(na - d.a0[d.i]) > 1e-6) d.moved = true;
    a[d.i] = na; a[d.i + 1] = pair - na; fit(d.p); scheduleRedraw(); ev.preventDefault();
  });
  const endDrag = () => { if (!drag) return; const d = drag; drag = null; if (d.moved) { pushHist(d.b, snapOf([d.p.id])); thumbRefresh(d.p.id); } redraw(); renderProps(); };
  stage.addEventListener('pointerup', endDrag, true); stage.addEventListener('pointercancel', endDrag, true);

  /* ---------- ganchos: soltar elemento, elemento novo ---------- */
  const ch0 = window.change;
  window.change = function (ids, fn) {
    return ch0.call(this, ids, function () {
      const before = new Map(); (ids || []).forEach((id) => { const p = S.pages[id]; if (on(p)) before.set(id, new Set(p.els.map((e) => e.id))); });
      fn();
      before.forEach((set, id) => { const p = S.pages[id]; if (p) { const nu = new Set(p.els.filter((e) => !set.has(e.id)).map((e) => e.id)); fit(p, nu, nu); } });
    });
  };
  function drop(p, ids) { if (on(p)) fit(p, new Set(ids || [])); }

  /* ---------- painel do elemento: girar / soltar / encaixar ---------- */
  const rp = window.renderProps;
  window.renderProps = function () {
    const r = rp.apply(this, arguments);
    try {
      const P = document.getElementById('props'), p = curPage(), els = selEls();
      if (!P || !on(p) || els.length !== 1 || P.querySelector('#secEl')) return r;
      const e = els[0], first = P.querySelector('.pact'); if (!first) return r;
      const w = document.createElement('div'); w.id = 'secEl'; w.className = 'secsel';
      const s = p.sec;
      w.innerHTML = e.slot ? `<b>Seção · linha ${unkey(e.slot)[0] + 1}, coluna ${unkey(e.slot)[1] + 1}</b><div class="row"><button type="button" class="btn sm pri" data-se="rot">↻ Girar seção</button><button type="button" class="btn sm" data-se="free">Soltar da seção</button></div>`
        : `<b>Fora das seções</b><div class="row"><button type="button" class="btn sm pri" data-se="fit">Encaixar numa seção</button></div>`;
      first.insertAdjacentElement('afterend', w);
      w.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-se]'); if (!b) return; const a = b.dataset.se;
        if (a === 'rot') edit(p, (x) => rotKey(x, e.slot, 90));
        else if (a === 'free') edit(p, () => { delete e.slot; e.free = true; });
        else if (a === 'fit') edit(p, () => { e.free = false; }, new Set([e.id]));
      });
      void s;
    } catch (err) { console.warn(err); }
    return r;
  };

  window.Secoes = { block, setMode, fit, drop, on, geom };
})();
