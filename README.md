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
