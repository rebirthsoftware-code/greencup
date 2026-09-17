import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { allSummaries } from '../store/selectors';
import { fmtDate, daysBetween, today } from '../utils/format';
import { PageHeader, Avatar, Empty } from '../components/ui';
import * as Ic from '../components/Icons';

export default function Visits() {
  const { state } = useStore();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const sums = useMemo(() => allSummaries(state).filter((s) => !q || s.customer.name.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR'))), [state, q]);
  const t = today();
  const recent = [...sums].sort((a, b) => ((b.lastVisit?.date || '') > (a.lastVisit?.date || '') ? 1 : -1));
  const plan = [...sums].sort((a, b) => ((a.lastVisit?.date || '') > (b.lastVisit?.date || '') ? 1 : -1));

  return (
    <div className="page">
      <PageHeader title="Ziyaretler" to="/daha" right={<Link to="/islem?tur=visit" className="icon-btn" aria-label="Ziyaret ekle"><Ic.Plus size={20} /></Link>} />
      <div className="tabs">
        <button className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>Son Ziyaretler</button>
        <button className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>Ziyaret Planı</button>
      </div>
      <div className="search"><Ic.Search size={18} /><input placeholder="Müşteri ara..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="list">
        {(tab === 0 ? recent : plan).map((s) => {
          const days = s.lastVisit ? daysBetween(s.lastVisit.date, t) : null;
          return (
            <Link key={s.customer.id} to={`/ziyaret/${s.customer.id}`} className="item">
              <Avatar customer={s.customer} />
              <div className="item-body">
                <div className="item-title">{s.customer.name}</div>
                <div className="item-sub">{s.customer.city}{s.customer.district ? ` / ${s.customer.district}` : ''}</div>
              </div>
              {tab === 0
                ? <span className="small bold">{s.lastVisit ? fmtDate(s.lastVisit.date) : '-'}</span>
                : <span className={`badge ${days == null || days >= 14 ? 'badge--gecikmis' : days >= 7 ? 'badge--takipte' : 'badge--aktif'}`}>{days == null ? 'Hiç' : `${days} gün önce`}</span>}
            </Link>
          );
        })}
        {sums.length === 0 && <Empty>Kayıt yok.</Empty>}
      </div>
    </div>
  );
}
