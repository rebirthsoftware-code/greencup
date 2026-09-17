// Basit çevrimdışı önbellek: kabuk dosyalarını saklar, ağ yoksa önbellekten sunar.
// Alt yolda (örn. /greencup/) da çalışması için yollar kayıt kapsamına göre kurulur.
const CACHE = 'greencup-app-v3';
const base = new URL(self.registration.scope).pathname;
const shell = ['', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'logo-greencup.png'].map((p) => base + p);

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
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return; // API istekleri önbelleklenmez
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match(base + 'index.html')))
  );
});

// Anlık bildirimler (Web Push)
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { title: 'GreenCup', body: e.data ? e.data.text() : '' }; }
  const url = data.url || base;
  e.waitUntil(self.registration.showNotification(data.title || 'GreenCup', {
    body: data.body || '', icon: base + 'icons/icon-192.png', badge: base + 'icons/icon-192.png', tag: data.tag || 'greencup', renotify: true, data: { url },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || base, self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const c = list.find((w) => w.url.startsWith(self.location.origin));
    if (c) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
