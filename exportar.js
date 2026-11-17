/* Exportar — tela de exportação do Estúdio (prévia + formatos + tamanhos de papel), no estilo de editores de planner.
   Usa as funções do editor (drawPage, prep, impose, pageLinks…) e o motor vetorial (vetor.js). */
(function () {
  'use strict';
  const KEY = 'cnu.estudio.export';
  const SZ = { A4: [210, 297], Carta: [215.9, 279.4] };
  const FMT = [['print', 'Impressão'], ['tablet', 'Tablet'], ['kdp', 'KDP'], ['booklet', 'Caderno'], ['png', 'Imagem']];
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const wr = (o) => { try { localStorage.setItem(KEY, JSON.stringify({ fmt: o.fmt, sheet: o.sheet, spread: o.spread, kdpBleed: o.kdpBleed, bleed: o.bleed, hideCut: o.hideCut, cut: o.cut, links: o.links, vec: o.vec, dpi: o.dpi, sheets: o.sheets })); } catch (e) { /* sem armazenamento */ } };

  /* ---------- páginas escolhidas e folhas do arquivo ---------- */
  function pagesSel(o) {
    const n = S.order.length; let ids = S.order;
    if (o.range === 'cur') ids = [S.order[S.cur]];
    else if (o.range === 'custom') { const a = cl(Math.min(o.from || 1, o.to || 1), 1, n), b = cl(Math.max(o.from || 1, o.to || 1), 1, n); ids = S.order.slice(a - 1, b); }
    return ids.map((id) => S.pages[id]).filter(Boolean);
  }
  function cuts(c, k, x0, y0, pw, ph, b, col) {
    c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.strokeStyle = col; c.lineWidth = 0.25; c.beginPath();
    const g = b + 1, L = 5;
    for (const [x, y, sx, sy] of [[x0, y0, -1, -1], [x0 + pw, y0, 1, -1], [x0, y0 + ph, -1, 1], [x0 + pw, y0 + ph, 1, 1]]) {
      c.moveTo(x + sx * g, y); c.lineTo(x + sx * (g + L), y); c.moveTo(x, y + sy * g); c.lineTo(x, y + sy * (g + L));
    }
    c.stroke(); c.restore();
  }
  function build(o) {
    const pgs = pagesSel(o), jobs = [], cut = !o.hideCut, col = o.cut || '#D3D3D3', R = { jobs, pgs, main: '', extra: 0, fits: { A4: true, Carta: true } };
    if (!pgs.length) return R;
    if (o.fmt === 'booklet') {
      const sizes = {}; pgs.forEach((p) => { const n = sizeName(p.w, p.h); sizes[n] = (sizes[n] || 0) + 1; });
      const main = Object.entries(sizes).sort((a, b) => b[1] - a[1])[0][0], list = pgs.filter((p) => sizeName(p.w, p.h) === main), pw = list[0].w, ph = list[0].h, W0 = pw * 2;
      const big = o.sheet === 'A4', W = big ? 297 : W0, H = big ? 210 : ph, ox = (W - W0) / 2, oy = (H - ph) / 2;
      R.main = main; R.pgs = list; R.extra = pgs.length - list.length; R.fits = { A4: W0 <= 297.5 && ph <= 210.5, Carta: false }; R.sizes = sizes;
      impose(list, o.sheets).forEach((s) => jobs.push({
        w: W, h: H, side: s.side, pids: [s.l, s.r].filter(Boolean).map((p) => p.id), links: () => [],
        draw: (c, k) => {
          if (s.l) drawPage(c, s.l, k, ox * k, oy * k); if (s.r) drawPage(c, s.r, k, (ox + pw) * k, oy * k);
          if (cut) { c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.strokeStyle = col; c.lineWidth = 0.25; c.beginPath(); const x = ox + pw, a = big ? [oy - 6, oy - 1.5, oy + ph + 1.5, oy + ph + 6] : [oy, oy + 3, oy + ph - 3, oy + ph]; c.moveTo(x, a[0]); c.lineTo(x, a[1]); c.moveTo(x, a[2]); c.lineTo(x, a[3]); c.stroke(); c.restore(); }
        },
      }));
      return R;
    }
    const b = o.fmt === 'kdp' ? (o.kdpBleed ? 3 : 0) : o.fmt === 'print' ? (o.bleed ? 3 : 0) : 0;
    const sheet = o.fmt === 'print' ? o.sheet : 'atual', marks = o.fmt === 'print' && cut;
    for (const k of ['A4', 'Carta']) R.fits[k] = pgs.every((p) => { const [a, c] = p.w > p.h ? [SZ[k][1], SZ[k][0]] : SZ[k]; return p.w + 2 * b <= a + 0.5 && p.h + 2 * b <= c + 0.5; });
    if (o.fmt === 'tablet' && o.spread) {
      let i = 0;
      const single = (p) => jobs.push({ w: p.w, h: p.h, pids: [p.id], links: () => pageLinks(p), draw: (c, k) => drawPage(c, p, k, 0, 0) });
      if (S.meta.coverAlone !== false && pgs[0] === S.pages[S.order[0]]) { single(pgs[0]); i = 1; }
      for (; i < pgs.length; i += 2) {
        const a = pgs[i], d = pgs[i + 1]; if (!d) { single(a); break; }
        jobs.push({ w: a.w + d.w, h: Math.max(a.h, d.h), pids: [a.id, d.id], links: () => [...pageLinks(a), ...pageLinks(d).map((L) => ({ ...L, x: L.x + a.w }))], draw: (c, k) => { drawPage(c, a, k, 0, 0); drawPage(c, d, k, a.w * k, 0); } });
      }
      return R;
    }
    for (const p of pgs) {
      let W, H, ox, oy;
      if (sheet === 'atual') { const pad = b + (marks ? 6 : 0); W = p.w + 2 * pad; H = p.h + 2 * pad; ox = oy = pad; }
      else { let [sw, sh] = SZ[sheet]; if (p.w > p.h) [sw, sh] = [sh, sw]; W = sw; H = sh; ox = (W - p.w) / 2; oy = (H - p.h) / 2; }
      jobs.push({ w: W, h: H, pids: [p.id], links: () => pageLinks(p).map((L) => ({ ...L, x: L.x + ox, y: L.y + oy })), draw: (c, k) => { drawPage(c, p, k, ox * k, oy * k, { bleed: b }); if (marks) cuts(c, k, ox, oy, p.w, p.h, b, col); } });
    }
    return R;
  }

  /* ---------- gerar o arquivo ---------- */
  async function generate(o, prog) {
    const B = build(o); if (!B.jobs.length) throw new Error('Não há páginas para exportar.');
    prog(0, 'Preparando imagens e fontes…'); await prep(B.pgs);
    const pxmm = o.dpi / 25.4, pos = new Map(); B.jobs.forEach((j, i) => j.pids.forEach((id) => pos.set(id, i)));
    const linksOf = (j, i) => (o.links && o.fmt !== 'booklet') ? j.links().map((L) => ({ ...L, t: pos.get(L.to) })).filter((L) => L.t != null && L.t !== i) : [];
    const name = () => fileBase() + ({ print: '', tablet: '-tablet', kdp: '-kdp', booklet: '-cadernos' }[o.fmt] || '');
    if (o.fmt === 'png') {
      const p = S.pages[S.order[S.cur]], cv = document.createElement('canvas'), c = cv.getContext('2d');
      cv.width = Math.round(p.w * pxmm); cv.height = Math.round(p.h * pxmm); drawPage(c, p, pxmm);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png')); const r = await saveFile(`${fileBase()}-pagina-${S.cur + 1}.png`, blob);
      return prog(1, r === 'ok' ? 'Imagem salva.' : 'Download cancelado.');
    }
    let blob, note = '';
    if (o.vec && window.Vetor) {
      const V = window.Vetor, dry = new V.Doc({ dry: true }); B.jobs.forEach((j) => j.draw(dry.page(j.w, j.h), 1));
      prog(0.02, 'Conferindo as fontes usadas…');
      const userFonts = S.lib.filter((x) => x.kind === 'font' && x.family).map((x) => ({ family: x.family, load: async () => (await fetch(srcUrl(x.src))).arrayBuffer() }));
      const missing = await V.loadFonts(dry.reqs, userFonts, (f) => prog(0.02 + f * 0.2, 'Baixando fontes para embutir no PDF…'));
      const doc = new V.Doc({ title: S.meta.name || 'Miolo' }); V.useLoaded(doc, dry.reqs);
      for (let i = 0; i < B.jobs.length; i++) {
        const j = B.jobs[i]; j.draw(doc.page(j.w, j.h), 1);
        for (const L of linksOf(j, i)) doc.link(i, L.x, L.y, L.w, L.h, L.t);
        prog(0.22 + 0.7 * (i + 1) / B.jobs.length, `Folha ${i + 1} de ${B.jobs.length}…`); if (i % 4 === 3) await tick();
      }
      prog(0.95, 'Montando o arquivo…'); await tick(); blob = await doc.finish();
      if (doc.failedText) note = ` ${doc.failedText} texto(s) viraram imagem porque a fonte${missing.size ? ' (' + [...missing].slice(0, 3).join(', ') + ')' : ''} não pôde ser embutida.`;
    } else {
      if (!window.jspdf) throw new Error('O gerador de PDF não carregou. Recarregue a página e tente de novo.');
      const { jsPDF } = window.jspdf; let doc = null; const cv = document.createElement('canvas'), c = cv.getContext('2d');
      for (let i = 0; i < B.jobs.length; i++) {
        const j = B.jobs[i], or = j.w > j.h ? 'l' : 'p';
        if (!doc) doc = new jsPDF({ unit: 'mm', format: [j.w, j.h], orientation: or, compress: true }); else doc.addPage([j.w, j.h], or);
        cv.width = Math.round(j.w * pxmm); cv.height = Math.round(j.h * pxmm); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, cv.width, cv.height);
        j.draw(c, pxmm); doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, j.w, j.h, undefined, 'FAST');
        for (const L of linksOf(j, i)) doc.link(L.x, L.y, L.w, L.h, { pageNumber: L.t + 1 });
        prog((i + 1) / B.jobs.length, `Folha ${i + 1} de ${B.jobs.length}…`); if (i % 2 === 1) await tick();
      }
      prog(1, 'Montando o arquivo…'); await tick(); blob = doc.output('blob');
    }
    const r = await saveFile(name() + '.pdf', blob);
    prog(1, r === 'ok' ? `PDF salvo (${(blob.size / 1048576).toFixed(1)} MB).${note}` : 'Download cancelado.');
    if (B.extra) toast(`${B.extra} página(s) de outro tamanho ficaram de fora do caderno.`);
  }

  /* ---------- ícones dos cartões ---------- */
  const tick4 = (x, y, w, h) => `<path d="M${x - 3} ${y}h-4M${x} ${y - 3}v-4M${x + w + 3} ${y}h4M${x + w} ${y - 3}v-4M${x - 3} ${y + h}h-4M${x} ${y + h + 3}v4M${x + w + 3} ${y + h}h4M${x + w} ${y + h + 3}v4" stroke="currentColor" stroke-width="1" fill="none"/>`;
  const pg = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="currentColor" opacity=".18"/>`;
  const ICON = {
    atual: '<svg viewBox="0 0 80 56">' + pg(26, 9, 28, 38) + tick4(26, 9, 28, 38) + '</svg>',
    A4: '<svg viewBox="0 0 80 56"><rect x="14" y="3" width="52" height="50" rx="2" fill="none" stroke="currentColor"/>' + pg(30, 12, 20, 32) + tick4(30, 12, 20, 32) + '</svg>',
    Carta: '<svg viewBox="0 0 80 56"><rect x="12" y="6" width="56" height="44" rx="2" fill="none" stroke="currentColor"/>' + pg(30, 14, 20, 28) + tick4(30, 14, 20, 28) + '</svg>',
    dupla: '<svg viewBox="0 0 80 56"><rect x="8" y="6" width="64" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/>' + pg(15, 12, 24, 32) + pg(41, 12, 24, 32) + '</svg>',
    unica: '<svg viewBox="0 0 80 56"><rect x="22" y="3" width="36" height="50" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/>' + pg(28, 9, 24, 36) + '</svg>',
    com: '<svg viewBox="0 0 80 56"><rect x="20" y="6" width="40" height="44" fill="currentColor" opacity=".12"/>' + pg(25, 11, 30, 34) + '<path d="M25 11v34h30V11z" fill="none" stroke="currentColor" stroke-dasharray="2 2"/></svg>',
    sem: '<svg viewBox="0 0 80 56">' + pg(26, 9, 28, 38) + '</svg>',
  };

  /* ---------- a tela ---------- */
  function exportModal() {
    const o = Object.assign({ fmt: 'print', sheet: 'atual', spread: true, kdpBleed: true, bleed: false, hideCut: false, cut: '#D3D3D3', links: true, vec: true, dpi: 200, sheets: 4 }, rd(), { range: 'all', from: 1, to: S.order.length });
    let idx = 0, token = 0, showAll = false;
    modal(`<div class="xroot">
      <div class="xhead"><div><h2>Exportar</h2><p class="hint" id="xSub"></p></div><button class="btn ghost" data-close aria-label="Fechar">✕</button></div>
      <div class="xgrid">
        <section class="xprev"><div class="xph">O QUE VOCÊ VAI RECEBER</div>
          <div class="xstage"><canvas id="xCv"></canvas><div id="xAll" class="xall" hidden></div></div>
          <div class="xnav"><button class="btn sm ghost" id="xPrev" aria-label="Anterior">‹</button><b id="xCnt"></b><button class="btn sm ghost" id="xNext" aria-label="Próxima">›</button><span class="hint" id="xInfo"></span><button class="btn sm" id="xView">Ver todas</button></div>
        </section>
        <section class="xopts">
          <h3>FORMATO</h3><div class="segf xfmt" id="xFmt">${FMT.map(([k, n]) => `<button data-f="${k}">${n}</button>`).join('')}</div>
          <div id="xSizeBox"><h3 id="xSizeH">TAMANHO DO PAPEL</h3><div class="xcards" id="xCards"></div><p class="hint" id="xNote"></p></div>
          <div id="xCutBox"><h3>LINHAS DE CORTE</h3><div class="xcut"><label class="chk"><input type="checkbox" id="xHide"> Ocultar linhas de corte</label><input type="color" id="xCol" aria-label="Cor das linhas de corte"><input type="text" id="xHex" maxlength="7" aria-label="Cor em hexadecimal"></div></div>
          <div id="xRangeBox"><h3>PÁGINAS</h3><div class="xrow"><select id="xRange"><option value="all">Todas (${S.order.length})</option><option value="cur">Só a atual (${S.cur + 1})</option><option value="custom">Intervalo…</option></select><span id="xFromTo" hidden>de <input type="number" id="xFrom" min="1" max="${S.order.length}"> até <input type="number" id="xTo" min="1" max="${S.order.length}"></span></div></div>
          <details class="xadv"><summary>Mais opções</summary>
            <label class="chk"><input type="checkbox" id="xLinks"> Links clicáveis entre páginas (GoodNotes, Notability, Xodo)</label>
            <label class="chk" id="xBleedL"><input type="checkbox" id="xBleed"> Sangria de 3 mm</label>
            <label class="f" id="xSheetsL">Folhas por caderno<select id="xSheets">${[1, 2, 3, 4, 5, 6, 8].map((n) => `<option value="${n}">${n} folha${n > 1 ? 's' : ''} · ${n * 4} páginas</option>`).join('')}</select></label>
            <label class="f">Tipo de PDF<select id="xVec"><option value="1">Vetorial · letras e formas nítidas em qualquer zoom</option><option value="0">Imagem · como antes (mais pesado)</option></select></label>
            <label class="f" id="xDpiL">Resolução<select id="xDpi"><option value="150">150 dpi · leve</option><option value="200">200 dpi · equilíbrio</option><option value="300">300 dpi · gráfica</option></select></label>
          </details>
          <div id="xWarn" class="sum" hidden></div>
        </section>
      </div>
      <div class="xfoot"><div class="prog" id="xProg" hidden><i></i></div><p class="hint" id="xMsg"></p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-close>Fechar</button><button class="btn pri" id="xGo">Exportar PDF</button></div></div>
    </div>`, (b, close) => {
      const g = (q) => $(q, b);
      const fmtName = () => (FMT.find((f) => f[0] === o.fmt) || [])[1];
      const prep0 = async () => { try { await prep(pagesSel(Object.assign({}, o, { range: 'all' }))); } catch (e) { /* segue sem */ } };
      const cardsFor = () => {
        if (o.fmt === 'print') return [['atual', 'Tamanho atual'], ['A4', 'A4'], ['Carta', 'Carta (US Letter)']];
        if (o.fmt === 'booklet') return [['atual', 'Tamanho atual'], ['A4', 'A4']];
        if (o.fmt === 'tablet') return [['dupla', 'Página dupla', 'Links no PDF'], ['unica', 'Página única']];
        if (o.fmt === 'kdp') return [['com', 'Com sangria (3 mm)'], ['sem', 'Sem sangria']];
        return [];
      };
      const isOn = (k) => o.fmt === 'tablet' ? (k === 'dupla') === o.spread : o.fmt === 'kdp' ? (k === 'com') === o.kdpBleed : o.sheet === k;
      const pick = (k) => { if (o.fmt === 'tablet') o.spread = k === 'dupla'; else if (o.fmt === 'kdp') o.kdpBleed = k === 'com'; else o.sheet = k; };
      const sync = () => {
        const B = build(o), n = B.jobs.length, p0 = B.pgs[0];
        // cartões
        const cs = cardsFor();
        g('#xSizeBox').hidden = !cs.length;
        g('#xCards').innerHTML = cs.map(([k, n2, badge]) => {
          const off = (o.fmt === 'print' || o.fmt === 'booklet') && (k === 'A4' || k === 'Carta') && B.fits && B.fits[k] === false;
          const lab = k === 'atual' && p0 ? `${n2} · ${o.fmt === 'booklet' ? B.main : sizeName(p0.w, p0.h)}` : n2;
          return `<button class="xcard${isOn(k) ? ' on' : ''}" data-k="${k}"${off ? ' disabled title="A página não cabe nesse papel"' : ''}><span class="xic">${ICON[k]}</span><span class="xlb">${lab}</span>${badge ? `<span class="xbadge">${badge}</span>` : ''}</button>`;
        }).join('');
        if ((o.fmt === 'print' || o.fmt === 'booklet') && B.fits && B.fits[o.sheet] === false) { o.sheet = 'atual'; return sync(); }
        g('#xSizeH').textContent = o.fmt === 'tablet' ? 'ESTILO DO ARQUIVO' : o.fmt === 'kdp' ? 'SANGRIA' : o.fmt === 'booklet' ? 'PAPEL DA FOLHA' : 'TAMANHO DO PAPEL';
        g('#xNote').textContent = o.fmt === 'booklet' && B.main ? `Usa as páginas ${B.main} (${B.sizes[B.main]}). Cada folha tem o dobro da largura da página. Imprima frente e verso virando pela borda curta; páginas em branco completam o último caderno.` : o.fmt === 'tablet' ? 'Dupla: duas páginas lado a lado, como no editor. Única: uma página por tela.' : o.fmt === 'kdp' ? 'A Amazon KDP pede sangria de 3 mm nas bordas.' : o.fmt === 'png' ? 'Gera uma imagem PNG da página atual.' : '';
        g('#xCutBox').hidden = !(o.fmt === 'print' || o.fmt === 'booklet');
        g('#xRangeBox').hidden = o.fmt === 'png';
        g('#xBleedL').hidden = o.fmt !== 'print'; g('#xSheetsL').hidden = o.fmt !== 'booklet';
        g('#xDpiL').hidden = o.vec && o.fmt !== 'png';
        $$('#xFmt button', b).forEach((x) => x.classList.toggle('on', x.dataset.f === o.fmt));
        g('#xGo').textContent = o.fmt === 'png' ? 'Exportar imagem' : 'Exportar PDF';
        g('#xSub').textContent = p0 ? `${o.fmt === 'png' ? 1 : B.pgs.length} página${B.pgs.length > 1 && o.fmt !== 'png' ? 's' : ''} · ${sizeName(p0.w, p0.h)} · ${Math.round(p0.w * 10) / 10} × ${Math.round(p0.h * 10) / 10} mm` : '';
        if (idx >= n) idx = Math.max(0, n - 1);
        g('#xCnt').textContent = n ? `${o.fmt === 'booklet' ? 'Folha' : 'Página'} ${idx + 1} de ${n}` : '';
        g('#xInfo').textContent = n ? `${Math.round(B.jobs[idx].w * 10) / 10} × ${Math.round(B.jobs[idx].h * 10) / 10} mm` : '';
        g('#xView').textContent = showAll ? 'Voltar' : `Ver todas (${n})`; g('#xView').hidden = n < 2 || o.fmt === 'png';
        g('#xPrev').hidden = g('#xNext').hidden = n < 2 || showAll;
        g('#xCnt').hidden = showAll;
        warn(); paint(B);
      };
      const paint = (B) => {
        const my = ++token, st = g('.xstage'), cv = g('#xCv'), all = g('#xAll'); cv.hidden = showAll; all.hidden = !showAll;
        const draw = (j, c, wpx, hpx) => { const k = Math.min(wpx / j.w, hpx / j.h), d = window.devicePixelRatio || 1; c.width = Math.round(j.w * k * d); c.height = Math.round(j.h * k * d); c.style.width = j.w * k + 'px'; c.style.height = j.h * k + 'px'; const x = c.getContext('2d'); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); j.draw(x, k * d); };
        if (!B.jobs.length) return;
        if (!showAll) { const j = B.jobs[o.fmt === 'png' ? 0 : idx]; if (o.fmt === 'png') { const p = S.pages[S.order[S.cur]]; draw({ w: p.w, h: p.h, draw: (x, k) => drawPage(x, p, k) }, cv, st.clientWidth - 40, 300); } else draw(j, cv, st.clientWidth - 40, 300); return; }
        all.innerHTML = B.jobs.slice(0, 80).map((j, i) => `<button class="xth${i === idx ? ' on' : ''}" data-i="${i}"><canvas></canvas><span>${i + 1}</span></button>`).join('');
        const cvs = $$('canvas', all); let i = 0;
        const step = () => { if (my !== token) return; for (let n = 0; n < 4 && i < cvs.length; n++, i++) draw(B.jobs[i], cvs[i], 96, 130); if (i < cvs.length) setTimeout(step, 0); }; step();
        $$('.xth', all).forEach((x) => { x.onclick = () => { idx = +x.dataset.i; showAll = false; sync(); }; });
      };
      const warn = () => {
        const W = g('#xWarn'), ids = new Set(S.order), inSel = new Set(pagesSel(o).map((p) => p.id)), L = scanLinks().filter((l) => inSel.has(l.id));
        const broken = o.fmt === 'png' ? [] : L.filter((l) => !ids.has(l.to)), out = (o.fmt !== 'png' && o.fmt !== 'booklet' && o.links) ? L.filter((l) => ids.has(l.to) && !inSel.has(l.to)) : [];
        if (!broken.length && !out.length) { W.hidden = true; W.innerHTML = ''; W._h = ''; return; }
        const ex = (a) => [...new Set(a.map((l) => S.order.indexOf(l.id) + 1))].slice(0, 8).join(', ');
        const html = (broken.length ? `<b>${broken.length} link${broken.length > 1 ? 's' : ''} sem destino</b><span class="hint">Levam a páginas que já não existem (nas páginas ${ex(broken)}). Ficariam sem efeito no PDF.</span><button class="btn sm" id="xFix">Remover links quebrados</button>` : '') + (out.length ? `<b>${out.length} link${out.length > 1 ? 's' : ''} para fora do intervalo</b><span class="hint">Apontam para páginas que não vão neste arquivo (páginas ${ex(out)}). Escolha “Todas” para mantê-los funcionando.</span>` : '');
        W.hidden = false; if (W._h === html) return; W._h = html; W.innerHTML = html;
        const fx = g('#xFix'); if (fx) fx.onclick = () => { fixLinks(broken); warn(); toast(`${broken.length} link(s) removido(s).`); };
      };
      // preenche os controles
      g('#xHide').checked = o.hideCut; g('#xCol').value = o.cut; g('#xHex').value = o.cut; g('#xLinks').checked = o.links; g('#xBleed').checked = o.bleed; g('#xSheets').value = o.sheets; g('#xVec').value = o.vec ? '1' : '0'; g('#xDpi').value = o.dpi; g('#xFrom').value = 1; g('#xTo').value = S.order.length;
      const onO = () => { wr(o); sync(); };
      $$('#xFmt button', b).forEach((x) => { x.onclick = () => { o.fmt = x.dataset.f; if (o.fmt === 'print' || o.fmt === 'booklet') o.sheet = o.sheet === 'Carta' && o.fmt === 'booklet' ? 'atual' : o.sheet; idx = 0; showAll = false; onO(); }; });
      g('#xCards').onclick = (e) => { const c = e.target.closest('.xcard'); if (!c || c.disabled) return; pick(c.dataset.k); idx = 0; onO(); };
      g('#xHide').onchange = (e) => { o.hideCut = e.target.checked; onO(); };
      g('#xCol').oninput = (e) => { o.cut = e.target.value; g('#xHex').value = o.cut; onO(); };
      g('#xHex').oninput = (e) => { const v = e.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) { o.cut = v; g('#xCol').value = v; onO(); } };
      g('#xLinks').onchange = (e) => { o.links = e.target.checked; onO(); }; g('#xBleed').onchange = (e) => { o.bleed = e.target.checked; onO(); };
      g('#xSheets').onchange = (e) => { o.sheets = +e.target.value; idx = 0; onO(); }; g('#xVec').onchange = (e) => { o.vec = e.target.value === '1'; onO(); }; g('#xDpi').onchange = (e) => { o.dpi = +e.target.value; wr(o); };
      g('#xRange').onchange = (e) => { o.range = e.target.value; g('#xFromTo').hidden = o.range !== 'custom'; idx = 0; sync(); };
      g('#xFrom').oninput = (e) => { o.from = +e.target.value || 1; idx = 0; sync(); }; g('#xTo').oninput = (e) => { o.to = +e.target.value || 1; idx = 0; sync(); };
      g('#xPrev').onclick = () => { idx = Math.max(0, idx - 1); sync(); }; g('#xNext').onclick = () => { idx++; sync(); };
      g('#xView').onclick = () => { showAll = !showAll; sync(); };
      g('#xGo').onclick = async () => {
        const btn = g('#xGo'); btn.disabled = true; $('#modal').dataset.lock = 1;
        try { await generate(o, (f, msg) => { g('#xProg').hidden = false; g('#xProg i').style.width = Math.round(f * 100) + '%'; g('#xMsg').textContent = msg; }); }
        catch (e) { console.error(e); g('#xMsg').textContent = e && e.message ? e.message : 'Algo deu errado ao gerar o arquivo.'; }
        finally { btn.disabled = false; delete $('#modal').dataset.lock; }
      };
      sync(); prep0().then(() => sync());
    });
  }
  window.exportModal = exportModal;
  window.Exportar = { build, generate };
  const bt = document.getElementById('bExport'); if (bt) bt.onclick = exportModal;
})();
