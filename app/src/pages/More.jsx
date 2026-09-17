import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import * as Ic from '../components/Icons';

const Row = ({ to, icon: Icon, label, sub }) => (
  <Link to={to} className="row pad" style={{ padding: '13px 0' }}>
    <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="tl-icon"><Icon size={18} /></span><span><div className="bold">{label}</div>{sub && <div className="xs muted">{sub}</div>}</span></span>
    <Ic.ChevronRight size={18} className="muted" />
  </Link>
);

export default function More() {
  const { state } = useStore();
  return (
    <div className="page">
      <header className="page-header"><h1>Daha Fazla</h1></header>
      <Link to="/daha/ayarlar" className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="avatar" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><Ic.User size={22} /></div>
        <div style={{ flex: 1 }}><div className="bold">{state.settings.userName}</div><div className="small muted">{state.settings.userEmail}</div></div>
        <Ic.ChevronRight size={18} className="muted" />
      </Link>
      <div className="card" style={{ marginTop: 12 }}>
        <Row to="/daha/odemeler" icon={Ic.Receipt} label="Benim Ödemelerim" sub="Kira, tedarikçi, maaş..." />
        <Row to="/daha/ziyaretler" icon={Ic.Target} label="Ziyaretler" sub="Son ziyaretler ve plan" />
        <Row to="/daha/raporlar" icon={Ic.BarChart} label="Raporlar" sub="Cari, stok, kasa, satış" />
        <Row to="/daha/ayarlar" icon={Ic.Settings} label="Ayarlar" sub="Firma, kullanıcı, yedekleme" />
      </div>
    </div>
  );
}
