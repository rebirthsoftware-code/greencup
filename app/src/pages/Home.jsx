import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useSync } from '../store/sync';
import { dashboard, notifications } from '../store/selectors';
import { fmtMoney, fmtNum } from '../utils/format';
import { loadDevice } from '../store/storage';
import * as Ic from '../components/Icons';
import InstallPrompt from '../components/InstallPrompt';

const Quick = ({ to, icon: Icon, label }) => (
  <Link to={to} className="quick"><Icon size={24} /><span>{label}</span></Link>
);

export default function Home() {
  const { state } = useStore();
  const d = dashboard(state);
  const alerts = notifications(state).filter((n) => n.level !== 'green');
  const sync = useSync();
  const syncColor = !sync.enabled ? 'var(--text-3)' : sync.status === 'error' ? 'var(--red)' : sync.status === 'syncing' || sync.meta.dirty ? 'var(--orange)' : 'var(--green)';
  const syncTitle = !sync.enabled ? 'Bulut senkron kapalı' : sync.status === 'error' ? `Senkron hatası: ${sync.error}` : sync.status === 'syncing' ? 'Senkronize ediliyor' : sync.meta.dirty ? 'Bekleyen değişiklik' : 'Bulut ile güncel';
  const firstName = (loadDevice().userName || state.settings.userName || '').split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 6 }}>
        <img src="logo-greencup.png" alt="GreenCup" style={{ height: 34 }} />
        <div style={{ flex: 1 }} />
        <Link to="/daha/ayarlar" className="icon-btn" aria-label={syncTitle} title={syncTitle} style={{ color: syncColor }}><Ic.Cloud size={20} /></Link>
        <Link to="/bildirimler" className="icon-btn" aria-label="Bildirimler"><Ic.Bell size={20} />{alerts.length > 0 && <span className="badge-dot">{alerts.length}</span>}</Link>
      </header>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Hoş geldin {firstName} 👋</div>
        <div className="muted small">{greet}, bugün güzel geçsin.</div>
      </div>
      <InstallPrompt />

      <div className="grid-2">
        <Link to="/musteriler" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Users size={16} /></span>Müşteriler</div>
          <div className="stat-value">{fmtNum(state.customers.length)}</div>
          <div className="stat-sub">Toplam müşteri</div>
        </Link>
        <Link to="/musteriler?f=borclu" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Receipt size={16} /></span>Cari Alacak</div>
          <div className="stat-value">{fmtMoney(d.receivable)}</div>
          <div className="stat-sub">{d.overdue.length > 0 ? `${d.overdue.length} müşteride gecikme` : 'Toplam alacak'}</div>
        </Link>
        <Link to="/stok" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Box size={16} /></span>Depo</div>
          <div className="stat-value">{fmtNum(state.products.length)}</div>
          <div className="stat-sub">Ürün çeşidi</div>
        </Link>
        <Link to="/kasa" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Wallet size={16} /></span>Kasa</div>
          <div className="stat-value">{fmtMoney(d.cashTotal)}</div>
          <div className="stat-sub">Kasa bakiyesi</div>
        </Link>
      </div>

      <h2 className="section-title">Hızlı İşlemler</h2>
      <div className="grid-3">
        <Quick to="/musteriler/yeni" icon={Ic.UserPlus} label="Yeni Müşteri" />
        <Quick to="/islem?tur=sale" icon={Ic.Truck} label="Mal Ver" />
        <Quick to="/islem?tur=payment" icon={Ic.Cash} label="Tahsilat Gir" />
      </div>
      <div className="grid-2" style={{ marginTop: 10 }}>
        <Quick to="/islem?tur=sale&fatura=1" icon={Ic.FileText} label="Fatura Ekle" />
        <Quick to="/islem?tur=visit" icon={Ic.Target} label="Ziyaret Ekle" />
      </div>

      <h2 className="section-title">Bugün</h2>
      <Link to="/bildirimler" className="card" style={{ display: 'block' }}>
        <div className="alert-row"><span className="dot red" />
          <span>{d.overdue.length > 0 ? <><b>{d.overdue.length}</b> müşterinin ödemesi gecikti</> : 'Geciken ödeme yok'}</span>
        </div>
        <div className="alert-row"><span className="dot orange" />
          <span>{d.dueSoon.length + d.expensesDue.length > 0 ? <><b>{d.dueSoon.length}</b> vade, <b>{d.expensesDue.length}</b> ödeme yaklaşıyor</> : 'Yaklaşan vade veya ödeme yok'}</span>
        </div>
        <div className="alert-row"><span className="dot green" />
          <span>{d.visitsToday.length > 0 ? <><b>{d.visitsToday.length}</b> planlı ziyaret var</> : <><b>{d.notVisited.length}</b> müşterinin uzun süredir ziyareti yok</>}</span>
        </div>
      </Link>
    </div>
  );
}
