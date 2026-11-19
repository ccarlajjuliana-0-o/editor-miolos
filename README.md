# Estúdio de Miolos · Craft Notes Unique

Editor de miolos de cadernos e planners, ligado ao app do ateliê. Funciona no navegador e no tablet (PWA), guarda tudo no próprio aparelho e, com a nuvem ligada, envia modelos e adesivos direto para o Mostruário.

## Como colocar no ar (uma vez só)

1. **Repositório novo no GitHub** com o nome `editor-miolos` (mesma visibilidade do `APP-atelier`).
2. **Enviar os arquivos:** abra o repositório novo num Codespace, arraste o zip para a pasta, e rode:
   ```
   unzip -o editor-miolos.zip
   rm editor-miolos.zip
   git add -A && git commit -m "Estúdio de Miolos" && git push
   ```
3. **Ligar o GitHub Pages:** repositório → Settings → Pages → Source: **GitHub Actions**.
4. **Variáveis (mesmas do app do ateliê):** Settings → Secrets and variables → Actions → aba **Variables** → New repository variable:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `APP_ATELIE_URL` = `https://ccarlajjuliana-0-o.github.io/APP-atelier/`
5. **Supabase → Authentication → URL Configuration → Redirect URLs:** acrescente `https://ccarlajjuliana-0-o.github.io/editor-miolos/**`
6. Abra `https://ccarlajjuliana-0-o.github.io/editor-miolos/`, clique em **Entrar na nuvem** (rodapé da página de projetos) e depois, na aba **App**, em **Enviar ao mostruário agora**.

## Cópia dos projetos na nuvem (recomendado)
1. No Supabase: **SQL Editor → New query**, cole o conteúdo de `supabase/estudio-nuvem.sql` e clique **Run** (uma vez só).
2. No Estúdio, clique em **Entrar na nuvem**. Dali em diante cada projeto é copiado sozinho para a sua conta, e aparece em qualquer aparelho em que você entrar.
3. Projetos excluídos vão para a **Lixeira**; o botão **Versões** (dentro do projeto) guarda o histórico.

## Como funciona
- Projetos, páginas, fontes e imagens ficam no navegador (IndexedDB). Use **Baixar backup** / **Restaurar backup** para levar a outro aparelho.
- O login é o mesmo do app do ateliê (mesmo endereço do GitHub Pages, mesma sessão).
- Modelos e adesivos marcados para o mostruário vão para a tabela `mostruario_itens` e para a pasta `mostruario` do Supabase; o app do ateliê busca sozinho.
- Arquivos: `index.html`, `estilo.css`, `app.js` (editor), `protecao.js` (lixeira, versões, nuvem), `recursos.js` (bordas, repetir em páginas, régua e grade, widgets de data), `sw.js` (funcionar sem internet).

## PDF vetorial

Em **Exportar → Tipo de PDF** há duas opções: *Vetorial* (padrão) e *Imagem* (o modo antigo).
No vetorial, formas, linhas e letras vão para o PDF como desenho de verdade (nítidos em qualquer zoom, texto selecionável,
links entre páginas). Imagens e adesivos entram como imagem, com transparência. O motor está em `vetor.js` e não depende de biblioteca externa.

- As fontes do Google são baixadas na hora de exportar (pacotes Fontsource, via cdn.jsdelivr.net) e guardadas no navegador para as próximas vezes.
- Fontes enviadas por você (TTF/OTF) são embutidas direto.
- Se alguma fonte não puder ser embutida, só aquele texto vira imagem (o aviso aparece no fim da exportação).
- Antes de exportar, o Estúdio avisa de links sem destino e de links para páginas fora do intervalo escolhido.

## Tela de exportação

Prévia da folha à esquerda (com "Ver todas") e, à direita, formato (Impressão, Tablet, KDP, Caderno, Imagem), tamanho do papel
(tamanho atual, A4, Carta), linhas de corte (cor e ocultar) e "Mais opções" (links, sangria, tipo de PDF). Código em `exportar.js`.

## Tamanho do projeto

O botão com o tamanho (ex.: **A5**) na barra do editor abre a janela **Tamanho do projeto**: lista por categoria (papel, cadernos e planners,
argolas, Traveller's, tablet e redes, KDP), busca, mm ou polegadas, em pé/deitado, tamanho personalizado e "ajustar o conteúdo".
Aplica em todas as páginas ou só na atual. Na exportação, **Impressão** oferece: individual ou N páginas por folha A4, Ofício ou Carta
(só aparecem os papéis em que o tamanho cabe). Código em `tamanho.js` e `exportar.js`.

## Páginas: títulos, menu e copiar design

No painel **Páginas**, cada página tem um lápis (dar um título; duplo clique no nome também renomeia) e um menu **⋯** (ou botão direito na miniatura):
adicionar antes/depois, duplicar, renomear, mover (cima, baixo, para…, primeira, última), copiar design para outras páginas, usar o design de outra e excluir.
**Inserir página** (também o “+” da tira) abre a janela com *Página vazia* ou *Cópia de uma página*, onde inserir (frente, trás, antes, depois) e, em **Mais opções**, título, quantidade, tamanho e design a copiar.


### Páginas: seleção, arrastar e miniaturas
- Marque páginas (checkbox, Shift = intervalo, Ctrl = alternar) ou "Selecionar todas"; ações em lote: copiar design, duplicar, mover, excluir.
- Arraste o ⠿ para reorganizar (grupo marcado vai junto); setas ↑ ↓ no ⠿ também movem.
- "Copiar design" escolhe o que colar: fundo, textos, imagens, formas, tabelas/calendários; opcionalmente tamanho e título.
- Modo Lista ou Miniaturas no topo do painel.


### Margens e áreas
- Propriedades da página → *Layout*: topo, base, interna, externa, lombada (total ao meio), cabeçalho e rodapé (liga/desliga), bloquear/desbloquear, remover.
- Guias tracejadas no editor com alças para arrastar; elementos encostam nas guias; o conteúdo se ajusta à nova área (desligável).
- Padrão: a página da direita do editor é a da esquerda no impresso; dá para inverter no projeto ou escolher o lado por página.
- "Copiar design" tem a opção de copiar margens, lombada, cabeçalho e rodapé.
- Margens externa/interna (e topo/base) podem ser vinculadas: mudam juntas, mantendo a proporção (externa e interna vêm vinculadas por padrão).
- Espaço para furos: 20 mm (2 cm) no lado de dentro de cada página por padrão, ajustável.
- Espaço para divisórias (topo, base ou lateral): quantidade, largura, raio e fundo; "Inserir abas na lateral" cria as abas.
- Painel de margens no estilo Planify: "As alterações valem para" (todas / só esta / selecionadas), sliders com valor, ⛓ para vincular topo/base, externa/interna e o lado de dentro das duas páginas da dupla (⛓ no meio da dupla no editor), Vincular tudo, Redefinir e unidade (mm/cm/in).
- Coluna da direita: com o Layout (ou régua/grade) ativo, a configuração da página fica recolhida numa barra com Ocultar/Expandir; ao selecionar um elemento há o botão "← Voltar" para a janela anterior.
- Barra da direita: dois cliques na seta (ou o alfinete no topo) fixam a barra, que então não fecha sozinha (nem ao selecionar/soltar objetos nem com Esc); dois cliques de novo soltam. No modo compacto, fixa ela divide espaço com a página em vez de cobri-la.

## Seleção múltipla e grupos
- Arraste no vazio da página (ou Shift+clique) para selecionar vários; Ctrl+A seleciona tudo.
- Ctrl+G agrupa, Ctrl+Shift+G desagrupa. O grupo move, duplica, exclui e alinha como um só objeto.
- Arraste um canto da caixa da seleção para redimensionar tudo na mesma proporção (inclui tamanho de fonte).

## Proteção do conteúdo nas margens
- Ao mudar margens, furos, cabeçalho/rodapé ou divisórias, o conteúdo só se move: tamanhos e fontes não mudam, e nada sai da área segura nem da página.
- Se algo não couber sem mudar de tamanho, ou passar a se sobrepor, aparece um aviso de incompatibilidade (Ctrl+Z desfaz).

## Barra rápida
Ao selecionar um objeto aparece uma barra sobre ele: para texto, fonte, tamanho, cor, negrito, itálico e alinhamento do texto; para os demais, duplicar, travar, ordem, excluir e alinhar. Com vários selecionados: agrupar/desagrupar, duplicar, excluir e alinhar entre si.

## Divisórias (abas)
Ligue em Layout → Divisórias. Elas ficam fixas na lateral externa (arredondadas para fora, espelhadas na página da direita), são iguais em todas as páginas e empurram o conteúdo para dentro. "Mais configurações" abre os textos, as cores (iguais, alternadas ou individuais), a fonte, o destaque e o plano de fundo.

## Seletor de cores
Em qualquer campo de cor abre um seletor com quadro de cor, matiz, código HEX, conta-gotas (copia uma cor da tela; onde o aparelho não tem conta-gotas, toque em um ponto da página), cores usadas na página e cores da marca.

## Avisos, seções da barra e divisórias
- Sino na barra de cima: guarda os avisos com a hora.
- Layout ligado abre a barra da direita sozinha; ao desligar ela volta a ocultar (se não estiver fixa).
- Com divisórias ligadas a barra da direita ganha seções (Configuração da página, Layout, Divisórias), cada uma com Ocultar/Expandir.
- Com divisórias, a linha da margem externa fica rente a elas e a margem de segurança 0,35 mm adiante.
- Na dupla dá para escolher a página que está sendo editada; cabeçalho e rodapé pelos botões da página valem só para ela.

## Lados: copiar e trocar entre páginas
- Botão "Lados ⌄" na barra de cima, depois do tamanho: copiar esquerda → direita, direita → esquerda, para outra página…, trocar lados da página e trocar com outra página….
- Leva tudo (fundo, estilo, textos, fontes, imagens, adesivos, formas, widgets). Com margens ligadas, o conteúdo é reposicionado na área segura da página de destino (só move, não muda tamanhos) e avisa o que não couber. Ctrl+Z desfaz de uma vez.
- Régua, grade e guias agora também têm Ocultar/Expandir no painel da direita.

## Regra do painel da direita
- Toda configuração nova que entrar na barra lateral, quando ligada/ativada, ganha o título correspondente (linha + nome) e os botões Ocultar/Expandir. Se houver mais de uma seção, a "Configuração da página" também mostra o título. Use `secBar(id, título, aberto)` em margens.js.

## Régua e guias na página dupla
- A régua mostra a numeração (em cm) em cada página da dupla e em qualquer zoom.
- Guias podem ser arrastadas da régua direto para qualquer página da dupla, sem trocar de visualização. Separadas (azuis): ficam numa página só e mudam de página se você arrastar até a outra. Contínuas (lavanda): uma guia só que atravessa as duas páginas.
- Em "Régua, grade e guias" escolha o tipo das guias novas; Shift ao arrastar usa o outro tipo; dois cliques numa guia troca entre contínua e separada.

## Importar PDF (PDF → elementos editáveis)
- Botão "Importar PDF" na tela inicial e "Importar PDF…" no painel Páginas (também dá para arrastar um PDF para a janela).
- Cada página vira uma página do editor no tamanho original. Textos (agrupados por linha/parágrafo, com cor, tamanho, negrito/itálico e rotação), formas, traços (com tracejado), retângulos e imagens viram elementos separados e editáveis, na mesma ordem de camadas.
- Fontes do PDF são trocadas por uma parecida do editor (aviso no sino). Gradientes viram cor lisa; recortes de formas não são mantidos (os retangulares de imagens sim).
- Funciona melhor com PDFs feitos por programas (Canva, Word, Illustrator, este estúdio). PDF de scanner entra como imagem.
- Leitor: pdf.js (pasta vendor/pdfjs, licença Apache-2.0), guardado junto do app para funcionar offline.

## Camadas
- Aba "Camadas": lista todos os elementos da página (o topo é o que fica na frente). Clique seleciona (Ctrl soma, Shift seleciona o intervalo); arraste pelas bolinhas ⋮⋮ para mudar a ordem (também com vários selecionados ou um grupo inteiro).
- Olho: oculta o elemento (não aparece na página nem na exportação). Cadeado: trava a posição (não move, não redimensiona e, por padrão, não é selecionado ao clicar na página; Alt + clique seleciona). Dois cliques no nome renomeiam. Grupos aparecem recolhíveis.
- Filtros (Todas / Travadas / Ocultas), busca, "Travar tudo", "Destravar tudo" e "Mostrar tudo". Tudo entra no histórico (Ctrl+Z).

## Widgets: biblioteca, estilos e personalização
- **Biblioteca** (aba Widgets): busca, categorias (Mensal, Semanal, Diário, Tarefas, Anotações, Finanças, Cartões, Trackers, Citações, Extras) e abas **Widgets / Salvos / Populares**. Arquivos: `widgetsbib.js` (catálogo e painel), `widgets.js` (motor de desenho), `estilos.js` (coleções de estilos), `widgetsprop.js` (painel da direita).
- **Todo elemento pode ter `wx`**: título (`hd`), fundo (`bg`: cor ou imagem), moldura (`fr`), margem interna (`pad`) e sombra (`sh`). Sem `wx` nada muda no desenho. As cores com `@` (`@a`, `@ink`, `@soft`…) seguem a paleta do projeto.
- **Estilos** são dados em `estilos.js` (9 coleções). O estilo padrão do projeto fica em `S.meta.style.wst` e vale para os próximos widgets; cada widget e cada página pode ter o seu.
- **Moldura da página**: `p.frame` (desenhada em `drawPage`, por cima do fundo; não mexe nas margens).
- **Marcadores** (lista, tarefas, hábitos, grade numerada, sequência de símbolos): `box`/`mk` + `mfill` + `mfc` + `msize`.
- **Camadas e sobreposição**: `pin` ('top' | 'back') e `noOver`. Widgets com `noOver` não ficam sobre outros widgets; se já estavam sobrepostos antes de mexer, não são bloqueados.
- **Salvar widget**: `S.lib` item `kind:'wgt'` com `els`.
- Tipos novos: `progress`, `numgrid`, `rate`.
- Todas as seções do painel da direita têm título e Ocultar/Expandir (regra do painel da direita).

## Menu rápido de datas e cores recolhidas
- Ao selecionar calendário do mês, calendário anual ou caixa de data, a barra rápida mostra: mês/ano com ‹ ›, início da semana, feriados e título (calendário); ano e feriados (anual); dia anterior/próximo, data e formato (caixa de data).
- Campos de cor mostram só a cor em uso; o ▾ abre a paleta e o seletor completo.

## Planner datado (agora na tela inicial)

O gerador de agenda saiu do editor: na tela de projetos, o botão **Planner datado** (ao lado de "Novo projeto") abre a janela com mês/ano de início, quantidade de meses, início da semana, tamanho e orientação do miolo, capa, tipos de página, navegação (abas, links, feriados), paleta, fontes, **estilo dos widgets** e moldura opcional nas páginas. Ao criar, vira um projeto comum: tudo o que existe no editor (widgets, estilos, molduras, divisórias, camadas, margens, desfazer) vale nele.

**Regra para o futuro:** toda regra nova que precise valer nas páginas geradas se registra em `GenHooks` (app.js): `GenHooks.push((pages, opções, meta) => { ... })`. Ela roda logo depois de as páginas serem geradas e antes de o projeto ser criado. O estilo de widgets e a moldura de página já usam esse caminho.

**Divisórias no planner datado:** usam as Divisórias do Layout (lateral externa, espelhadas na dupla, uma por mês, com link para o mês). Por serem iguais em todas as páginas, o destaque do mês atual não é automático; dá para escolher um destaque fixo em Layout → Divisórias.

## Contracapa e moldura da capa
- **Contracapa:** a última página do projeto, quando se chama "Contracapa". Na dupla ela fica sozinha (à esquerda, como a capa fica sozinha à direita), a margem interna dela fica do lado certo, e na exportação em caderno (imposição) as páginas em branco entram antes dela, para que feche o caderno. No tablet em dupla ela também sai sozinha.
- **Moldura da página:** um retângulo vazado do tamanho da folha (como a borda da capa) acompanha a área segura quando as margens são ligadas e volta ao tamanho original quando são desligadas. É a única exceção à regra "margens só movem". Elementos centralizados continuam centralizados na nova área.

## ModuLab (laboratório de componentes)
Item **ModuLab** no menu da tela de projetos. Aqui se cria, edita, duplica e exclui o que depois aparece no editor. Arquivo: `modulab.js`.

| Tipo | Guardado como | Aparece no editor em |
|---|---|---|
| Widget | `wgt` (elementos prontos, a partir de um modelo-base + estilo + título) | Widgets → Salvos |
| Borda | `bdr` (desenho, cor/imagem, traço, medidas) | Bordas → Minhas bordas |
| Tema | `tema` (paleta de 7 cores + fontes + estilo + borda + moldura) | Modelos → Temas e "Tema do projeto…" (a paleta também entra na lista de paletas) |
| Estilo | `wsty` (moldura, fundo, título, espaço, sombra) | Estilo dos widgets → coleção "Meus estilos" |
| Adesivo | `stk` (um ou cartela de formas da marca) | Adesivos → Do ModuLab |
| Coleção | `colecao` (junta temas, estilos, bordas, widgets e adesivos) | Modelos → Coleções (botão "Aplicar coleção") |
| Outro | `outro` (base pronta, a definir) | só no ModuLab |

- **Sugestões:** cada criador tem a caixa "Sugestões". A IA só **propõe** (até 3 propostas, ou a coleção completa); você escolhe uma, ela é carregada no formulário e você muda o que quiser antes de salvar.
- **Sem IA:** funciona com as cores de uma imagem enviada ou com palavras (natal, páscoa, verão, outono, inverno, primavera, flor, oceano, amor…).
- **Com IA:** "Configurar IA" guarda a chave da Anthropic só neste aparelho (a chamada vai direto do navegador). Use uma chave com limite de gasto.
- **Modelos → Tema do projeto…**: ajusta paleta, fontes, estilo dos widgets, moldura e borda de uma vez (só esta página ou todas, trocando ou não os widgets que já existem) e permite salvar o resultado como tema no ModuLab.
- Seções novas na barra lateral do editor seguem a regra de ocultar/expandir com título.
- Para criar um tipo novo: adicionar em `KIND`/`EDIT` no `modulab.js` (formulário, prévia, como salvar) e onde ele entra no editor.

### Editor livre, Tema e IA (ModuLab v2)
- **Tema** é um botão principal na lateral do editor (depois de Páginas): paleta livre (qualquer cor), fontes, estilo dos widgets, moldura e borda, com escolha de onde aplicar. Dá para salvar o resultado no ModuLab.
- **Modelos** mostra só coleções do ModuLab e modelos prontos. Ao usar um modelo, o app pergunta onde aplicar (esta página, todas, ímpares/pares, intervalo ou páginas escolhidas) ou onde inserir.
- **Editor livre**: ModuLab → "Criar no editor livre" (ou "Novo widget/adesivo/borda" → Editor livre). Abre o editor completo numa página em branco; a barra flutuante tem **Pedir à IA**, **Salvar no ModuLab** e **Sair**. Salva o que estiver selecionado (ou tudo). Widget e adesivo guardam elementos editáveis; borda vira faixa de imagem. Editar um item salvo reabre no editor livre. Rascunhos ficam listados no ModuLab.
- **IA**: ModuLab → Ligar IA. Dois modos: chave neste aparelho, ou **pela nuvem** (recomendado):
  1. `supabase secrets set ANTHROPIC_API_KEY=sua-chave`
  2. `supabase functions deploy ia-modulab` (arquivo em `supabase/functions/ia-modulab/index.ts`)
  3. No estúdio, entre na nuvem e escolha "Pela minha nuvem".

### Soltar em peças (editor livre)
Qualquer widget (calendário, tabela, hábitos, horários…) pode ser transformado em peças soltas: linhas, caixas com cantos, textos e traçados. Use o botão **Soltar em peças** na barra do editor livre (vale para o widget selecionado, ou para todos da página se nada estiver selecionado) ou **Soltar em peças editáveis** em "Copiar e salvar" no painel direito. As peças ficam agrupadas como um objeto só; **Desagrupar** libera cada uma para apagar números, mudar cores/espessura/tipo de linha, arredondar cantos, trocar fontes, duplicar linhas e colunas, colocar imagens dentro, fora ou ao fundo, e título. Ao **Salvar no ModuLab**, o widget com várias peças é guardado como um único objeto. Ctrl+Z desfaz.

### Assistente rápido de widget (ajustes e paletas livres)
No ModuLab → Novo widget → Assistente rápido: além do modelo-base, estilo e título, há **Ajustes** do widget escolhido (quantidade de linhas, colunas, itens, dias, tamanhos, cores e opções), **Símbolo** (quadrado, coração, estrela, flor, visto… para listas, hábitos etc.) e **cores livres**: "Escolher cores livres / criar paleta" abre 7 seletores de cor; "Guardar como nova paleta" grava no ModuLab e a paleta passa a aparecer em todo o estúdio.

### Textos por nível (H1–H6) e Fontes
- Todo texto pode ter um **nível**: H1 título do widget, H2 cabeçalho do widget, H3 corpo, H4 textos de apoio, H5 cabeçalho da página, H6 rodapé da página. "Soltar em peças" já classifica sozinho.
- Ao selecionar um texto, uma peça solta ou um grupo, a seção **Textos por nível** do painel direito mostra um bloco por nível (fonte, tamanho, cor, espaço entre letras, negrito, itálico, sublinhado, tachado, alinhamento na caixa, posição vertical, opacidade). "Mudar vale para": mesmo nível no grupo (padrão), só os selecionados, na página ou no projeto. Linhas e caixas do grupo têm blocos próprios (cor, espessura, estilo, cantos).
- **Texto → Fontes e níveis de texto**: combinações de fontes (as prontas, novas combinações e as suas fontes enviadas), a lista H1–H6 (clique num nível para configurar; vale para o projeto todo), "Guardar esta configuração como padrão" (lista em Minhas configurações, vale também no ModuLab) e envio de fontes TTF/OTF ("Minhas fontes").
- H5/H6: botão para inserir cabeçalho/rodapé na página ou em todas.

### Texto com vários estilos, combinações com escopo, cabeçalho/rodapé e widgets de texto
- **Texto com várias cores e fontes**: selecione um texto → "Texto com várias cores e fontes…" (também no cabeçalho/rodapé). Selecione um trecho e mude fonte, cor, negrito, itálico, sublinhado ou tachado só nele; há paleta de símbolos e a fonte de símbolos (Noto Sans Symbols 2). O resto segue o nível (H1–H6).
- **Combinações de fontes** (Texto → Fontes): clicar numa combinação mostra as fontes dela (editáveis) e um seletor "Onde aplicar": esta página, widget selecionado, todas as páginas, todos os widgets ou tudo (projeto). Pode guardar como nova combinação.
- **Cabeçalho, rodapé e numeração** (painel direito, com nada selecionado): liga cada um, escreve o texto (igual em todas as páginas), estilo completo e **numeração automática** (formatos 3, - 3 -, ♡ 3 ♡, · 3 ·, Página 3, 3 / 20; posição esquerda/centro/direita/lado de fora/lado de dentro; fonte, tamanho, cor própria, negrito, itálico, sombra; começar em N; sem número na capa e contracapa). Dá para ter só o número ou só o texto.
- **Widgets só de texto**: aba Widgets → Textos (título e subtítulo, citação, caixa com título, frase do dia, tópicos, etiqueta, recado com símbolos, duas colunas, destaque misto). Caixas de texto aceitam título, fundo e moldura como qualquer widget.
- **ModuLab → Configuração de texto**: crie e edite níveis H1–H6 e a combinação de fontes, com prévia; ficam em Texto → Fontes → Minhas configurações.

## Ajuste 39 — Elementos, edição rápida e conjunto de widgets
- **Widgets › Elementos**: retângulos, quadrados, círculos, elipse, pílula, molduras, linhas e formas (coração, estrela, flor…), usando as cores do tema.
- **Duplo clique dentro do widget** (checklist, hábitos, abas, tabela, divisor e título do widget) abre o menu rápido: texto, fonte, tamanho, cor, alinhamento, incluir/excluir item, linha ou coluna.
- **Conjunto de widgets**: ao agrupar widgets, a seção "Conjunto de widgets" cria um fundo comum (fundo, borda, estilo e título valem para o todo); os textos continuam individuais.
- Arquivo novo: `rapido.js` (já listado no index, sw.js v45 e publicar.yml).

## Ajuste 40 — Edição direta no widget, cadeado, zoom e aba Fonte
- **Duplo clique no widget**: o cursor aparece direto na linha/coluna clicada (sem caixa sobre o widget). A barra rápida traz fonte, tamanho, cor, negrito/alinhamento (título), **＋ acima**, **＋ abaixo** e **✕ linha**. Enter inclui uma linha abaixo; Backspace numa linha vazia a exclui.
- **Checklist com linhas**: o texto assenta sobre a linha e a linha recomeça depois dele.
- **Cadeado**: ao passar o mouse sobre qualquer objeto travado aparece um cadeado; clicar nele destrava.
- **Zoom**: a roda do mouse amplia/reduz (Shift + roda rola; configurável) e o botão de porcentagem abre um menu (Ajustar, 50%…300%).
- **Aba Fonte** (antes "Texto"): combinações e níveis H1–H6; "Minhas fontes" e "Minhas combinações" são botões no topo e a configuração de combinação é um segundo nível com botão Voltar. Os modelos de texto agora ficam em Widgets › Textos.

## Ajuste 41
- Checklist com "Linha para escrever": a linha fica inteira sob o texto (não é mais empurrada).
- Cores consecutivas no painel direito (ex.: Cor do texto + Cor das linhas) ficam na mesma linha.
- Cor do texto da barra rápida reforçada (input + change).

## Ajuste 42
- A moldura (borda) de qualquer widget/objeto decorado agora ocupa espaço: o conteúdo e o título ficam sempre dentro dela, sem invadir.
- Rótulos de cor encurtados ("Texto", "Linhas", "Texto do título", "Fundo do título") para alinhar os seletores.

## Ajuste 43
- Painel direito mais compacto: campos curtos (listas, números, cores) ficam dois por linha e menores.
- Calendário: "Mostrar nome do mês" abre fonte, tamanho, peso, estilo, cor, espaço entre letras e alinhamento do nome; novo tamanho dos dias (0 = automático).
- Moldura encosta no conteúdo (sem folga extra); o título do widget respeita a borda e diminui para caber na largura do widget.

## Ajuste 44
- Nova seção "Dias da semana" (com ocultar/expandir) no painel direito dos calendários (mensal e anual): como mostrar (automático, letra, abreviado, extenso), altura da faixa, cor da faixa, fonte, tamanho, cor, peso, alinhamento, espaço entre letras e linhas da faixa (em cima/embaixo) com cor e espessura próprias.

## Ajuste 45
- Faixa dos dias: linhas também nas laterais ou em volta (contorno), divisórias da grade ligáveis, espaço entre células e cantos arredondados.
- Nova seção "Células dos dias" no calendário mensal: espaço entre os dias, cantos arredondados, fundo de cada dia e ocultar células vazias — cada dia vira um quadradinho individual.

## Ajuste 46
- Botão "↺ Restaurar" em cada seção (seta) do painel direito: volta só aquela seção ao original (apagado quando nada mudou).
- "Restaurar tudo ao original" no fim do painel: desfaz todas as personalizações do objeto (posição e grupo ficam). Ambos entram no histórico (Ctrl+Z).
- O "original" é guardado na primeira vez que o objeto é selecionado (campo interno `_b`).

## Ajuste 47
- Com espaço entre células (dias ou dias da semana), o fundo do widget só pinta dentro das células; os espaços mostram o fundo da página. Existe um registro (`CELLS` em widgets.js) para qualquer widget com células usar a mesma regra.

## Ajuste 48
- Moldura com cantos arredondados: o conteúdo recua e é recortado pela curva (vale para qualquer objeto com moldura).
- Textos: nova seção "Texto em curva" (arco/taça, raio, abertura em graus, ângulo inicial, espaço entre letras).
