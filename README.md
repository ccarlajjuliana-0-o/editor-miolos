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

## Como funciona
- Projetos, páginas, fontes e imagens ficam no navegador (IndexedDB). Use **Baixar backup** / **Restaurar backup** para levar a outro aparelho.
- O login é o mesmo do app do ateliê (mesmo endereço do GitHub Pages, mesma sessão).
- Modelos e adesivos marcados para o mostruário vão para a tabela `mostruario_itens` e para a pasta `mostruario` do Supabase; o app do ateliê busca sozinho.
- Arquivos: `index.html`, `estilo.css`, `app.js` (editor), `recursos.js` (bordas, repetir em páginas, régua e grade, widgets de data), `sw.js` (funcionar sem internet).
