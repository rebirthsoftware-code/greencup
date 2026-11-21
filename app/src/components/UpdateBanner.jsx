import { useEffect, useState } from 'react';

/** Sunucuda gerçekten yeni paket varsa küçük bir şerit: Yenile sayfayı yeniler, X bu oturumda gizler. */
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const on = () => { try { if (sessionStorage.getItem('gc-update-dismissed')) return; } catch { /* noop */ } setReady(true); };
    window.addEventListener('gc-update-ready', on);
    return () => window.removeEventListener('gc-update-ready', on);
  }, []);
  if (!ready) return null;
  const dismiss = () => { try { sessionStorage.setItem('gc-update-dismissed', '1'); } catch { /* noop */ } setReady(false); };
  return (
    <div className="update-banner" role="status">
      <span>Yeni sürüm hazır.</span>
      <button onClick={() => window.location.reload()}>Yenile</button>
      <button className="x" onClick={dismiss} aria-label="Kapat">✕</button>
    </div>
  );
}
