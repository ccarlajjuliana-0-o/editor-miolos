/* ModuLab — laboratório de componentes do Estúdio.
   Cria, edita e exclui widgets, bordas, temas, estilos, adesivos e coleções que passam a valer dentro do editor.
   Cada tipo tem o seu comportamento: onde é guardado, como é mostrado e como é aplicado.
   IA opcional (chave guardada só neste aparelho) + sugestões sem IA (cores de uma imagem ou palavras-chave).
   A IA só PROPÕE: nada entra no editor sem você aceitar e poder mudar. */
(function () {
  'use strict';
  const nz = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const KIND = {
    wgt: { n: 'Widget', pl: 'Widgets', ic: '▦', where: 'Widgets → Salvos' },
    bdr: { n: 'Borda', pl: 'Bordas', ic: '▢', where: 'Bordas → Minhas bordas' },
    tema: { n: 'Tema', pl: 'Temas', ic: '◐', where: 'Modelos → Temas' },
    wsty: { n: 'Estilo', pl: 'Estilos', ic: '✦', where: 'Estilo dos widgets → Meus estilos' },
    stk: { f: 'o', n: 'Adesivo', pl: 'Adesivos', ic: '♡', where: 'Adesivos → Do ModuLab' },
    colecao: { n: 'Coleção', pl: 'Coleções', ic: '❀', where: 'Modelos → Coleções' },
    tipos: { f: 'a', n: 'Configuração de texto', pl: 'Textos', ic: 'Aa', where: 'Texto → Fontes → Minhas configurações' },
    outro: { n: 'Outro', pl: 'Outros', ic: '＋', where: 'a definir' },
  };
  const ORDER = ['wgt', 'bdr', 'tema', 'wsty', 'stk', 'tipos', 'colecao', 'outro'];
  const LISTK = ['wgt', 'bdr', 'tema', 'wsty', 'stk', 'sticker', 'tipos', 'colecao', 'outro'];
  const mine = (k) => S.lib.filter((x) => x.kind === k);
  const TOK = [['@a', 'Cor A do tema'], ['@b', 'Cor B do tema'], ['@ink', 'Tinta'], ['@soft', 'Suave'], ['@soft2', 'Suave 2'], ['@line', 'Linha'], ['@text', 'Texto'], ['none', 'Sem cor']];
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
  const hex = (v, d) => (isHex(v) ? v : d);
  const num = (v, a, b, d) => { v = +v; return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const setPath = (o, path, v) => { const ks = path.split('.'); let c = o; ks.slice(0, -1).forEach((k) => { if (c[k] == null || typeof c[k] !== 'object') c[k] = {}; c = c[k]; }); c[ks[ks.length - 1]] = v; };
  const getPath = (o, path) => path.split('.').reduce((c, k) => (c == null ? c : c[k]), o);

  /* ---------- contexto de pré-visualização: usa o tema escolhido sem mexer no projeto aberto ---------- */
  function withCtx(style, fn) {
    const m = S.meta, pg = S.pages, od = S.order, cu = S.cur, sl = S.sel;
    S.meta = { style, weekStart: 0, kind: 'project' }; S.pages = { _ml: { id: '_ml', w: 148, h: 210, bg: '#fff', els: [] } }; S.order = ['_ml']; S.cur = 0; S.sel = [];
    try { return fn(); } finally { S.meta = m; S.pages = pg; S.order = od; S.cur = cu; S.sel = sl; }
  }
  const PVPAL = { pal: 'lavanda', pair: 'assinatura' };
  const styleFor = (st) => Object.assign({}, PVPAL, st || {});

  /* ---------- registra o que é do ModuLab nos sistemas do editor ---------- */
  function sync() {
    try {
      Object.keys(PALS).filter((k) => k[0] === 'u' && k[1] === '_').forEach((k) => delete PALS[k]);
      mine('tema').forEach((t) => { if (t.pal) PALS['u_' + t.id] = Object.assign({ nome: t.name }, t.pal); });
      if (window.WX && WX.COLS) {
        const i = WX.COLS.findIndex((c) => c.id === 'meus'); if (i >= 0) WX.COLS.splice(i, 1);
        Object.keys(WX.STY).filter((k) => k.indexOf('meus/') === 0).forEach((k) => delete WX.STY[k]);
        const sts = mine('wsty').filter((x) => x.spec);
        if (sts.length) {
          WX.COLS.unshift({ id: 'meus', n: 'Meus estilos', s: sts.map((x) => [x.id, x.name, x.spec]) });
          sts.forEach((x) => { WX.STY['meus/' + x.id] = { id: 'meus/' + x.id, col: 'meus', colName: 'Meus estilos', n: x.name, spec: x.spec }; });
        }
      }
    } catch (e) { console.warn('ModuLab sync', e); }
  }

  /* ---------- cores a partir de uma imagem (sem IA) e de palavras ---------- */
  const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (h1, h2, t) => { const a = rgb(h1), b = rgb(h2); return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); };
  const hsl = (h) => { let [r, g, b] = rgb(h).map((v) => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let s = 0, hh = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; } return [hh, s, l]; };
  function palFrom(cols) { // monta uma paleta completa a partir de 2+ cores
    const a = cols[0], b = cols[1] || mix(cols[0], '#92A8D1', 0.5);
    return { a, b, ink: mix(b, '#1E1726', 0.62), soft: mix(a, '#FFFFFF', 0.86), soft2: mix(b, '#FFFFFF', 0.88), line: mix(a, '#FFFFFF', 0.68), text: '#3E3550' };
  }
  async function imgData(file, max) {
    return new Promise((res) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(im.naturalWidth * k)); cv.height = Math.max(1, Math.round(im.naturalHeight * k)); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res({ url: cv.toDataURL('image/jpeg', 0.85), cv }); }; im.onerror = () => res(null); im.src = fr.result; }; fr.onerror = () => res(null); fr.readAsDataURL(file); });
  }
  function dominant(cv, n) {
    const w = 40, h = Math.max(1, Math.round(40 * cv.height / cv.width)), t = document.createElement('canvas'); t.width = w; t.height = h; const c = t.getContext('2d'); c.drawImage(cv, 0, 0, w, h);
    const d = c.getImageData(0, 0, w, h).data, bins = new Map();
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 100) continue; const k = (d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5); const o = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 }; o.n++; o.r += d[i]; o.g += d[i + 1]; o.b += d[i + 2]; bins.set(k, o); }
    const L = [...bins.values()].map((o) => { const h2 = toHex(o.r / o.n, o.g / o.n, o.b / o.n), [, s, l] = hsl(h2); return { h: h2, w: o.n * (0.35 + s) * (l > 0.93 || l < 0.08 ? 0.15 : 1) }; }).sort((a, b) => b.w - a.w);
    const out = []; for (const o of L) { if (out.every((x) => { const A = rgb(x), B = rgb(o.h); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) > 70; })) out.push(o.h); if (out.length >= n) break; }
    return out;
  }
  const WORDS = [['natal', ['#B5403A', '#4E7A5B']], ['pascoa', ['#E7A6BE', '#98B1C2']], ['verao', ['#F2A65A', '#4FB0C6']], ['outono', ['#C27A3A', '#8A5A44']], ['inverno', ['#6E8AB5', '#B8C7DD']], ['primavera', ['#E7A6BE', '#98C48A']], ['halloween', ['#E0782B', '#5B3A8C']], ['namorados', ['#D9667E', '#F1CDD9']], ['amor', ['#D9667E', '#C398C8']], ['bebe', ['#9EC5E8', '#F4C7D6']], ['floresta', ['#4F7F5C', '#98B1C2']], ['oceano', ['#35609A', '#6FC3C9']], ['flor', ['#E7A6BE', '#C398C8']], ['cafe', ['#8A5A44', '#D8A776']], ['lavanda', ['#C398C8', '#92A8D1']], ['dourado', ['#D8A776', '#9168A0']]];
  function colorsFromText(t) { const s = nz(t); for (const [w, c] of WORDS) if (s.includes(w)) return c.slice(); return null; }

  /* ---------- IA (opcional) ---------- */
  const IAK = 'cnu-estudio-ia';
  const parseJson = (txt) => { const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); if (a < 0 || b < a) throw new Error('A IA não devolveu um formato que eu entenda.'); return JSON.parse(txt.slice(a, b + 1)); };
  const IA = {
    cfg() { try { return Object.assign({ mode: 'direct', key: '', model: 'claude-sonnet-5-5' }, JSON.parse(localStorage.getItem(IAK) || '{}')); } catch (e) { return { mode: 'direct', key: '', model: 'claude-sonnet-5-5' }; } },
    save(c) { try { localStorage.setItem(IAK, JSON.stringify(c)); } catch (e) { /* sem armazenamento */ } },
    ok() { const c = this.cfg(); return c.mode === 'proxy' ? !!(window.Cloud && Cloud.sb && Cloud.user) : !!c.key; },
    label() { const c = this.cfg(); return this.ok() ? (c.mode === 'proxy' ? 'IA ligada (pela sua nuvem)' : 'IA ligada (chave neste aparelho)') : (c.mode === 'proxy' ? 'IA pela nuvem: entre na nuvem para usar' : 'IA desligada'); },
    async ask(system, prompt, imageUrl) {
      const c = this.cfg(); let txt;
      if (c.mode === 'proxy') {
        if (!(window.Cloud && Cloud.sb && Cloud.user)) throw new Error('Entre na nuvem (menu Nuvem e backup) para usar a IA pela nuvem.');
        const { data, error } = await Cloud.sb.functions.invoke('ia-modulab', { body: { system, prompt, image: imageUrl ? imageUrl.split(',')[1] : null, model: c.model } });
        if (error) throw new Error('A função de IA da nuvem não respondeu. Confira se ela foi publicada (veja Configurar IA).');
        if (data && data.error) throw new Error(data.error); txt = data && data.text;
      } else {
        if (!c.key) throw new Error('A IA está desligada. Use “Ligar IA” para configurar.');
        const content = []; if (imageUrl) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageUrl.split(',')[1] } });
        content.push({ type: 'text', text: prompt });
        let r; try { r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: c.model, max_tokens: 3000, system, messages: [{ role: 'user', content }] }) }); } catch (e) { throw new Error('Não consegui falar com a IA (sem internet ou bloqueio do navegador).'); }
        if (!r.ok) { let m = ''; try { m = (await r.json()).error.message; } catch (e) { /* sem corpo */ } throw new Error(m || 'A IA respondeu com erro ' + r.status + '.'); }
        const j = await r.json(); txt = (j.content || []).map((x) => x.text || '').join('');
      }
      return parseJson(txt || '');
    },
  };
  const SYS = 'Você ajuda a criar componentes visuais delicados para um editor de planners e cadernos (marca "Craft Notes Unique": lavanda, azul pervinca, rosa sakura, dourado mel, sálvia; formas suaves, cantos arredondados, nada de cores neon). Responda SOMENTE com JSON válido, sem texto fora do JSON. Cores sempre em #RRGGBB, exceto onde o esquema aceitar tokens.';
  const SCHEMA = {
    wsty: '{"propostas":[{"nome":"...","fr":{"k":"none|solid|dash|dot|double|bold|corners|notch|scallop|offset|tb|b|l","w":0.1-3,"c":"@a|@b|@ink|@soft|@line|#RRGGBB","r":0-8,"gap":0-3},"bg":{"t":"none|cor","c":"@soft|#RRGGBB","op":0-1},"hd":null ou {"fill":"@soft|@line|none|#RRGGBB","c":"@ink|#RRGGBB","font":"@title|@script|@body","size":5-16,"weight":400|600|700,"align":"left|center|right","h":5-12,"line":true|false},"pad":0-5,"sh":0|1}] (3 propostas)}',
    bdr: '{"propostas":[{"nome":"...","preset":"moldura|embaixo|topo|topo-baixo|laterais|externa|interna","color":"#RRGGBB","style":"solid|dash|dot|double","width":0.3-12,"inset":0-30,"radius":0-20,"opacity":0.3-1}] (3 propostas)}',
    tema: '{"propostas":[{"nome":"...","pal":{"a":"#RRGGBB","b":"#RRGGBB","ink":"#RRGGBB escuro","soft":"#RRGGBB bem claro","soft2":"#RRGGBB bem claro","line":"#RRGGBB claro","text":"#RRGGBB escuro"},"pair":"assinatura|manuscrita|classica|moderna"}] (3 propostas)}',
    stk: '{"propostas":[{"nome":"...","formas":["coracao|brilho|estrela|flor|folha|gota|livros|faixa|etiqueta|balao|circulo|hexagono|nuvem|seta|carimbo", ... até 8],"cores":["#RRGGBB","#RRGGBB","#RRGGBB"],"traco":"#RRGGBB"}] (3 propostas)}',
    wgt: '{"propostas":[{"nome":"...","base":"chave de widget da lista","titulo":"..."}] (3 propostas)}',
    colecao: '{"propostas":[{"nome":"...","tema":{"pal":{...igual ao tema},"pair":"..."},"estilo":{igual a uma proposta de estilo},"borda":{igual a uma proposta de borda},"adesivos":{"formas":[...],"cores":[...],"traco":"#RRGGBB"}}] (1 proposta completa)}',
  };

  /* ---------- sanitizadores: o que vem da IA ou das sugestões vira dados seguros ---------- */
  const okTok = (v, d) => (v === 'none' || (typeof v === 'string' && /^@(a|b|ink|soft|soft2|line|text)$/.test(v)) || isHex(v) ? v : d);
  const FKS = () => (window.WX ? WX.FK.map((x) => x[0]) : ['solid']);
  function cleanSty(s) {
    if (!s) return null; const f = s.fr || {}, bg = s.bg || {}, h = s.hd;
    const spec = { fr: { k: FKS().includes(f.k) ? f.k : 'solid', w: num(f.w, 0.1, 3, 0.35), c: okTok(f.c, '@ink'), r: num(f.r, 0, 8, 2), gap: num(f.gap, 0, 3, 1) }, bg: bg.t === 'cor' ? { t: 'cor', c: okTok(bg.c, '@soft'), op: num(bg.op, 0, 1, 1) } : { t: 'none' }, pad: num(s.pad, 0, 5, 2), sh: s.sh ? 1 : 0 };
    spec.hd = h ? { on: true, h: num(h.h, 5, 12, 7), fill: okTok(h.fill, '@soft'), c: okTok(h.c, '@ink'), font: ['@title', '@script', '@body'].includes(h.font) ? h.font : '@title', size: num(h.size, 5, 16, 8), weight: [400, 600, 700].includes(+h.weight) ? +h.weight : 700, align: ['left', 'center', 'right'].includes(h.align) ? h.align : 'center', ls: 0.05, line: !!h.line, lc: okTok(h.c, '@ink'), lw: 0.3 } : null;
    return { name: String(s.nome || s.name || 'Meu estilo').slice(0, 40), spec };
  }
  const PRESETS = () => (typeof BORDER_PRESETS !== 'undefined' ? BORDER_PRESETS.map((x) => x[0]) : ['moldura']);
  function cleanBdr(s) {
    if (!s) return null;
    return { name: String(s.nome || s.name || 'Minha borda').slice(0, 40), border: { preset: PRESETS().includes(s.preset) ? s.preset : 'moldura', kind: 'cor', color: hex(s.color, '#C398C8'), width: num(s.width, 0.3, 12, 2), inset: num(s.inset, 0, 30, 6), style: ['solid', 'dash', 'dot', 'double'].includes(s.style) ? s.style : 'solid', radius: num(s.radius, 0, 20, 3), opacity: num(s.opacity, 0.3, 1, 1), src: null } };
  }
  function cleanTema(s) {
    if (!s || !s.pal) return null; const p = s.pal, d = PALS.lavanda;
    return { name: String(s.nome || s.name || 'Meu tema').slice(0, 40), pal: { a: hex(p.a, d.a), b: hex(p.b, d.b), ink: hex(p.ink, d.ink), soft: hex(p.soft, d.soft), soft2: hex(p.soft2, d.soft2), line: hex(p.line, d.line), text: hex(p.text, d.text) }, pair: PAIRS[s.pair] ? s.pair : 'assinatura' };
  }
  function cleanStk(s) {
    if (!s) return null; const ok = Object.keys(SHAPES);
    const shapes = (s.formas || s.shapes || []).filter((k) => ok.includes(k)).slice(0, 8);
    return { name: String(s.nome || s.name || 'Meus adesivos').slice(0, 40), shapes: shapes.length ? shapes : ['coracao'], cols: (s.cores || s.cols || []).filter(isHex).slice(0, 3), stroke: hex(s.traco || s.stroke, '#4A4E79') };
  }
  function cleanWgt(s) {
    if (!s) return null; const it = WX.CAT.find((x) => x.k === s.base); if (!it) return null;
    return { name: String(s.nome || s.name || it.n).slice(0, 40), base: it.k, titulo: String(s.titulo || '').slice(0, 40) };
  }

  /* ---------- sugestões locais (sem IA) ---------- */
  async function localSuggest(kind, text, img) {
    let cols = null;
    if (img) cols = dominant(img.cv, 4);
    if ((!cols || cols.length < 2) && text) cols = colorsFromText(text);
    if (!cols || cols.length < 2) return { err: img ? 'Não achei cores bem definidas nessa imagem.' : 'Sem IA, eu entendo imagens (pelas cores) e palavras como natal, páscoa, verão, outono, inverno, primavera, flor, oceano, amor… Tente uma delas ou envie uma imagem.' };
    const v = [[cols[0], cols[1]], [cols[1], cols[0]], [cols[2] || cols[0], cols[1]]];
    const nome = (text || 'Do meu desenho').slice(0, 24);
    const pals = v.map(([a, b]) => palFrom([a, b]));
    if (kind === 'tema') return { list: pals.map((p, i) => cleanTema({ nome: nome + ' ' + (i + 1), pal: p, pair: ['assinatura', 'manuscrita', 'classica'][i] })) };
    if (kind === 'bdr') return { list: v.map(([a], i) => cleanBdr({ nome: nome + ' ' + (i + 1), preset: ['moldura', 'topo-baixo', 'laterais'][i], color: a, style: ['solid', 'dash', 'double'][i], width: [1.6, 1.2, 1.4][i], inset: 6, radius: [4, 0, 0][i] })) };
    if (kind === 'wsty') return { list: [
      cleanSty({ nome: nome + ' · suave', fr: { k: 'solid', w: 0.4, c: pals[0].a, r: 3 }, bg: { t: 'cor', c: pals[0].soft, op: 1 }, hd: { fill: pals[0].line, c: pals[0].ink, size: 8 }, pad: 2 }),
      cleanSty({ nome: nome + ' · fino', fr: { k: 'solid', w: 0.25, c: pals[1].a, r: 2 }, bg: { t: 'none' }, hd: { fill: 'none', c: pals[1].a, font: '@script', size: 13, weight: 400, line: true }, pad: 2 }),
      cleanSty({ nome: nome + ' · cantos', fr: { k: 'corners', w: 0.6, c: pals[2].a, r: 0 }, bg: { t: 'none' }, hd: { fill: pals[2].soft, c: pals[2].ink }, pad: 2.5 })] };
    if (kind === 'stk') return { list: v.map(([a, b], i) => cleanStk({ nome: nome + ' ' + (i + 1), formas: [['coracao', 'brilho', 'flor', 'estrela'], ['gota', 'folha', 'circulo', 'etiqueta'], ['carimbo', 'faixa', 'balao', 'hexagono']][i], cores: [a, b, mix(a, '#FFFFFF', 0.6)], traco: mix(b, '#1E1726', 0.6) })) };
    if (kind === 'colecao') { const P = pals[0]; return { list: [{ tema: cleanTema({ nome, pal: P, pair: 'assinatura' }), wsty: cleanSty({ nome: nome + ' · estilo', fr: { k: 'solid', w: 0.4, c: P.a, r: 3 }, bg: { t: 'cor', c: P.soft, op: 1 }, hd: { fill: P.line, c: P.ink }, pad: 2 }), bdr: cleanBdr({ nome: nome + ' · borda', preset: 'moldura', color: P.a, width: 1.6, radius: 4 }), stk: cleanStk({ nome: nome + ' · adesivos', formas: ['coracao', 'brilho', 'flor', 'estrela', 'gota', 'folha'], cores: [cols[0], cols[1], mix(cols[0], '#FFFFFF', 0.6)], traco: P.ink }) }] }; }
    return { err: 'Para este tipo, escolha o modelo-base na lista. A IA pode sugerir por texto.' };
  }
  async function aiSuggest(kind, text, img) {
    const extra = kind === 'wgt' ? '\nChaves de widget disponíveis: ' + WX.CAT.map((x) => x.k + '=' + x.n).join(', ') : '';
    const j = await IA.ask(SYS, `Tipo de criação: ${kind}.\nPedido: ${text || '(veja a imagem anexa)'}\nUse as cores e o clima ${img ? 'da imagem anexa' : 'do pedido'}.\nFormato:\n${SCHEMA[kind]}${extra}`, img && img.url);
    const L = j.propostas || j.proposals || [j];
    if (kind === 'colecao') return { list: L.slice(0, 1).map((p) => ({ tema: cleanTema(Object.assign({ nome: p.nome }, p.tema)), wsty: cleanSty(p.estilo), bdr: cleanBdr(p.borda), stk: cleanStk(Object.assign({ nome: (p.nome || 'Coleção') + ' · adesivos' }, p.adesivos)) })) };
    const fn = { wsty: cleanSty, bdr: cleanBdr, tema: cleanTema, stk: cleanStk, wgt: cleanWgt }[kind];
    const list = L.map(fn).filter(Boolean).slice(0, 3); if (!list.length) throw new Error('A IA não trouxe propostas que eu possa usar.');
    return { list };
  }

  /* ---------- construção dos elementos (widgets, adesivos) ---------- */
  function shapeEl(k, f1, f2, stroke) {
    const two = k === 'flor' || k === 'livros';
    const w = k === 'faixa' ? 34 : k === 'etiqueta' ? 30 : k === 'balao' ? 30 : k === 'livros' ? 30 : k === 'nuvem' ? 30 : k === 'seta' ? 28 : 18;
    const h = k === 'faixa' ? 14 : k === 'etiqueta' ? 14 : k === 'balao' ? 24 : k === 'livros' ? 22 : k === 'nuvem' ? 20 : k === 'seta' ? 14 : 18;
    return E('shape', 0, 0, w, h, { kind: k, fill: f1, fill2: two ? f2 : 'none', stroke: stroke || (two ? '#4A4E79' : 'none'), sw: stroke ? 0.35 : 0 });
  }
  function stkEls(s) {
    const cols = s.cols.length ? s.cols : ['#F1CDD9', '#E7A6BE', '#D8A776'];
    const els = s.shapes.map((k, i) => shapeEl(k, cols[i % cols.length], cols[(i + 1) % cols.length], s.stroke));
    if (els.length === 1) return els;
    const n = Math.ceil(Math.sqrt(els.length)); let x = 0, y = 0, rowH = 0, col = 0; const gap = 4, g = uid('g');
    els.forEach((e) => { if (col >= n) { col = 0; x = 0; y += rowH + gap; rowH = 0; } e.x = x; e.y = y; x += e.w + gap; rowH = Math.max(rowH, e.h); col++; e.g = g; });
    return els;
  }
  function wgtEls(s) {
    const it = WX.CAT.find((x) => x.k === s.base); if (!it) return [];
    return withCtx(styleFor(s.palC ? { pal: '_c', palC: s.palC, pair: s.pair, wst: s.wst } : { pal: s.pal, pair: s.pair, wst: s.wst }), () => {
      const p = S.pages._ml, st = styleOf(); let els = [].concat(it.fn(p, st));
      const main = els.find((e) => WX.ACCEPT.has(e.type));
      if (main && s.adj) Object.entries(s.adj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') main[k] = v; });
      if (s.titulo) els.forEach((e) => { if (e.wx && e.wx.hd) e.wx.hd.text = s.titulo; });
      return clone(els);
    });
  }
  const ctxStyle = (s) => { const t = s.tema && mine('tema').find((x) => x.id === s.tema); return t ? { pal: 'u_' + t.id, pair: t.pair, palC: t.pal } : { pal: s.pal || 'lavanda', pair: s.pair || 'assinatura', palC: s.palC }; };

  /* ---------- pré-visualizações ---------- */
  function boxPrev(cv, els, bw, bh) { try { WX.previewEls(cv, els, bw, bh); } catch (e) { /* sem prévia */ } }
  function wstyPrev(cv, spec, st, bw, bh) {
    withCtx(styleFor(st), () => {
      const e = E('text', 0, 0, 40, 26, { text: 'Escreva aqui\nsuas ideias', font: 'Nunito', size: 6.2, color: '#3E3550', lh: 1.35 });
      e.wx = clone({ fr: spec.fr, pad: spec.pad || 0, bg: spec.bg || { t: 'none' }, hd: spec.hd, sh: spec.sh ? 1 : 0, st: '_pv' }); if (e.wx.hd) e.wx.hd.text = 'Título';
      const L = WX.layout(Object.assign({}, e)); e.w = r1(e.w + 2 * L.pad + L.off); e.h = r1(e.h + L.hd + 2 * L.pad + L.off);
      const t = document.createElement('canvas'); elPreview(t, e, bw - 36, bh - 30);
      const d = window.devicePixelRatio || 1; cv.width = bw * d; cv.height = bh * d; cv.getContext('2d').drawImage(t, 18 * d, 15 * d);
    });
  }
  function bdrPrev(cv, b, bw, bh) {
    const W = 60, H = 84, d = window.devicePixelRatio || 1, s = Math.min(bw / W, bh / H); cv.width = bw * d; cv.height = bh * d; const c = cv.getContext('2d');
    c.setTransform(s * d, 0, 0, s * d, ((bw - W * s) / 2) * d, ((bh - H * s) / 2) * d); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.strokeStyle = '#E7DCE8'; c.lineWidth = 0.4; c.strokeRect(0, 0, W, H);
    try { drawBorder(c, { id: '_pv', w: W, h: H, els: [], border: Object.assign({}, b, { width: Math.max(b.width * 0.7, 1), inset: Math.min(b.inset, 8) }) }); } catch (e) { /* sem prévia */ }
  }
  function temaPrev(cv, t, bw, bh) {
    const d = window.devicePixelRatio || 1; cv.width = bw * d; cv.height = bh * d; const c = cv.getContext('2d'); c.scale(d, d); const p = t.pal, ks = ['a', 'b', 'ink', 'soft', 'soft2', 'line'], w = bw / ks.length;
    c.fillStyle = p.soft; c.fillRect(0, 0, bw, bh); ks.forEach((k, i) => { c.fillStyle = p[k]; c.fillRect(i * w, bh * 0.52, w, bh * 0.48); });
    c.fillStyle = p.ink; c.font = `700 ${Math.round(bh * 0.2)}px '${PAIRS[t.pair] ? PAIRS[t.pair].title : 'Quicksand'}', sans-serif`; c.textBaseline = 'middle'; c.fillText(t.name || 'Tema', 8, bh * 0.26);
  }
  function itemPrev(cv, it, bw, bh) {
    try {
      if (it.kind === 'wgt' || it.kind === 'stk') boxPrev(cv, it.els, bw, bh);
      else if (it.kind === 'bdr') bdrPrev(cv, it.border, bw, bh);
      else if (it.kind === 'wsty') wstyPrev(cv, it.spec, null, bw, bh);
      else if (it.kind === 'tema') temaPrev(cv, it, bw, bh);
      else if (it.kind === 'tipos' && window.Textos) Textos.prev(cv, it, bw, bh);
      else if (it.kind === 'sticker' && it.src) { const im = getImg(it.src); const d = window.devicePixelRatio || 1; cv.width = bw * d; cv.height = bh * d; const draw = () => { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); const r = im && im.im; if (r && r.naturalWidth) { const k = Math.min(cv.width / r.naturalWidth, cv.height / r.naturalHeight); c.drawImage(r, (cv.width - r.naturalWidth * k) / 2, (cv.height - r.naturalHeight * k) / 2, r.naturalWidth * k, r.naturalHeight * k); } }; draw(); if (im && im.im) im.im.addEventListener('load', draw, { once: true }); }
      else if (it.kind === 'colecao') { const d = window.devicePixelRatio || 1; cv.width = bw * d; cv.height = bh * d; const c = cv.getContext('2d'); c.scale(d, d); c.fillStyle = '#F7E5E7'; c.fillRect(0, 0, bw, bh); c.fillStyle = '#9168A0'; c.font = '700 22px Quicksand, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('❀ ' + (it.items || []).length, bw / 2, bh / 2); }
    } catch (e) { /* sem prévia */ }
  }

  /* =====================================================================
     Editores de cada tipo
     state = o próprio item da biblioteca (sem id). Cada editor diz: form(), preview(), clean (para propostas), save().
     ===================================================================== */
  const colIn = (path, val, o) => {
    o = o || {}; const tk = o.tokens !== false, isH = isHex(val), cur = isH ? val : (o.def || '#C398C8');
    if (!tk) return `<span class="mlc"><input type="color" data-kc="${path}" value="${cur}" aria-label="Escolher cor"></span>`;
    return `<span class="mlc"><select data-k="${path}" data-cs>${tk ? TOK.filter((t) => o.none || t[0] !== 'none').map(([v, n]) => `<option value="${v}"${val === v ? ' selected' : ''}>${n}</option>`).join('') : ''}<option value="#"${isH || !tk ? ' selected' : ''}>${tk ? 'Cor própria…' : 'Cor'}</option></select><input type="color" data-kc="${path}" value="${cur}" aria-label="Escolher cor"${isH || !tk ? '' : ' hidden'}></span>`;
  };
  const fld = (label, inner, cls) => `<label class="pfield${cls ? ' ' + cls : ''}"><span>${label}</span>${inner}</label>`;
  const nin = (path, v, min, max, step) => `<input type="number" data-k="${path}" data-n="1" value="${v}" min="${min}" max="${max}" step="${step}">`;
  const sel = (path, v, opts, num) => `<select data-k="${path}"${num ? ' data-n="1"' : ''}>${opts.map(([a, b]) => `<option value="${a}"${String(v) === String(a) ? ' selected' : ''}>${b}</option>`).join('')}</select>`;
  const chk = (path, v, label) => `<label class="chk"><input type="checkbox" data-k="${path}"${v ? ' checked' : ''}> ${label}</label>`;
  const pvPick = (s) => `<div class="pfield"><span>Pré-visualizar com a paleta</span><div class="chips">${Object.entries(PALS).map(([k, p]) => `<button type="button" class="chip${(s.pv || 'lavanda') === k ? ' on' : ''}" data-pv="${k}"><i style="background:linear-gradient(135deg,${p.a} 50%,${p.b} 50%)"></i>${esc(p.nome)}</button>`).join('')}</div></div>`;


  /* ---------- ajustes do widget (linhas, colunas, símbolo) e paletas livres ---------- */
  const ADJ_SKIP = new Set(['ta', 'text', 'lines', 'list', 'font']);
  const ADJ_LIM = { rows: [1, 40, 1], cols: [1, 12, 1], n: [1, 40, 1], days: [1, 31, 1], from: [0, 23, 1], to: [1, 24, 1], active: [0, 20, 1] };
  const MKF2 = { checklist: 'box', habit: 'mk', numgrid: 'mk', rate: 'mk' }, MKC2 = { checklist: 'color', habit: 'accent', numgrid: 'color', rate: 'color' };
  function primaryOf(s) { const base = wgtEls({ base: s.base, wst: s.wst, titulo: s.titulo, pal: s.pv, pair: s.pair, palC: s.palC }); return base.find((e) => WX.ACCEPT.has(e.type)) || null; }
  function adjForm(s) {
    const m = primaryOf(s); if (!m) return ''; const a = s.adj || {}, val = (k) => (a[k] !== undefined ? a[k] : m[k]), FD = (typeof FIELDS !== 'undefined' ? FIELDS : {})[m.type] || [];
    const rows = FD.filter((f) => !ADJ_SKIP.has(f[2])).map(([k, l, t, x]) => {
      if (t === 'num' || t === 'numa') { const lim = ADJ_LIM[k] || [-9999, 9999, x || 1]; return fld(l, nin('adj.' + k, val(k) ?? '', lim[0], lim[1], lim[2] || x || 1)); }
      if (t === 'sel') { const opts = Array.isArray(x) ? x : []; return fld(l, sel('adj.' + k, val(k), opts, typeof (opts[0] || [])[0] === 'number')); }
      if (t === 'chk') return chk('adj.' + k, !!val(k), l);
      if (t === 'color' || t === 'colorN') { const v = val(k); return fld(l, colIn('adj.' + k, isHex(v) ? v : '#3E3550', { tokens: false })); }
      return '';
    }).filter(Boolean).join('');
    const mk = MKF2[m.type] ? (() => { const f = MKF2[m.type], cur = a[f] || m[f] || (m.type === 'habit' ? 'circle' : 'square'); return `<h3>SÍMBOLO</h3><p class="hint">Troque os quadradinhos ou bolinhas por outro símbolo.</p><div class="mkgrid">${WX.MARKS.map(([k, n]) => `<button type="button" class="mkb${cur === k ? ' on' : ''}" data-amk="${k}" title="${n}" aria-label="${n}"><canvas data-mkc="${k}"></canvas></button>`).join('')}</div><div class="mlrow">${fld('Preenchimento', sel('adj.mfill', a.mfill ?? m.mfill ?? '', [['', 'Contorno'], ['solid', 'Cheio'], ['soft', 'Suave']]))}${fld('Cor do símbolo', colIn('adj.' + MKC2[m.type], isHex(val(MKC2[m.type])) ? val(MKC2[m.type]) : '#C398C8', { tokens: false }))}</div>`; })() : '';
    return `${mk}<h3>AJUSTES · ${esc((typeof TYPE_NAME !== 'undefined' ? TYPE_NAME : {})[m.type] || 'WIDGET')}</h3><div class="mlrow">${rows}</div><p class="hint">Quantidade de linhas e colunas, cores e opções do widget. O resto você muda no editor.</p>`;
  }
  const PCOLS = [['a', 'Cor A (destaque)'], ['b', 'Cor B (apoio)'], ['ink', 'Tinta (títulos)'], ['soft', 'Suave'], ['soft2', 'Suave 2'], ['line', 'Linhas'], ['text', 'Texto']];
  function palTools(s) {
    if (s.palC) return `<div class="pfield"><span>Cores da paleta (qualquer cor)</span><div class="mlrow">${PCOLS.map(([k, n]) => fld(n, colIn('palC.' + k, s.palC[k] || '#C398C8', { tokens: false }))).join('')}</div>
      <div class="row"><input type="text" id="palName" placeholder="Nome da paleta" value="Minha paleta" style="max-width:200px"><button type="button" class="btn sm" data-palsave>Guardar como nova paleta</button><button type="button" class="btn sm ghost" data-paloff>Voltar às paletas</button></div></div>`;
    return `<div class="row"><button type="button" class="btn sm" data-paledit>Escolher cores livres / criar paleta</button></div>`;
  }
  async function palSave(s, name) {
    const pal = {}; PCOLS.forEach(([k]) => { pal[k] = isHex(s.palC[k]) ? s.palC[k] : '#C398C8'; });
    const it = { id: uid('l'), kind: 'tema', name: (name || '').trim() || 'Minha paleta', pal, pair: s.pair || 'assinatura', wst: '', frame: false, bdr: '', createdAt: Date.now(), updatedAt: Date.now() };
    await put(it); sync(); s.pv = 'u_' + it.id; s.palC = null; toast('Paleta guardada. Ela aparece em todo o estúdio. 💜');
  }

  const EDIT = {
    /* ---- estilo ---- */
    wsty: {
      title: 'Novo estilo', blank: () => ({ kind: 'wsty', name: 'Meu estilo', pv: 'lavanda', spec: { fr: { k: 'solid', w: 0.4, c: '@ink', r: 3, gap: 1 }, bg: { t: 'none' }, hd: { on: true, h: 7, fill: '@soft', c: '@ink', font: '@title', size: 8, weight: 700, align: 'center', ls: 0.06, line: false, lc: '@ink', lw: 0.3 }, pad: 2, sh: 0 } }),
      form(s) {
        const sp = s.spec, f = sp.fr, h = sp.hd;
        return `${pvPick(s)}<h3>MOLDURA</h3><div class="mlrow">${fld('Desenho', sel('spec.fr.k', f.k, WX.FK))}${fld('Cor', colIn('spec.fr.c', f.c, { def: '#4A4E79' }))}${fld('Espessura (mm)', nin('spec.fr.w', f.w, 0.1, 3, 0.05))}${fld('Cantos (mm)', nin('spec.fr.r', f.r, 0, 8, 0.5))}${fld('Folga (mm)', nin('spec.fr.gap', f.gap ?? 1, 0, 3, 0.1))}</div>
          <h3>FUNDO</h3><div class="mlrow">${fld('Fundo', sel('spec.bg.t', sp.bg.t, [['none', 'Sem fundo'], ['cor', 'Cor lisa']]))}${sp.bg.t === 'cor' ? fld('Cor do fundo', colIn('spec.bg.c', sp.bg.c, { def: '#F7E5E7' })) + fld('Opacidade', nin('spec.bg.op', sp.bg.op ?? 1, 0, 1, 0.05)) : ''}</div>
          <h3>TÍTULO</h3>${chk('hdOn', !!h, 'Mostrar título no widget')}
          ${h ? `<div class="mlrow">${fld('Fundo do título', colIn('spec.hd.fill', h.fill, { none: true, def: '#F7E5E7' }))}${fld('Cor do texto', colIn('spec.hd.c', h.c, { def: '#4A4E79' }))}${fld('Fonte', sel('spec.hd.font', h.font, [['@title', 'Títulos do tema'], ['@script', 'Manuscrita do tema'], ['@body', 'Texto do tema']]))}${fld('Tamanho (pt)', nin('spec.hd.size', h.size, 5, 16, 0.5))}${fld('Peso', sel('spec.hd.weight', h.weight, [[400, 'Normal'], [600, 'Médio'], [700, 'Negrito']], true))}${fld('Alinhamento', sel('spec.hd.align', h.align, [['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']]))}${fld('Altura (mm)', nin('spec.hd.h', h.h, 5, 12, 0.5))}</div>${chk('spec.hd.line', h.line, 'Linha sob o título')}` : ''}
          <h3>GERAL</h3><div class="mlrow">${fld('Espaço interno (mm)', nin('spec.pad', sp.pad, 0, 5, 0.5))}</div>${chk('spec.sh', sp.sh, 'Sombra')}`;
      },
      preview(cv, s) { wstyPrev(cv, s.spec, { pal: s.pv || 'lavanda', pair: 'assinatura' }, 300, 200); },
      apply(s, p) { s.spec = clone(p.spec); s.name = p.name; },
      readExtra(s, b) { const o = $('[data-k="hdOn"]', b); if (o) { if (o.checked && !s.spec.hd) s.spec.hd = clone(EDIT.wsty.blank().spec.hd); if (!o.checked) s.spec.hd = null; } },
      list: (c) => c, propPrev(cv, p) { wstyPrev(cv, p.spec, null, 150, 100); },
    },
    /* ---- borda ---- */
    bdr: {
      title: 'Nova borda', blank: () => ({ kind: 'bdr', name: 'Minha borda', border: { preset: 'moldura', kind: 'cor', color: '#C398C8', width: 2, inset: 6, style: 'solid', radius: 3, opacity: 1, src: null } }),
      form(s) {
        const b = s.border;
        return `<h3>DESENHO</h3><div class="mlrow">${fld('Onde fica', sel('border.preset', b.preset, BORDER_PRESETS))}${fld('Tipo', sel('border.kind', b.kind, [['cor', 'Cor lisa'], ['imagem', 'Imagem repetida']]))}</div>
          ${b.kind === 'cor' ? `<div class="mlrow">${fld('Cor', colIn('border.color', b.color, { tokens: false }))}${fld('Traço', sel('border.style', b.style, [['solid', 'Contínuo'], ['dash', 'Tracejado'], ['dot', 'Pontilhado'], ['double', 'Duplo']]))}${b.preset === 'moldura' ? fld('Cantos (mm)', nin('border.radius', b.radius ?? 0, 0, 30, 0.5)) : ''}</div>`
            : `<div class="pfield"><span>Imagem que se repete (PNG com fundo transparente fica linda)</span><span class="btn sm upl">${b.src ? 'Trocar imagem' : 'Enviar imagem'}<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" data-bimg></span>${b.src ? '<small class="hint">Imagem escolhida.</small>' : ''}</div>`}
          <div class="mlrow">${fld('Espessura (mm)', nin('border.width', b.width, 0.3, 40, 0.5))}${fld('Distância da borda (mm)', nin('border.inset', b.inset, 0, 60, 0.5))}${fld('Opacidade', nin('border.opacity', b.opacity ?? 1, 0.1, 1, 0.05))}</div>`;
      },
      preview(cv, s) { bdrPrev(cv, s.border, 150, 210); },
      apply(s, p) { s.border = Object.assign({}, s.border, p.border); s.name = p.name; }, propPrev(cv, p) { bdrPrev(cv, p.border, 90, 126); },
    },
    /* ---- tema ---- */
    tema: {
      title: 'Novo tema', blank: () => ({ kind: 'tema', name: 'Meu tema', pal: clone({ a: PALS.lavanda.a, b: PALS.lavanda.b, ink: PALS.lavanda.ink, soft: PALS.lavanda.soft, soft2: PALS.lavanda.soft2, line: PALS.lavanda.line, text: PALS.lavanda.text }), pair: 'assinatura', wst: '', frame: false, bdr: '' }),
      form(s) {
        const P = [['a', 'Cor A (destaque)'], ['b', 'Cor B (apoio)'], ['ink', 'Tinta (títulos)'], ['soft', 'Suave'], ['soft2', 'Suave 2'], ['line', 'Linhas'], ['text', 'Texto']];
        const sty = [['', 'Padrão do projeto']].concat(Object.values(WX.STY).map((x) => [x.id, x.colName + ' · ' + x.n]));
        const bs = [['', 'Nenhuma']].concat(mine('bdr').map((x) => [x.id, x.name]));
        return `<h3>PALETA</h3><div class="mlrow">${P.map(([k, n]) => fld(n, colIn('pal.' + k, s.pal[k], { tokens: false, def: s.pal[k] }))).join('')}</div>
          <h3>FONTES</h3><div class="mlrow">${fld('Combinação', sel('pair', s.pair, Object.entries(PAIRS).map(([k, p]) => [k, p.nome + ' · ' + p.script + ' + ' + p.title])))}</div>
          <h3>PERSONALIZAÇÃO</h3><div class="mlrow">${fld('Estilo dos widgets', sel('wst', s.wst || '', sty))}${fld('Borda das páginas', sel('bdr', s.bdr || '', bs))}</div>${chk('frame', s.frame, 'Moldura do mesmo estilo nas páginas')}`;
      },
      preview(cv, s) { withCtx(styleFor({ pal: '_t', pair: s.pair, palC: s.pal, wst: s.wst }), () => { const d = window.devicePixelRatio || 1; cv.width = 300 * d; cv.height = 210 * d; const c = cv.getContext('2d'); c.scale(d, d); c.fillStyle = '#fff'; c.fillRect(0, 0, 300, 210); const p = s.pal, st = styleOf(); c.fillStyle = p.soft; c.fillRect(0, 0, 300, 210);
        c.fillStyle = p.a; c.fillRect(14, 14, 120, 8); c.fillStyle = p.b; c.fillRect(14, 28, 70, 6); c.fillStyle = p.ink; c.font = `700 22px '${st.script}', cursive`; c.fillText(s.name || 'Tema', 14, 70); c.fillStyle = p.text; c.font = `400 11px '${st.body}', sans-serif`; c.fillText('Texto de exemplo em ' + st.body, 14, 92);
        ['a', 'b', 'ink', 'soft2', 'line'].forEach((k, i) => { c.fillStyle = p[k]; c.beginPath(); c.arc(26 + i * 34, 130, 13, 0, 7); c.fill(); });
        try { const id = s.wst && WX.STY[s.wst] ? s.wst : null; if (id) { const e = E('text', 0, 0, 40, 26, { text: 'Exemplo', font: st.body, size: 6, color: p.text }); WX.applyId(e, id, { title: 'Título' }); const L = WX.layout(Object.assign({}, e)); e.w += 2 * L.pad + L.off; e.h += L.hd + 2 * L.pad + L.off; c.save(); c.translate(180, 20); c.scale(2.4, 2.4); drawEl(c, Object.assign(e, { x: 0, y: 0 })); c.restore(); } } catch (e2) { /* sem prévia */ } }); },
      apply(s, p) { s.pal = p.pal; s.pair = p.pair; s.name = p.name; }, propPrev(cv, p) { temaPrev(cv, p, 150, 80); },
    },
    /* ---- widget ---- */
    wgt: {
      title: 'Novo widget', blank: () => ({ kind: 'wgt', name: 'Meu widget', base: 'tarefas', wst: '', titulo: '', pv: 'lavanda', pair: 'assinatura', els: [], w: 0, h: 0, adj: {}, palC: null }),
      readExtra(s) { if (s._lb !== s.base) { if (s._lb !== undefined) s.adj = {}; s._lb = s.base; } },
      form(s) {
        const base = WX.CATS.map(([id, n]) => `<optgroup label="${esc(n)}">${WX.CAT.filter((x) => x.cats[0] === id).map((x) => `<option value="${x.k}"${s.base === x.k ? ' selected' : ''}>${esc(x.n)}</option>`).join('')}</optgroup>`).join('');
        const sty = [['', 'Estilo padrão do projeto']].concat(Object.values(WX.STY).map((x) => [x.id, x.colName + ' · ' + x.n]));
        return `<div class="mlrow">${fld('Modelo-base', `<select data-k="base">${base}</select>`)}${fld('Estilo', sel('wst', s.wst || '', sty))}${fld('Título do widget', `<input type="text" data-k="titulo" value="${esc(s.titulo || '')}" placeholder="(do estilo)">`)}</div>${pvPick(s)}${palTools(s)}${adjForm(s)}
          <p class="hint">Depois de salvo, o widget fica em Widgets → Salvos, com todas as opções de personalização do editor.</p>`;
      },
      preview(cv, s) { const els = wgtEls({ base: s.base, wst: s.wst, titulo: s.titulo, pal: s.pv, pair: s.pair, palC: s.palC, adj: s.adj }); if (!els.length) return; boxPrev(cv, els, 300, 200); },
      apply(s, p) { s.base = p.base; s.titulo = p.titulo; s.name = p.name; }, propPrev(cv, p) { boxPrev(cv, wgtEls({ base: p.base, pal: 'lavanda', pair: 'assinatura' }), 150, 100); },
    },
    /* ---- adesivo ---- */
    stk: {
      title: 'Novo adesivo', blank: () => ({ kind: 'stk', name: 'Meu adesivo', shapes: ['coracao'], cols: ['#F1CDD9', '#E7A6BE', '#D8A776'], stroke: '#4A4E79', cartela: false }),
      form(s) {
        return `<h3>FORMAS</h3><p class="hint">Marque uma para um adesivo único, ou várias para uma cartela.</p><div class="mlshapes">${Object.entries(SHAPES).map(([k, n]) => `<button type="button" class="mlshape${s.shapes.includes(k) ? ' on' : ''}" data-shape="${k}"><canvas data-sh="${k}"></canvas>${n}</button>`).join('')}</div>
          <h3>CORES</h3><div class="mlrow">${[0, 1, 2].map((i) => fld('Cor ' + (i + 1), colIn('cols.' + i, s.cols[i] || '#F1CDD9', { tokens: false }))).join('')}${fld('Contorno', colIn('stroke', s.stroke, { tokens: false }))}</div>
          <div class="pfield"><span>A partir de uma imagem sua (com fundo recortado)</span><button class="btn sm" type="button" data-stkimg>Abrir o criador de adesivo por imagem</button></div>`;
      },
      preview(cv, s) { boxPrev(cv, stkEls(s), 300, 200); },
      apply(s, p) { s.shapes = p.shapes; s.cols = p.cols.length ? p.cols : s.cols; s.stroke = p.stroke; s.name = p.name; }, propPrev(cv, p) { boxPrev(cv, stkEls(p), 150, 100); },
    },
    /* ---- outro ---- */
    outro: {
      title: 'Novo item (outros)', blank: () => ({ kind: 'outro', name: 'Meu item', tipo: '', nota: '' }),
      form(s) { return `<p class="hint">Este espaço ainda vai ser definido. Já deixei a base: o item é guardado na biblioteca e aparece na lista do ModuLab.</p><div class="mlrow">${fld('Tipo (livre)', `<input type="text" data-k="tipo" value="${esc(s.tipo || '')}" placeholder="ex.: papel de parede, padrão, gráfico…">`)}</div>${fld('Anotações', `<textarea data-k="nota" rows="5">${esc(s.nota || '')}</textarea>`)}`; },
      preview(cv) { const d = window.devicePixelRatio || 1; cv.width = 300 * d; cv.height = 200 * d; const c = cv.getContext('2d'); c.scale(d, d); c.fillStyle = '#F7E5E7'; c.fillRect(0, 0, 300, 200); c.fillStyle = '#9168A0'; c.font = '700 40px Quicksand, sans-serif'; c.textAlign = 'center'; c.fillText('＋', 150, 115); },
      noAI: true,
    },
    /* ---- coleção ---- */
    colecao: {
      title: 'Nova coleção', blank: () => ({ kind: 'colecao', name: 'Minha coleção', items: [], nota: '', gen: null }),
      form(s) {
        const groups = ['tema', 'wsty', 'bdr', 'wgt', 'stk', 'sticker'].map((k) => { const L = mine(k); if (!L.length) return ''; return `<div class="mlgrp"><b>${(KIND[k] || { pl: 'Adesivos (imagem)' }).pl}</b>${L.map((x) => `<label class="chk"><input type="checkbox" data-it="${x.id}"${s.items.includes(x.id) ? ' checked' : ''}> ${esc(x.name)}</label>`).join('')}</div>`; }).join('');
        const g = s.gen;
        const genH = g ? `<h3>NOVOS ITENS DA IA</h3><p class="hint">Estes itens serão criados junto com a coleção. Desmarque o que não quiser.</p><div class="mlgen">${['tema', 'wsty', 'bdr', 'stk'].filter((k) => g[k]).map((k) => `<label class="mlgi"><input type="checkbox" data-gi="${k}"${g['on_' + k] !== false ? ' checked' : ''}><canvas data-gp="${k}"></canvas><span>${KIND[k].n}: ${esc(g[k].name)}</span></label>`).join('')}</div>` : '';
        return `${genH}<h3>ITENS DA COLEÇÃO</h3>${groups || '<p class="hint">Você ainda não criou itens. Use a IA acima para gerar uma coleção completa (tema, estilo, borda e adesivos), ou crie itens nos outros tipos e volte aqui.</p>'}
          ${fld('Anotações', `<textarea data-k="nota" rows="3">${esc(s.nota || '')}</textarea>`)}<p class="hint">No editor, a coleção aparece em Modelos → Coleções, com o botão de aplicar tudo de uma vez.</p>`;
      },
      preview(cv, s) { itemPrev(cv, Object.assign({}, s, { kind: 'colecao' }), 300, 200); },
      apply(s, p) { s.gen = Object.assign({}, p); if (p.tema) s.name = p.tema.name || s.name; },
      bundle: true,
    },
  };

  /* ---------- janela de edição ---------- */
  let refresh = () => { };
  function openEditor(kind, item) {
    const ED = EDIT[kind], isNew = !item, s = item ? clone(item) : ED.blank(); delete s.id; S._mlImg = null; S._mlPrompt = '';
    if (kind === 'stk' && s.cartela === undefined) s.cartela = (s.shapes || []).length > 1;
    const aiOn = !ED.noAI; let props = []; let busy = '';
    const html = () => `<div class="mlx"><div class="mlh"><h2>${isNew ? ED.title : 'Editar · ' + esc(KIND[kind].n)}</h2><label class="f mlname">Nome<input type="text" data-k="name" value="${esc(s.name)}"></label></div>
      <div class="mlcols"><div class="mlleft">
        ${aiOn ? `<div class="mlai"><div class="mlaih"><b>Sugestões</b><small class="${IA.ok() ? 'iaon' : 'iaoff'}">${esc(IA.label())}${IA.ok() ? '' : ' · uso só cores de imagem e palavras'}</small><button class="btn sm${IA.ok() ? ' ghost' : ' pri'}" type="button" data-iacfg>${IA.ok() ? 'Configurar IA' : 'Ligar IA'}</button></div>
          <textarea id="mlPrompt" rows="2" placeholder="${kind === 'colecao' ? 'Ex.: coleção de natal delicada com tons de verde e dourado' : 'Descreva o que você quer, ex.: ' + ({ wsty: 'moldura fina com título manuscrito', bdr: 'borda de flores suaves em rosa', tema: 'tema outono aconchegante', stk: 'cartela de adesivos de natal', wgt: 'lista de tarefas para o inverno' }[kind] || 'algo delicado')}">${esc(S._mlPrompt || '')}</textarea>
          <div class="row"><span class="btn sm upl">Enviar imagem de referência<input type="file" id="mlImg" accept="image/*"></span><span class="hint" id="mlImgN">${S._mlImg ? 'Imagem anexada.' : ''}</span><button class="btn sm pri" type="button" id="mlGo"${busy ? ' disabled' : ''}>${busy || 'Sugerir'}</button></div>
          <div class="mlprops" id="mlProps">${props.map((p, i) => `<button type="button" class="mlprop" data-prop="${i}"><canvas data-pp="${i}"></canvas><span>${esc((p.name || (p.tema && p.tema.name) || 'Proposta') + '')}</span></button>`).join('')}</div>
          ${props.length ? '<p class="hint">Escolha uma proposta para carregar. Depois você muda o que quiser.</p>' : ''}<p class="hint" id="mlErr"></p></div>` : ''}
        <div id="mlForm">${ED.form(s)}</div></div>
        <div class="mlright"><canvas id="mlPv"></canvas><small class="hint">Onde aparece no editor: ${KIND[kind].where}</small></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="mlSave">Salvar no ModuLab</button></div></div>`;

    modal(html(), (b, close) => {
      let render;
      const paint = () => { $$('canvas[data-mkc]', b).forEach((c) => { try { const k = c.dataset.mkc, z = 30; c.width = z * 2; c.height = z * 2; c.style.width = c.style.height = z + 'px'; const g = c.getContext('2d'); g.scale(2, 2); WX.mark(g, k, z / 2, z / 2, z * 0.62, { stroke: '#4A4E79', fill: '#C398C8', mode: 'soft', sw: 1.4, num: 1, font: 'Nunito' }); } catch (e) { /* sem ícone */ } }); const cv = $('#mlPv', b); if (cv) { try { ED.preview(cv, s); } catch (e) { console.warn(e); } } $$('canvas[data-sh]', b).forEach((c) => boxPrev(c, [shapeEl(c.dataset.sh, '#F1CDD9', '#E7A6BE', '#4A4E79')], 44, 36)); $$('canvas[data-pp]', b).forEach((c) => { try { (ED.propPrev || (() => { }))(c, props[+c.dataset.pp]); } catch (e) { /* sem prévia */ } }); $$('canvas[data-gp]', b).forEach((c) => { const g = s.gen[c.dataset.gp]; itemPrev(c, Object.assign({ kind: c.dataset.gp }, g, { els: c.dataset.gp === 'stk' ? stkEls(g) : undefined }), 64, 48); }); };
      render = (full) => { if (full) { const sc = $('.mlleft', b).scrollTop; const aiKeep = $('#mlPrompt', b) && $('#mlPrompt', b).value; $('.mlx', b).outerHTML = html(); if (aiKeep != null && $('#mlPrompt', b)) $('#mlPrompt', b).value = aiKeep; $('.mlleft', b).scrollTop = sc; $$('[data-close]', b).forEach((x) => x.onclick = close); } wire(); paint(); };
      const readInput = (i) => {
        const k = i.dataset.k; if (!k) return; let v = i.type === 'checkbox' ? i.checked : i.type === 'number' ? (+i.value || 0) : i.value;
        if (i.dataset.n && i.tagName === 'SELECT') v = +v;
        if (i.dataset.cs) { if (v === '#') { const c = $(`[data-kc="${k}"]`, b); v = c ? c.value : '#C398C8'; } }
        if (k === 'hdOn') return; setPath(s, k, v);
      };
      const wire = () => {
      $('[data-k="name"]', b).onchange = (e) => { s.name = e.target.value; };
      $('#mlSave', b).onclick = async () => {
        s.name = ($('[data-k="name"]', b).value || '').trim() || KIND[kind].n; const btn = $('#mlSave', b); btn.disabled = true;
        try { await saveItem(kind, s, item); close(); toast(`${KIND[kind].n} ${['bdr', 'colecao'].includes(kind) ? 'salva' : 'salvo'} no ModuLab. 💜`); ModuLab.refresh(); if (S.view === 'editor' && typeof renderPanel === 'function') renderPanel(); }
        catch (e) { console.error(e); toast('Não consegui salvar. Talvez haja imagens grandes demais.'); btn.disabled = false; }
      };
        $$('[data-k]', b).forEach((i) => { i.onchange = () => { readInput(i); if (ED.readExtra) ED.readExtra(s, b); const full = i.dataset.k !== 'name' && (i.tagName === 'SELECT' || i.type === 'checkbox'); render(full); }; if (i.type === 'number' || i.type === 'text') i.oninput = () => { readInput(i); paint(); }; });
        $$('[data-kc]', b).forEach((i) => { i.oninput = () => { const k = i.dataset.kc; setPath(s, k, i.value); const sl = $(`select[data-k="${k}"]`, b); if (sl) sl.value = '#'; paint(); }; });
        $$('[data-pv]', b).forEach((x) => x.onclick = () => { s.pv = x.dataset.pv; s.palC = null; render(true); });
        $$('[data-amk]', b).forEach((x) => x.onclick = () => { const m = primaryOf(s); if (!m) return; s.adj = s.adj || {}; s.adj[MKF2[m.type]] = x.dataset.amk; render(true); });
        const pe = $('[data-paledit]', b); if (pe) pe.onclick = () => { const base = PALS[s.pv] || PALS.lavanda; s.palC = {}; PCOLS.forEach(([k]) => { s.palC[k] = base[k]; }); render(true); };
        const po = $('[data-paloff]', b); if (po) po.onclick = () => { s.palC = null; render(true); };
        const ps = $('[data-palsave]', b); if (ps) ps.onclick = async () => { await palSave(s, ($('#palName', b) || {}).value); render(true); };
        $$('[data-shape]', b).forEach((x) => x.onclick = () => { const k = x.dataset.shape, i = s.shapes.indexOf(k); if (i >= 0) { if (s.shapes.length > 1) s.shapes.splice(i, 1); } else s.shapes.push(k); render(true); });
        $$('[data-it]', b).forEach((x) => x.onchange = () => { const id = x.dataset.it; s.items = s.items.filter((y) => y !== id); if (x.checked) s.items.push(id); });
        $$('[data-gi]', b).forEach((x) => x.onchange = () => { s.gen['on_' + x.dataset.gi] = x.checked; });
        const bi = $('[data-bimg]', b); if (bi) bi.onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { const ext = (f.name.split('.').pop() || '').toLowerCase(); const src = await Store.upload(f, ext === 'png' ? 'image/png' : 'image/jpeg'); s.border.src = src; s.src = src; toast('Imagem pronta.'); render(true); } catch (err) { toast('Não consegui enviar a imagem.'); } };
        const sb = $('[data-stkimg]', b); if (sb) sb.onclick = () => { close(); if (typeof stickerMaker === 'function') stickerMaker(); };
        const cfg = $('[data-iacfg]', b); if (cfg) cfg.onclick = () => iaModal(() => openEditor(kind, item ? Object.assign({ id: item.id }, s) : null));
        const pr = $('#mlPrompt', b); if (pr) pr.oninput = () => { S._mlPrompt = pr.value; };
        const im = $('#mlImg', b); if (im) im.onchange = async (e) => { const f = e.target.files[0]; if (!f) return; S._mlImg = await imgData(f, 1024); $('#mlImgN', b).textContent = S._mlImg ? 'Imagem anexada.' : 'Não consegui ler a imagem.'; };
        const go = $('#mlGo', b); if (go) go.onclick = async () => {
          const text = ($('#mlPrompt', b).value || '').trim(); if (!text && !S._mlImg) { $('#mlErr', b).textContent = 'Escreva um pedido ou envie uma imagem de referência.'; return; }
          go.disabled = true; go.textContent = IA.ok() ? 'Pensando…' : 'Procurando…'; $('#mlErr', b).textContent = '';
          try {
            let r; if (IA.ok()) { try { r = await aiSuggest(kind, text, S._mlImg); } catch (e1) { $('#mlErr', b).textContent = (e1.message || 'A IA falhou') + ' Usei a sugestão sem IA.'; r = await localSuggest(kind, text, S._mlImg); } } else r = await localSuggest(kind, text, S._mlImg);
            if (r.err) { $('#mlErr', b).textContent = r.err; props = []; } else { props = r.list || []; if (kind === 'colecao') { if (props[0]) { ED.apply(s, props[0]); } props = []; } }
            const keepErr = $('#mlErr', b).textContent; render(true); $('#mlErr', b).textContent = keepErr;
          } catch (e2) { $('#mlErr', b).textContent = e2.message || 'Não consegui sugerir agora.'; go.disabled = false; go.textContent = 'Sugerir'; }
        };
        $$('[data-prop]', b).forEach((x) => x.onclick = () => { const p = props[+x.dataset.prop]; if (kind === 'colecao') ED.apply(s, p); else ED.apply(s, p); props = []; render(true); toast('Proposta carregada. Ajuste o que quiser. 🌸'); });
      };
      wire(); paint();
    }, true);
  }

  async function put(it) { await Store.saveLib(it); const i = S.lib.findIndex((x) => x.id === it.id); if (i >= 0) S.lib[i] = it; else S.lib.push(it); }
  async function saveItem(kind, s, old) {
    const base = { id: old ? old.id : uid('l'), kind, name: s.name, createdAt: old ? old.createdAt : Date.now(), updatedAt: Date.now() };
    let it;
    if (kind === 'wsty') it = Object.assign(base, { spec: s.spec, pv: s.pv });
    else if (kind === 'bdr') it = Object.assign(base, { border: s.border }, s.border.src ? { src: s.border.src } : {});
    else if (kind === 'tema') it = Object.assign(base, { pal: s.pal, pair: s.pair, wst: s.wst || '', frame: !!s.frame, bdr: s.bdr || '' });
    else if (kind === 'wgt') { const els = wgtEls({ base: s.base, wst: s.wst, titulo: s.titulo, pal: s.pv, pair: s.pair, palC: s.palC, adj: s.adj }); if (!els.length) throw new Error('vazio'); const bx = WX.boxOf(els); els.forEach((e) => { e.x = r1(e.x - bx.x); e.y = r1(e.y - bx.y); }); it = Object.assign(base, { els, w: r1(bx.w), h: r1(bx.h), ml: { base: s.base, wst: s.wst || '', titulo: s.titulo || '', pv: s.pv, pair: s.pair, palC: s.palC || null, adj: s.adj || {} } }); }
    else if (kind === 'stk') { const els = stkEls(s); const bx = WX.boxOf(els); els.forEach((e) => { e.x = r1(e.x - bx.x); e.y = r1(e.y - bx.y); }); it = Object.assign(base, { els, w: r1(bx.w), h: r1(bx.h), shapes: s.shapes, cols: s.cols, stroke: s.stroke }); }
    else if (kind === 'outro') it = Object.assign(base, { tipo: s.tipo, nota: s.nota });
    else if (kind === 'colecao') {
      const ids = (s.items || []).slice(); const g = s.gen;
      if (g) {
        if (g.tema && g.on_tema !== false) { const t = Object.assign({ id: uid('l'), kind: 'tema', createdAt: Date.now(), wst: '', frame: false, bdr: '' }, { name: g.tema.name, pal: g.tema.pal, pair: g.tema.pair }); await put(t); ids.push(t.id); g._t = t; }
        if (g.wsty && g.on_wsty !== false) { const w = { id: uid('l'), kind: 'wsty', createdAt: Date.now(), name: g.wsty.name, spec: g.wsty.spec }; await put(w); ids.push(w.id); }
        if (g.bdr && g.on_bdr !== false) { const d = { id: uid('l'), kind: 'bdr', createdAt: Date.now(), name: g.bdr.name, border: g.bdr.border }; await put(d); ids.push(d.id); }
        if (g.stk && g.on_stk !== false) { const els = stkEls(g.stk); const bx = WX.boxOf(els); els.forEach((e) => { e.x = r1(e.x - bx.x); e.y = r1(e.y - bx.y); }); const k = { id: uid('l'), kind: 'stk', createdAt: Date.now(), name: g.stk.name, els, w: r1(bx.w), h: r1(bx.h), shapes: g.stk.shapes, cols: g.stk.cols, stroke: g.stk.stroke }; await put(k); ids.push(k.id); }
      }
      it = Object.assign(base, { items: [...new Set(ids)], nota: s.nota || '' });
    }
    await put(it); sync();
  }

  /* ---------- configuração da IA ---------- */
  function iaModal(after) {
    const c = IA.cfg();
    modal(`<h2>Ligar a IA do ModuLab</h2><p class="hint">A IA só <b>propõe</b> (cores, estilos, bordas, adesivos, widgets e até desenhos no editor livre). Nada entra sem você aceitar e poder mudar. Escolha como ligar:</p>
      <label class="chk"><input type="radio" name="iaM" value="proxy"${c.mode === 'proxy' ? ' checked' : ''}> <b>Pela minha nuvem</b> (recomendado: a chave fica guardada na nuvem, não no navegador)</label>
      <div id="iaProxy" class="mlnote"${c.mode === 'proxy' ? '' : ' hidden'}>Precisa publicar uma vez a função <code>ia-modulab</code> no seu Supabase (o arquivo já está no projeto, em <code>supabase/functions/ia-modulab/index.ts</code>):<br><code>supabase secrets set ANTHROPIC_API_KEY=sua-chave</code><br><code>supabase functions deploy ia-modulab</code><br>Depois, entre na nuvem aqui no estúdio e clique em Testar. Passo a passo no README.</div>
      <label class="chk"><input type="radio" name="iaM" value="direct"${c.mode !== 'proxy' ? ' checked' : ''}> <b>Chave neste aparelho</b> (mais rápido de ligar)</label>
      <div id="iaDirect" class="mlnote"${c.mode !== 'proxy' ? '' : ' hidden'}><label class="f">Chave da API da Anthropic<input type="password" id="iaKey" value="${esc(c.key)}" placeholder="sk-ant-…" autocomplete="off"></label><span class="hint">A chave fica só neste aparelho e as perguntas vão direto do navegador para a Anthropic. Use uma chave com limite de gasto (console.anthropic.com).</span></div>
      <label class="f">Modelo<input type="text" id="iaMod" value="${esc(c.model)}"></label>
      <p class="hint" id="iaMsg"></p><p class="hint">Sem IA, o ModuLab ainda sugere a partir das cores de uma imagem ou de palavras como natal, páscoa, outono…</p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button><button class="btn" id="iaTest" type="button">Testar</button><button class="btn pri" id="iaSave" type="button">Salvar</button></div>`, (b, close) => {
      const mode = () => ($('[name=iaM]:checked', b) || {}).value || 'direct';
      $$('[name=iaM]', b).forEach((r) => r.onchange = () => { $('#iaProxy', b).hidden = mode() !== 'proxy'; $('#iaDirect', b).hidden = mode() === 'proxy'; });
      const rd = () => ({ mode: mode(), key: ($('#iaKey', b).value || '').trim(), model: $('#iaMod', b).value.trim() || 'claude-sonnet-5-5' });
      $('#iaSave', b).onclick = () => { IA.save(rd()); close(); toast(IA.ok() ? 'IA ligada. ✨' : 'Salvei, mas a IA ainda não está pronta (falta a chave ou entrar na nuvem).'); if (after) after(); else ModuLab.refresh(); };
      $('#iaTest', b).onclick = async () => { IA.save(rd()); $('#iaMsg', b).textContent = 'Testando…'; try { await IA.ask('Responda só com JSON.', 'Devolva {"ok":true}'); $('#iaMsg', b).textContent = 'Funcionou! A IA está ligada. 💜'; } catch (e) { $('#iaMsg', b).textContent = e.message || 'Não funcionou.'; } };
    });
  }


  /* =====================================================================
     Editor livre: o editor completo do Estúdio numa página em branco (como um Canva).
     Tudo o que o editor faz vale aqui: texto, formas, desenho à mão, imagens, widgets, adesivos, camadas…
     No fim, "Salvar no ModuLab" guarda o que você montou como widget, adesivo ou borda.
     ===================================================================== */
  const FREE = { wgt: { n: 'Widget', w: 110, h: 80 }, stk: { n: 'Adesivo', w: 70, h: 70 }, bdr: { n: 'Borda (faixa de imagem)', w: 148, h: 30 } };
  function freeModal() {
    modal(`<h2>Criar no editor livre</h2><p class="hint">Uma página em branco no editor completo do Estúdio. Desenhe, escreva, coloque imagens e formas do jeito que quiser. Depois é só salvar no ModuLab.</p>
      <label class="f">O que você vai criar<select id="frK">${Object.entries(FREE).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select></label>
      <div class="fgrid"><label class="f">Largura da área (mm)<input type="number" id="frW" min="10" max="600" value="110"></label><label class="f">Altura da área (mm)<input type="number" id="frH" min="10" max="600" value="80"></label></div>
      <label class="f">Nome<input type="text" id="frN" value="Meu widget"></label>
      <p class="hint">A área é só o espaço de trabalho: o que você salvar leva o tamanho do desenho.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="frGo">Abrir o editor</button></div>`, (b, close) => {
      $('#frK', b).onchange = () => { const f = FREE[$('#frK', b).value]; $('#frW', b).value = f.w; $('#frH', b).value = f.h; $('#frN', b).value = 'Meu ' + f.n.split(' ')[0].toLowerCase(); };
      $('#frGo', b).onclick = () => { const k = $('#frK', b).value, o = { w: num($('#frW', b).value, 10, 600, 110), h: num($('#frH', b).value, 10, 600, 80), name: ($('#frN', b).value || '').trim() || FREE[k].n }; close(); openFree(k, null, o); };
    });
  }
  async function openFree(kind, item, o) {
    o = o || {}; let w = o.w, h = o.h, els = [];
    if (item) { const bx = { w: item.w || 60, h: item.h || 40 }; w = Math.max(80, Math.round(bx.w * 1.5)); h = Math.max(60, Math.round(bx.h * 1.5)); els = clone(item.els || []).map((e) => Object.assign(e, { id: uid('e'), x: r1(e.x + (w - bx.w) / 2), y: r1(e.y + (h - bx.h) / 2), link: null })); }
    const pg = blankPage(w, h); pg.els = els; pg.name = (item ? item.name : o.name) || 'Criação';
    toast('Abrindo o editor livre…');
    await createProject('ModuLab · ' + pg.name, { w, h }, [pg], false, { modulab: true, ml: { kind, itemId: item ? item.id : null, name: pg.name } });
    S.tab = 'widgets'; if (typeof renderRail === 'function') { renderRail(); renderPanel(); }
  }

  /* =====================================================================
     Soltar em peças: transforma um widget (calendário, tabela, hábitos…) em linhas, retângulos e textos soltos,
     um por um, para editar tudo livremente. As peças ficam agrupadas (1 objeto); "Desagrupar" libera cada uma.
     Funciona gravando o que o widget desenha e convertendo em elementos do editor.
     ===================================================================== */
  function recordWidget(e) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 8; const real = cv.getContext('2d');
    const out = [], st = { path: null, dash: [] };
    const M = () => real.getTransform(), P = (x, y) => { const q = M().transformPoint(new DOMPoint(x, y)); return [q.x, q.y]; };
    const alpha = () => real.globalAlpha;
    const flush = () => { if (st.path && (st.path.fill || st.path.stroke)) out.push(st.path); st.path = null; };
    const ensure = () => st.path || (st.path = { subs: [], fill: null, stroke: null });
    const cur = () => { const p = ensure(); return p.subs[p.subs.length - 1]; };
    const hooks = {
      beginPath() { flush(); st.path = { subs: [], fill: null, stroke: null }; },
      moveTo(x, y) { const p = ensure(); p.subs.push({ pts: [P(x, y)], closed: false }); },
      lineTo(x, y) { const sp = cur(); if (sp) sp.pts.push(P(x, y)); else ensure().subs.push({ pts: [P(x, y)], closed: false }); },
      closePath() { const sp = cur(); if (sp) sp.closed = true; },
      rect(x, y, w, h) { const p = ensure(); p.subs.push({ pts: [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)], closed: true, rect: [P(x, y), P(x + w, y + h)] }); },
      arcTo(x1, y1, x2, y2) { const sp = cur(); if (sp) { sp.pts.push(P(x1, y1)); sp.arcs = (sp.arcs || 0) + 1; sp.pts.push(P(x2, y2)); } },
      arc(x, y, r, a0, a1) { const sp = ensure(); sp.subs.push({ pts: Array.from({ length: 13 }, (_, i) => P(x + r * Math.cos(a0 + (a1 - a0) * i / 12), y + r * Math.sin(a0 + (a1 - a0) * i / 12))), closed: Math.abs(a1 - a0) > 6 }); },
      ellipse(x, y, rx, ry, rot, a0, a1) { const p = ensure(); p.subs.push({ pts: [P(x - rx, y - ry), P(x + rx, y + ry)], ell: true, closed: true }); },
      bezierCurveTo(a, b, c, d, x, y) { const sp = cur(); if (!sp) return; const p0 = sp.pts[sp.pts.length - 1], m = M().inverse(), q = m.transformPoint(new DOMPoint(p0[0], p0[1])); for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; sp.pts.push(P(u * u * u * q.x + 3 * u * u * t * a + 3 * u * t * t * c + t * t * t * x, u * u * u * q.y + 3 * u * u * t * b + 3 * u * t * t * d + t * t * t * y)); } },
      quadraticCurveTo(a, b, x, y) { const sp = cur(); if (!sp) return; const p0 = sp.pts[sp.pts.length - 1], q = M().inverse().transformPoint(new DOMPoint(p0[0], p0[1])); for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; sp.pts.push(P(u * u * q.x + 2 * u * t * a + t * t * x, u * u * q.y + 2 * u * t * b + t * t * y)); } },
      fill() { const p = ensure(); p.fill = { c: real.fillStyle, a: alpha() }; },
      stroke() { const p = ensure(); p.stroke = { c: real.strokeStyle, w: real.lineWidth * Math.hypot(M().a, M().b), a: alpha(), dash: st.dash.slice(), cap: real.lineCap }; },
      setLineDash(d) { st.dash = Array.from(d || []); },
      fillRect(x, y, w, h) { flush(); const a = P(x, y), b = P(x + w, y + h); out.push({ subs: [{ pts: [a, [b[0], a[1]], b, [a[0], b[1]]], closed: true, rect: [a, b] }], fill: { c: real.fillStyle, a: alpha() }, stroke: null }); },
      fillText(t, x, y) { flush(); const fm = /^(italic )?(?:(\d+) )?(\d+(?:\.\d+)?)px (.+)$/.exec(real.font) || [], k = Math.hypot(M().a, M().b), px = parseFloat(fm[3]) || 16, w = real.measureText(t).width * k, fam0 = String(fm[4] || 'Nunito').split(',')[0].replace(/["']/g, '').trim(), m = [0, fm[1], fm[2], fm[3], fam0];
          out.push({ text: String(t), at: P(x, y), size: px * k, fam: m[4] || 'Nunito', weight: +m[2] || 400, italic: !!m[1], color: real.fillStyle, align: real.textAlign, w, a: alpha() }); },
      drawImage() { out.push({ skipped: 'image' }); },
    };
    const proxy = new Proxy(real, {
      get(t, k) { if (hooks[k]) return (...a) => { const r = real[k] ? real[k](...a) : undefined; hooks[k](...a); return r; }; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; },
      set(t, k, v) { t[k] = v; return true; },
    });
    const el = clone(e); el.x = 0; el.y = 0; el.rot = 0; el.opacity = 1;
    real.setTransform(1, 0, 0, 1, 0, 0); drawEl(proxy, el); flush();
    return out;
  }
  function piecesOf(e) {
    const rec = recordWidget(e), els = [], mm = (n) => r1(n);
    rec.forEach((o) => {
      if (o.skipped) return;
      const x0 = e.x, y0 = e.y;
      if (o.text !== undefined) {
        const sz = o.size / F_MM, h = o.size * 1.25, w = Math.max(2, o.w + 1.2), ax = o.align === 'center' ? o.at[0] - w / 2 : o.align === 'right' || o.align === 'end' ? o.at[0] - w : o.at[0];
        const t = tx(mm(x0 + ax), mm(y0 + o.at[1] - h / 2), mm(w), mm(h), o.text, { font: o.fam, size: r1(sz), weight: o.weight, italic: o.italic, color: hexOf(o.color), align: o.align === 'end' ? 'right' : o.align === 'start' ? 'left' : (['left', 'center', 'right'].includes(o.align) ? o.align : 'left'), valign: 'middle', lh: 1.25 });
        const wxT = e.wx && e.wx.hd && e.wx.hd.text;
        t.role = wxT && String(wxT).trim() === String(o.text).trim() ? 'h1' : (/^\d+$/.test(o.text) ? 'h3' : (/^(dom|seg|ter|qua|qui|sex|s[áa]b|[dstq])$/i.test(o.text) || /^(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(o.text) ? 'h2' : 'h4'));
        if (o.a < 1) t.opacity = r1(o.a); els.push(t); return;
      }
      const fillC = o.fill ? hexOf(o.fill.c) : 'none', strC = o.stroke ? hexOf(o.stroke.c) : 'none', sw = o.stroke ? Math.max(0.05, r1(o.stroke.w)) : 0.3, al = Math.min(o.fill ? o.fill.a : 1, o.stroke ? o.stroke.a : 1);
      const dsh = o.stroke && o.stroke.dash.length ? (o.stroke.dash[0] < sw * 0.8 ? 'dot' : 'dash') : 'solid';
      o.subs.forEach((sp) => {
        let n;
        if (sp.ell) { const [a, b] = sp.pts; n = E('ellipse', mm(x0 + Math.min(a[0], b[0])), mm(y0 + Math.min(a[1], b[1])), mm(Math.abs(b[0] - a[0])), mm(Math.abs(b[1] - a[1])), { fill: fillC, stroke: strC, sw }); }
        else if (sp.rect || (sp.closed && isRectPts(sp.pts) )) { const xs = sp.pts.map((q) => q[0]), ys = sp.pts.map((q) => q[1]), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y; n = E('rect', mm(x0 + x), mm(y0 + y), mm(w), mm(h), { fill: fillC, stroke: strC, sw, radius: 0 }); }
        else if (sp.arcs >= 4 && sp.closed) { const xs = sp.pts.map((q) => q[0]), ys = sp.pts.map((q) => q[1]), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y, first = sp.pts[0], rad = Math.max(0, Math.min(first[0] - x, w / 2, h / 2)); n = E('rect', mm(x0 + x), mm(y0 + y), mm(w), mm(h), { fill: fillC, stroke: strC, sw, radius: mm(rad) }); }
        else if (sp.pts.length === 2 && !o.fill) {
          const [a, b] = sp.pts, len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.01) return;
          if (Math.abs(b[1] - a[1]) < 0.01) n = E('line', mm(x0 + Math.min(a[0], b[0])), mm(y0 + a[1] - 0.5), mm(len), 1, { stroke: strC, sw, dash: dsh });
          else if (Math.abs(b[0] - a[0]) < 0.01) n = E('path', mm(x0 + a[0] - 0.5), mm(y0 + Math.min(a[1], b[1])), 1, mm(len), { pts: [[0.5, 0], [0.5, 1]], closed: false, smooth: false, fill: 'none', stroke: strC, sw, dash: dsh === 'solid' ? null : [sw * (dsh === 'dot' ? 0.01 : 5), sw * (dsh === 'dot' ? 3 : 3.5)] });
          else { const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.max(0.5, Math.abs(b[0] - a[0])), h = Math.max(0.5, Math.abs(b[1] - a[1])); n = E('path', mm(x0 + x), mm(y0 + y), mm(w), mm(h), { pts: [[r4((a[0] - x) / w), r4((a[1] - y) / h)], [r4((b[0] - x) / w), r4((b[1] - y) / h)]], closed: false, smooth: false, fill: 'none', stroke: strC, sw, dash: null }); }
        } else if (sp.pts.length >= 2) {
          const xs = sp.pts.map((q) => q[0]), ys = sp.pts.map((q) => q[1]), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(0.5, Math.max(...xs) - x), h = Math.max(0.5, Math.max(...ys) - y);
          n = E('path', mm(x0 + x), mm(y0 + y), mm(w), mm(h), { pts: sp.pts.map((q) => [r4((q[0] - x) / w), r4((q[1] - y) / h)]), closed: !!sp.closed, smooth: false, fill: sp.closed ? fillC : 'none', stroke: strC, sw, dash: null });
        }
        if (n) { if (al < 1) n.opacity = r1(al); els.push(n); }
      });
    });
    return els;
  }
  const F_MM = 0.3528, r4 = (v) => Math.round(v * 10000) / 10000;
  const isRectPts = (P) => P.length === 4 && ((P[0][1] === P[1][1] && P[1][0] === P[2][0] && P[2][1] === P[3][1]) || (Math.abs(P[0][1] - P[1][1]) < 1e-6 && Math.abs(P[1][0] - P[2][0]) < 1e-6));
  const hexOf = (c) => { c = String(c || ''); if (isHex(c)) return c; if (c === 'none' || c === 'transparent') return 'none'; const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? '#' + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, '0')).join('') : (/^#[0-9a-f]{3}$/i.test(c) ? '#' + c.slice(1).split('').map((x) => x + x).join('') : '#3E3550'); };
  function soltar() {
    const p = curPage(); if (!p) return;
    let alvos = selEls().filter((e) => WX.ACCEPT && WX.ACCEPT.has(e.type) && e.type !== 'text'); if (!alvos.length) alvos = p.els.filter((e) => WX.ACCEPT && WX.ACCEPT.has(e.type) && e.type !== 'text' && !e.hidden);
    if (!alvos.length) { toast('Não achei widgets para soltar. Selecione um widget na página.'); return; }
    const novos = [];
    change([p.id], () => {
      alvos.forEach((e) => {
        const pcs = piecesOf(e); if (!pcs.length) return; const g = uid('g'); pcs.forEach((x) => { x.g = g; });
        if (e.rot) { const cx = e.x + e.w / 2, cy = e.y + e.h / 2, a = e.rot * Math.PI / 180, co = Math.cos(a), si = Math.sin(a); pcs.forEach((x) => { const px = x.x + x.w / 2 - cx, py = x.y + x.h / 2 - cy, nx = cx + px * co - py * si, ny = cy + px * si + py * co; x.x = r1(nx - x.w / 2); x.y = r1(ny - x.h / 2); x.rot = r1((x.rot || 0) + e.rot); }); }
        const i = p.els.findIndex((q) => q.id === e.id); if (i >= 0) p.els.splice(i, 1, ...pcs); else p.els.push(...pcs); novos.push(...pcs);
      });
    });
    if (!novos.length) { toast('Esse widget não pôde ser solto em peças.'); return; }
    S.sel = novos.map((x) => x.id); redraw(); renderProps(); thumbRefresh(p.id);
    toast(`Soltei em ${novos.length} peças, ainda agrupadas. Use “Desagrupar” para mexer em cada uma. ✨`);
  }

  function dockBox() { let d = document.getElementById('mlDock'); if (!d) { d = document.createElement('div'); d.id = 'mlDock'; d.hidden = true; document.body.appendChild(d); } return d; }
  function dock() {
    const d = dockBox(), on = S.view === 'editor' && S.meta && S.meta.ml;
    if (!on) { d.hidden = true; return; }
    const k = S.meta.ml.kind, f = FREE[k] || FREE.wgt;
    d.hidden = false; d.innerHTML = `<span class="mlt"><b>ModuLab</b> · criando ${esc(f.n.toLowerCase())}</span><button class="btn sm" id="mlAiDraw" type="button">✨ Pedir à IA</button><button class="btn sm" id="mlSoltar" type="button" title="Transforma o widget selecionado em linhas, caixas e textos soltos para editar tudo">Soltar em peças</button><button class="btn sm pri" id="mlFreeSave" type="button">Salvar no ModuLab</button><button class="btn sm ghost" id="mlFreeExit" type="button">Sair</button><button class="btn sm ghost" id="mlDockMin" type="button" title="Recolher a barra" aria-label="Recolher a barra">–</button>`;
    d.classList.toggle('min', !!S._dockMin); $('#mlDockMin', d).onclick = () => { S._dockMin = !S._dockMin; dock(); };
    $('#mlAiDraw', d).onclick = aiDrawModal; $('#mlSoltar', d).onclick = soltar; $('#mlFreeSave', d).onclick = freeSaveModal; $('#mlFreeExit', d).onclick = () => { const b = $('#bBack'); if (b) b.click(); };
  }
  const freeEls = () => { const p = curPage(), sel = selEls(); const ids = sel.length ? gx(p, sel.map((e) => e.id)) : null; return p.els.filter((e) => !e.hidden && (!ids || ids.includes(e.id))); };
  async function renderPng(els, bx) {
    const k = 10, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(bx.w * k)); cv.height = Math.max(1, Math.round(bx.h * k));
    const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, -bx.x * k, -bx.y * k); els.forEach((e) => drawEl(c, e));
    return await new Promise((res) => cv.toBlob(res, 'image/png'));
  }
  function freeSaveModal() {
    const els = freeEls(); if (!els.length) { toast('A página está vazia. Crie algo primeiro.'); return; }
    const ml = S.meta.ml, locked = !!ml.itemId, sel = selEls().length;
    modal(`<h2>Salvar no ModuLab</h2><p class="hint">${sel ? 'Vai salvar só o que está selecionado.' : 'Vai salvar tudo o que está na página.'}</p>
      <label class="f">Nome<input type="text" id="fsN" value="${esc(ml.name || 'Minha criação')}"></label>
      ${locked ? '' : `<label class="f">Salvar como<select id="fsK"><option value="wgt"${ml.kind === 'wgt' ? ' selected' : ''}>Widget (Widgets → Salvos)</option><option value="stk"${ml.kind === 'stk' ? ' selected' : ''}>Adesivo (Adesivos → Do ModuLab)</option><option value="bdr"${ml.kind === 'bdr' ? ' selected' : ''}>Borda de imagem (Bordas → Minhas bordas)</option></select></label>`}
      ${locked ? '<p class="hint">Atualiza o item que você abriu. Para guardar como novo, use “Salvar como cópia”.</p>' : ''}
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button>${locked ? '<button class="btn" id="fsCopy" type="button">Salvar como cópia</button>' : ''}<button class="btn pri" id="fsGo" type="button">${locked ? 'Atualizar' : 'Salvar'}</button></div>`, (b, close) => {
      const go = async (asCopy) => {
        const name = ($('#fsN', b).value || '').trim() || 'Minha criação', kind = locked ? ml.kind : $('#fsK', b).value;
        const src = freeEls(), bx = WX.boxOf(src); if (!(bx.w > 0 && bx.h > 0)) { toast('Não consegui medir o desenho.'); return; }
        const id = locked && !asCopy ? ml.itemId : uid('l'), old = S.lib.find((x) => x.id === id);
        const base = { id, kind, name, createdAt: old ? old.createdAt : Date.now(), updatedAt: Date.now() };
        try {
          let it;
          if (kind === 'bdr') {
            const blob = await renderPng(src, bx); const asset = await Store.upload(blob, 'image/png');
            it = Object.assign(base, { src: asset, border: { preset: 'moldura', kind: 'imagem', color: '#C398C8', width: r1(Math.max(2, bx.h)), inset: 6, style: 'solid', radius: 0, opacity: 1, src: asset } });
          } else {
            const els = clone(src).map((e) => Object.assign(e, { x: r1(e.x - bx.x), y: r1(e.y - bx.y), locked: false, link: null, hidden: false }));
            if (kind === 'wgt' && els.length > 1) { const g = uid('g'); els.forEach((e) => { e.g = g; }); }
            it = Object.assign(base, { els, w: r1(bx.w), h: r1(bx.h) });
          }
          await put(it); sync(); close(); ml.itemId = id; ml.kind = kind; ml.name = name; S.meta.ml = ml; Saver.m(); dock();
          toast(`${(KIND[kind] || {}).n} salvo no ModuLab. 💜`);
        } catch (e) { console.error(e); toast('Não consegui salvar. Talvez haja imagens grandes demais.'); }
      };
      $('#fsGo', b).onclick = () => go(false); const cp = $('#fsCopy', b); if (cp) cp.onclick = () => go(true);
    });
  }

  /* ---------- IA que desenha direto na página ---------- */
  const DRAW_SCHEMA = '{"elementos":[{"tipo":"rect|ellipse|line|text|shape","x":mm,"y":mm,"w":mm,"h":mm,"fill":"#RRGGBB ou none","stroke":"#RRGGBB ou none","sw":0.1-3,"radius":0-30,"rot":-180..180,"texto":"(só text)","fonte":"@title|@script|@body","tamanho":4-60,"cor":"#RRGGBB","align":"left|center|right","forma":"coracao|brilho|estrela|flor|folha|gota|livros|faixa|etiqueta|balao|circulo|hexagono|nuvem|seta|carimbo (só shape)"}]} (até 25 elementos)';
  function cleanDraw(list, pw, ph) {
    const st = styleOf(), out = [], col = (v, d) => (v === 'none' ? 'none' : hex(v, d)), fnt = (f) => (f === '@script' ? st.script : f === '@body' ? st.body : st.title);
    (Array.isArray(list) ? list : []).slice(0, 25).forEach((o) => {
      const x = num(o.x, -20, pw, 0), y = num(o.y, -20, ph, 0), w = num(o.w, 0.5, pw * 1.5, 20), h = num(o.h, 0.5, ph * 1.5, 12); let e = null;
      if (o.tipo === 'rect') e = E('rect', x, y, w, h, { fill: col(o.fill, 'none'), stroke: col(o.stroke, '#4A4E79'), sw: num(o.sw, 0, 5, 0.4), radius: num(o.radius, 0, 30, 0) });
      else if (o.tipo === 'ellipse') e = E('ellipse', x, y, w, h, { fill: col(o.fill, 'none'), stroke: col(o.stroke, '#4A4E79'), sw: num(o.sw, 0, 5, 0.4) });
      else if (o.tipo === 'line') e = E('line', x, y, w, num(o.h, 0.5, 4, 2), { stroke: col(o.stroke, '#4A4E79'), sw: num(o.sw, 0.1, 3, 0.35), dash: 'solid' });
      else if (o.tipo === 'text' && o.texto) e = tx(x, y, w, h, String(o.texto).slice(0, 140), { font: fnt(o.fonte), size: num(o.tamanho, 4, 60, 10), color: hex(o.cor, '#3E3550'), align: ['left', 'center', 'right'].includes(o.align) ? o.align : 'left' });
      else if (o.tipo === 'shape') e = E('shape', x, y, w, h, { kind: SHAPES[o.forma] ? o.forma : 'coracao', fill: col(o.fill, '#F1CDD9'), fill2: 'none', stroke: col(o.stroke, '#4A4E79'), sw: num(o.sw, 0, 3, 0.35) });
      if (e) { e.rot = num(o.rot, -180, 180, 0); out.push(e); }
    });
    return out;
  }
  function aiDrawModal() {
    if (!IA.ok()) { iaModal(); return; }
    const p = curPage(); let img = null;
    modal(`<h2>✨ Pedir à IA</h2><p class="hint">Descreva o que quer na página (ou envie uma imagem de referência). A IA desenha com formas, linhas e textos editáveis, e você muda tudo depois. Ctrl+Z desfaz.</p>
      <textarea id="adT" rows="3" style="width:100%" placeholder="Ex.: um bloco de anotações de natal com moldura de azevinho, título manuscrito e linhas pautadas"></textarea>
      <div class="row"><span class="btn sm upl">Imagem de referência<input type="file" id="adI" accept="image/*"></span><span class="hint" id="adIn"></span></div><p class="hint" id="adM"></p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="adGo" type="button">Desenhar</button></div>`, (b, close) => {
      $('#adI', b).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; img = await imgData(f, 1024); $('#adIn', b).textContent = img ? 'Imagem anexada.' : 'Não consegui ler.'; };
      $('#adGo', b).onclick = async () => {
        const t = ($('#adT', b).value || '').trim(); if (!t && !img) { $('#adM', b).textContent = 'Escreva um pedido ou envie uma imagem.'; return; }
        const btn = $('#adGo', b); btn.disabled = true; btn.textContent = 'Desenhando…'; $('#adM', b).textContent = '';
        try {
          const j = await IA.ask(SYS + ' Você desenha componentes de planner com formas simples em milímetros. Use poucas cores harmoniosas.', `A página de trabalho tem ${p.w} x ${p.h} mm (origem no canto superior esquerdo). Desenhe: ${t || '(veja a imagem anexa)'}.\nPosicione tudo dentro da página, com margem de uns 5 mm. Formato:\n${DRAW_SCHEMA}`, img && img.url);
          const els = cleanDraw(j.elementos || j.elements, p.w, p.h); if (!els.length) throw new Error('A IA não trouxe elementos que eu possa desenhar. Tente descrever de outro jeito.');
          change([p.id], () => p.els.push(...els)); S.sel = els.map((e) => e.id); close(); redraw(); renderProps(); thumbRefresh(p.id); toast(`${els.length} elementos desenhados. Mude o que quiser. ✨`);
        } catch (e) { $('#adM', b).textContent = e.message || 'Não consegui desenhar agora.'; btn.disabled = false; btn.textContent = 'Desenhar'; }
      };
    });
  }

  function chooseModal(k) {
    const f = FREE[k];
    modal(`<h2>Novo ${esc(KIND[k].n.toLowerCase())}</h2><p class="hint">Como você quer criar?</p>
      <button class="btn pri" id="chFree" type="button" style="width:100%;margin-bottom:8px">Editor livre (como um Canva)</button><p class="hint" style="margin:0 0 12px">Página em branco no editor completo: faça o ${esc(f.n.split(' ')[0].toLowerCase())} do jeito que quiser.</p>
      <button class="btn" id="chAss" type="button" style="width:100%;margin-bottom:8px">Assistente rápido</button><p class="hint" style="margin:0 0 12px">${k === 'wgt' ? 'Parte de um widget pronto e de um estilo.' : k === 'stk' ? 'Formas da marca em cartela.' : 'Desenho, cor, traço e medidas.'} Com sugestões${IA.ok() ? ' da IA' : ''}.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button></div>`, (b, close) => {
      $('#chFree', b).onclick = () => { close(); freeModalFor(k); };
      $('#chAss', b).onclick = () => { close(); openEditor(k, null); };
    });
  }
  function freeModalFor(k) { freeModal(); setTimeout(() => { const sel = $('#frK'); if (sel) { sel.value = k; sel.onchange(); } }, 0); }

  /* ---------- tela do ModuLab (menu lateral) ---------- */
  const filt = { k: 'todos' };
  function mount(box) {
    if (!box) return; sync();
    const all = S.lib.filter((x) => LISTK.includes(x.kind) && (filt.k === 'todos' || x.kind === filt.k)).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    box.innerHTML = `<p class="suave" style="max-width:70ch">O laboratório dos seus componentes: tudo o que você criar aqui passa a aparecer no editor, pronto para usar em qualquer projeto.</p>
      <div class="mlbanner ${IA.ok() ? 'on' : 'off'}"><span>${IA.ok() ? '✨' : '○'} <b>${esc(IA.label())}</b>${IA.ok() ? '' : ' — sem IA eu só sugiro a partir de cores de imagens e palavras.'}</span><button class="btn sm${IA.ok() ? '' : ' pri'}" id="mlIa">${IA.ok() ? 'Configurar IA' : 'Ligar IA'}</button></div>
      <div class="mlfreeb"><div><b>Editor livre</b><small>Uma página em branco no editor completo, como um Canva: desenhe, escreva, use imagens e formas e salve como widget, adesivo ou borda.</small></div><button class="btn pri" id="mlFree">Criar no editor livre</button></div>
      <h2 class="mlh2">Criar</h2><div class="mlnew">${ORDER.map((k) => `<button class="mlnewc" data-new="${k}"><span class="mli">${KIND[k].ic}</span><b>${KIND[k].n}</b><small>${KIND[k].where}</small></button>`).join('')}</div>
      ${(S.drafts || []).length ? `<h2 class="mlh2">Rascunhos do editor livre</h2><div class="mlgrid">${S.drafts.map((d) => `<div class="mlcard"><div class="mlb"><span class="mlbadge">Rascunho</span><b>${esc(d.name || 'Sem nome')}</b><div class="ac"><button class="btn sm" data-od="${d.id}">Continuar</button><button class="btn sm ghost danger" data-dd="${d.id}">Excluir</button></div></div></div>`).join('')}</div>` : ''}
      <h2 class="mlh2">Minhas criações</h2><div class="chips mlf">${[['todos', 'Tudo']].concat(LISTK.filter((k) => k !== 'sticker').map((k) => [k, KIND[k].pl])).map(([k, n]) => `<button class="chip${filt.k === k ? ' on' : ''}" data-f="${k}">${n}</button>`).join('')}</div>
      ${all.length ? `<div class="mlgrid">${all.map((it) => `<div class="mlcard" data-id="${it.id}"><div class="mlpv"><canvas data-pc="${it.id}"></canvas></div><div class="mlb"><span class="mlbadge">${(KIND[it.kind] || { n: 'Adesivo (imagem)' }).n}</span><b>${esc(it.name || 'Sem nome')}</b>${it.kind === 'colecao' ? `<small>${(it.items || []).length} itens</small>` : ''}<div class="ac">${it.kind === 'sticker' ? '' : `<button class="btn sm" data-ed="${it.id}">Editar</button><button class="btn sm ghost" data-dp="${it.id}">Duplicar</button>`}<button class="btn sm ghost danger" data-rm="${it.id}">Excluir</button></div></div></div>`).join('')}</div>` : '<p class="hint">Nada por aqui ainda. Escolha um tipo acima para criar o primeiro. 🌸</p>'}`;
    $('#mlIa', box).onclick = () => iaModal();
    $$('[data-new]', box).forEach((b) => b.onclick = () => { const k = b.dataset.new; if (['wgt', 'stk', 'bdr'].includes(k)) chooseModal(k); else if (k === 'tipos') Textos.openTipos(null); else openEditor(k, null); });
    const fb = $('#mlFree', box); if (fb) fb.onclick = freeModal;
    $$('[data-od]', box).forEach((b) => b.onclick = () => { const d = S.drafts.find((x) => x.id === b.dataset.od); if (d && !S.projects.some((x) => x.id === d.id)) S.projects.push(d); openProject(b.dataset.od); });
    $$('[data-dd]', box).forEach((b) => b.onclick = async () => { if (!b.dataset.cf) { b.dataset.cf = 1; b.textContent = 'Confirmar'; setTimeout(() => { if (b.isConnected) { delete b.dataset.cf; b.textContent = 'Excluir'; } }, 4000); return; } const d = S.drafts.find((x) => x.id === b.dataset.dd); try { await Store.delProject(b.dataset.dd, d ? d.order || [] : []); S.drafts = S.drafts.filter((x) => x.id !== b.dataset.dd); mount(box); } catch (e) { toast('Não consegui excluir.'); } });
    $$('[data-f]', box).forEach((b) => b.onclick = () => { filt.k = b.dataset.f; mount(box); });
    $$('canvas[data-pc]', box).forEach((cv) => { const it = S.lib.find((x) => x.id === cv.dataset.pc); if (it) itemPrev(cv, it, 190, 120); });
    $$('[data-ed]', box).forEach((b) => b.onclick = () => { const it = S.lib.find((x) => x.id === b.dataset.ed); if (!it) return; if (it.kind === 'wgt' || it.kind === 'stk') openFree(it.kind, it); else if (it.kind === 'tipos') Textos.openTipos(it); else openEditor(it.kind, it); });
    $$('[data-dp]', box).forEach((b) => b.onclick = async () => { const it = S.lib.find((x) => x.id === b.dataset.dp); if (!it) return; const c = clone(it); c.id = uid('l'); c.name = (it.name || '') + ' (cópia)'; c.createdAt = c.updatedAt = Date.now(); await put(c); sync(); mount(box); });
    $$('[data-rm]', box).forEach((b) => b.onclick = async () => { if (!b.dataset.cf) { b.dataset.cf = 1; b.textContent = 'Confirmar exclusão'; setTimeout(() => { if (b.isConnected) { delete b.dataset.cf; b.textContent = 'Excluir'; } }, 4000); return; }
      const it = S.lib.find((x) => x.id === b.dataset.rm); if (!it) return; try { await Store.delLib(it); S.lib = S.lib.filter((x) => x !== it); S.lib.forEach((c) => { if (c.kind === 'colecao' && (c.items || []).includes(it.id)) { c.items = c.items.filter((y) => y !== it.id); Store.saveLib(c); } }); sync(); mount(box); toast('Excluído.'); } catch (e) { toast('Não consegui excluir.'); } });
  }

  /* =====================================================================
     Integração com o editor
     ===================================================================== */
  const bdrAll = () => mine('bdr');
  function applyTheme(t, o) { // t: item de tema; o: {scope:'one'|'all', restyle, frame, border}
    o = o || {}; const st = Object.assign({}, S.meta.style, { pal: 'u_' + t.id, palC: t.pal, pair: t.pair });
    if (t.wst && WX.STY[t.wst]) st.wst = t.wst;
    S.meta.style = st; Saver.m();
    const ids = o.scope === 'all' ? S.order.slice() : [curPage().id];
    const wst = st.wst, bd = (o.border !== undefined ? o.border : t.bdr) && bdrAll().find((x) => x.id === (o.border !== undefined ? o.border : t.bdr));
    const frame = o.frame !== undefined ? o.frame : t.frame;
    change(ids, () => ids.forEach((id) => { const p = S.pages[id];
      if (o.restyle && wst) p.els.forEach((e) => { if (WX.ACCEPT.has(e.type) && e.wx) WX.applyId(e, wst); });
      if (frame && wst) WX.applyPage(p, wst);
      if (bd) p.border = clone(bd.border); }));
    redraw(); refreshThumbs && refreshThumbs();
  }
  function themeModal() {
    const st = S.meta.style || {}, ths = mine('tema');
    const sty = [['', 'Manter o atual (' + WX.globalName() + ')']].concat(Object.values(WX.STY).map((x) => [x.id, x.colName + ' · ' + x.n]));
    modal(`<h2>Tema do projeto</h2><p class="hint">Ajuste paleta, fontes, estilo dos widgets, moldura e borda de uma vez. Os modelos novos já nascem com este tema.</p>
      <div class="pfield"><span>Paleta</span><div class="chips">${Object.entries(PALS).map(([k, p]) => `<button type="button" class="chip${(st.pal || 'lavanda') === k ? ' on' : ''}" data-tp="${k}"><i style="background:linear-gradient(135deg,${p.a} 50%,${p.b} 50%)"></i>${esc(p.nome)}</button>`).join('')}</div></div>
      <div class="mlrow">${fld('Fontes', sel('pair', st.pair || 'assinatura', Object.entries(PAIRS).map(([k, p]) => [k, p.nome + ' · ' + p.script + ' + ' + p.title])))}${fld('Estilo dos widgets', sel('wst', '', sty))}${fld('Borda das páginas', sel('bdr', '', [['', 'Não mudar'], ['none', 'Remover']].concat(bdrAll().map((x) => [x.id, x.name]))))}</div>
      ${chk('frame', false, 'Colocar moldura do estilo escolhido nas páginas')}${chk('restyle', true, 'Trocar também o estilo dos widgets que já estão no projeto')}
      <div class="mlrow">${fld('Aplicar em', sel('scope', 'all', [['one', 'Só nesta página'], ['all', 'Todas as páginas']]))}</div>
      ${ths.length ? `<div class="pfield"><span>Ou use um dos seus temas</span><div class="chips">${ths.map((t) => `<button type="button" class="chip" data-th="${t.id}"><i style="background:linear-gradient(135deg,${t.pal.a} 50%,${t.pal.b} 50%)"></i>${esc(t.name)}</button>`).join('')}</div></div>` : ''}
      <div class="row" style="justify-content:space-between"><button class="btn ghost" id="thSave" type="button">Salvar como tema no ModuLab</button><span><button class="btn ghost" data-close>Cancelar</button> <button class="btn pri" id="thGo">Aplicar</button></span></div>`, (b, close) => {
      const v = { pal: st.pal || 'lavanda', pair: st.pair || 'assinatura', wst: '', bdr: '', frame: false, restyle: true, scope: 'all' }; let pickedTheme = null;
      $$('[data-k]', b).forEach((i) => i.onchange = () => { v[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value; });
      $$('[data-tp]', b).forEach((x) => x.onclick = () => { v.pal = x.dataset.tp; pickedTheme = null; $$('[data-tp]', b).forEach((y) => y.classList.toggle('on', y === x)); });
      $$('[data-th]', b).forEach((x) => x.onclick = () => { pickedTheme = mine('tema').find((t) => t.id === x.dataset.th); $$('[data-tp]', b).forEach((y) => y.classList.remove('on')); $$('[data-th]', b).forEach((y) => y.classList.toggle('on', y === x)); });
      $('#thGo', b).onclick = () => {
        if (pickedTheme) applyTheme(pickedTheme, { scope: v.scope, restyle: v.restyle, frame: v.frame || undefined, border: v.bdr === '' ? undefined : (v.bdr === 'none' ? '' : v.bdr) });
        else { const pl = PALS[v.pal]; S.meta.style = Object.assign({}, S.meta.style, { pal: v.pal, pair: v.pair }); if (pl && v.pal[0] === 'u' && v.pal[1] === '_') S.meta.style.palC = Object.assign({}, pl); else delete S.meta.style.palC; if (v.wst) S.meta.style.wst = v.wst; Saver.m();
          const ids = v.scope === 'all' ? S.order.slice() : [curPage().id], w = S.meta.style.wst; const bd = v.bdr && v.bdr !== 'none' && bdrAll().find((x) => x.id === v.bdr);
          change(ids, () => ids.forEach((id) => { const p = S.pages[id]; if (v.restyle && v.wst) p.els.forEach((e) => { if (WX.ACCEPT.has(e.type) && e.wx) WX.applyId(e, w); }); if (v.frame && w) WX.applyPage(p, w); if (v.bdr === 'none') p.border = null; else if (bd) p.border = clone(bd.border); })); redraw(); refreshThumbs && refreshThumbs(); }
        close(); renderPanel(); renderProps(); toast('Tema aplicado. Ctrl+Z desfaz nas páginas. 🌸'); };
      $('#thSave', b).onclick = async () => { const pl = pickedTheme ? pickedTheme.pal : (PALS[v.pal] || PALS.lavanda); const it = { id: uid('l'), kind: 'tema', name: 'Tema do ' + (S.meta.name || 'projeto'), pal: { a: pl.a, b: pl.b, ink: pl.ink, soft: pl.soft, soft2: pl.soft2, line: pl.line, text: pl.text }, pair: v.pair, wst: v.wst || (S.meta.style && S.meta.style.wst) || '', frame: !!v.frame, bdr: v.bdr && v.bdr !== 'none' ? v.bdr : '', createdAt: Date.now(), updatedAt: Date.now() }; await put(it); sync(); toast('Tema salvo no ModuLab. 💜'); close(); renderPanel(); };
    });
  }
  const macc = (id, title, inner) => { const open = (Pref.macc || {})[id] !== false; return `<div class="macc${open ? ' open' : ''}" data-macc="${id}"><button class="wah" type="button" aria-expanded="${open}"><i class="wtri"></i><b>${title}</b></button><div class="mab">${inner}</div></div>`; };
  function modelosHTML() {
    const cols = mine('colecao'), ths = mine('tema');
    const byId = (id) => S.lib.find((x) => x.id === id);
    const colH = cols.length ? macc('col', 'Coleções', cols.map((c) => { const its = (c.items || []).map(byId).filter(Boolean); return `<div class="mlcol"><div class="mlch"><b>${esc(c.name)}</b><small>${its.length} itens</small></div><div class="ta"><button class="btn sm pri" data-cap="${c.id}">Aplicar coleção</button></div><div class="mlits">${its.map((x) => `<button type="button" class="mlit" data-use="${x.id}" title="Usar ${esc(x.name)}"><canvas data-uc="${x.id}"></canvas><span>${esc(x.name)}</span></button>`).join('')}</div></div>`; }).join('')) : '';
    const thH = '';
    return `${colH}${!cols.length ? '<p class="hint">Coleções que você criar no <b>ModuLab</b> aparecem aqui.</p>' : ''}`;
  }
  function useItem(x) {
    if (x.kind === 'wgt' || x.kind === 'stk') { const els = clone(x.els).map((e) => Object.assign(e, { id: uid('e'), link: null, locked: false })); regroup(els); WX.insertEls(els, false); }
    else if (x.kind === 'bdr') { if (S.tab === 'bordas') { Object.assign(borderEdit(), clone(x.border)); renderPanel(); toast('Borda carregada. Escolha onde aplicar.'); } else { applyBorder([curPage().id], x.border); toast('Borda aplicada nesta página.'); } }
    else if (x.kind === 'wsty') { S.meta.style = Object.assign({}, S.meta.style, { wst: 'meus/' + x.id }); Saver.m(); toast('Estilo definido para os próximos widgets.'); renderPanel(); }
    else if (x.kind === 'tema') themeFrom(x);
  }
  function themeFrom(t) { modal(`<h2>Aplicar tema “${esc(t.name)}”</h2><label class="f">Aplicar em<select id="atS"><option value="all">Todas as páginas</option><option value="one">Só esta página</option></select></label><label class="chk"><input type="checkbox" id="atR" checked> Trocar também o estilo dos widgets que já estão no projeto</label><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="atGo">Aplicar</button></div>`, (b, close) => { $('#atGo', b).onclick = () => { applyTheme(t, { scope: $('#atS', b).value, restyle: $('#atR', b).checked }); close(); renderPanel(); renderProps(); toast('Tema aplicado. 🌸'); }; }); }
  function modelosMount(P) {
    $$('[data-macc] .wah', P).forEach((b) => b.onclick = () => { const a = b.parentNode, o = !a.classList.contains('open'); a.classList.toggle('open', o); b.setAttribute('aria-expanded', o); Pref.macc = Object.assign({}, Pref.macc, { [a.dataset.macc]: o }); savePref(); });
    $$('canvas[data-uc]', P).forEach((cv) => { const it = S.lib.find((x) => x.id === cv.dataset.uc); if (it) itemPrev(cv, it, 54, 40); });
    $$('[data-use]', P).forEach((b) => b.onclick = () => { const it = S.lib.find((x) => x.id === b.dataset.use); if (it) useItem(it); });
    $$('[data-tap]', P).forEach((b) => b.onclick = () => { const t = S.lib.find((x) => x.id === b.dataset.tap); if (t) themeFrom(t); });
    $$('[data-cap]', P).forEach((b) => b.onclick = () => { const c = S.lib.find((x) => x.id === b.dataset.cap); if (!c) return; const its = (c.items || []).map((id) => S.lib.find((x) => x.id === id)).filter(Boolean);
      modal(`<h2>Aplicar “${esc(c.name)}”</h2><p class="hint">Aplica o tema, o estilo dos widgets e a borda da coleção. Adesivos e widgets ficam para você colocar onde quiser.</p><label class="f">Aplicar em<select id="caS"><option value="all">Todas as páginas</option><option value="one">Só esta página</option></select></label><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancelar</button><button class="btn pri" id="caGo">Aplicar</button></div>`, (m, close) => { $('#caGo', m).onclick = () => {
        const sc = $('#caS', m).value, t = its.find((x) => x.kind === 'tema'), w = its.find((x) => x.kind === 'wsty'), d = its.find((x) => x.kind === 'bdr');
        if (t) applyTheme(Object.assign({}, t, { wst: w ? 'meus/' + w.id : t.wst, bdr: d ? d.id : t.bdr, frame: false }), { scope: sc, restyle: true });
        else if (w || d) { if (w) { S.meta.style = Object.assign({}, S.meta.style, { wst: 'meus/' + w.id }); Saver.m(); } const ids = sc === 'all' ? S.order.slice() : [curPage().id]; change(ids, () => ids.forEach((id) => { const p = S.pages[id]; if (w) p.els.forEach((e) => { if (WX.ACCEPT.has(e.type) && e.wx) WX.applyId(e, 'meus/' + w.id); }); if (d) p.border = clone(d.border); })); redraw(); refreshThumbs && refreshThumbs(); }
        close(); renderPanel(); renderProps(); toast('Coleção aplicada. 🌸'); }; }); });
  }

  function listHTML(k, title) {
    const L = mine(k); if (!L.length) return '';
    return macc('ml' + k, title, `<div class="litems mlitems">${L.map((x) => `<button type="button" class="mlit" data-use="${x.id}" title="${esc(x.name)}"><canvas data-uc="${x.id}"></canvas><span>${esc(x.name)}</span></button>`).join('')}</div>`);
  }
  function wrapPanel(name, kinds, ins) {
    const P0 = PANELS[name]; if (!P0 || P0._ml) return; const h0 = P0.html, m0 = P0.mount;
    P0.html = function () { const x = kinds.map(([k, t]) => listHTML(k, t)).join(''); const h = h0.apply(this, arguments); return x ? ins(h, x) : h; };
    P0.mount = function (P) { const r = m0 && m0.apply(this, arguments); modelosMount(P); return r; }; P0._ml = 1;
  }
  function boot() {
    // Modelos: temas, coleções e botão de tema
    const M = PANELS.modelos; if (M && !M._ml) { const h0 = M.html, m0 = M.mount; M.html = function () { return h0.apply(this, arguments).replace(/(<h2>Modelos de miolo<\/h2>)/, '$1' + modelosHTML()); }; M.mount = function (P) { const r = m0.apply(this, arguments); modelosMount(P); return r; }; M._ml = 1; }
    wrapPanel('bordas', [['bdr', 'Minhas bordas (ModuLab)']], (h, x) => h.replace(/(<h3>DESENHO<\/h3>)/, x + '$1'));
    wrapPanel('adesivos', [['stk', 'Do ModuLab']], (h, x) => h.replace(/(<h3>DA MARCA<\/h3>)/, x + '$1'));
    // estilos e paletas próprios entram assim que a biblioteca carrega
    const lh = window.loadHome; if (typeof lh === 'function' && !lh._ml) { const w = async function () { sync(); return lh.apply(this, arguments); }; w._ml = 1; window.loadHome = w; }
    const op = window.openProject; if (typeof op === 'function' && !op._ml) { const w = async function () { const r = await op.apply(this, arguments); dock(); return r; }; w._ml = 1; window.openProject = w; }
    const lh2 = window.loadHome; if (typeof lh2 === 'function' && !lh2._ml2) { const w = async function () { const r = await lh2.apply(this, arguments); dock(); return r; }; w._ml = 1; w._ml2 = 1; window.loadHome = w; }
    sync();
  }
  window.ModuLab = { soltar, piecesOf, openFree, freeModal, dock, mount, sync, openEditor, themeModal, IA, refresh() { const b = $('#mlBox'); if (b && $('#vModulab') && !$('#vModulab').hidden) mount(b); }, applyTheme, colorsFromText, dominant, palFrom };
  boot();
})();
