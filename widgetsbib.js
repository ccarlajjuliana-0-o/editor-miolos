/* Biblioteca de widgets — busca, categorias, abas Widgets / Salvos / Populares e widgets novos. */
(function () {
  'use strict';
  const CATS = [['mensal', 'Mensal'], ['semanal', 'Semanal'], ['diario', 'Diário'], ['tarefas', 'Tarefas'], ['notas', 'Anotações'], ['financas', 'Finanças'], ['cartoes', 'Cartões'], ['trackers', 'Trackers'], ['citacoes', 'Citações'], ['extras', 'Extras']];
  const nz = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const days = (st) => Array.from({ length: 7 }, (_, i) => DIA3[((st.ws || 0) + i) % 7]);
  const wide = (p, f) => Math.min(p.w * f, 150);
  const sty = WX.styled;
  const chk0 = chk;
  const chk1 = (x, y, w, h, n, st, o) => chk0(x, y, w, h, n, st, Object.assign({ font: st.body }, o));
  const STICKY = { amarelo: '#FBEFD5', rosa: '#F7E5E7', azul: '#E3EAF6' };

  function frameEl(w, h, id, nohd) { const e = E('rect', 0, 0, w, h, { fill: 'none', stroke: 'none', sw: 0 }); WX.applyId(e, id, { nohd: nohd !== false }); return e; }
  function sticky(p, st, cor, texto) {
    const e = tx(0, 0, 58, 58, texto, { font: st.script === 'Great Vibes' ? 'Caveat' : st.script, size: 15, color: st.pal.text, lh: 1.15, align: 'left', valign: 'top' });
    e.wx = { fr: { k: 'none', r: 1.2 }, bg: { t: 'cor', c: cor, op: 1 }, pad: 3.2, sh: 1 }; return e;
  }
  function card(p, st, w, h, id, build) {
    const f = frameEl(w, h, id), out = [f]; build(out, w, h, st); return out;
  }
  const ctext = (st, x, y, w, h, t, o) => tx(x, y, w, h, t, Object.assign({ font: st.title, size: 9, align: 'center', valign: 'middle', color: st.pal.text, lh: 1.35 }, o));

  const CAT = [];
  const C = (k, n, cats, kw, fn, o) => CAT.push(Object.assign({ k, n, cats, kw: kw || '', fn }, o || {}));

  /* ----- mensal ----- */
  C('calmes', 'Calendário do mês', ['mensal'], 'calendario mes grade', (p, st) => { const r = tplRef(); return cal(0, 0, p.w * 0.84, p.h * 0.5, st, r.y, r.m); });
  C('minical', 'Mini calendário', ['mensal', 'extras'], 'calendario pequeno', (p, st) => { const r = tplRef(); return cal(0, 0, 56, 50, st, r.y, r.m, { showTitle: true, headFill: 'none', style: 'linhas' }); });
  C('anual', 'Calendário anual', ['mensal'], 'ano 12 meses', (p, st) => ycal(0, 0, p.w * 0.84, p.h * 0.7, st, tplRef().y));
  C('metas-mes', 'Metas do mês', ['mensal', 'tarefas'], 'objetivos metas', (p, st) => sty(chk1(0, 0, wide(p, 0.7), 46, 6, st, { box: 'star', mfill: 'soft', mfc: st.pal.a }), 'Metas do mês'));
  C('foco-mes', 'Foco do mês', ['mensal', 'notas'], 'foco prioridade', (p, st) => sty(E('pattern', 0, 0, wide(p, 0.7), 40, { kind: 'lines', sp: 7, color: st.pal.line, sw: 0.3 }), 'Foco do mês'));
  /* ----- semanal ----- */
  C('sem-lista', 'Semana em lista', ['semanal'], 'dias da semana', (p, st) => sty(tbl(0, 0, wide(p, 0.78), 70, 7, ['Dia', 'Anotações'], st, { side: days(st), cw: [0.7, 3] }), 'Semana'));
  C('sem-cols', 'Semana em colunas', ['semanal'], 'sete dias colunas', (p, st) => sty(tbl(0, 0, wide(p, 0.84), 80, 5, days(st), st), 'Semana'));
  C('horas', 'Agenda por horas', ['semanal', 'diario'], 'horario agenda dia', (p, st) => E('hours', 0, 0, 60, p.h * 0.6, { from: 7, to: 20, font: st.title, color: st.pal.ink, stroke: st.pal.line, fmt: 'h', half: true }));
  C('foco-sem', 'Foco da semana', ['semanal', 'notas'], 'foco prioridades', (p, st) => sty(E('pattern', 0, 0, wide(p, 0.6), 36, { kind: 'lines', sp: 7, color: st.pal.line, sw: 0.3 }), 'Foco da semana'));
  C('refeicoes', 'Plano de refeições', ['semanal'], 'cardapio comida refeicao', (p, st) => sty(tbl(0, 0, wide(p, 0.84), 70, 7, ['Dia', 'Café', 'Almoço', 'Jantar'], st, { side: days(st), cw: [0.7, 1, 1, 1] }), 'Refeições da semana'));
  C('treino', 'Treino da semana', ['semanal', 'trackers'], 'exercicio academia', (p, st) => sty(E('habit', 0, 0, wide(p, 0.84), 44, { days: 7, rows: 5, labels: ['Alongar', 'Cardio', 'Força', 'Yoga', 'Descanso'], labelW: 0.34, font: st.title, color: st.pal.text, accent: st.pal.a, stroke: st.pal.line }), 'Treino'));
  /* ----- diário ----- */
  C('prioridades', 'Prioridades do dia', ['diario', 'tarefas'], 'prioridade importante', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 30, 3, st, { box: 'num' }), 'Prioridades'));
  C('rotina', 'Rotina do dia', ['diario', 'tarefas'], 'rotina manha noite', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 44, 6, st, { box: 'circle', lines: false }), 'Rotina'));
  C('agua', 'Copos de água', ['diario', 'trackers'], 'agua hidratacao', (p, st) => E('water', 0, 0, 60, 10, { n: 8, color: st.pal.b, fill: 'none', sw: 0.3 }));
  C('humor', 'Humor do dia', ['diario', 'trackers'], 'humor emocao', (p, st) => E('mood', 0, 0, 50, 10, { n: 5, color: st.pal.ink, sw: 0.3 }));
  C('sono', 'Horas de sono', ['diario', 'trackers'], 'sono dormir', (p, st) => E('rate', 0, 0, 56, 8, { n: 8, mk: 'circle', color: st.pal.b, sw: 0.3 }));
  C('gratidao', 'Gratidão', ['diario', 'notas'], 'gratidao agradecer', (p, st) => sty(E('pattern', 0, 0, wide(p, 0.6), 32, { kind: 'lines', sp: 7, color: st.pal.line, sw: 0.3 }), 'Sou grata por…'));
  /* ----- tarefas ----- */
  C('tarefas', 'Lista de tarefas', ['tarefas'], 'to do checklist afazeres', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 48, 6, st), 'Tarefas'));
  C('lista-bolinhas', 'Lista com bolinhas', ['tarefas', 'notas'], 'lista bullet marcador', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 44, 6, st, { box: 'dot', lines: false }), 'Lista'));
  C('lista-coracoes', 'Lista com corações', ['tarefas', 'notas'], 'lista coracao favoritos', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 44, 6, st, { box: 'heart', mfill: 'soft', mfc: st.pal.a, lines: true }), 'Meus favoritos'));
  C('lista-estrelas', 'Lista com estrelas', ['tarefas', 'notas'], 'lista estrela', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 44, 6, st, { box: 'star', mfill: 'soft', mfc: st.pal.a }), 'Destaques'));
  C('compras', 'Lista de compras', ['tarefas', 'financas'], 'mercado compras', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 64, 10, st, { box: 'rounded' }), 'Compras'));
  C('desejos', 'Lista de desejos', ['tarefas', 'financas'], 'desejo presente', (p, st) => sty(chk1(0, 0, wide(p, 0.6), 44, 6, st, { box: 'sparkle', mfill: 'soft', mfc: st.pal.a, lines: true }), 'Lista de desejos'));
  /* ----- anotações ----- */
  C('texto', 'Caixa de texto', ['notas', 'extras'], 'texto escrever', (p, st) => tx(0, 0, 60, 12, 'Escreva aqui', { font: st.body, size: 11, color: st.pal.text }), { plain: true });
  C('pautas', 'Pautas', ['notas'], 'linhas caderno', (p, st) => E('pattern', 0, 0, p.w * 0.7, 48, { kind: 'lines', sp: 7, color: st.pal.line, sw: 0.3 }));
  C('pontos', 'Pontilhado', ['notas'], 'bullet journal pontos', (p, st) => E('pattern', 0, 0, p.w * 0.7, 48, { kind: 'dots', sp: 5, color: st.pal.ink, sw: 0.2, opacity: 0.6 }));
  C('quadric', 'Quadriculado', ['notas'], 'grade quadrados', (p, st) => E('pattern', 0, 0, p.w * 0.7, 48, { kind: 'grid', sp: 5, color: st.pal.line, sw: 0.2 }));
  C('bloco', 'Bloco de notas', ['notas'], 'anotacoes notas', (p, st) => sty(E('pattern', 0, 0, wide(p, 0.7), 52, { kind: 'lines', sp: 7, color: st.pal.line, sw: 0.3 }), 'Notas'));
  C('notas-pont', 'Notas pontilhadas', ['notas'], 'bullet journal', (p, st) => sty(E('pattern', 0, 0, wide(p, 0.7), 52, { kind: 'dots', sp: 5, color: st.pal.ink, sw: 0.2, opacity: 0.55 }), 'Notas'));
  C('post-amarelo', 'Post-it mel', ['notas', 'citacoes'], 'sticky nota adesiva lembrete', (p, st) => sticky(p, st, STICKY.amarelo, 'Lembrete…'), { plain: true });
  C('post-rosa', 'Post-it rosa', ['notas', 'citacoes'], 'sticky nota adesiva', (p, st) => sticky(p, st, STICKY.rosa, 'Anote aqui…'), { plain: true });
  C('post-azul', 'Post-it azul', ['notas'], 'sticky nota adesiva', (p, st) => sticky(p, st, STICKY.azul, 'Ideia…'), { plain: true });
  /* ----- finanças ----- */
  C('orcamento', 'Orçamento mensal', ['financas'], 'orcamento gastos previsto', (p, st) => sty(tbl(0, 0, wide(p, 0.8), 74, 8, ['Categoria', 'Previsto', 'Real', 'Diferença'], st, { side: ['Moradia', 'Mercado', 'Transporte', 'Saúde', 'Lazer', 'Contas', 'Poupança', 'Outros'], cw: [1.6, 1, 1, 1] }), 'Orçamento do mês'));
  C('fluxo', 'Entradas e saídas', ['financas'], 'fluxo caixa dinheiro', (p, st) => sty(tbl(0, 0, wide(p, 0.84), 84, 10, ['Data', 'Descrição', 'Entrada', 'Saída'], st, { cw: [0.8, 2, 1, 1] }), 'Entradas e saídas'));
  C('contas', 'Contas a pagar', ['financas', 'tarefas'], 'contas boletos vencimento', (p, st) => sty(tbl(0, 0, wide(p, 0.8), 66, 8, ['Conta', 'Vence', 'Valor', 'Pago'], st, { cw: [2, 1, 1, 0.8] }), 'Contas a pagar'));
  C('poupanca52', 'Desafio 52 semanas', ['financas', 'trackers'], 'poupanca economizar desafio', (p, st) => { const w = wide(p, 0.7); return sty(E('numgrid', 0, 0, w, w / 8 * 6.6, { n: 52, cols: 8, start: 1, mk: 'rounded', color: st.pal.ink, mfc: st.pal.a, font: st.title, sw: 0.25 }), '52 semanas'); });
  C('meta-eco', 'Metas de economia', ['financas', 'trackers'], 'meta economia barra progresso', (p, st) => sty(E('progress', 0, 0, wide(p, 0.8), 34, { rows: 3, segs: 10, labels: ['Viagem', 'Reserva', 'Presente'], labelW: 0.26, font: st.title, color: st.pal.text, accent: st.pal.a, stroke: st.pal.ink, sw: 0.25 }), 'Metas de economia'));
  /* ----- cartões ----- */
  C('cartao-visita', 'Cartão de visita', ['cartoes'], 'contato nome marca', (p, st) => card(p, st, 90, 50, 'decorativo/elegante', (o, w, h) => {
    o.push(tx(6, h * 0.18, w - 12, 14, 'Seu Nome', { font: st.script, size: 22, align: 'center', valign: 'middle', color: st.pal.a, lh: 1 }));
    o.push(ctext(st, 6, h * 0.55, w - 12, 18, 'atelier criativo\n@seuinstagram · (00) 00000-0000', { size: 7.5, lh: 1.55 }));
  }), { plain: true });
  C('cartao-agradecimento', 'Cartão de agradecimento', ['cartoes'], 'obrigada obrigado agradecer', (p, st) => card(p, st, 100, 70, 'doce/sakura', (o, w, h) => {
    o.push(tx(8, 12, w - 16, 18, 'Obrigada', { font: st.script, size: 30, align: 'center', valign: 'middle', color: st.pal.a, lh: 1 }));
    o.push(E('divider', 14, 33, w - 28, 6, { text: '', font: st.title, size: 8, color: st.pal.ink, accent: '#E7A6BE' }));
    o.push(ctext(st, 10, 41, w - 20, 18, 'por fazer parte da minha história', { size: 9.5 }));
  }), { plain: true });
  C('cartao-aniversario', 'Cartão de aniversário', ['cartoes'], 'parabens aniversario festa', (p, st) => card(p, st, 100, 70, 'pop/quadrinhos', (o, w, h) => {
    o.push(ctext(st, 8, 12, w - 16, 18, 'Feliz aniversário!', { size: 17, weight: 700, color: st.pal.ink }));
    o.push(ctext(st, 10, 34, w - 20, 20, 'Que o seu dia seja cheio de cor,\ncarinho e muito bolo.', { size: 9 }));
    o.push(E('shape', w - 22, 50, 10, 10, { kind: 'brilho', fill: '#D8A776', fill2: 'none', stroke: 'none', sw: 0 }));
  }), { plain: true });
  C('cartao-casamento', 'Cartão de casamento', ['cartoes'], 'noivos casamento convite', (p, st) => card(p, st, 100, 70, 'decorativo/vintage2', (o, w, h) => {
    o.push(tx(8, 12, w - 16, 18, 'Nome & Nome', { font: st.script, size: 26, align: 'center', valign: 'middle', color: st.pal.a, lh: 1 }));
    o.push(ctext(st, 10, 33, w - 20, 22, 'convidam você para celebrar o amor\n00 de mês de 0000 · 00h', { size: 8.5, lh: 1.6 }));
  }), { plain: true });
  C('cartao-natal', 'Cartão de Natal', ['cartoes'], 'natal feliz natal', (p, st) => card(p, st, 100, 70, 'negrito/grossa', (o, w, h) => {
    o.push(tx(10, 14, w - 20, 18, 'Feliz Natal', { font: st.script, size: 28, align: 'center', valign: 'middle', color: st.pal.a, lh: 1 }));
    o.push(ctext(st, 10, 38, w - 20, 16, 'Paz, saúde e muito amor\npara o seu ano novo.', { size: 9 }));
  }), { plain: true });
  C('cartao-halloween', 'Cartão de Halloween', ['cartoes'], 'halloween docinho', (p, st) => card(p, st, 100, 70, 'bolhas/bolha', (o, w, h) => {
    o.push(ctext(st, 10, 14, w - 20, 22, 'Doce ou travessura?', { size: 16, weight: 700, color: st.pal.ink }));
    o.push(ctext(st, 10, 40, w - 20, 14, 'Feito com carinho para você', { size: 8.5 }));
  }), { plain: true });
  C('cuidados', 'Cuidados com o produto', ['cartoes'], 'cuidados instrucoes produto', (p, st) => sty(chk1(0, 0, 82, 40, 5, st, { box: 'heart', mfill: 'soft', mfc: st.pal.a, lines: false, size: 8, items: ['Evite contato com água', 'Guarde em local seco', 'Não exponha ao sol forte', 'Limpe com pano macio', 'Manuseie com carinho'] }), 'Cuidados com o seu produto', { st: 'neutro/delicado' }));
  C('etiqueta-presente', 'Etiqueta de presente', ['cartoes'], 'tag presente para de', (p, st) => card(p, st, 62, 36, 'doce/pimenta', (o, w, h) => {
    o.push(ctext(st, 6, 6, w - 12, 10, 'Para:', { size: 8, align: 'left', weight: 700 }));
    o.push(E('line', 16, 15, w - 22, 2, { stroke: st.pal.line, sw: 0.3, dash: 'solid' }));
    o.push(ctext(st, 6, 20, w - 12, 10, 'De:', { size: 8, align: 'left', weight: 700 }));
    o.push(E('line', 14, 29, w - 20, 2, { stroke: st.pal.line, sw: 0.3, dash: 'solid' }));
  }), { plain: true });
  /* ----- trackers ----- */
  C('habitos', 'Hábitos', ['trackers', 'diario'], 'habitos rotina mes', (p, st) => sty(E('habit', 0, 0, wide(p, 0.84), 58, { days: 31, rows: 7, labels: ['Beber água', 'Ler', 'Caminhar'], labelW: 0.28, font: st.title, color: st.pal.text, accent: st.pal.a, stroke: st.pal.line }), 'Hábitos do mês'));
  C('desafio31', 'Desafio 31 dias', ['trackers'], 'desafio dias mes', (p, st) => { const w = wide(p, 0.6); return sty(E('numgrid', 0, 0, w, w / 7 * 5, { n: 31, cols: 7, start: 1, mk: 'rounded', color: st.pal.ink, mfc: st.pal.a, font: st.title, sw: 0.25 }), '31 dias'); });
  C('desafio100', 'Desafio 100 dias', ['trackers'], 'cem dias desafio', (p, st) => { const w = wide(p, 0.7); return sty(E('numgrid', 0, 0, w, w, { n: 100, cols: 10, start: 1, mk: 'circle', color: st.pal.ink, mfc: st.pal.a, font: st.title, sw: 0.22 }), '100 dias'); });
  C('humor-mes', 'Humor do mês', ['trackers', 'diario'], 'humor mes cores', (p, st) => { const w = wide(p, 0.6); return sty(E('numgrid', 0, 0, w, w / 7 * 5, { n: 31, cols: 7, start: 1, mk: 'heart', color: st.pal.ink, mfc: st.pal.a, font: st.title, sw: 0.25 }), 'Humor do mês'); });
  C('leitura', 'Leitura', ['trackers'], 'livros leitura paginas', (p, st) => sty(E('progress', 0, 0, wide(p, 0.8), 36, { rows: 4, segs: 10, labels: ['Livro 1', 'Livro 2', 'Livro 3', 'Livro 4'], labelW: 0.24, font: st.title, color: st.pal.text, accent: st.pal.b, stroke: st.pal.ink, sw: 0.25 }), 'Minhas leituras'));
  C('avaliacao', 'Avaliação', ['trackers', 'diario'], 'estrelas nota avaliacao', (p, st) => E('rate', 0, 0, 56, 9, { n: 5, mk: 'star', color: st.pal.a, mfill: 'soft', mfc: st.pal.a, sw: 0.3 }));
  /* ----- citações ----- */
  C('citacao', 'Citação', ['citacoes'], 'frase citacao', (p, st) => sty(tx(0, 0, wide(p, 0.7), 18, 'Cada página nasce pensada pra sua história.', { font: st.body, size: 11, italic: true, align: 'center', valign: 'middle', color: st.pal.ink }), '', { st: 'decorativo/elegante', nohd: true }));
  C('destaque', 'Frase de destaque', ['citacoes'], 'frase script titulo', (p, st) => tx(0, 0, wide(p, 0.8), 18, 'Hoje eu escolho a leveza', { font: st.script, size: 28, align: 'center', valign: 'middle', color: st.pal.a, lh: 1 }), { plain: true });
  C('afirmacao', 'Afirmação do dia', ['citacoes', 'diario'], 'afirmacao positiva', (p, st) => sty(tx(0, 0, wide(p, 0.6), 18, 'Hoje eu me permito\ndescansar', { font: st.title, size: 11, weight: 600, align: 'center', valign: 'middle', color: st.pal.ink }), '', { st: 'doce/pirulito', nohd: true }));
  C('numero', 'Número grande', ['citacoes', 'extras'], 'numero data grande', (p, st) => tx(0, 0, 30, 16, '03', { font: st.title, size: 36, weight: 700, color: st.pal.a, valign: 'middle' }), { plain: true });
  /* ----- extras ----- */
  C('divisor', 'Divisor ♡', ['extras', 'citacoes'], 'divisor coracao separador', (p, st) => E('divider', 0, 0, p.w * 0.7, 7, { text: 'atelier criativo', font: st.title, size: 8, color: st.pal.ink, accent: '#E7A6BE' }), { plain: true });
  C('abas', 'Abas laterais', ['extras', 'mensal'], 'abas indice meses', (p, st) => { const tw = cl(Math.min(p.w, p.h) / 148 * 7, 5, 10), m = fr(p.w, p.h).m; return E('tabs', p.w - tw, m * 0.6, tw, p.h - m * 1.2, { labels: MES3.slice(), links: [], active: -1, font: st.title, color: '#3E3550', fill1: st.pal.a, fill2: st.pal.b, activeFill: '#4A4E79' }); }, { keep: true, plain: true });
  C('tabela', 'Tabela', ['extras', 'financas'], 'tabela colunas', (p, st) => sty(tbl(0, 0, wide(p, 0.75), 48, 5, ['Coluna 1', 'Coluna 2', 'Coluna 3'], st), 'Tabela'));
  C('moldura', 'Moldura vazia', ['extras'], 'moldura caixa quadro', (p, st) => sty(E('rect', 0, 0, wide(p, 0.7), 50, { fill: 'none', stroke: 'none', sw: 0 }), 'Título'));
  C('faixa-titulo', 'Faixa de título', ['extras', 'notas'], 'titulo faixa', (p, st) => sty(tx(0, 0, wide(p, 0.8), 8, 'Meu título', { font: st.title, size: 13, weight: 700, color: st.pal.ink, valign: 'middle' }), '', { st: 'minimal/plano', nohd: true }));
  C('retangulo', 'Retângulo', ['extras'], 'forma caixa', (p, st) => E('rect', 0, 0, 50, 30, { fill: st.pal.soft, stroke: st.pal.a, sw: 0.4, radius: 3 }), { plain: true });
  C('circulo', 'Círculo', ['extras'], 'forma redondo', (p, st) => E('ellipse', 0, 0, 30, 30, { fill: st.pal.soft, stroke: st.pal.a, sw: 0.4 }), { plain: true });
  C('linha', 'Linha', ['extras'], 'traco separador', (p, st) => E('line', 0, 0, 60, 2, { stroke: st.pal.ink, sw: 0.35, dash: 'solid' }), { plain: true });

  const POP_SEED = ['tarefas', 'calmes', 'habitos', 'horas', 'bloco', 'post-amarelo', 'orcamento', 'poupanca52', 'lista-coracoes', 'agua', 'citacao', 'cartao-agradecimento'];
  const ST = { tab: 'w', cat: 'todos', q: '' };

  /* ---------- inserir ---------- */
  function boxOf(els) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    els.forEach((e) => { const b = bbox(e); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function insertEls(els, keep) {
    const p = curPage(); if (!p || !els.length) return;
    if (els.length > 1) { const g = uid('g'); els.forEach((e) => { e.g = g; }); }
    if (!keep) {
      const b = boxOf(els), dx = (p.w - b.w) / 2 - b.x, dy = (p.h - b.h) / 2 - b.y;
      els.forEach((e) => { e.x = r1(e.x + dx); e.y = r1(e.y + dy); });
      if (WX.free) WX.free(p, els);
    }
    change([p.id], () => p.els.push(...els));
    S.sel = els.map((e) => e.id); redraw(); renderProps(); thumbRefresh(p.id); closeMob();
  }
  function build(k) { const it = CAT.find((x) => x.k === k); if (!it) return null; return { it, els: [].concat(it.fn(curPage(), styleOf())) }; }
  function insert(k) {
    const r = build(k); if (!r) return;
    Pref.wuse = Pref.wuse || {}; Pref.wuse[k] = (Pref.wuse[k] || 0) + 1; savePref();
    insertEls(r.els, r.it.keep);
  }
  function insertSaved(id) {
    const it = S.lib.find((x) => x.id === id); if (!it) return;
    const els = clone(it.els).map((e) => Object.assign(e, { id: uid('e'), link: null, locked: false }));
    regroup(els); insertEls(els, false);
  }
  function previewEls(cv, els, bw, bh) {
    const b = boxOf(els), k = Math.min(bw / Math.max(b.w, 1), bh / Math.max(b.h, 3)), d = window.devicePixelRatio || 1;
    cv.width = bw * d; cv.height = bh * d; const c = cv.getContext('2d'); c.setTransform(k * d, 0, 0, k * d, 0, 0);
    c.translate((bw / k - b.w) / 2 - b.x, (bh / k - b.h) / 2 - b.y); els.forEach((e) => drawEl(c, e));
  }

  /* ---------- painel ---------- */
  const catName = (id) => (CATS.find((c) => c[0] === id) || [0, id])[1];
  function filtered() {
    const q = nz(ST.q).trim();
    let list = CAT.filter((it) => (ST.cat === 'todos' || it.cats.includes(ST.cat)));
    if (q) list = CAT.filter((it) => nz(it.n + ' ' + it.kw + ' ' + it.cats.map(catName).join(' ')).includes(q));
    return list;
  }
  const wbtn = (it) => `<button class="wbtn" data-wk="${it.k}" title="${esc(it.n)}"><canvas data-wp="${it.k}"></canvas>${esc(it.n)}</button>`;
  function bodyHTML() {
    if (ST.tab === 's') {
      const sv = S.lib.filter((x) => x.kind === 'wgt'), art = S.lib.filter((x) => x.kind === 'widget');
      return `<h3>MEUS WIDGETS SALVOS</h3>${sv.length ? `<div class="wgrid">${sv.map((it) => `<div class="wsv"><button class="wbtn" data-wsv="${it.id}" title="${esc(it.name)}"><canvas data-wsp="${it.id}"></canvas>${esc(it.name)}</button><button class="x" data-wsd="${it.id}">excluir</button></div>`).join('')}</div>` : '<p class="hint">Aqui ficam os widgets que você personalizou. Selecione um widget na página e, no painel da direita, use “Salvar como widget”.</p>'}
        <div class="libsec"><div class="lhd"><h3>MINHAS ARTES</h3><span class="btn sm upl">Enviar PNG/JPEG<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" multiple data-up="widget" aria-label="Enviar widgets"></span></div>
        ${art.length ? `<div class="litems">${art.map(libItem).join('')}</div>` : '<p class="hint">Molduras, blocos de anotação ou qualquer arte sua que vira um widget reutilizável.</p>'}</div>`;
    }
    if (ST.tab === 'p') {
      const sc = (it) => (Pref.wuse && Pref.wuse[it.k] || 0) * 10 + Math.max(0, 12 - POP_SEED.indexOf(it.k)) * (POP_SEED.includes(it.k) ? 1 : 0);
      const list = CAT.slice().sort((a, b) => sc(b) - sc(a)).slice(0, 12);
      return `<h3>MAIS USADOS</h3><p class="hint">Os que você mais coloca nas páginas aparecem primeiro.</p><div class="wgrid">${list.map(wbtn).join('')}</div>`;
    }
    const list = filtered(); const q = nz(ST.q).trim();
    if (!list.length) return '<p class="hint">Nada encontrado. Tente outra palavra, como “lista”, “calendário” ou “cartão”.</p>';
    let h = '';
    if (ST.cat === 'todos' && !q) {
      CATS.forEach(([id, n]) => { const g = list.filter((it) => it.cats[0] === id); if (g.length) h += `<h3>${n.toUpperCase()}</h3><div class="wgrid">${g.map(wbtn).join('')}</div>`; });
      h += `<h3>FORMAS LIVRES</h3><div class="wgrid"><button class="wbtn" data-tool="free">${ico('pen', 'ico" style="width:40px;height:40px')}À mão livre</button><button class="wbtn" data-tool="poly">${ico('poly', 'ico" style="width:40px;height:40px')}Polígono</button><button class="wbtn" data-tool="curve">${ico('curve', 'ico" style="width:40px;height:40px')}Curva por pontos</button></div><p class="hint">Depois de desenhar, use “Editar pontos” no painel à direita.</p>`;
    } else h = `<div class="wgrid">${list.map(wbtn).join('')}</div>`;
    return h;
  }
  const html = () => `<h2>Widgets</h2>
    <input type="search" class="wsearch" id="wq" placeholder="Buscar widgets…" value="${esc(ST.q)}" aria-label="Buscar widgets">
    <div class="segf wtabs">${[['w', 'Widgets'], ['s', 'Salvos'], ['p', 'Populares']].map(([k, n]) => `<button data-wt="${k}" class="${ST.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="chips wcats"${ST.tab === 'w' ? '' : ' hidden'}>${[['todos', 'Todos']].concat(CATS).map(([k, n]) => `<button class="chip cat${ST.cat === k ? ' on' : ''}" data-wc="${k}">${n}</button>`).join('')}</div>
    <div id="wbody">${bodyHTML()}</div>`;
  function mount(P) {
    const body = $('#wbody', P);
    const paintPrev = () => {
      const st = styleOf(), p = curPage(); const list = $$('canvas[data-wp],canvas[data-wsp]', P); let i = 0;
      const step = () => {
        for (let n = 0; n < 6 && i < list.length; n++, i++) {
          const cv = list[i]; if (!cv.isConnected) continue;
          try {
            if (cv.dataset.wp) { const r = build(cv.dataset.wp); if (r) previewEls(cv, r.els.map((e) => Object.assign({}, e)), 64, 44); }
            else { const it = S.lib.find((x) => x.id === cv.dataset.wsp); if (it) previewEls(cv, it.els, 64, 44); }
          } catch (err) { console.warn(err); }
        }
        if (i < list.length) requestAnimationFrame(step);
      };
      void st; void p; step();
    };
    const wire = () => {
      $$('[data-wk]', body).forEach((b) => { b.onclick = () => insert(b.dataset.wk); });
      $$('[data-wsv]', body).forEach((b) => { b.onclick = () => insertSaved(b.dataset.wsv); });
      $$('[data-wsd]', body).forEach((b) => {
        b.onclick = async () => {
          if (!b.dataset.cf) { b.dataset.cf = 1; b.classList.add('cf'); b.textContent = 'confirmar'; return; }
          const it = S.lib.find((x) => x.id === b.dataset.wsd); if (!it) return;
          try { await Store.delLib(it); } catch (e) { /* segue */ }
          S.lib = S.lib.filter((x) => x !== it); renderPanel();
        };
      });
      $$('[data-tool]', body).forEach((b) => { b.onclick = () => startTool(b.dataset.tool); });
      mountLib(P, 'widget'); paintPrev();
    };
    const repaint = () => { body.innerHTML = bodyHTML(); wire(); };
    $$('[data-wt]', P).forEach((b) => { b.onclick = () => { ST.tab = b.dataset.wt; renderPanel(); }; });
    $$('[data-wc]', P).forEach((b) => { b.onclick = () => { ST.cat = b.dataset.wc; $$('[data-wc]', P).forEach((x) => x.classList.toggle('on', x === b)); repaint(); }; });
    $('#wq', P).oninput = (e) => { ST.q = e.target.value; if (ST.q && ST.tab !== 'w') { ST.tab = 'w'; renderPanel(); const q = $('#wq'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; } repaint(); };
    S.panelRepaint = paintPrev; wire();
  }
  PANELS.widgets = { html, mount };

  Object.assign(window.WX, { CAT, CATS, insert, insertEls, insertSaved, boxOf, previewEls });
})();
