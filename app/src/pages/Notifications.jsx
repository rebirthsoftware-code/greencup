import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { notifications } from '../store/selectors';
import { fmtMoney } from '../utils/format';
import { PageHeader, Empty } from '../components/ui';
import * as Ic from '../components/Icons';

const ICON = { overdue: Ic.Receipt, due: Ic.Clock, expense: Ic.Cash, visit: Ic.Target, novisit: Ic.MapPin, stock: Ic.Box };

export default function Notifications() {
  const { state } = useStore();
  const list = notifications(state);
  return (
    <div className="page">
      <PageHeader title="Bildirimler" to="/" />
      <div className="list">
        {list.map((n, i) => {
          const Icon = ICON[n.kind] || Ic.Bell;
          const to = n.to || (n.customerId ? `/musteriler/${n.customerId}` : '/');
          return (
            <Link key={i} to={to} className="item">
              <span className={`tl-icon ${n.level === 'red' ? '' : n.level === 'orange' ? 'visit' : 'note'}`} style={n.level === 'red' ? { background: 'var(--red-bg)', color: 'var(--red)' } : {}}><Icon size={18} /></span>
              <div className="item-body"><div className="item-title">{n.title}</div><div className="item-sub">{n.sub}</div></div>
              {n.amount != null && <span className="num">{fmtMoney(n.amount)}</span>}
            </Link>
          );
        })}
        {list.length === 0 && <Empty>Bildirim yok. Her şey yolunda.</Empty>}
      </div>
      <p className="xs muted" style={{ marginTop: 16 }}>Bildirimler uygulama açıkken hesaplanır; geciken alacaklar, yaklaşan vadeler ve giderler, bugünkü ziyaret planı, uzun süredir gidilmeyen müşteriler ve azalan stok burada listelenir.</p>
    </div>
  );
}
