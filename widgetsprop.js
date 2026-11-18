/* Widgets — painel da direita (personalização), moldura da página, copiar estilo, salvar widget,
   camadas/sobreposição e fixar na frente/atrás. */
(function () {
  'use strict';
  const { tok } = WX;
  const ISW = new Set(['calendar', 'yearcal', 'table', 'checklist', 'habit', 'hours', 'progress', 'numgrid', 'water', 'mood', 'rate']);
  const DEFNO = new Set(['calendar', 'yearcal', 'table', 'checklist', 'habit', 'hours', 'progress', 'numgrid']);
  const MKF = { checklist: 'box', habit: 'mk', numgrid: 'mk', rate: 'mk' };
  const MKC = { checklist: 'color', habit: 'accent', numgrid: 'color', rate: 'color' };
  const UNF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/></svg>';
  const isW = (e) => ISW.has(e.type) || e.noOver === true;
  const isNoOver = (e) => (e.noOver !== undefined ? e.noOver : DEFNO.has(e.type));
  const blocks = (a, b) => a !== b && isW(a) && isW(b) && (isNoOver(a) || isNoOver(b));
  const inter = (a, b) => a.x < b.x + b.w - 0.2 && a.x + a.w > b.x + 0.2 && a.y < b.y + b.h - 0.2 && a.y + a.h > b.y + 0.2;
  const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  let RT = 'e', wxB = null;

  /* ---------- controles ---------- */
  const fld = (l, inner) => `<label class="pfield"><span>${l}</span>${inner}</label>`;
  const A = (path) => `data-wx="${path}" data-r="${RT}"`;
  const inNum = (o, path, l, step, min, max) => fld(l, `<input type="number" ${A(path)} data-t="num" step="${step}"${min != null ? ` min="${min}"` : ''}${max != null ? ` max="${max}"` : ''} value="${get(o, path) ?? 0}">`);
  const inChk = (o, path, l, val) => `<label class="chk"><input type="checkbox" ${A(path)} data-t="chk"${(val !== undefined ? val : get(o, path)) ? ' checked' : ''}> ${l}</label>`;
  const inTxt = (o, path, l) => fld(l, `<input type="text" ${A(path)} data-t="text" value="${esc(get(o, path) || '')}">`);
  const inRng = (o, path, l, min, max, step, dflt, fmt) => { const v = get(o, path) ?? dflt; return fld(l, `<div class="rngrow"><input type="range" ${A(path)} data-t="num" min="${min}" max="${max}" step="${step}" value="${v}"><span>${fmt ? fmt(v) : Math.round(v * 100) + '%'}</span></div>`); };
  const inSeg = (o, path, l, opts) => fld(l, `<div class="segf">${opts.map(([v, n]) => `<button type="button" data-wxs="${path}" data-r="${RT}" data-v="${v}" class="${String(get(o, path) ?? '') === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div>`);
  const inFont = (o, path, l) => {
    const L = fontList(), v = get(o, path);
    return fld(l, `<select ${A(path)} data-t="sel">${[['@title', 'Fonte de títulos do projeto'], ['@script', 'Fonte caligráfica do projeto'], ['@body', 'Fonte de texto do projeto']].map(([k, n]) => `<option value="${k}"${v === k ? ' selected' : ''}>${n}</option>`).join('')}${L.map((n) => `<option${n === v ? ' selected' : ''} style="font-family:'${esc(n)}'">${esc(n)}</option>`).join('')}</select>`);
  };
  function wc(path, v, none) {
    const val = tok(v), hex = /^#[0-9a-f]{6}$/i.test(val || '') ? val : '#ffffff', isNone = !!none && (v === 'none' || !v);
    return `<div class="cfield cc${isNone ? ' isnone' : ''}">${none ? `<button type="button" class="sw none${isNone ? ' cur' : ''}" data-wxc="${path}" data-r="${RT}" data-v="none" title="Sem cor" aria-label="Sem cor"></button>` : ''}<input type="color" ${A(path)} data-t="color" value="${hex}" aria-label="Cor atual. Clique para escolher qualquer cor"><button type="button" class="cct" title="Mostrar ou ocultar as cores da paleta" aria-label="Paleta de cores">▾</button>${['@a', '@b', '@ink', '@soft', '@line'].map((t) => `<button type="button" class="sw tk${v === t ? ' on' : ''}" data-wxc="${path}" data-r="${RT}" data-v="${t}" style="background:${tok(t)}" title="Cor da paleta" aria-label="Cor da paleta"></button>`).join('')}${BRAND.map((c) => `<button type="button" class="sw${v === c ? ' on' : ''}" data-wxc="${path}" data-r="${RT}" data-v="${c}" style="background:${c}" title="${c}" aria-label="${c}"></button>`).join('')}</div>`;
  }
  const inCol = (o, path, l, none) => fld(l, wc(path, get(o, path), none));
  const openAcc = (id) => { Pref.acc = Pref.acc || { cont: true }; return !!Pref.acc[id]; };
  const acc = (id, title, i, inner) => `<div class="wacc${openAcc(id) ? ' open' : ''}" data-acc="${id}"><button class="wah" type="button" aria-expanded="${openAcc(id)}"><i class="wtri"></i><b>${title}</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab">${inner}</div></div>`;
  const grp = (t) => `<div class="wgp">${t}</div>`;

  /* ---------- seções ---------- */
  function secMarkers(e) {
    const f = MKF[e.type], cur = e[f] || (e.type === 'habit' ? 'circle' : e.type === 'rate' ? 'star' : e.type === 'numgrid' ? 'rounded' : 'square');
    return `<div class="mkgrid">${WX.MARKS.map(([k, n]) => `<button type="button" class="mkb${cur === k ? ' on' : ''}" data-wxmk="${k}" title="${n}" aria-label="${n}"><canvas data-mkc="${k}"></canvas></button>`).join('')}</div>
      ${inSeg(e, 'mfill', 'Preenchimento', [['', 'Contorno'], ['solid', 'Cheio'], ['soft', 'Suave']])}
      ${inCol(e, MKC[e.type], 'Cor do marcador', false)}
      ${e.mfill ? inCol(e, 'mfc', 'Cor do preenchimento', false) : ''}
      ${e.type === 'checklist' ? inRng(e, 'msize', 'Tamanho do marcador', 0.5, 2, 0.05, 1, (v) => '×' + (+v).toFixed(2)) : ''}
      ${cur === 'num' || (e.type === 'checklist' && cur === 'num') ? inNum(e, 'num0', 'Começa em', 1, 0, 999) : ''}`;
  }
  function secHeader(e) {
    const h = e.wx && e.wx.hd, on = !!(h && h.on);
    let s = inChk(e, 'wx.hd.on', 'Mostrar título', on);
    if (!on) return s;
    s += inTxt(e, 'wx.hd.text', 'Texto do título') + inFont(e, 'wx.hd.font', 'Fonte do título') + `<div class="fgrid">${inNum(e, 'wx.hd.size', 'Tamanho (pt)', 0.5, 4, 40)}${inNum(e, 'wx.hd.h', 'Altura (mm)', 0.5, 3, 30)}</div>`
      + inSeg(e, 'wx.hd.align', 'Alinhamento', [['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']])
      + inSeg(e, 'wx.hd.weight', 'Peso', [[400, 'Normal'], [600, 'Médio'], [700, 'Negrito']])
      + inCol(e, 'wx.hd.c', 'Cor do texto do título', false) + inCol(e, 'wx.hd.fill', 'Cor de fundo do título', true)
      + inChk(e, 'wx.hd.line', 'Linha própria embaixo do título (borda diferente do todo)', !!h.line);
    if (h.line) s += inCol(e, 'wx.hd.lc', 'Cor da linha do título', false) + inNum(e, 'wx.hd.lw', 'Espessura da linha (mm)', 0.05, 0.1, 3);
    return s;
  }
  function secBg(e) {
    const bg = (e.wx && e.wx.bg) || { t: 'none' };
    let s = inSeg(e, 'wx.bg.t', 'Fundo do widget', [['none', 'Nenhum'], ['cor', 'Cor'], ['img', 'Imagem']]);
    if (bg.t === 'cor') s += inCol(e, 'wx.bg.c', 'Cor de fundo', false) + inRng(e, 'wx.bg.op', 'Opacidade do fundo', 0, 1, 0.05, 1);
    if (bg.t === 'img') {
      const imgs = S.lib.filter((x) => ['background', 'sticker', 'widget', 'border'].includes(x.kind) && x.src).slice(0, 18);
      s += `<div class="pfield"><span>Imagem de fundo</span><div class="wimgs">${imgs.map((it) => `<button type="button" class="wimg${bg.src === it.src ? ' on' : ''}" data-wxi="${esc(it.src)}" title="${esc(it.name || '')}"><img src="${esc(srcUrl(it.src))}" alt="" loading="lazy"></button>`).join('') || '<span class="hint">Envie uma imagem para usar aqui.</span>'}</div><span class="btn sm upl">Enviar PNG/JPEG<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" data-wxup aria-label="Enviar imagem de fundo"></span></div>`;
      s += inSeg(e, 'wx.bg.fit', 'Encaixe', [['cover', 'Preencher'], ['contain', 'Inteira'], ['stretch', 'Esticar']]) + inRng(e, 'wx.bg.op', 'Opacidade da imagem', 0, 1, 0.05, 1);
    }
    return s;
  }
  function secFrame(e) {
    const f = (e.wx && e.wx.fr) || { k: 'none' };
    let s = `<div class="fkgrid">${WX.FK.map(([k, n]) => `<button type="button" class="fkb${(f.k || 'none') === k ? ' on' : ''}" data-wxfk="${k}" title="${n}"><canvas data-fkc="${k}"></canvas><span>${n}</span></button>`).join('')}</div>`;
    if (f.k && f.k !== 'none') {
      s += `<div class="fgrid">${inNum(e, 'wx.fr.w', 'Espessura (mm)', 0.05, 0.05, 5)}${inNum(e, 'wx.fr.r', 'Cantos (mm)', 0.5, 0, 30)}</div>` + inCol(e, 'wx.fr.c', 'Cor da borda', false);
      if (['double', 'bold', 'notch', 'offset'].includes(f.k)) s += inNum(e, 'wx.fr.gap', 'Distância / sombra (mm)', 0.1, 0, 8);
      if (f.k === 'scallop') s += inNum(e, 'wx.fr.bump', 'Tamanho das bolhas (mm)', 0.5, 2, 12);
    }
    s += inNum(e, 'wx.pad', 'Margem interna (mm)', 0.5, 0, 20) + inChk(e, 'wx.sh', 'Sombra suave', !!(e.wx && e.wx.sh));
    return s;
  }
  function secStyle(e) {
    const id = e.wx && e.wx.st, st = id && WX.STY[id];
    return `<div class="wgcur"><span>Estilo · <b>${st ? esc(st.colName + ' · ' + st.n) : e.wx ? 'Personalizado' : 'Nenhum'}</b></span></div>
      <div class="row"><button type="button" class="btn sm pri" data-wxa="style">Escolher estilo…</button><button type="button" class="btn sm ghost" data-wxa="resetwx"${e.wx ? '' : ' disabled'}>Redefinir</button></div>
      <p class="hint">O estilo muda moldura, título e fundo juntos, e usa as cores da paleta do projeto. Depois você ajusta cada detalhe nas seções ao lado.</p>`;
  }
  function secSize(e) {
    return `<p class="hint">Largura, altura e giro estão no topo do painel.</p>` + inRng(e, 'opacity', 'Opacidade do widget', 0.05, 1, 0.05, 1);
  }
  function secLayers(e) {
    return inSeg(e, 'pin', 'Posição nas camadas', [['', 'Normal'], ['top', 'Sempre na frente'], ['back', 'Sempre atrás']])
      + `<div class="row"><button type="button" class="btn sm" data-wxa="front">Trazer para frente</button><button type="button" class="btn sm" data-wxa="back">Enviar para trás</button></div>`
      + inChk(e, 'noOver', 'Não deixar outros widgets por cima', isNoOver(e))
      + `<p class="hint">Com isto ligado, este widget não fica sobre outro widget (nem outro sobre ele). Textos, adesivos e imagens podem ficar por cima. “Sempre na frente/atrás” vale mesmo quando você muda a ordem na aba Camadas.</p>`
      + inChk(e, 'locked', 'Travar posição', !!e.locked);
  }
  function secCopy(e) {
    return `<div class="row"><button type="button" class="btn sm" data-wxa="copy">Copiar estilo</button><button type="button" class="btn sm" data-wxa="paste"${S.wxClip ? '' : ' disabled'}>Colar estilo</button></div>
      <div class="row"><button type="button" class="btn sm" data-wxa="applyType">Em todos deste tipo (página)</button><button type="button" class="btn sm" data-wxa="applyAll">Em todos deste tipo (projeto)</button></div>
      <p class="hint">“Copiar estilo” leva moldura, título, fundo, cores e fontes. Cole em qualquer outro widget.</p>`;
  }
  function secPage(p) {
    const f = p.frame || { k: 'none' }, st = f.st && WX.STY[f.st];
    RT = 'p';
    const s = `<div class="wgcur"><span>Estilo · <b>${st ? esc(st.colName + ' · ' + st.n) : p.frame ? 'Personalizada' : 'Nenhuma'}</b></span></div>
      <div class="row"><button type="button" class="btn sm pri" data-pfa="style">Escolher estilo…</button><button type="button" class="btn sm ghost" data-pfa="off"${p.frame ? '' : ' disabled'}>Remover</button></div>
      <div class="fkgrid">${WX.FK.filter(([k]) => !['offset', 'tb', 'b', 'l'].includes(k)).map(([k, n]) => `<button type="button" class="fkb${(f.k || 'none') === k ? ' on' : ''}" data-pffk="${k}" title="${n}"><canvas data-fkc="${k}"></canvas><span>${n}</span></button>`).join('')}</div>`
      + (p.frame && f.k !== 'none' ? `<div class="fgrid">${inNum(p, 'frame.w', 'Espessura (mm)', 0.05, 0.05, 5)}${inNum(p, 'frame.r', 'Cantos (mm)', 0.5, 0, 30)}</div>${inCol(p, 'frame.c', 'Cor da moldura', false)}<div class="fgrid">${inNum(p, 'frame.inset', 'Distância da borda (mm)', 0.5, 0, 40)}${['double', 'bold', 'notch'].includes(f.k) ? inNum(p, 'frame.gap', 'Espaço interno (mm)', 0.1, 0, 8) : ''}</div>${inRng(p, 'frame.op', 'Opacidade', 0.05, 1, 0.05, 1)}<button type="button" class="btn sm" data-pfa="all">Copiar para todas as páginas</button>` : '')
      + `<p class="hint">A moldura fica por cima do fundo e não mexe nas margens. Diferente da aba Bordas, aqui você usa os estilos e as cores da paleta.</p>`;
    RT = 'e'; return s;
  }

  /* ---------- montar no painel ---------- */
  function decorate(P) {
    const p = curPage(); if (!p) return;
    const els = selEls();
    if (els.length === 1) {
      const e = els[0], grpEl = $('#fldGrp', P); if (!grpEl) return;
      RT = 'e'; const W = WX.ACCEPT.has(e.type), mk = !!MKF[e.type];
      const wrap = document.createElement('div'); wrap.className = 'wacc' + (openAcc('cont') ? ' open' : ''); wrap.dataset.acc = 'cont';
      wrap.innerHTML = `<button class="wah" type="button" aria-expanded="${openAcc('cont')}"><i class="wtri"></i><b>Conteúdo</b><span class="wcol" title="Ocultar ou expandir">${UNF}</span></button><div class="wab"></div>`;
      grpEl.parentNode.insertBefore(wrap, grpEl); $('.wab', wrap).appendChild(grpEl);
      wrap.insertAdjacentHTML('beforebegin', W ? grp('INTERNO · TEXTOS, CORES E LINHAS') : '');
      let h = '';
      if (mk) h += acc('mark', 'Marcadores', 3, secMarkers(e));
      if (W) h += acc('hd', 'Título do widget', 1, secHeader(e)) + grp('EXTERNO · FUNDO E MOLDURA') + acc('bg', 'Fundo', 2, secBg(e)) + acc('fr', 'Borda e moldura', 4, secFrame(e)) + acc('sty', 'Estilo', 5, secStyle(e));
      h += grp('GERAL') + acc('size', 'Tamanho e opacidade', 6, secSize(e)) + acc('cp', 'Copiar e salvar', 8, secCopy(e));
      wrap.insertAdjacentHTML('afterend', h);
      paintIcons(P);
    } else if (els.length > 1) {
      P.insertAdjacentHTML('beforeend', acc('cp', 'Copiar e salvar', 8, `<div class="row"><button type="button" class="btn sm" data-wxa="paste"${S.wxClip ? '' : ' disabled'}>Colar estilo</button></div>`));
    } else if ($('#psz', P)) {
      const hint = [...P.children].reverse().find((x) => x.classList.contains('hint'));
      const html = acc('pframe', 'Moldura da página', 2, secPage(p));
      if (hint) hint.insertAdjacentHTML('beforebegin', html); else P.insertAdjacentHTML('beforeend', html);
      paintIcons(P);
    }
  }
  function paintIcons(P) {
    const st = styleOf();
    $$('canvas[data-mkc]', P).forEach((cv) => {
      const d = window.devicePixelRatio || 1; cv.width = 30 * d; cv.height = 30 * d; const c = cv.getContext('2d'); const k = 30 * d / 8; c.setTransform(k, 0, 0, k, 0, 0);
      if (cv.dataset.mkc === 'none') { c.beginPath(); c.arc(4, 4, 2.4, 0, 7); c.moveTo(2.4, 5.6); c.lineTo(5.6, 2.4); c.strokeStyle = '#9A90A8'; c.lineWidth = 0.4; c.stroke(); return; }
      WX.mark(c, cv.dataset.mkc, 4, 4, 5.4, { stroke: '#4A4E79', fill: st.pal.a, mode: ['dot'].includes(cv.dataset.mkc) ? 'none' : 'soft', sw: 0.42, num: 1, font: 'Nunito' });
    });
    $$('canvas[data-fkc]', P).forEach((cv) => {
      const d = window.devicePixelRatio || 1; cv.width = 44 * d; cv.height = 30 * d; const c = cv.getContext('2d'); const k = 44 * d / 22; c.setTransform(k, 0, 0, k, 0, 0);
      const f = { k: cv.dataset.fkc, w: 0.7, c: '@ink', r: 1.6, gap: 0.9, bump: 3.4 }; const off = f.k === 'offset' ? 1 : 0;
      if (off) { rr(c, 1 + 1, 1 + 1, 16, 11, 1); c.fillStyle = tok('@ink'); c.fill(); rr(c, 1, 1, 16, 11, 1); c.fillStyle = '#fff'; c.fill(); }
      WX.frame(c, 1, 1, f.k === 'offset' ? 16 : 20, f.k === 'offset' ? 11 : 13, f);
    });
  }

  /* ---------- editar valores ---------- */
  const DEF = {
    'wx': () => ({}), 'wx.fr': () => ({ k: 'solid', w: 0.4, c: '@ink', r: 0, gap: 1 }), 'wx.bg': () => ({ t: 'cor', c: '@soft', op: 1 }),
    'wx.hd': (o) => ({ on: true, h: 7, fill: '@soft', c: '@ink', font: '@title', size: 8, weight: 700, align: 'center', ls: 0.06, line: false, lc: '@ink', lw: 0.3, text: WX.defTitle(o) }),
    'frame': () => ({ k: 'solid', w: 0.5, c: '@ink', r: 0, gap: 1, inset: 5 })
  };
  const CLAMP = { 'opacity': [0.05, 1], 'wx.bg.op': [0, 1], 'frame.op': [0.05, 1], 'wx.fr.w': [0.05, 5], 'frame.w': [0.05, 5], 'wx.fr.r': [0, 30], 'frame.r': [0, 40], 'wx.pad': [0, 20], 'wx.hd.h': [3, 30], 'wx.hd.size': [4, 40], 'msize': [0.5, 2], 'wx.fr.gap': [0, 8], 'frame.gap': [0, 8], 'wx.hd.lw': [0.1, 3], 'frame.inset': [0, 40] };
  function setPath(o, path, v) {
    const ks = path.split('.');
    let cur = o, pre = '';
    for (let i = 0; i < ks.length - 1; i++) {
      pre = pre ? pre + '.' + ks[i] : ks[i];
      if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = (DEF[pre] ? DEF[pre](o) : {});
      cur = cur[ks[i]];
    }
    if (CLAMP[path] && typeof v === 'number') v = cl(v, CLAMP[path][0], CLAMP[path][1]);
    const last = ks[ks.length - 1];
    if (v === '' || v === undefined) delete cur[last]; else cur[last] = v;
  }
  const rootOf = (el) => (el.dataset.r === 'p' ? curPage() : selEls()[0]);
  const parseV = (el) => { const t = el.dataset.t; if (t === 'num') return parseFloat(el.value) || 0; if (t === 'chk') return el.checked; return el.value; };
  function applyEl(el, commit) {
    const p = curPage(), o = rootOf(el); if (!p || !o) return;
    wxB = wxB || snapOf([p.id]); let v = parseV(el);
    if (el.dataset.wx === 'wx.hd.weight') v = +v;
    setPath(o, el.dataset.wx, v);
    if (el.type === 'range') { const sp = el.parentNode.querySelector('span'); if (sp) sp.textContent = el.dataset.wx === 'msize' ? '×' + (+v).toFixed(2) : Math.round(v * 100) + '%'; }
    scheduleRedraw();
    if (commit) { pushHist(wxB, snapOf([p.id])); wxB = null; thumbRefresh(p.id); if (el.type === 'checkbox' || el.tagName === 'SELECT') renderProps(); }
  }
  function commitSet(path, v, rootKind, extra) {
    const p = curPage(), o = rootKind === 'p' ? p : selEls()[0]; if (!p || !o) return;
    change([p.id], () => { setPath(o, path, v); if (extra) extra(o); });
    redraw(); renderProps(); thumbRefresh(p.id);
  }

  /* ---------- copiar estilo ---------- */
  const styleKeys = (t) => (FIELDS[t] || []).filter((f) => ['color', 'colorN', 'font'].includes(f[2]) || ['size', 'weight'].includes(f[0])).map((f) => f[0]).concat(MKF[t] ? [MKF[t], 'mfill', 'mfc', 'msize'] : []);
  const grab = (e) => ({ type: e.type, wx: clone(e.wx || null), opacity: e.opacity, pin: e.pin, noOver: e.noOver, keys: Object.fromEntries(styleKeys(e.type).filter((k) => e[k] !== undefined).map((k) => [k, clone(e[k])])) });
  function put(e, g) {
    if (g.wx) { const keep = e.wx && e.wx.hd && e.wx.hd.text; e.wx = clone(g.wx); if (e.wx.hd && keep) e.wx.hd.text = keep; } else delete e.wx;
    e.opacity = g.opacity ?? 1; if (g.pin) e.pin = g.pin; else delete e.pin; if (g.noOver !== undefined) e.noOver = g.noOver;
    const mine = new Set(styleKeys(e.type));
    Object.entries(g.keys).forEach(([k, v]) => { if (e.type === g.type || (mine.has(k) && !MKF[e.type])) e[k] = clone(v); });
  }
  function saveModal() {
    const p = curPage(), els = selEls(); if (!els.length) return;
    const ids = gx(p, els.map((e) => e.id)), list = p.els.filter((e) => ids.includes(e.id));
    modal(`<h2>Salvar como widget</h2><label class="f">Nome<input type="text" id="swN" value="${esc((list.length === 1 ? (TYPE_NAME[list[0].type] || 'Meu widget') : 'Meu widget') + ' personalizado')}"></label><p class="hint">Fica na aba “Salvos” da biblioteca, com tudo o que você personalizou, e vale para qualquer projeto.</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="swGo">Salvar</button></div>`, (b, close) => {
      $('#swGo', b).onclick = async () => {
        const name = $('#swN', b).value.trim() || 'Meu widget', bx = WX.boxOf(list);
        const copy = clone(list).map((e) => Object.assign(e, { x: r1(e.x - bx.x), y: r1(e.y - bx.y), locked: false, link: null }));
        const it = { id: uid('l'), kind: 'wgt', name, w: r1(bx.w), h: r1(bx.h), els: copy, createdAt: Date.now() };
        try { await Store.saveLib(it); S.lib.push(it); toast('Widget salvo na aba “Salvos”. 💜'); close(); if (S.tab === 'widgets') renderPanel(); }
        catch (err) { console.error(err); toast('Não consegui salvar este widget.'); }
      };
    });
  }

  /* ---------- ações ---------- */
  function action(a) {
    const p = curPage(), e = selEls()[0];
    if (a === 'style') { if (e) { S.wxView = { t: 'el', id: e.id, col: null }; renderProps(); } return; }
    if (a === 'resetwx') { if (!e) return; change([p.id], () => { delete e.wx; }); redraw(); renderProps(); thumbRefresh(p.id); return; }
    if (a === 'front' || a === 'back') { orderSel(a); return; }
    if (a === 'copy') { if (e) { S.wxClip = grab(e); toast('Estilo copiado. Selecione outro widget e use “Colar estilo”.'); renderProps(); } return; }
    if (a === 'paste') {
      if (!S.wxClip) return; const els = selEls(); if (!els.length) return;
      change([p.id], () => els.forEach((x) => put(x, S.wxClip))); redraw(); renderProps(); thumbRefresh(p.id); toast('Estilo colado.'); return;
    }
    if (a === 'applyType' || a === 'applyAll') {
      if (!e) return; const g = grab(e), ids = a === 'applyAll' ? S.order.slice() : [p.id]; let n = 0;
      change(ids, () => ids.forEach((id) => S.pages[id].els.forEach((x) => { if (x.type === e.type && x !== e) { put(x, g); n++; } })));
      redraw(); refreshThumbs(); toast(n ? `Estilo aplicado em ${n} widget${n > 1 ? 's' : ''}.` : 'Não há outros widgets deste tipo.'); return;
    }
    if (a === 'save') saveModal();
  }

  /* ---------- eventos ---------- */
  const P0 = $('#props');
  P0.addEventListener('input', (ev) => { const el = ev.target; if (el.dataset && el.dataset.wx !== undefined) applyEl(el, false); });
  P0.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset && el.dataset.wx !== undefined) { applyEl(el, true); return; }
    if (el.dataset && el.dataset.wxup !== undefined) { uploadFiles([...el.files], 'background'); }
  });
  P0.addEventListener('click', (ev) => {
    const h = ev.target.closest('.wah');
    if (h) { const w = h.parentNode, id = w.dataset.acc; Pref.acc = Pref.acc || { cont: true }; Pref.acc[id] = !w.classList.contains('open'); w.classList.toggle('open', Pref.acc[id]); h.setAttribute('aria-expanded', Pref.acc[id]); savePref(); return; }
    const b = ev.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset;
    if (d.wxa) { action(d.wxa); return; }
    if (d.pfa) {
      const p = curPage();
      if (d.pfa === 'style') { S.wxView = { t: 'page', col: null }; renderProps(); }
      if (d.pfa === 'off') { change([p.id], () => { delete p.frame; }); redraw(); renderProps(); thumbRefresh(p.id); }
      if (d.pfa === 'all') { const f = clone(p.frame), ids = S.order.slice(); change(ids, () => ids.forEach((id) => { const q = S.pages[id]; q.frame = Object.assign(clone(f), { inset: q === p ? f.inset : WX.pageInset(q) * (f.inset / (WX.pageInset(p) || 1)) }); })); redraw(); refreshThumbs(); toast('Moldura copiada para todas as páginas.'); }
      return;
    }
    if (d.pffk) { commitSet('frame.k', d.pffk, 'p', (o) => { if (d.pffk === 'none') delete o.frame; else { o.frame.st = ''; delete o.frame.st; } }); return; }
    if (d.wxs !== undefined) { let v = d.v; if (d.wxs === 'wx.hd.weight') v = +v; commitSet(d.wxs, v, d.r, (o) => { if (d.wxs === 'wx.bg.t' && v === 'cor' && !o.wx.bg.c) o.wx.bg.c = '@soft'; }); return; }
    if (d.wxc) { commitSet(d.wxc, d.v, d.r); return; }
    if (d.wxmk) { const e = selEls()[0]; if (e) commitSet(MKF[e.type], d.wxmk, 'e'); return; }
    if (d.wxfk) { commitSet('wx.fr.k', d.wxfk, 'e', (o) => { if (o.wx.pad == null) o.wx.pad = 1.8; if (d.wxfk !== 'none' && !o.wx.fr.w) o.wx.fr.w = 0.4; delete o.wx.st; }); return; }
    if (d.wxi) { const e = selEls()[0], p = curPage(); if (!e) return; change([p.id], () => { e.wx = e.wx || {}; e.wx.bg = { t: 'img', src: d.wxi, fit: 'cover', op: 1 }; delete e.wx.st; }); redraw(); renderProps(); thumbRefresh(p.id); }
  });

  document.addEventListener('click', (ev) => { const ct = ev.target.closest('.cct'); if (ct) ct.parentNode.classList.toggle('open'); });

  /* ---------- ligar na renderProps ---------- */
  const rp0 = window.renderProps;
  window.renderProps = function () {
    const P = $('#props');
    if (S.wxView && P) {
      const v = S.wxView, e = selEls()[0];
      if ((v.t === 'el' && e && e.id === v.id) || (v.t === 'page' && !selEls().length)) { WX.galleryInto(P, v); P.scrollTop = 0; return; }
      S.wxView = null;
    }
    const r = rp0.apply(this, arguments);
    try { if (P && S.meta && !P.querySelector('.wacc')) decorate(P); } catch (err) { console.warn(err); }
    return r;
  };

  /* ---------- sobreposição, posição livre e fixar camadas ---------- */
  function conflictAny(p, els, dx, dy) {
    const ids = new Set(els.map((e) => e.id));
    for (const e of els) { const r = bbox(Object.assign({}, e, { x: e.x + dx, y: e.y + dy })); for (const o of p.els) { if (ids.has(o.id) || o.hidden) continue; if (blocks(e, o) && inter(r, bbox(o))) return true; } }
    return false;
  }
  function free(p, els) {
    if (!els.some(isW)) return true;
    if (!conflictAny(p, els, 0, 0)) return true;
    const b = WX.boxOf(els), cx = b.x + b.w / 2, cy = b.y + b.h / 2, c = [];
    for (let y = 0; y <= p.h - b.h + 0.01; y += 4) for (let x = 0; x <= p.w - b.w + 0.01; x += 4) c.push([x - b.x, y - b.y, Math.hypot(x + b.w / 2 - cx, y + b.h / 2 - cy)]);
    c.sort((a, z) => a[2] - z[2]);
    for (const [dx, dy] of c) if (!conflictAny(p, els, dx, dy)) { els.forEach((e) => { e.x = r1(e.x + dx); e.y = r1(e.y + dy); }); return true; }
    toast('Não coube sem ficar sobre outro widget. Libere espaço ou desmarque “Não deixar outros widgets por cima”.');
    return false;
  }
  function guard(d) {
    const p = d.p; let ms;
    if (d.mode === 'move' || d.mode === 'gres') ms = d.ms; else if (d.mode === 'res' || d.mode === 'rot') ms = [d.e]; else return;
    const one = d.mode === 'res' || d.mode === 'rot', get0 = (e) => (one ? d.o : d.o[e.id]), moved = new Set(ms.map((x) => x.id)); let bad = false;
    for (const e of ms) {
      const before = Object.assign({}, e, get0(e));
      for (const o of p.els) { if (moved.has(o.id) || o.hidden || !blocks(e, o)) continue; if (inter(bbox(e), bbox(o)) && !inter(bbox(before), bbox(o))) bad = true; }
    }
    if (bad) {
      ms.forEach((e) => { const o0 = get0(e); Object.keys(o0).forEach((k) => { if (o0[k] !== undefined) e[k] = o0[k]; }); });
      toast('Esse widget não pode ficar por cima de outro. Para permitir, desmarque “Não deixar outros widgets por cima” em Camadas e sobreposição.');
    }
  }
  function normPins() {
    S.order.forEach((id) => {
      const pg = S.pages[id]; if (!pg || !pg.els.some((e) => e.pin)) return;
      const n = [...pg.els.filter((e) => e.pin === 'back'), ...pg.els.filter((e) => !e.pin), ...pg.els.filter((e) => e.pin === 'top')];
      if (n.some((e, i) => e !== pg.els[i])) pg.els.splice(0, pg.els.length, ...n);
    });
  }
  const rd0 = window.redraw; window.redraw = function () { try { normPins(); } catch (e) { /* segue */ } return rd0.apply(this, arguments); };
  const add0 = window.addEl;
  window.addEl = function (e, keep) {
    if (!keep) { const p = curPage(); e.x = r1((p.w - e.w) / 2); e.y = r1((p.h - e.h) / 2); free(p, [e]); keep = true; }
    return add0.call(this, e, keep);
  };
  const dup0 = window.dupSel;
  window.dupSel = function () { const r = dup0.apply(this, arguments); const p = curPage(), els = selEls(); if (els.length && free(p, els)) { redraw(); renderProps(); } return r; };

  const setLay = (k, v) => { const p = curPage(), ws = selEls().filter(isW); if (!p || !ws.length) return; change([p.id], () => ws.forEach((e) => { if (k === 'pin') { if (v) e.pin = v; else delete e.pin; } else e[k] = v; })); redraw(); renderProps(); thumbRefresh(p.id); };
  Object.assign(window.WX, { free, guard, isNoOver, isW, decorate, setLay });
})();
