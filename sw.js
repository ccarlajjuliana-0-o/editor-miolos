// Guarda o app para abrir sem internet. Arquivos próprios: rede primeiro (para as atualizações chegarem); bibliotecas e fontes: guardadas na primeira vez.
const V = 'estudio-miolos-v26';
const BASE = ['./', 'index.html', 'estilo.css', 'app.js', 'vetor.js', 'aparencia.js', 'layout.js', 'protecao.js', 'recursos.js', 'exportar.js', 'tamanho.js', 'paginas.js', 'margens.js', 'lados.js','barra.js', 'seletor.js', 'avisos.js', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // dados da nuvem nunca ficam em cache
  const proprio = url.origin === location.origin;
  if (proprio) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { const c = r.clone(); caches.open(V).then((ca) => ca.put(req, c)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then((m) => m || caches.match('index.html', { ignoreSearch: true }))));
  } else {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(V).then((ca) => ca.put(req, c)); } return r; })));
  }
});
