/* =====================================================================
   Aparência do Estúdio: as mesmas escolhas do app do ateliê (modo, paletas,
   cores livres, fontes e tamanho das letras).
   Usa o MESMO registro do app ('craft-notes:tema' no navegador), então os dois
   apps acompanham o que você escolher em qualquer um deles neste aparelho.
   ===================================================================== */
'use strict';
const Apar = (() => {
  const CHAVE = 'craft-notes:tema';
  const PALETAS = [
    { id: 'marca', nome: 'Lavanda e azul pervinca (marca)', principal: '#9168A0', principalEscuro: '#C398C8', apoio: '#92A8D1', menu: '#4A4E79', fundo: '#FBF7F4', fundoEscuro: '#1E1726' },
    { id: 'rosa', nome: 'Lilás suave e rosa', principal: '#8A5BB0', principalEscuro: '#B48AD8', apoio: '#F3D9EC', menu: '#4A4E79' },
    { id: 'menta', nome: 'Azul e verde menta', principal: '#2F6DB3', principalEscuro: '#6FA8E8', apoio: '#D3F0E4', menu: '#4A4E79' },
    { id: 'sakura', nome: 'Sakura (rosa cerejeira)', principal: '#B65C85', principalEscuro: '#E7A6BE', apoio: '#F1CDD9', menu: '#5A3A52' },
    { id: 'salvia', nome: 'Sálvia (verde azulado)', principal: '#4F7F8C', principalEscuro: '#98B1C2', apoio: '#CFE0D6', menu: '#33505A' },
    { id: 'mel', nome: 'Mel (dourado suave)', principal: '#A6702D', principalEscuro: '#D8A776', apoio: '#F3E2C7', menu: '#5B4632' },
    { id: 'oceano', nome: 'Oceano (azul profundo)', principal: '#35609A', principalEscuro: '#8FA8D2', apoio: '#BFD4EC', menu: '#24385C' },
    { id: 'ameixa', nome: 'Ameixa (roxo e rosa)', principal: '#7A3E6E', principalEscuro: '#C58AB8', apoio: '#EBCFE3', menu: '#3C2244' },
    { id: 'pessego', nome: 'Pêssego (coral suave)', principal: '#C0605A', principalEscuro: '#EFA59F', apoio: '#F9D9CF', menu: '#5E3A3A' },
    { id: 'grafite', nome: 'Grafite (neutro)', principal: '#5B6275', principalEscuro: '#A9B1C7', apoio: '#DDE1EA', menu: '#2B2F3C' },
  ];
  const FONTES_CORPO = [
    { id: 'nunito', nome: 'Nunito (padrão)', familia: "'Nunito', system-ui, sans-serif", google: 'Nunito:wght@400;700' },
    { id: 'quicksand', nome: 'Quicksand', familia: "'Quicksand', system-ui, sans-serif", google: 'Quicksand:wght@400;500;600;700' },
    { id: 'comfortaa', nome: 'Comfortaa', familia: "'Comfortaa', system-ui, sans-serif", google: 'Comfortaa:wght@400;700' },
    { id: 'lato', nome: 'Lato', familia: "'Lato', system-ui, sans-serif", google: 'Lato:wght@400;700' },
    { id: 'dmsans', nome: 'DM Sans', familia: "'DM Sans', system-ui, sans-serif", google: 'DM+Sans:wght@400;500;700' },
    { id: 'mulish', nome: 'Mulish', familia: "'Mulish', system-ui, sans-serif", google: 'Mulish:wght@400;600;700' },
    { id: 'atkinson', nome: 'Atkinson (leitura fácil)', familia: "'Atkinson Hyperlegible', system-ui, sans-serif", google: 'Atkinson+Hyperlegible:wght@400;700' },
    { id: 'sistema', nome: 'Fonte do aparelho', familia: "system-ui, -apple-system, 'Segoe UI', sans-serif", google: '' },
  ];
  const FONTES_TITULO = [
    { id: 'quicksand', nome: 'Quicksand (padrão)', familia: "'Quicksand', 'Nunito', sans-serif", google: 'Quicksand:wght@500;600;700' },
    { id: 'nunito', nome: 'Nunito', familia: "'Nunito', sans-serif", google: 'Nunito:wght@400;700' },
    { id: 'comfortaa', nome: 'Comfortaa', familia: "'Comfortaa', sans-serif", google: 'Comfortaa:wght@400;700' },
    { id: 'fredoka', nome: 'Fredoka', familia: "'Fredoka', sans-serif", google: 'Fredoka:wght@500;600;700' },
    { id: 'playfair', nome: 'Playfair Display (clássica)', familia: "'Playfair Display', serif", google: 'Playfair+Display:wght@500;600;700' },
    { id: 'lora', nome: 'Lora (clássica)', familia: "'Lora', serif", google: 'Lora:wght@500;600;700' },
    { id: 'cormorant', nome: 'Cormorant Garamond (elegante)', familia: "'Cormorant Garamond', serif", google: 'Cormorant+Garamond:wght@500;600;700' },
  ];
  const FONTES_SCRIPT = [
    { id: 'greatvibes', nome: 'Great Vibes (marca)', familia: "'Great Vibes', cursive", google: 'Great+Vibes' },
    { id: 'alexbrush', nome: 'Alex Brush', familia: "'Alex Brush', cursive", google: 'Alex+Brush' },
    { id: 'allura', nome: 'Allura', familia: "'Allura', cursive", google: 'Allura' },
    { id: 'parisienne', nome: 'Parisienne', familia: "'Parisienne', cursive", google: 'Parisienne' },
    { id: 'sacramento', nome: 'Sacramento', familia: "'Sacramento', cursive", google: 'Sacramento' },
    { id: 'dancing', nome: 'Dancing Script', familia: "'Dancing Script', cursive", google: 'Dancing+Script:wght@400;700' },
    { id: 'satisfy', nome: 'Satisfy', familia: "'Satisfy', cursive", google: 'Satisfy' },
  ];
  const TEXTO_MINIMO = 3, ESCALA_MIN = 85, ESCALA_MAX = 140;
  const FUNDO_CLARO = '#FBF7F4', FUNDO_ESCURO = '#1E1726', MENU_ESCURO = '#150F1B', TEXTO_ESCURO = '#3E3550';
  const PADRAO = { modo: 'automatico', paletaId: 'marca' };
  const achar = (lista, id) => lista.find((f) => f.id === id) || lista[0];
  const escalaDe = (p) => (typeof p.escalaFonte === 'number' && Number.isFinite(p.escalaFonte) ? Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Math.round(p.escalaFonte))) : 100);

  /* ---------- cores ---------- */
  const rgb = (hex) => { const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const luminancia = (hex) => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const lumWcag = (hex) => { const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contraste = (a, b) => { const [x, y] = [lumWcag(a), lumWcag(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const textoSobre = (hex) => (contraste(hex, '#FFFFFF') >= contraste(hex, TEXTO_ESCURO) ? '#FFFFFF' : TEXTO_ESCURO);
  const misturar = (a, b, t) => { const [x, y] = [rgb(a), rgb(b)]; return '#' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join(''); };
  const modoEfetivo = (modo, sis) => (modo === 'automatico' ? (sis ? 'escuro' : 'claro') : modo);
  const fundoDaPaleta = (p, escuro) => (escuro ? p.fundoEscuro || misturar(FUNDO_ESCURO, p.principalEscuro, 0.1) : p.fundo || misturar(FUNDO_CLARO, p.apoio, 0.28));

  function variaveis(p, sistemaEscuro) {
    const escuro = modoEfetivo(p.modo, sistemaEscuro) === 'escuro';
    const base = PALETAS.find((x) => x.id === p.paletaId) || PALETAS[0];
    const principal = p.principalLivre || (escuro ? base.principalEscuro : base.principal);
    const apoio = p.apoioLivre || base.apoio;
    const menu = p.menuLivre || (escuro ? MENU_ESCURO : base.menu);
    const menuAtivo = escuro ? misturar(principal, MENU_ESCURO, 0.62) : principal;
    const cor = {
      fundo: escuro ? FUNDO_ESCURO : FUNDO_CLARO, cartao: escuro ? '#2A2036' : '#FFFFFF', texto: escuro ? '#F3ECF5' : '#3E3550',
      suave: escuro ? '#B9AFC6' : '#6B6280', linha: escuro ? '#3A2E48' : '#F0E3E6', borda: escuro ? '#4C3E5C' : '#DCCBD3', neutro: escuro ? '#33283F' : '#F7E5E7',
    };
    const fundoDePaleta = (escuro ? base.fundoEscuro : base.fundo) !== (escuro ? FUNDO_ESCURO : FUNDO_CLARO) ? fundoDaPaleta(base, escuro) : undefined;
    const fundoEscolhido = p.fundoLivre || fundoDePaleta;
    const fundoPorVoce = !!p.fundoLivre;
    const textoEscolhido = p.textoLivre && contraste(p.textoLivre, fundoEscolhido || cor.fundo) >= TEXTO_MINIMO ? p.textoLivre : undefined;
    if (fundoEscolhido || textoEscolhido) {
      const fundo = fundoEscolhido || cor.fundo, texto = textoEscolhido || (fundoPorVoce ? textoSobre(fundo) : cor.texto), claro = luminancia(fundo) > 0.5;
      cor.fundo = fundo; cor.texto = texto;
      cor.cartao = fundoEscolhido ? misturar(fundo, '#FFFFFF', claro ? 0.6 : 0.07) : cor.cartao;
      cor.suave = misturar(texto, fundo, 0.35); cor.linha = misturar(fundo, texto, 0.1); cor.borda = misturar(fundo, texto, 0.2); cor.neutro = misturar(fundo, texto, 0.06);
    }
    return {
      escuro, cor, principal, apoio, menu,
      css: {
        '--escala': String(escalaDe(p) / 100), '--fundo': cor.fundo, '--cartao': cor.cartao, '--texto': cor.texto, '--texto-suave': cor.suave,
        '--linha': cor.linha, '--borda': cor.borda, '--neutro': cor.neutro, '--menu': menu, '--sobre-menu': textoSobre(menu),
        '--menu-ativo': menuAtivo, '--sobre-menu-ativo': textoSobre(menuAtivo), '--principal': principal, '--sobre-principal': textoSobre(principal),
        '--apoio': escuro ? apoio + '33' : apoio, '--sobre-apoio': escuro ? apoio : '#3E3550',
        '--fonte-corpo': achar(FONTES_CORPO, p.fonteCorpo).familia, '--fonte-titulo': achar(FONTES_TITULO, p.fonteTitulo).familia, '--fonte-script': achar(FONTES_SCRIPT, p.fonteScript).familia,
      },
    };
  }

  /* ---------- estado ---------- */
  let prefs = ler();
  function ler() { try { const b = localStorage.getItem(CHAVE); if (b) return Object.assign({}, PADRAO, JSON.parse(b)); } catch (e) { /* usa o padrão */ } return Object.assign({}, PADRAO); }
  function guardar() { prefs.atualizadoEm = new Date().toISOString(); try { localStorage.setItem(CHAVE, JSON.stringify(prefs)); } catch (e) { /* ignora */ } }
  const sistemaEscuro = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const urlDasFontes = (fs) => { const ps = [...new Set(fs.map((f) => f.google).filter(Boolean))]; return ps.length ? 'https://fonts.googleapis.com/css2?' + ps.map((p) => 'family=' + p).join('&') + '&display=swap' : ''; };
  function carregarFontes(id, url) {
    const tag = 'fontes-' + id; let el = document.getElementById(tag);
    if (!url) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('link'); el.id = tag; el.rel = 'stylesheet'; document.head.appendChild(el); }
    if (el.href !== url) el.href = url;
  }

  function aplicar() {
    const v = variaveis(prefs, sistemaEscuro()), r = document.documentElement.style, c = v.cor;
    for (const [k, val] of Object.entries(v.css)) r.setProperty(k, val);
    // nomes antigos do Estúdio, ligados às mesmas cores
    const ws = v.escuro ? misturar(c.fundo, '#000000', 0.35) : misturar(c.fundo, c.texto, 0.06);
    const map = {
      '--bg': c.fundo, '--surface': c.cartao, '--raised': c.cartao, '--surface2': c.neutro, '--line': c.borda, '--text': c.texto, '--muted': c.suave, '--ink': c.texto,
      '--accent': v.principal, '--accent-fg': textoSobre(v.principal), '--ws': ws, '--ws-dot': misturar(ws, c.texto, 0.12),
      '--shadow': v.escuro ? 'rgba(0,0,0,.55)' : 'rgba(74,78,121,.20)', '--sel': v.escuro ? '#92A8D1' : '#6E8AB5', '--danger': v.escuro ? '#F08FB1' : '#B4436C',
      '--f-script': v.css['--fonte-script'], '--f-title': v.css['--fonte-titulo'], '--f-body': v.css['--fonte-corpo'],
    };
    for (const [k, val] of Object.entries(map)) r.setProperty(k, val);
    document.documentElement.dataset.theme = v.escuro ? 'dark' : 'light';
    r.colorScheme = v.escuro ? 'dark' : 'light';
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = v.menu;
    carregarFontes('estudio', urlDasFontes([achar(FONTES_CORPO, prefs.fonteCorpo), achar(FONTES_TITULO, prefs.fonteTitulo), achar(FONTES_SCRIPT, prefs.fonteScript)]));
    try { if (window.S && S.homeRepaint) S.homeRepaint(); } catch (e) { /* ainda não carregou */ }
  }
  aplicar();
  if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicar); } catch (e) { /* navegador antigo */ } }
  window.addEventListener('storage', (e) => { if (e.key === CHAVE) { prefs = ler(); aplicar(); const box = document.getElementById('aparBox'); if (box && !box.closest('[hidden]')) montar(box); } });

  /* ---------- tela "Aparência" ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bolinha = (cor) => `<span class="bol" style="background:${cor}"></span>`;
  const hex6 = (c) => String(c).slice(0, 7);
  function mudar(patch) { prefs = Object.assign({}, prefs, patch); guardar(); aplicar(); const box = document.getElementById('aparBox'); if (box) montar(box); }
  const LIMPAR = { principalLivre: undefined, apoioLivre: undefined, menuLivre: undefined, fundoLivre: undefined, textoLivre: undefined };

  function escolha(rotulo, itens, atual, attr) {
    return `<div class="escolha"><span class="escolha-rotulo">${rotulo}</span><div class="escolha-lista" role="radiogroup" aria-label="${esc(rotulo)}">${itens.map((i) => `<button type="button" role="radio" class="opc" aria-checked="${i.id === atual}" aria-pressed="${i.id === atual}" data-${attr}="${i.id}" style="${i.estilo || ''}">${i.html}</button>`).join('')}</div></div>`;
  }
  const escolhaFonte = (titulo, fontes, atual, amostra, tam, attr) => escolha(titulo, fontes.map((f) => ({ id: f.id, estilo: `font-family:${f.familia};font-size:${tam}px`, html: `${amostra} <span class="nomef">· ${esc(f.nome)}</span>` })), achar(fontes, atual).id, attr);

  function montar(box) {
    const v = variaveis(prefs, sistemaEscuro()), paleta = PALETAS.find((p) => p.id === prefs.paletaId) || PALETAS[0], escala = escalaDe(prefs);
    const legivel = contraste(v.cor.texto, v.cor.fundo) >= 4.5, recusado = !!prefs.textoLivre && contraste(prefs.textoLivre, v.cor.fundo) < TEXTO_MINIMO;
    const MODOS = [['claro', 'Claro'], ['escuro', 'Escuro'], ['automatico', 'Automático']];
    carregarFontes('opcoes', urlDasFontes([...FONTES_CORPO, ...FONTES_TITULO, ...FONTES_SCRIPT]));
    const aberto = box.querySelector('details') && box.querySelector('details').open;
    box.innerHTML = `
      <p class="suave">Estas escolhas são as mesmas do app do ateliê e ficam guardadas neste aparelho. No tablet, escolha de novo do seu jeito.</p>
      <div class="grade">
        <section class="cartao"><h2>Modo</h2>
          <div class="linha">${MODOS.map(([id, n]) => `<button class="pilula" data-modo="${id}" aria-pressed="${prefs.modo === id}">${n}</button>`).join('')}</div>
          <p class="suave peq">Automático segue o modo do aparelho. Ao trocar de modo, o fundo e o texto voltam ao padrão dele.</p></section>
        <section class="cartao"><h2>Prévia</h2>
          <div class="script prev-script">Craft Notes Unique</div>
          <h3 style="margin:4px 0">Projeto · Planner 2027</h3>
          <p style="margin:0 0 10px">Cada caderno nasce pensado pra sua história.</p>
          <div class="linha"><button class="btn pri">Exportar PDF</button><button class="btn">Abrir projeto</button><span class="etiqueta">A5</span></div></section>
      </div>
      <div class="grade" style="margin-top:16px;align-items:start">
        <section class="cartao" style="margin-top:0"><h2>Cores</h2>
          ${escolha('Paleta', PALETAS.map((p) => ({ id: p.id, html: `${bolinha(p.principal)}${bolinha(p.apoio)}${bolinha(p.menu)}${bolinha(fundoDaPaleta(p, v.escuro))}<span>${esc(p.nome)}</span>` })), paleta.id, 'pal')}
          <p class="suave peq">Cada paleta tem 4 cores: destaque, detalhes, menu lateral e plano de fundo.</p>
          <details class="recolhivel"${aberto ? ' open' : ''}><summary>Ou escolher minhas cores</summary>
            <div class="cores-livres">
              <label class="item"><input type="color" data-cor="principalLivre" value="${hex6(prefs.principalLivre || v.principal)}">Botões e destaques</label>
              <label class="item"><input type="color" data-cor="apoioLivre" value="${hex6(prefs.apoioLivre || paleta.apoio)}">Detalhes suaves</label>
              <label class="item"><input type="color" data-cor="menuLivre" value="${hex6(prefs.menuLivre || v.menu)}">Menu lateral</label>
              <label class="item"><input type="color" data-cor="fundoLivre" value="${hex6(v.cor.fundo)}">Plano de fundo</label>
              <label class="item"><input type="color" data-cor="textoLivre" value="${hex6(v.cor.texto)}">Cor do texto</label>
            </div>
            ${recusado ? '<p class="aviso">Essa cor de texto ficaria quase invisível sobre o fundo, então usei a cor automática. Escolha uma cor mais clara ou mais escura que o fundo.</p>' : (!legivel ? '<p class="aviso">Essa combinação de texto e fundo está difícil de ler. Tente uma cor de texto mais clara ou mais escura.</p>' : '')}
            <div style="margin-top:10px"><button class="btn sm" id="aparRestaurar">Restaurar</button></div>
          </details>
          <p class="suave peq">O texto sobre as cores troca sozinho entre claro e escuro para manter a leitura. No modo escuro, o menu fica escuro, a menos que você escolha uma cor para ele.</p></section>
        <section class="cartao" style="margin-top:0"><h2>Fontes</h2>
          <div class="col">
            ${escolhaFonte('Títulos', FONTES_TITULO, prefs.fonteTitulo, 'Projetos em andamento', 20, 'ft')}
            ${escolhaFonte('Texto', FONTES_CORPO, prefs.fonteCorpo, 'Cada detalhe feito à mão', 16, 'fc')}
            ${escolhaFonte('Cursiva (nome do atelier no menu)', FONTES_SCRIPT, prefs.fonteScript, 'Craft Notes Unique', 26, 'fs')}
          </div>
          <div style="margin-top:14px"><span class="escolha-rotulo">Tamanho das letras: ${escala}%</span>
            <div class="linha" style="margin-top:4px">
              <button class="btn" id="aparMenos" aria-label="Diminuir letras"${escala <= ESCALA_MIN ? ' disabled' : ''}>A−</button>
              <input type="range" id="aparEscala" aria-label="Tamanho das letras" min="${ESCALA_MIN}" max="${ESCALA_MAX}" step="5" value="${escala}" style="flex:1;min-width:120px">
              <button class="btn" id="aparMais" aria-label="Aumentar letras"${escala >= ESCALA_MAX ? ' disabled' : ''}>A+</button>
              ${escala !== 100 ? '<button class="btn" id="aparNormal">Normal</button>' : ''}
            </div></div>
          <p class="suave peq">As fontes vêm da internet. Sem conexão, o Estúdio usa uma fonte parecida até voltar. O tamanho das letras vale para os menus e telas; a página que você desenha no editor não muda.</p></section>
      </div>
      <div style="margin-top:12px"><button class="btn" id="aparPadrao">Voltar ao visual padrão da marca</button></div>`;
    box.querySelectorAll('[data-modo]').forEach((b) => b.onclick = () => mudar({ modo: b.dataset.modo, fundoLivre: undefined, textoLivre: undefined }));
    box.querySelectorAll('[data-pal]').forEach((b) => b.onclick = () => mudar(Object.assign({ paletaId: b.dataset.pal }, LIMPAR)));
    box.querySelectorAll('[data-ft]').forEach((b) => b.onclick = () => mudar({ fonteTitulo: b.dataset.ft }));
    box.querySelectorAll('[data-fc]').forEach((b) => b.onclick = () => mudar({ fonteCorpo: b.dataset.fc }));
    box.querySelectorAll('[data-fs]').forEach((b) => b.onclick = () => mudar({ fonteScript: b.dataset.fs }));
    box.querySelectorAll('[data-cor]').forEach((i) => i.onchange = () => mudar({ [i.dataset.cor]: i.value }));
    const esc2 = (n) => mudar({ escalaFonte: Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, n)) });
    box.querySelector('#aparMenos').onclick = () => esc2(escala - 5);
    box.querySelector('#aparMais').onclick = () => esc2(escala + 5);
    box.querySelector('#aparEscala').onchange = (e) => esc2(Number(e.target.value));
    const nm = box.querySelector('#aparNormal'); if (nm) nm.onclick = () => esc2(100);
    box.querySelector('#aparRestaurar').onclick = () => mudar(LIMPAR);
    box.querySelector('#aparPadrao').onclick = () => mudar(Object.assign({}, LIMPAR, { paletaId: 'marca', fonteCorpo: undefined, fonteTitulo: undefined, fonteScript: undefined, escalaFonte: undefined }));
  }
  const fechar = () => carregarFontes('opcoes', '');
  return { montar, fechar, aplicar, get prefs() { return prefs; } };
})();
