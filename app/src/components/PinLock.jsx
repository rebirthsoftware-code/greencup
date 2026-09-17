import { useEffect, useState } from 'react';
import { asset } from '../utils/asset';
import { loadDevice } from '../store/storage';
import { sha256 } from '../utils/format';

const LOCK_AFTER_MS = 5 * 60 * 1000; // arka planda 5 dk sonra kilitlenir

/** Cihaza özel PIN kilidi. PIN senkronlanmaz; her cihaz kendi PIN'ini belirler. */
export default function PinLock({ children }) {
  const [pinHash] = useState(() => loadDevice().pinHash || null);
  const pinLen = loadDevice().pinLen || 4;
  const [locked, setLocked] = useState(() => !!loadDevice().pinHash && sessionStorage.getItem('gc-unlocked') !== '1');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!pinHash) return;
    let hiddenAt = null;
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS) { sessionStorage.removeItem('gc-unlocked'); setLocked(true); setPin(''); }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pinHash]);

  useEffect(() => {
    if (!locked || pin.length < pinLen) return;
    let cancelled = false;
    sha256(pin).then((h) => {
      if (cancelled) return;
      if (h === pinHash) { sessionStorage.setItem('gc-unlocked', '1'); setLocked(false); setPin(''); setErr(''); }
      else { setErr('Yanlış PIN'); setPin(''); }
    });
    return () => { cancelled = true; };
  }, [pin, locked, pinHash, pinLen]);

  if (!locked) return children;

  const press = (d) => { setErr(''); setPin((p) => (p.length < pinLen ? p + d : p)); };
  const forgot = () => {
    if (confirm('PIN sıfırlanacak ve bu cihazdaki yerel veri ile bulut bağlantısı silinecek. Buluttaki veri korunur; token ile yeniden bağlanabilirsiniz. Devam?')) {
      localStorage.clear(); sessionStorage.clear(); location.reload();
    }
  };
  return (
    <div className="pin-screen">
      <img src={asset('logo-greencup.png')} alt="GreenCup" style={{ width: 150 }} />
      <div className="bold" style={{ fontSize: 18, marginTop: 14 }}>PIN girin</div>
      <div className="pin-dots">{Array.from({ length: pinLen }, (_, i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}</div>
      <div className="xs" style={{ color: 'var(--red)', minHeight: 18 }}>{err}</div>
      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
          <button key={i} disabled={k === ''} onClick={() => (k === '⌫' ? setPin((p) => p.slice(0, -1)) : press(k))}>{k}</button>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} onClick={forgot}>PIN'i unuttum</button>
    </div>
  );
}

