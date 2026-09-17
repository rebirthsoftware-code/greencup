import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { useSync } from '../store/sync';
import { dashboard, notifications, monthlySeries } from '../store/selectors';
import { fmtMoney, fmtNum } from '../utils/format';
import { useCountUp } from '../utils/hooks';
import { loadDevice } from '../store/storage';
import { asset } from '../utils/asset';
import * as Ic from '../components/Icons';
import InstallPrompt from '../components/InstallPrompt';

const Quick = ({ to, icon: Icon, label, tone = '' }) => (
  <Link to={to} className="quick"><span className={`qi ${tone}`}><Icon size={22} /></span><span>{label}</span></Link>
);

/** Küçük çizgi grafik: son 6 ayın tahsilatı (tek seri, eksensiz). */
function Sparkline({ data }) {
  const W = 300, H = 56; const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - 6 - (v / max) * (H - 12)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" aria-hidden>
      <path d={area} fill="rgba(255,255,255,.18)" />
      <path d={d} fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#fff" />}
    </svg>
  );
}

export default function Home() {
  const { state } = useStore();
  const d = dashboard(state);
  const alerts = notifications(state).filter((n) => n.level !== 'green');
  const series = monthlySeries(state, 6);
  const sync = useSync();
  const syncColor = !sync.enabled ? 'var(--text-3)' : sync.status === 'error' ? 'var(--red)' : sync.status === 'syncing' || sync.meta.dirty ? 'var(--orange)' : 'var(--green)';
  const syncTitle = !sync.enabled ? 'Bulut senkron kapalı' : sync.status === 'error' ? `Senkron hatası: ${sync.error}` : sync.status === 'syncing' ? 'Senkronize ediliyor' : sync.meta.dirty ? 'Bekleyen değişiklik' : 'Bulut ile güncel';
  const firstName = (loadDevice().userName || state.settings.userName || '').split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const dateLine = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  const receivable = useCountUp(d.receivable);
  const cashTotal = useCountUp(d.cashTotal);
  const overdueAmount = d.overdue.reduce((a, s) => a + s.overdueAmount, 0);
  const debtors = d.sums.filter((s) => s.balance > 0).length;
  const thisMonth = series[series.length - 1] || { sales: 0, payments: 0 };

  return (
    <div className="page">
      <header className="page-header home-header">
        <img src={asset('logo-greencup.png')} alt="GreenCup" style={{ height: 34 }} />
        <div style={{ flex: 1 }} />
        <Link to="/daha/ayarlar" className="icon-btn" aria-label={syncTitle} title={syncTitle} style={{ color: syncColor }}><Ic.Cloud size={20} /></Link>
        <Link to="/bildirimler" className="icon-btn" aria-label="Bildirimler"><Ic.Bell size={20} />{alerts.length > 0 && <span className="badge-dot">{alerts.length}</span>}</Link>
      </header>

      <div style={{ marginBottom: 16 }}>
        <div className="display" style={{ fontSize: 22 }}>Hoş geldin {firstName} 👋</div>
        <div className="muted small">{greet}, bugün güzel geçsin. <span className="xs" style={{ color: 'var(--text-3)' }}>· {dateLine}</span></div>
      </div>
      <InstallPrompt />

      <Link to="/musteriler?f=borclu" className="hero">
        <div className="hero-top"><span>Toplam Alacak</span><span className="hero-link">Borçlular <Ic.ChevronRight size={14} /></span></div>
        <div className="hero-value display">{fmtMoney(Math.round(receivable))}</div>
        <div className="hero-kpis">
          <div><b>{fmtMoney(overdueAmount)}</b><span>Gecikmiş</span></div>
          <div><b>{fmtNum(debtors)}</b><span>Borçlu müşteri</span></div>
          <div><b>{fmtMoney(thisMonth.payments)}</b><span>Bu ay tahsilat</span></div>
        </div>
        <Sparkline data={series.map((m) => m.payments)} />
        <div className="hero-foot">Son 6 ay tahsilat</div>
      </Link>

      <div className="tiles">
        <Link to="/musteriler" className="tile"><span className="qi"><Ic.Users size={18} /></span><b>{fmtNum(state.customers.length)}</b><span>Müşteri</span></Link>
        <Link to="/stok" className="tile"><span className="qi orange"><Ic.Box size={18} /></span><b>{fmtNum(state.products.length)}</b><span>Ürün çeşidi</span></Link>
        <Link to="/kasa" className="tile"><span className="qi gold"><Ic.Wallet size={18} /></span><b>{fmtMoney(Math.round(cashTotal))}</b><span>Kasa</span></Link>
      </div>

      <div className="row" style={{ marginTop: 22, marginBottom: 10 }}><h2 className="section-title" style={{ margin: 0 }}>Hızlı İşlemler</h2></div>
      <div className="grid-3">
        <Quick to="/musteriler/yeni" icon={Ic.UserPlus} label="Yeni Müşteri" />
        <Quick to="/islem?tur=sale" icon={Ic.Truck} label="Mal Ver" tone="blue" />
        <Quick to="/islem?tur=payment" icon={Ic.Cash} label="Tahsilat Gir" tone="gold" />
      </div>
      <div className="grid-2" style={{ marginTop: 10 }}>
        <Quick to="/islem?tur=sale&fatura=1" icon={Ic.FileText} label="Fatura Ekle" tone="purple" />
        <Quick to="/islem?tur=visit" icon={Ic.Target} label="Ziyaret Ekle" tone="orange" />
      </div>

      <div className="row" style={{ marginTop: 22, marginBottom: 10 }}><h2 className="section-title" style={{ margin: 0 }}>Bugün</h2><Link to="/bildirimler" className="hero-link" style={{ color: 'var(--green)' }}>Tümü <Ic.ChevronRight size={14} /></Link></div>
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
