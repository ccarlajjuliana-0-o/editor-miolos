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
