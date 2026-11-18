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
