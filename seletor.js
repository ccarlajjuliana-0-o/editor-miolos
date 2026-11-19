/* Seletor de cores: quadro de cor, matiz, código HEX, conta-gotas e "cores na página".
   Substitui o seletor nativo em todo <input type="color"> do estúdio. */
(function () {
  'use strict';
  const pop = document.createElement('div'); pop.id = 'cpop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Seletor de cores');
  document.body.appendChild(pop);
  const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
  const rgb2hex = (r, g, b) => '#' + hex2(r) + hex2(g) + hex2(b);
  const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function rgb2hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
  function hsv2rgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; let r = 0, g = 0, b = 0; if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
  const okHex = (s) => { s = String(s || '').trim(); if (s[0] !== '#') s = '#' + s; if (/^#[0-9a-f]{3}$/i.test(s)) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]; return /^#[0-9a-f]{6}$/i.test(s) ? s.toLowerCase() : null; };

  let st = null; // { el, sig, h, s, v, hex, dirty }
  const sigOf = (el) => JSON.stringify(Object.assign({}, el.dataset, { id: el.id }));
  function resolve() {
    if (!st) return null; if (st.el.isConnected) return st.el;
    const f = [...document.querySelectorAll('input[type=color]')].find((e) => sigOf(e) === st.sig); if (f) st.el = f; return f || null;
  }
  function pageColors() {
    const out = [], add = (v) => { const h = okHex(v); if (h && !out.includes(h)) out.push(h); };
    try { const p = curPage(); if (p) { add(p.bg); p.els.forEach((e) => { for (const k in e) { if (typeof e[k] === 'string' && /^#[0-9a-f]{6}$/i.test(e[k])) add(e[k]); } }); } } catch (e) { /* sem página */ }
    return out.slice(0, 14);
  }
  const sw = (c, k) => `<button type="button" class="cps" data-c="${c}" style="background:${c}" title="${c}" aria-label="${c}"></button>`;
  /* contexto do campo: aceita "sem cor" / gradiente? */
  function ctxOf(el) {
    const key = el.dataset && el.dataset.k, inP = !!(el.closest && el.closest('#props')), cf = el.closest && el.closest('.cfield');
    let e = null; try { e = selEls()[0]; } catch (x) { /* sem seleção */ }
    return { key, inP, e, none: inP && !!(cf && cf.querySelector('.sw.none')), grad: inP && key === 'fill' && !!e && ['rect', 'ellipse', 'shape', 'path'].includes(e.type) };
  }
  function applyVal(key, val, live) {
    const p = curPage(); if (!p) return; selEls().forEach((e) => { e[key] = val; });
    if (live) { redraw(); return; } redraw(); renderProps(); thumbRefresh(p.id);
  }
  function html() {
    const pc = pageColors(), br = (typeof window.BRAND_COLORS !== 'undefined' ? window.BRAND_COLORS : []);
    const cx = ctxOf(st.el);
    return `<div class="cp-h"><span>Sólido</span><span class="cp-hb">${cx.none ? '<button type="button" class="cp-b" id="cpNone" title="Sem preenchimento">Sem cor</button>' : ''}${cx.grad ? '<button type="button" class="cp-b" id="cpGrad" title="Preencher com gradiente">Gradiente ›</button>' : ''}<button type="button" class="cp-x" id="cpX" title="Fechar" aria-label="Fechar">✕</button></span></div>
      <div class="cp-sv" id="cpSV"><i id="cpSVk"></i></div>
      <div class="cp-hue" id="cpH"><i id="cpHk"></i></div>
      <div class="cp-row"><span class="cp-f">HEX</span><input id="cpHex" type="text" spellcheck="false" maxlength="7" aria-label="Código HEX"><button type="button" id="cpEye" title="Conta-gotas: copiar uma cor da tela" aria-label="Conta-gotas"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6l4 4M4 20l1-4 9-9a2.1 2.1 0 013 3l-9 9zM16 4l4 4"/></svg></button></div>
      <div class="cp-sec">Cores na página</div><div class="cp-sws">${pc.length ? pc.map(sw).join('') : '<small>Nenhuma ainda</small>'}</div>
      ${br.length ? `<div class="cp-sec">Cores da marca</div><div class="cp-sws">${br.map(sw).join('')}</div>` : ''}`;
  }
  function paint() {
    const [r, g, b] = hsv2rgb(st.h, st.s, st.v); st.hex = rgb2hex(r, g, b);
    const sv = pop.querySelector('#cpSV'); sv.style.background = `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${st.h},100%,50%))`;
    const k = pop.querySelector('#cpSVk'); k.style.left = st.s * 100 + '%'; k.style.top = (1 - st.v) * 100 + '%'; k.style.background = st.hex;
    pop.querySelector('#cpHk').style.left = (st.h / 360) * 100 + '%'; pop.querySelector('#cpHk').style.background = `hsl(${st.h},100%,50%)`;
    const hx = pop.querySelector('#cpHex'); if (document.activeElement !== hx) hx.value = st.hex.toUpperCase();
  }
  function send(type) {
    const el = resolve(); if (!el) return;
    if (type === 'input' && el.value.toLowerCase() === st.hex) return;
    el.value = st.hex; el.dispatchEvent(new Event(type, { bubbles: true })); if (type === 'input') st.dirty = true;
  }
  const commit = () => { if (st && st.dirty) { send('change'); st.dirty = false; } };
  function setHex(h, live) { const [r, g, b] = hex2rgb(h); [st.h, st.s, st.v] = rgb2hsv(r, g, b); if (!st.s) st.h = st.h0 || 0; paint(); send('input'); if (!live) commit(); }
  function drag(el, fn) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); const mv = (ev) => { const r = el.getBoundingClientRect(); fn(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))); }; mv(e); const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); commit(); }; el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); });
  }
  function place(a) {
    const r = a.getBoundingClientRect(), W = pop.offsetWidth, H = pop.offsetHeight, vw = innerWidth, vh = innerHeight;
    let left = r.left + r.width / 2 - W / 2, top = r.bottom + 8; if (top + H > vh - 8) top = Math.max(8, r.top - H - 8);
    left = Math.max(8, Math.min(left, vw - W - 8)); pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  function open(el) {
    const h = okHex(el.value) || '#c398c8', [r, g, b] = hex2rgb(h), v = rgb2hsv(r, g, b);
    st = { el, sig: sigOf(el), h: v[0], h0: v[0], s: v[1], v: v[2], hex: h, dirty: false };
    pop.classList.remove('cp-g'); gs = null; pop.innerHTML = html(); pop.hidden = false; paint(); place(el);
    { const cx = ctxOf(el); if (!noAuto && cx.grad && cx.e && GR.is(cx.e[cx.key])) { openGrad(); return; } noAuto = false; }
    drag(pop.querySelector('#cpSV'), (x, y) => { st.s = x; st.v = 1 - y; paint(); send('input'); });
    drag(pop.querySelector('#cpH'), (x) => { st.h = st.h0 = x * 359.99; paint(); send('input'); });
    const hx = pop.querySelector('#cpHex');
    hx.onchange = () => { const k = okHex(hx.value); if (k) setHex(k); else paint(); };
    hx.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); hx.blur(); } };
    pop.querySelectorAll('.cps').forEach((b) => { b.onclick = () => setHex(b.dataset.c); });
    pop.querySelector('#cpEye').onclick = eyedrop;
    pop.querySelector('#cpX').onclick = close;
    const nb = pop.querySelector('#cpNone'); if (nb) nb.onclick = () => { const c0 = ctxOf(st.el), sn = snapOf([curPage().id]); applyVal(c0.key, 'none'); pushHist(sn, snapOf([curPage().id])); close(); };
    const gb = pop.querySelector('#cpGrad'); if (gb) gb.onclick = () => openGrad();
  }
  /* ---------- segunda janela: gradiente (2 a 4 cores) ---------- */
  let noAuto = false, gs = null; // { key, g, act, hsv, snap }
  function gradHTML() {
    const g = gs.g, dirs = [[315, '↖'], [0, '↑'], [45, '↗'], [270, '←'], [-1, ''], [90, '→'], [225, '↙'], [180, '↓'], [135, '↘']];
    return `<div class="cp-h"><button type="button" class="cp-b" id="gBack">‹ Voltar</button><span>Gradiente</span><button type="button" class="cp-x" id="gX" title="Fechar" aria-label="Fechar">✕</button></div>
      <div class="gprev" id="gPrev"></div>
      <div class="cp-sec">Direção</div>
      <div class="gdir"><div class="gdirs">${dirs.map(([a, t]) => (a < 0 ? '<i></i>' : `<button type="button" data-a="${a}" aria-label="Direção ${a}°">${t}</button>`)).join('')}</div>
        <div class="gang"><input type="range" id="gAng" min="0" max="360" step="1"><span id="gAngV"></span></div></div>
      <div class="cp-sec">Cores <small>(2 a 4)</small></div>
      <div class="gst" id="gSt"></div>
      <div class="cp-sv" id="cpSV"><i id="cpSVk"></i></div><div class="cp-hue" id="cpH"><i id="cpHk"></i></div>
      <div class="cp-row"><span class="cp-f">HEX</span><input id="cpHex" type="text" spellcheck="false" maxlength="7" aria-label="Código HEX da cor selecionada"></div>
      <div class="gsl"><label>Saturação <span id="gSatV"></span><input type="range" id="gSat" min="0" max="200" step="1"></label><label>Opacidade <span id="gOpV"></span><input type="range" id="gOp" min="0" max="100" step="1"></label></div>`;
  }
  function gPaint(live) {
    const g = gs.g, hx = st.hex = rgb2hex(...hsv2rgb(gs.hsv[0], gs.hsv[1], gs.hsv[2])); g.cols[gs.act] = hx;
    pop.querySelector('#gPrev').style.background = GR.css(GR.enc(g));
    pop.querySelector('#gSt').innerHTML = g.cols.map((c, i) => `<button type="button" class="gch${i === gs.act ? ' on' : ''}" data-i="${i}" style="background:${c}" aria-label="Cor ${i + 1}"></button>`).join('') + (g.cols.length < 4 ? '<button type="button" class="gpm" id="gAdd" title="Adicionar cor" aria-label="Adicionar cor">＋</button>' : '') + (g.cols.length > 2 ? '<button type="button" class="gpm" id="gDel" title="Remover cor selecionada" aria-label="Remover cor">－</button>' : '');
    const sv = pop.querySelector('#cpSV'); sv.style.background = `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${gs.hsv[0]},100%,50%))`;
    const k = pop.querySelector('#cpSVk'); k.style.left = gs.hsv[1] * 100 + '%'; k.style.top = (1 - gs.hsv[2]) * 100 + '%'; k.style.background = hx;
    const hk = pop.querySelector('#cpHk'); hk.style.left = gs.hsv[0] / 360 * 100 + '%'; hk.style.background = `hsl(${gs.hsv[0]},100%,50%)`;
    const hi = pop.querySelector('#cpHex'); if (document.activeElement !== hi) hi.value = hx.toUpperCase();
    pop.querySelector('#gAng').value = g.ang; pop.querySelector('#gAngV').textContent = Math.round(g.ang) + '°'; pop.querySelector('#gSat').value = g.sat; pop.querySelector('#gSatV').textContent = Math.round(g.sat) + '%'; pop.querySelector('#gOp').value = g.op; pop.querySelector('#gOpV').textContent = Math.round(g.op) + '%';
    pop.querySelectorAll('.gdirs button').forEach((b) => b.classList.toggle('on', +b.dataset.a === Math.round(g.ang)));
    pop.querySelectorAll('.gch').forEach((b) => { b.onclick = () => { gs.act = +b.dataset.i; gs.hsv = rgb2hsv(...hex2rgb(g.cols[gs.act])); gPaint(); }; });
    const ad = pop.querySelector('#gAdd'); if (ad) ad.onclick = () => { g.cols.push(g.cols[g.cols.length - 1]); gs.act = g.cols.length - 1; gPaint(true); };
    const dl = pop.querySelector('#gDel'); if (dl) dl.onclick = () => { g.cols.splice(gs.act, 1); gs.act = Math.min(gs.act, g.cols.length - 1); gs.hsv = rgb2hsv(...hex2rgb(g.cols[gs.act])); gPaint(true); };
    applyVal(gs.key, GR.enc(g), true);
  }
  function gEnd() { if (!gs) return; const p = curPage(), n = snapOf([p.id]); try { pushHist(gs.snap, n); } catch (x) { /* sem histórico */ } renderProps(); thumbRefresh(p.id); gs = null; }
  function openGrad() {
    const cx = ctxOf(st.el), e = cx.e, cur = e[cx.key], g = GR.is(cur) ? GR.parse(cur) : { ang: 135, sat: 100, op: 100, cols: [okHex(cur) || st.hex || '#c398c8', '#f2bae8'] };
    gs = { key: cx.key, g, act: 0, hsv: rgb2hsv(...hex2rgb(g.cols[0])), snap: snapOf([curPage().id]) };
    pop.innerHTML = gradHTML(); pop.classList.add('cp-g');
    drag(pop.querySelector('#cpSV'), (x, y) => { gs.hsv[1] = x; gs.hsv[2] = 1 - y; gPaint(); });
    drag(pop.querySelector('#cpH'), (x) => { gs.hsv[0] = x * 359.99; gPaint(); });
    const hi = pop.querySelector('#cpHex'); hi.onchange = () => { const k = okHex(hi.value); if (k) { gs.hsv = rgb2hsv(...hex2rgb(k)); } gPaint(); }; hi.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); hi.blur(); } };
    pop.querySelectorAll('.gdirs button').forEach((b) => { b.onclick = () => { gs.g.ang = +b.dataset.a; gPaint(); }; });
    pop.querySelector('#gAng').oninput = (ev) => { gs.g.ang = +ev.target.value; gPaint(); };
    pop.querySelector('#gSat').oninput = (ev) => { gs.g.sat = +ev.target.value; gPaint(); };
    pop.querySelector('#gOp').oninput = (ev) => { gs.g.op = +ev.target.value; gPaint(); };
    pop.querySelector('#gBack').onclick = () => { gEnd(); pop.classList.remove('cp-g'); const el = resolve(); if (el) { noAuto = true; open(el); } };
    pop.querySelector('#gX').onclick = close;
    gPaint(); const el = resolve(); if (el) place(el);
  }
  function close() { if (!st) return; if (gs) { gEnd(); pop.classList.remove('cp-g'); } commit(); st = null; pop.hidden = true; pop.innerHTML = ''; }
  async function eyedrop() {
    if (window.EyeDropper) {
      try { const res = await new window.EyeDropper().open(); if (st && res && res.sRGBHex) setHex(res.sRGBHex); } catch (e) { /* cancelado */ }
      return;
    }
    // sem EyeDropper (tablet/celular): toque em qualquer ponto de uma página para copiar a cor
    const keep = st; pop.style.visibility = 'hidden'; if (typeof toast === 'function') toast('Toque em um ponto da página para copiar a cor.');
    const pick = (ev) => {
      const cs = [...document.querySelectorAll('#stage canvas')]; let cv = null;
      for (const c of cs) { const r = c.getBoundingClientRect(); if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { cv = c; break; } }
      document.removeEventListener('pointerdown', pick, true); pop.style.visibility = '';
      if (!cv || !st) return; ev.preventDefault(); ev.stopPropagation();
      try { const r = cv.getBoundingClientRect(), x = Math.floor((ev.clientX - r.left) * cv.width / r.width), y = Math.floor((ev.clientY - r.top) * cv.height / r.height), d = cv.getContext('2d').getImageData(x, y, 1, 1).data; setHex(rgb2hex(d[0], d[1], d[2])); } catch (e) { if (typeof toast === 'function') toast('Não consegui copiar a cor deste ponto.'); }
    };
    setTimeout(() => document.addEventListener('pointerdown', pick, true), 0); void keep;
  }

  // abre no lugar do seletor nativo
  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest && e.target.closest('input[type=color]'); if (!el || el.disabled) return;
    e.preventDefault(); e.stopPropagation(); if (st && st.el === el) { close(); return; } close(); open(el);
  }, true);
  document.addEventListener('pointerdown', (e) => { if (!st || pop.hidden) return; if (pop.contains(e.target) || (e.target.closest && e.target.closest('input[type=color]'))) return; if (pop.style.visibility === 'hidden') return; close(); }, true);
  document.addEventListener('keydown', (e) => { if (st && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);
  window.addEventListener('resize', () => { if (st) { const el = resolve(); if (el) place(el); } });
  window.ColorPicker = { isOpen: () => !!st, close };
})();
