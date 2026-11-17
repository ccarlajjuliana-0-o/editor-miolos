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
  const bindOn = (m) => !!m && (m.bindOn !== undefined ? !!m.bindOn : num(m.holes, 0) > 0 || num(m.gutter, 0) > 0);
  const bindOf = (m) => (m && BIND[m.bind] ? m.bind : m && m.bind === undefined && num(m.holes, 0) === 20 ? 'disc' : 'custom');
  // Padrão proporcional ao lado curto da página (A5: 5,8 mm nas bordas e 12,2 mm por dentro). Furos só se houver encadernação.
  const defaults = (p, bk) => {
    const s = Math.min(p.w, p.h), r = (v) => Math.round(v * 10) / 10, k = bk !== undefined ? bk : S.meta && S.meta.mgBind, B = BIND[k];
    return { top: r(s * 0.0392), bottom: r(s * 0.0392), inner: r(s * 0.0824), outer: r(s * 0.0392), gutter: 0, holes: B ? B.mm : 0, bind: B ? k : 'custom', bindOn: !!B, hdr: 0, ftr: 0, tabs: curTabs(), lock: false, side: 'auto' };
  };
  const TDEF = { on: false, pos: 'side', n: 4, w: 12, r: 3, gap: 1, len: 0, al: 'center', bg: 'none', labels: [], cmode: 'alt', c1: '#C398C8', c2: '#92A8D1', cols: [], tc: '#3E3550', font: 'Quicksand', act: 0, actc: '#4A4E79' };
  const tabsOf = (m) => Object.assign({}, TDEF, m && m.tabs);
  // as divisórias são iguais em todas as páginas: quem nasce depois herda a configuração das outras
  function curTabs() { const id = S.order && S.order.find((i) => S.pages[i] && S.pages[i].mg); return Object.assign({}, TDEF, id ? S.pages[id].mg.tabs : null); }
  function extras(m) { const t = tabsOf(m), w = t.on ? Math.max(0, num(t.w, 12)) : 0; return { side: t.pos === 'side' ? w : 0, top: t.pos === 'top' ? w : 0, bot: t.pos === 'bottom' ? w : 0, t }; }
  function geom(p, m) {
    if (!m) return { full: true, x0: 0, x1: p.w, top: 0, bot: p.h, y0: 0, y1: p.h, hasH: false, hasF: false, e: false, g: 0, holes: 0, X: { side: 0, top: 0, bot: 0, t: tabsOf(null) } };
    const e = isLeft(p, m), bo = bindOn(m), g = bo ? num(m.gutter, 0) / 2 : 0, hdr = num(m.hdr, 0), ftr = num(m.ftr, 0), holes = bo ? Math.max(0, num(m.holes, 0)) : 0, X = extras(m);
    const L = e ? num(m.outer, 0) + X.side : num(m.inner, 0) + g + holes, R = e ? num(m.inner, 0) + g + holes : num(m.outer, 0) + X.side;
    const top = num(m.top, 0) + X.top, bot = p.h - num(m.bottom, 0) - X.bot;
    return { x0: L, x1: p.w - R, top, bot, y0: top + hdr, y1: bot - ftr, hasH: hdr > 0, hasF: ftr > 0, e, g, holes, X };
  }
  const r1v = (v) => Math.round(v * 10) / 10;

  /* ---------- ajusta o conteúdo da área antiga para a nova ---------- */
  // O conteúdo só se MOVE: tamanhos e fontes nunca mudam. Cada elemento acompanha a borda mais próxima
  // (os do meio dividem o deslocamento) e fica preso dentro da área segura e da página.
  // O que não cabe sem mudar de tamanho, ou que passaria a se sobrepor, vira um aviso de incompatibilidade.
  let FIX = [];
  const nameOf = (e) => { const t = String(e.text || '').replace(/\s+/g, ' ').trim(); return t ? '“' + t.slice(0, 24) + (t.length > 24 ? '…' : '') + '”' : (typeof TYPE_NAME !== 'undefined' && TYPE_NAME[e.type]) || 'elemento'; };
  // Âncoras por elemento (e.mu): posição relativa à área em vez de valores absolutos. Assim o ajuste é reversível:
  // ao devolver a margem ao valor anterior, cada elemento volta exatamente ao lugar de origem.
  const same = (a, b) => Math.abs(a - b) < 0.06;
  function anchorAxis(pos, len, a0, a1, lo, hi, pageLen, kind) { // kind: 'x' ou 'y'
    const c = pos + len / 2, area = a1 - a0;
    if (len > area + 1 || (lo === 0 && hi === pageLen && len >= pageLen - 1)) return { m: 'X', v: 0 };
    if (c < a0) return { m: kind === 'x' ? 'L' : 'T', v: pos - lo };       // fora da área, na margem: acompanha a borda
    if (c > a1) return { m: kind === 'x' ? 'R' : 'B', v: pos - hi };
    if (Math.abs(pos - a0) <= 1.5) return { m: 'S', v: pos - a0 };           // colado no começo da área: acompanha
    if (Math.abs(a1 - (pos + len)) <= 1.5) return { m: 'E', v: pos + len - a1 }; // colado no fim: acompanha
    return { m: 'F', v: pos };                                                // livre: fica onde está e só recua se a margem invadir
  }
  function placeAxis(an, pos, len, b0, b1, lo, hi, pageLen) { // devolve {v, ok}
    if (an.m === 'X') return { v: pos, ok: true };
    if (an.m === 'L' || an.m === 'T') return { v: lo + an.v, ok: true };
    if (an.m === 'R' || an.m === 'B') return { v: hi + an.v, ok: true };
    const room = b1 - b0; if (len > room + 0.05) return { v: b0, ok: false };
    const v = an.m === 'S' ? b0 + an.v : an.m === 'E' ? b1 + an.v - len : an.v;
    return { v: Math.max(b0, Math.min(v, b1 - len)), ok: true };
  }
  function fit(p, a, b) {
    if (a.full && b.full) return;
    const moved = [];
    p.els.forEach((e) => {
      if (e.locked) return;
      const before = { x: e.x, y: e.y };
      let mu = e.mu;
      if (!mu || !same(mu.x, e.x) || !same(mu.y, e.y)) { // novo ou movido à mão: registra a âncora na área atual
        const ax = anchorAxis(e.x, e.w, a.x0, a.x1, a.x0, a.x1, p.w, 'x'), ay = anchorAxis(e.y, e.h, a.y0, a.y1, a.top, a.bot, p.h, 'y');
        mu = { ax, ay };
      }
      const X = placeAxis(mu.ax, e.x, e.w, b.x0, b.x1, b.x0, b.x1, p.w), Y = placeAxis(mu.ay, e.y, e.h, b.y0, b.y1, b.top, b.bot, p.h);
      e.x = r1(Math.max(0, Math.min(X.v, Math.max(0, p.w - e.w)))); e.y = r1(Math.max(0, Math.min(Y.v, Math.max(0, p.h - e.h))));
      e.mu = { ax: mu.ax, ay: mu.ay, x: e.x, y: e.y };
      if (!X.ok) FIX.push({ p, e, why: 'largura' }); else if (!Y.ok) FIX.push({ p, e, why: 'altura' });
      moved.push({ e, before });
    });
    const ov = (A, B2) => A.x < B2.x + B2.w - .3 && A.x + A.w > B2.x + .3 && A.y < B2.y + B2.h - .3 && A.y + A.h > B2.y + .3;
    if (moved.length < 160) for (let i = 0; i < moved.length; i++) for (let k = i + 1; k < moved.length; k++) {
      const m1 = moved[i], m2 = moved[k], e1 = m1.e, e2 = m2.e;
      if (ov(e1, e2) && !ov({ x: m1.before.x, y: m1.before.y, w: e1.w, h: e1.h }, { x: m2.before.x, y: m2.before.y, w: e2.w, h: e2.h })) FIX.push({ p, e: e2, why: 'sobrepõe ' + nameOf(e1) });
    }
  }
  function warnFit() {
    const L = FIX; FIX = []; if (!L.length) return;
    const seen = new Set(), U = L.filter((f) => { if (seen.has(f.e.id)) return false; seen.add(f.e.id); return true; });
    const pages = new Set(U.map((f) => f.p.id)).size, ex = nameOf(U[0].e);
    const msg = 'Incompatibilidade: ' + U.length + ' elemento' + (U.length > 1 ? 's' : '') + (pages > 1 ? ' em ' + pages + ' páginas' : '') + ' não ' + (U.length > 1 ? 'cabem' : 'cabe') + ' na nova área sem mudar de tamanho ou ' + (U.length > 1 ? 'passam' : 'passa') + ' a se sobrepor (ex.: ' + ex + '). Mantive tamanhos e fontes. Reduza o recuo ou desfaça com Ctrl+Z.';
    toast2(msg); try { clearTimeout(toastT); toastT = setTimeout(() => document.querySelector('#toast').classList.remove('on'), 9000); } catch (e) { /* sem toastT */ }
  }

  /* ---------- aplicar (com histórico) ---------- */
  const fitOn = () => S.meta.mgFit !== false;
  const PAIR = { top: 'bottom', bottom: 'top', inner: 'outer', outer: 'inner' };
  const linkOn = (k) => (k === 'top' || k === 'bottom' ? S.meta.mgLinkTB === true : S.meta.mgLinkLR === true);
  const spreadOn = () => S.meta.mgLinkSpread !== false;
  const NUMK = ['top', 'bottom', 'inner', 'outer', 'gutter', 'holes', 'hdr', 'ftr'], SPK = ['inner', 'holes', 'gutter', 'bindOn', 'bind'];
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
    ids.forEach((id) => thumbRefresh(id)); redraw(); renderProps(); warnFit(); return ids.length;
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

  /* ---------- divisórias: um desenho só, fixo na lateral externa, igual em todas as páginas ---------- */
  function rr(c, x, y, w, h, r) { // r = [tl, tr, br, bl]
    c.beginPath(); c.moveTo(x + r[0], y); c.lineTo(x + w - r[1], y); if (r[1]) c.arcTo(x + w, y, x + w, y + r[1], r[1]); c.lineTo(x + w, y + h - r[2]); if (r[2]) c.arcTo(x + w, y + h, x + w - r[2], y + h, r[2]);
    c.lineTo(x + r[3], y + h); if (r[3]) c.arcTo(x, y + h, x, y + h - r[3], r[3]); c.lineTo(x, y + r[0]); if (r[0]) c.arcTo(x, y, x + r[0], y, r[0]); c.closePath();
  }
  R.mgtabs = function (c, e) {
    const n = e.n, V = e.side === 'l' || e.side === 'r', L = V ? e.h : e.w, D = V ? e.w : e.h, gap = Math.max(0, e.gap);
    if (e.bgw) { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, e.w, e.h); }
    const auto = Math.max(1, (L - (n - 1) * gap) / n), th = e.len > 0 ? Math.min(e.len, auto) : auto, total = n * th + (n - 1) * gap;
    const st = e.len > 0 ? (e.al === 'start' ? 0 : e.al === 'end' ? L - total : (L - total) / 2) : 0;
    const rad = Math.max(0, Math.min(e.rad, th / 2, D));
    const R4 = { l: [rad, 0, 0, rad], r: [0, rad, rad, 0], t: [rad, rad, 0, 0], b: [0, 0, rad, rad] }[e.side];
    for (let i = 0; i < n; i++) {
      const a = st + i * (th + gap), act = i === e.act - 1;
      if (V) rr(c, 0, a, D, th, R4); else rr(c, a, 0, th, D, R4);
      c.fillStyle = act ? e.actc : e.cols[i]; c.fill();
      const lab = String(e.labels[i] == null ? '' : e.labels[i]); if (!lab) continue;
      c.save(); c.translate(V ? D / 2 : a + th / 2, V ? a + th / 2 : D / 2);
      if (V) c.rotate(e.side === 'r' ? Math.PI / 2 : -Math.PI / 2);
      font(c, Math.min(D * 0.42, th * 0.26, 5), e.font, 600); c.fillStyle = act ? '#FFFFFF' : e.tc; T(c, fitText(c, lab, th - 1.6), 0, 0, 'center', 'middle'); c.restore();
    }
  };
  function tabEl(pg) {
    const m = pg && pg.mg; if (!m || !S.meta || S.meta.mgOn === false) return null;
    const t = tabsOf(m); if (!t.on) return null;
    const g = geom(pg, m), w = Math.max(3, num(t.w, 12)), n = cl(Math.round(num(t.n, 4)), 1, 30);
    let x, y, ww, hh, side;
    if (t.pos === 'side') { side = g.e ? 'l' : 'r'; x = g.e ? 0 : pg.w - w; y = g.top; ww = w; hh = g.bot - g.top; }
    else { side = t.pos === 'top' ? 't' : 'b'; x = g.x0; y = t.pos === 'top' ? 0 : pg.h - w; ww = g.x1 - g.x0; hh = w; }
    const cols = Array.from({ length: n }, (_, i) => (t.cmode === 'same' ? t.c1 : t.cmode === 'each' ? (t.cols[i] || (i % 2 ? t.c2 : t.c1)) : (i % 2 ? t.c2 : t.c1)));
    return { id: 'mgtabs', type: 'mgtabs', x, y, w: ww, h: hh, side, n, len: num(t.len, 0), gap: num(t.gap, 1), al: t.al, rad: num(t.r, 3), labels: Array.from({ length: n }, (_, i) => (t.labels[i] != null ? t.labels[i] : String(i + 1))), cols, tc: t.tc, font: t.font, act: num(t.act, 0), actc: t.actc, bgw: t.bg === 'white' };
  }
  // aplica a mudança em TODAS as páginas com layout (as divisórias são vinculadas)
  function tabsEdit(p, patch) {
    const base = tabsOf(p.mg), pt = Object.assign({}, patch);
    const lab = (arr, n) => Array.from({ length: n }, (_, i) => (arr[i] != null ? arr[i] : String(i + 1)));
    if ('n' in pt) { pt.n = cl(Math.round(+pt.n || 1), 1, 30); pt.labels = lab(base.labels, pt.n); }
    else if ('labels' in pt) { pt.labels = pt.labels.slice(0, 30); pt.n = Math.max(1, pt.labels.length); }
    else if (pt.on && !base.labels.length) pt.labels = lab([], base.n);
    const ids = S.order.filter((id) => S.pages[id] && S.pages[id].mg);
    if (!ids.includes(p.id)) ids.push(p.id);
    return edit(p, { tabs: pt }, null, { ids });
  }

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
    if (isOn()) { const wm = S.order.filter((id) => S.pages[id] && S.pages[id].mg); if (wm.length && fitOn()) { change(wm, () => wm.forEach((id) => { const q = S.pages[id]; fit(q, geom(q, q.mg), geom(q, null)); })); wm.forEach((id) => thumbRefresh(id)); FIX = []; } S.meta.mgOn = false; S.guides = false; Saver.m(); paintBtn(); redraw(); renderProps(); msg('Margens desligadas. Os valores ficam guardados.'); return; }
    const need0 = S.order.filter((id) => S.pages[id] && !S.pages[id].mg);
    if (need0.length && S.meta.mgBind === undefined) { askBind(enable); return; }
    enable();
    function enable() {
      S.meta.mgOn = true; S.guides = true; Saver.m();
      const had = S.order.filter((id) => S.pages[id] && S.pages[id].mg);
      if (had.length && fitOn()) { change(had, () => had.forEach((id) => { const q = S.pages[id]; fit(q, geom(q, null), geom(q, q.mg)); })); had.forEach((id) => thumbRefresh(id)); }
      const need = S.order.filter((id) => S.pages[id] && !S.pages[id].mg);
      if (need.length) {
        change(need, () => need.forEach((id) => { const p = S.pages[id], m = defaults(p); if (fitOn()) fit(p, geom(p, null), geom(p, m)); p.mg = m; }));
        need.forEach((id) => thumbRefresh(id));
      }
      paintBtn(); redraw(); renderProps(); msg('Margens ligadas.' + (need.length ? ' Ctrl+Z desfaz o ajuste do conteúdo.' : ''));
      warnFit();
    }
  }
  // antes de criar o layout: pergunta se o miolo vai ser encadernado (define o espaço dos furos)
  function askBind(go) {
    const opts = [['none', 'Sem encadernação', 'Sem espaço para furos. Só margens.']].concat(Object.keys(BIND).filter((k) => k !== 'custom').map((k) => [k, BIND[k].name, BIND[k].mm + ' mm de espaço para os furos']));
    modal(`<div class="insroot"><h2>Esse miolo vai ser encadernado?</h2><p class="hint">Escolha o tipo para eu reservar o espaço dos furos no meio da dupla. Dá para mudar depois no painel Layout.</p>
      <div class="bindopts">${opts.map(([k, n, d]) => `<button type="button" class="bindopt" data-bk="${k}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>
      <div class="row"><button class="btn sm" data-close>Cancelar</button></div></div>`, (box) => {
      box.querySelectorAll('[data-bk]').forEach((b) => { b.onclick = () => { S.meta.mgBind = b.dataset.bk === 'none' ? 'none' : b.dataset.bk; Saver.m(); const m = document.getElementById('modal'); m.hidden = true; box.innerHTML = ''; go(); }; });
    });
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
    geom, applyMap, defaults, isLeft, tabEl,
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
    const t = tabsOf(m), d = dis ? ' disabled' : '', pb = (v, l) => `<button type="button" data-tpos="${v}" class="${t.pos === v ? 'on' : ''}"${d}>${l}</button>`, ab = (v, l) => `<button type="button" data-tal="${v}" class="${t.al === v ? 'on' : ''}"${d}>${l}</button>`;
    const body = t.on ? `<div class="mgsub">POSIÇÃO</div><div class="segf" id="mgTbPos">${pb('top', '⬒ Topo')}${pb('bottom', '⬓ Base')}${pb('side', '◧ Lateral')}</div>
      <div class="mrow"><span class="mi">#</span><span class="ml">Quantidade</span><span class="mstep"><button type="button" data-tn="-1"${d}>−</button><input type="number" min="1" max="30" step="1" data-mgt="n" value="${t.n}"${d}><button type="button" data-tn="1"${d}>+</button></span></div>
      <div class="mgsub tsh"><span>TAMANHO E FORMA</span><button type="button" class="mini" id="mgTbReset" title="Voltar ao padrão inicial" aria-label="Redefinir tamanho e forma"${d}>↺</button></div>
      <div class="mrow"><span class="mi">↔</span><span class="ml">${t.pos === 'side' ? 'Largura' : 'Altura'}</span><input type="range" min="3" max="40" step="0.5" value="${Math.min(num(t.w, 12), 40)}" data-mgtr="w"${d}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(t.w)}" data-mgtn="w"${d}></div>
      <div class="mrow"><span class="mi">◜</span><span class="ml">Raio</span><input type="range" min="0" max="15" step="0.5" value="${Math.min(num(t.r, 3), 15)}" data-mgtr="r"${d}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(t.r)}" data-mgtn="r"${d}></div>
      <div class="mrow"><span class="mi">⇕</span><span class="ml">Espaço entre</span><input type="range" min="0" max="15" step="0.5" value="${Math.min(num(t.gap, 1), 15)}" data-mgtr="gap"${d}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(t.gap)}" data-mgtn="gap"${d}></div>
      <div class="mrow"><span class="mi">▭</span><span class="ml">Tamanho</span><input type="range" min="0" max="120" step="1" value="${Math.min(num(t.len, 0), 120)}" data-mgtr="len"${d}><input type="number" class="mn" step="${stepU()}" min="0" value="${toU(t.len)}" data-mgtn="len"${d}></div>
      <p class="hint">Tamanho 0 = as divisórias ocupam a lateral toda.</p>
      <div class="mgsub">ALINHAMENTO NA LATERAL</div><div class="segf" id="mgTbAl">${ab('start', 'Início')}${ab('center', 'Centro')}${ab('end', 'Fim')}</div>
      <button type="button" class="btn sm" id="mgTbMore"${d}>Mais configurações…</button>` : '';
    return `<div class="mgcard${t.on ? ' on' : ''}"><div class="mgcard-h"><span class="mi">▤</span><b>Divisórias</b>${sw('mgTbOn', t.on, dis)}</div>${body ? `<div class="mgcard-b">${body}</div>` : ''}</div>`;
  }
  let tabsMore = false; // segunda janela: nomes, cores e fundo das divisórias
  function moreHTML(p) {
    const t = tabsOf(p.mg), n = cl(Math.round(num(t.n, 4)), 1, 30);
    const cf = (key, val, label) => `<div class="tcf"><span class="tcl">${label}</span><div class="cfield">${BRAND.map((c) => `<button type="button" class="sw${String(val).toLowerCase() === c.toLowerCase() ? ' on' : ''}" data-tcv="${key}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input type="color" data-tcc="${key}" value="${/^#[0-9a-f]{6}$/i.test(val) ? val : '#C398C8'}" aria-label="Escolher cor"></div></div>`;
    const cm = (v, l) => `<button type="button" data-tcm="${v}" class="${t.cmode === v ? 'on' : ''}">${l}</button>`;
    const rows = Array.from({ length: n }, (_, i) => { const lab = t.labels[i] != null ? t.labels[i] : String(i + 1), col = t.cols[i] || (i % 2 ? t.c2 : t.c1); return `<div class="tbrow"><span class="tbn">${i + 1}</span><input type="text" data-tbl="${i}" value="${String(lab).replace(/"/g, '&quot;')}" aria-label="Texto da divisória ${i + 1}">${t.cmode === 'each' ? `<input type="color" class="tbcol" data-tbc="${i}" value="${/^#[0-9a-f]{6}$/i.test(col) ? col : '#C398C8'}" title="Cor da divisória ${i + 1}" aria-label="Cor da divisória ${i + 1}">` : ''}</div>`; }).join('');
    return `<div class="pbrow" id="pbRow"><button type="button" class="pback" id="tbBack" title="Voltar para o Layout">← Voltar</button></div>
      <div class="pgrp" id="mgPanel"><h3 class="mgh3">▤ DIVISÓRIAS · MAIS CONFIGURAÇÕES</h3>
      <div class="mgsub">TEXTO DE CADA DIVISÓRIA${t.cmode === 'each' ? ' E SUA COR' : ''}</div>${rows}
      <div class="row"><button type="button" class="btn sm" id="tbAdd"${n >= 30 ? ' disabled' : ''}>＋ Divisória</button><button type="button" class="btn sm" id="tbDel"${n <= 1 ? ' disabled' : ''}>− Última</button></div>
      <div class="mgsub">CORES DAS DIVISÓRIAS</div><div class="segf" id="tbCm">${cm('same', 'Iguais')}${cm('alt', 'Alternadas')}${cm('each', 'Cada uma')}</div>
      ${t.cmode === 'each' ? '<p class="hint">Use o quadrinho de cor ao lado do texto de cada divisória.</p>' : t.cmode === 'same' ? cf('c1', t.c1, 'Cor de todas') : cf('c1', t.c1, 'Cor 1 (1ª, 3ª…)') + cf('c2', t.c2, 'Cor 2 (2ª, 4ª…)')}
      ${cf('tc', t.tc, 'Cor do texto')}
      <label class="pfield"><span>Fonte</span><select id="tbFont">${(typeof FONTS !== 'undefined' ? FONTS : [[t.font]]).map(([f]) => `<option${f === t.font ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
      <div class="mrow"><span class="mi">★</span><span class="ml">Destaque nº</span><input type="number" class="mn" min="0" max="${n}" step="1" id="tbAct" value="${num(t.act, 0)}"></div>
      ${num(t.act, 0) > 0 ? cf('actc', t.actc, 'Cor do destaque') : ''}
      <div class="mgsub">PLANO DE FUNDO</div><div class="segf" id="mgTbBgSel"><button type="button" data-tbg="none" class="${t.bg === 'white' ? '' : 'on'}">Transparente</button><button type="button" data-tbg="white" class="${t.bg === 'white' ? 'on' : ''}">Branco</button></div>
      <p class="hint">As divisórias são iguais em todas as páginas: mudar aqui muda em todas.</p></div>`;
  }
  function mountMore(p, P) {
    const $q = (s) => P.querySelector(s), E_ = (patch) => tabsEdit(p, patch);
    $q('#tbBack').onclick = () => { tabsMore = false; renderProps(); };
    const t = tabsOf(p.mg);
    P.querySelectorAll('[data-tbl]').forEach((i) => { i.onchange = () => { const L = t.labels.slice(); for (let k = 0; k < t.n; k++) if (L[k] == null) L[k] = String(k + 1); L[+i.dataset.tbl] = i.value; E_({ labels: L.slice(0, t.n) }); }; });
    P.querySelectorAll('[data-tbc]').forEach((i) => { i.onchange = () => { const C = []; for (let k = 0; k < t.n; k++) C[k] = t.cols[k] || (k % 2 ? t.c2 : t.c1); C[+i.dataset.tbc] = i.value; E_({ cols: C }); }; });
    $q('#tbAdd').onclick = () => E_({ n: t.n + 1 }); $q('#tbDel').onclick = () => E_({ n: t.n - 1 });
    $q('#tbCm').onclick = (e) => { const b = e.target.closest('[data-tcm]'); if (b) { const patch = { cmode: b.dataset.tcm }; if (b.dataset.tcm === 'each' && !t.cols.length) patch.cols = Array.from({ length: t.n }, (_, k) => (t.cmode === 'same' ? t.c1 : k % 2 ? t.c2 : t.c1)); E_(patch); } };
    P.querySelectorAll('[data-tcv]').forEach((b) => { b.onclick = () => E_({ [b.dataset.tcv]: b.dataset.v }); });
    P.querySelectorAll('[data-tcc]').forEach((i) => { i.onchange = () => E_({ [i.dataset.tcc]: i.value }); });
    $q('#tbFont').onchange = (e) => E_({ font: e.target.value });
    $q('#tbAct').onchange = (e) => E_({ act: cl(Math.round(+e.target.value || 0), 0, t.n) });
    $q('#mgTbBgSel').onclick = (e) => { const b = e.target.closest('[data-tbg]'); if (b) E_({ bg: b.dataset.tbg }); };
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
      <div class="mrow mgsw-row"><span class="mi">◎</span><span class="ml" style="flex:1">Encadernação</span>${sw('mgBindOn', bindOn(m), dis)}</div>
      ${bindOn(m) ? `<label class="pfield mgbind"><span>Tipo de encadernação</span><select id="mgBind"${dis ? ' disabled' : ''}>${Object.keys(BIND).map((k) => `<option value="${k}"${bindOf(m) === k ? ' selected' : ''}>${BIND[k].name} · ${BIND[k].mm} mm</option>`).join('')}<option value="custom"${bindOf(m) === 'custom' ? ' selected' : ''}>Personalizado</option></select></label>
      <div class="mgpair"><div class="mgrows">${row('holes', 'Furos', m.holes, 40, dis)}${row('gutter', 'Lombada', m.gutter, 30, dis)}</div>${chain('mgLkSp', spreadOn(), dis)}</div>` : ''}
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
    const bo = $q('#mgBindOn'); if (bo) bo.onchange = () => { blur(); if (bo.checked) { const k = BIND[bindOf(p.mg)] ? bindOf(p.mg) : BIND[S.meta.mgBind] ? S.meta.mgBind : 'spiral'; const h = num(p.mg.holes, 0) > 0 ? p.mg.holes : BIND[k].mm; edit(p, { bindOn: true, bind: num(p.mg.holes, 0) > 0 ? bindOf(p.mg) : k, holes: h }, null); } else edit(p, { bindOn: false }, null); };
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
      ids.forEach((id) => thumbRefresh(id)); redraw(); renderProps(); warnFit();
    };
    P.querySelectorAll('[data-mgr]').forEach((r) => { const k = r.dataset.mgr, nb = $q(`[data-mgn=${k}]`); r.oninput = () => { nb.value = toU(+r.value); }; r.onchange = () => commit(k, +r.value); });
    P.querySelectorAll('[data-mgn]').forEach((nb) => { nb.onchange = () => commit(nb.dataset.mgn, Math.max(0, fromU(nb.value))); });
    // divisórias
    const tbOn = $q('#mgTbOn'); if (tbOn) tbOn.onchange = () => { blur(); tabsEdit(p, { on: tbOn.checked }); };
    const tp = $q('#mgTbPos'); if (tp) tp.onclick = (e) => { const b = e.target.closest('[data-tpos]'); if (b && !b.disabled) tabsEdit(p, { pos: b.dataset.tpos }); };
    const ta = $q('#mgTbAl'); if (ta) ta.onclick = (e) => { const b = e.target.closest('[data-tal]'); if (b && !b.disabled) tabsEdit(p, { al: b.dataset.tal }); };
    const tcommit = (k, v) => { blur(); if (k === 'n') v = cl(Math.round(+v || 1), 1, 30); else if (k === 'w') v = Math.max(3, v || 12); else v = Math.max(0, v || 0); tabsEdit(p, { [k]: v }); };
    P.querySelectorAll('[data-mgtr]').forEach((r) => { const k = r.dataset.mgtr, nb = $q(`[data-mgtn=${k}]`); r.oninput = () => { nb.value = toU(+r.value); }; r.onchange = () => tcommit(k, +r.value); });
    P.querySelectorAll('[data-mgtn]').forEach((nb) => { nb.onchange = () => tcommit(nb.dataset.mgtn, fromU(nb.value)); });
    const nIn = $q('[data-mgt=n]'); if (nIn) nIn.onchange = () => tcommit('n', nIn.value);
    P.querySelectorAll('[data-tn]').forEach((b) => { b.onclick = () => tcommit('n', num(tabsOf(p.mg).n, 4) + +b.dataset.tn); });
    on('#mgTbReset', () => { blur(); tabsEdit(p, { w: TDEF.w, r: TDEF.r, gap: TDEF.gap, len: TDEF.len, al: TDEF.al }); toast2('Tamanho e forma voltaram ao padrão. Ctrl+Z desfaz.'); });
    on('#mgTbMore', () => { tabsMore = true; renderProps(); });
  }
  /* ---------- organização da coluna da direita ---------- */
  let pgOpen = false; // configuração da página expandida enquanto há outra janela de configuração ativa
  const otherCfgActive = () => isOn() || (typeof Pref !== 'undefined' && (Pref.rulers || Pref.grid));
  function decorate(P) {
    if (!P || !S.meta) return;
    const isPage = !!P.querySelector('#psz');
    if (!isPage) { // elemento selecionado: botão para voltar à janela anterior
      if (P.children.length && !P.querySelector('#pBack') && !P.querySelector('#mgPanel')) {
        P.insertAdjacentHTML('afterbegin', '<div class="pbrow" id="pbRow"><button type="button" class="pback" id="pBack" title="Voltar para as configurações da página">← Voltar</button></div>');
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
      if (tabsMore && (selEls().length || !isOn() || !p || !tabsOf(p.mg).on)) tabsMore = false;
      if (tabsMore && P && p && P.querySelector('#psz')) { P.innerHTML = moreHTML(p); mountMore(p, P); }
      else decorate(P);
    } catch (e) { console.error(e); }
    return r;
  };
})();
