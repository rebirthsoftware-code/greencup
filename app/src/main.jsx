import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: service worker (sadece production build'de)
// "Yeni sürüm hazır" şeridi yalnızca sunucudaki paket gerçekten değiştiyse gösterilir:
// iOS, service worker'ı arada yeniden kurduğu için yalnızca SW olayına güvenmek yanlış uyarı veriyordu.
const BUNDLE_RE = /assets\/index-[A-Za-z0-9_-]+\.js/;
const currentBundle = () => { for (const sc of document.scripts) { const m = (sc.src || '').match(BUNDLE_RE); if (m) return m[0]; } return null; };
let lastCheck = 0;
async function newBuildAvailable() {
  const cur = currentBundle(); if (!cur) return false;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}index.html?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const m = (await res.text()).match(BUNDLE_RE);
    return !!m && m[0] !== cur;
  } catch { return false; }
}
async function checkUpdate(force) {
  if (!force && Date.now() - lastCheck < 10 * 60 * 1000) return;
  lastCheck = Date.now();
  if (await newBuildAvailable()) window.dispatchEvent(new Event('gc-update-ready'));
}
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.BASE_URL.startsWith('/')) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) checkUpdate(true); });
      });
      setInterval(() => { reg.update().catch(() => {}); checkUpdate(true); }, 60 * 60 * 1000); // saatte bir
    } catch { /* service worker yok */ }
  });
}
if (import.meta.env.PROD) {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(false); });
}
