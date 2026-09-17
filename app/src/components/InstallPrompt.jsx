import { useEffect, useState } from 'react';
import { Sheet } from './ui';
import * as Ic from './Icons';
import { isIOS, isStandalone } from '../store/push';

const KEY = 'gc-install-dismissed';
let deferred = null; // beforeinstallprompt (Android/Chrome)
if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });

/** Ana ekrana ekleme daveti: Android'de tek dokunuşla kurulum, iPhone'da adımlar. */
export default function InstallPrompt() {
  const [hidden, setHidden] = useState(() => { try { return isStandalone() || sessionStorage.getItem(KEY) === '1'; } catch { return true; } });
  const [ios, setIos] = useState(false);
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  useEffect(() => {
    const on = () => setCanPrompt(true);
    window.addEventListener('beforeinstallprompt', on);
    const t = setTimeout(() => setCanPrompt(!!deferred), 1500);
    return () => { window.removeEventListener('beforeinstallprompt', on); clearTimeout(t); };
  }, []);
  if (hidden) return null;
  const dismiss = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* noop */ } setHidden(true); };
  const install = async () => {
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; if (r?.outcome === 'accepted') setHidden(true); return; }
    setIos(true);
  };
  return (
    <>
      <div className="install">
        <img src="icons/icon-192.png" alt="" />
        <div className="t"><b>Ana ekrana ekle</b><span>Uygulama gibi açılır, tam ekran çalışır{isIOS() ? ', bildirimler için gerekli' : ''}.</span></div>
        <button className="btn" onClick={install}>{canPrompt ? 'Kur' : 'Nasıl?'}</button>
        <button className="x" onClick={dismiss} aria-label="Kapat"><Ic.X size={18} /></button>
      </div>
      <Sheet open={ios} onClose={() => setIos(false)} title="Ana Ekrana Ekle">
        {isIOS() ? (
          <div className="ios-steps">
            <div><span className="n">1</span><span>Safari'de alttaki <b>Paylaş</b> simgesine dokunun (kare içinden çıkan ok).</span></div>
            <div><span className="n">2</span><span>Listeden <b>Ana Ekrana Ekle</b>'yi seçin.</span></div>
            <div><span className="n">3</span><span>Sağ üstten <b>Ekle</b> deyin. Uygulama ana ekranda GreenCup simgesiyle görünür.</span></div>
          </div>
        ) : (
          <div className="ios-steps">
            <div><span className="n">1</span><span>Tarayıcının sağ üstündeki <b>⋮</b> menüsüne dokunun.</span></div>
            <div><span className="n">2</span><span><b>Ana ekrana ekle</b> veya <b>Uygulamayı yükle</b> seçeneğini seçin.</span></div>
          </div>
        )}
        <p className="xs muted" style={{ marginTop: 12 }}>Sonrasında uygulamayı ana ekrandaki simgeden açın; adres çubuğu olmadan, tam ekran çalışır.</p>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setIos(false)}>Tamam</button>
      </Sheet>
    </>
  );
}
