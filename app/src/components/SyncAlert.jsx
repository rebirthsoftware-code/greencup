import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSync } from '../store/sync';
import { useStore } from '../store/store';

const DAY = 86400000;
/** Bulut bağlantısı kopuk / kapalı / token'ın süresi dolmak üzereyken tüm sayfalarda görünen uyarı. */
export default function SyncAlert() {
  const sync = useSync();
  const { state } = useStore();
  const { pathname } = useLocation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  if (pathname.startsWith('/daha/ayarlar')) return null;
  const hasData = state.customers.length > 0 || state.transactions.length > 0;
  let tone = null, text = null;
  if (sync.enabled && (sync.status === 'error')) {
    tone = 'red';
    text = sync.error?.startsWith('Token') ? 'Bulut bağlantısı koptu: token geçersiz veya süresi dolmuş. Girdiğiniz veriler yalnızca bu cihazda kalıyor!' : `Bulut bağlantısı koptu (${sync.error}). Girdiğiniz veriler yalnızca bu cihazda kalıyor!`;
  } else if (!sync.enabled && hasData) {
    tone = 'orange'; text = 'Bulut senkron kapalı: veriler yalnızca bu cihazda. Kaybolmaması için bağlayın.';
  } else if (sync.enabled && sync.meta.tokenExp) {
    const left = (new Date(sync.meta.tokenExp).getTime() - now) / DAY;
    if (left <= 0) { tone = 'red'; text = 'Bulut token\'ının süresi doldu. Yeni token girin; yoksa veriler yalnızca bu cihazda kalır.'; }
    else if (left <= 14) { tone = 'orange'; text = `Bulut token'ı ${Math.ceil(left)} gün sonra dolacak (${new Date(sync.meta.tokenExp).toLocaleDateString('tr-TR')}). Şimdiden yenileyin.`; }
  }
  if (!tone) return null;
  return (
    <Link to="/daha/ayarlar" className={`sync-alert ${tone}`}>
      <span>{text}</span><b>Ayarlar →</b>
    </Link>
  );
}
