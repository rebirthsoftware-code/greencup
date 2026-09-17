import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { dashboard } from '../store/selectors';
import { fmtMoney, fmtNum } from '../utils/format';
import * as Ic from '../components/Icons';

const Quick = ({ to, icon: Icon, label }) => (
  <Link to={to} className="quick"><Icon size={24} /><span>{label}</span></Link>
);

export default function Home() {
  const { state } = useStore();
  const d = dashboard(state);
  const firstName = state.settings.userName.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 6 }}>
        <img src="/logo-greencup.png" alt="GreenCup" style={{ height: 34 }} />
        <div style={{ flex: 1 }} />
        <Link to="/daha/ayarlar" className="icon-btn" aria-label="Bildirimler"><Ic.Bell size={20} /></Link>
      </header>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Hoş geldin {firstName} 👋</div>
        <div className="muted small">{greet}, bugün güzel geçsin.</div>
      </div>

      <div className="grid-2">
        <Link to="/musteriler" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Users size={16} /></span>Müşteriler</div>
          <div className="stat-value">{fmtNum(state.customers.length)}</div>
          <div className="stat-sub">Toplam müşteri</div>
        </Link>
        <Link to="/musteriler?f=borclu" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Receipt size={16} /></span>Cari Alacak</div>
          <div className="stat-value">{fmtMoney(d.receivable)}</div>
          <div className="stat-sub">Toplam alacak</div>
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
      <div className="card">
        <div className="alert-row"><span className="dot red" />
          <span>{d.overdue.length > 0 ? <><b>{d.overdue.length}</b> müşterinin ödemesi gecikti</> : 'Geciken ödeme yok'}</span>
        </div>
        <div className="alert-row"><span className="dot orange" />
          <span>{d.expensesDue.length > 0 ? <><b>{d.expensesDue.length}</b> ödemenin vadesi yaklaşıyor</> : 'Yaklaşan ödeme yok'}</span>
        </div>
        <div className="alert-row"><span className="dot green" />
          <span><b>{d.notVisited.length}</b> müşterinin uzun süredir ziyareti yok</span>
        </div>
      </div>
    </div>
  );
}
