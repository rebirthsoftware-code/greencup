// Basit çevrimdışı önbellek: kabuk dosyalarını saklar, ağ yoksa önbellekten sunar.
// Alt yolda (örn. /greencup/) da çalışması için yollar kayıt kapsamına göre kurulur.
const CACHE = 'greencup-app-v2';
const base = new URL(self.registration.scope).pathname;
const shell = ['', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'logo-greencup.png'].map((p) => base + p);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(shell)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // API istekleri (GitHub) dokunulmaz
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match(base + 'index.html')))
  );
});
