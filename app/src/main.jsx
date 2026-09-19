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
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.BASE_URL.startsWith('/')) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      // Yeni sürüm kurulduğunda (eski sürüm çalışırken) kullanıcıya yenileme önerisi
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) window.dispatchEvent(new Event('gc-update-ready')); });
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000); // saatte bir güncelleme kontrolü
    } catch { /* service worker yok */ }
  });
}
