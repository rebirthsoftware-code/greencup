import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { allSummaries } from '../store/selectors';
import { fmtMoney, fmtDate } from '../utils/format';
import { Avatar, StatusBadge, Empty } from '../components/ui';
import * as Ic from '../components/Icons';

const FILTERS = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'borclu', label: 'Borçlular' },
  { key: 'alacakli', label: 'Alacaklılar' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'gecikmis', label: 'Gecikmiş' },
];

export function CustomerRow({ s, right }) {
  const c = s.customer;
  return (
    <Link to={`/musteriler/${c.id}`} className="item">
      <Avatar customer={c} status={s.status} />
      <div className="item-body">
        <div className="item-title">{c.name}</div>
        <div className="item-sub">{c.type}{c.city ? ` · ${c.city}` : ''}</div>
        <div className="item-sub xs">Son ziyaret: {s.lastVisit ? fmtDate(s.lastVisit.date) : '-'}</div>
      </div>
      {right ?? (
        <div className="item-right">
          <div className={`num ${s.balance > 0 ? 'neg' : s.balance < 0 ? 'neg' : 'pos'}`} style={{ fontSize: 15 }}>{s.balance === 0 ? 'Borç yok' : fmtMoney(Math.abs(s.balance))}</div>
          <StatusBadge status={s.status} />
        </div>
      )}
    </Link>
  );
}

export default function Customers() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const filter = params.get('f') || 'tumu';
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const sums = allSummaries(state);
    const ql = q.trim().toLocaleLowerCase('tr-TR');
    return sums.filter((s) => {
      if (ql && !s.customer.name.toLocaleLowerCase('tr-TR').includes(ql) && !s.customer.city?.toLocaleLowerCase('tr-TR').includes(ql)) return false;
      if (filter === 'borclu') return s.balance > 0;
      if (filter === 'alacakli') return s.balance < 0;
      if (filter === 'aktif') return s.status === 'aktif';
      if (filter === 'gecikmis') return s.status === 'gecikmis';
      return true;
    }).sort((a, b) => b.balance - a.balance);
  }, [state, q, filter]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Müşteriler</h1>
        <div className="actions">
          <Link to="/musteriler/yeni" className="icon-btn" aria-label="Yeni müşteri"><Ic.Plus size={20} /></Link>
        </div>
      </header>
      <div className="search">
        <Ic.Search size={18} />
        <input placeholder="Müşteri ara..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setParams(f.key === 'tumu' ? {} : { f: f.key })}>{f.label}</button>
        ))}
      </div>
      <div className="list">
        {list.map((s) => <CustomerRow key={s.customer.id} s={s} />)}
        {list.length === 0 && <Empty>{state.customers.length === 0 ? <>Henüz müşteri yok. Sağ üstteki <b>+</b> ile ekleyin.</> : 'Müşteri bulunamadı.'}</Empty>}
      </div>
    </div>
  );
}
