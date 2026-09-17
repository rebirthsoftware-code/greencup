import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { allSummaries } from '../store/selectors';
import { fmtMoney, fmtNum, today } from '../utils/format';
import { PageHeader } from '../components/ui';
import * as Ic from '../components/Icons';

const KINDS = [
  { key: 'cari', label: 'Cari Raporu', icon: Ic.Receipt }, { key: 'stok', label: 'Stok Raporu', icon: Ic.Box },
  { key: 'kasa', label: 'Kasa Raporu', icon: Ic.Wallet }, { key: 'ziyaret', label: 'Ziyaret Raporu', icon: Ic.Target },
  { key: 'satis', label: 'Satış Raporu', icon: Ic.BarChart }, { key: 'tahsilat', label: 'Tahsilat Raporu', icon: Ic.Cash },
];
const monthStart = () => today().slice(0, 8) + '01';

export default function Reports() {
  const { state } = useStore();
  const [kind, setKind] = useState('cari');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [show, setShow] = useState(false);

  const data = useMemo(() => {
    const inRange = (d) => d >= from && d <= to;
    const tx = state.transactions.filter((t) => inRange(t.date));
    const sums = allSummaries(state);
    const name = (id) => state.customers.find((c) => c.id === id)?.name || '-';
    switch (kind) {
      case 'cari': return sums.filter((s) => s.balance !== 0).map((s) => [s.customer.name, fmtMoney(s.balance)]);
      case 'stok': return state.products.map((p) => [p.name, `${fmtNum(p.stock - p.reserved)} / ${fmtNum(p.stock)}`]);
      case 'kasa': return state.cashMoves.filter((m) => inRange(m.date)).map((m) => [`${m.date} ${m.title}`, fmtMoney(m.type === 'in' ? m.amount : -m.amount, true)]);
      case 'ziyaret': return tx.filter((t) => t.type === 'visit').map((t) => [`${t.date} ${name(t.customerId)}`, t.note || '']);
      case 'satis': return tx.filter((t) => t.type === 'sale').map((t) => [`${t.date} ${name(t.customerId)}`, fmtMoney(t.amount)]);
      case 'tahsilat': return tx.filter((t) => t.type === 'payment').map((t) => [`${t.date} ${name(t.customerId)}`, fmtMoney(t.amount)]);
      default: return [];
    }
  }, [state, kind, from, to]);

  return (
    <div className="page">
      <PageHeader title="Raporlar" to="/daha" />
      <div className="grid-3">
        {KINDS.map(({ key, label, icon: Icon }) => (
          <button key={key} className="quick" style={kind === key ? { borderColor: 'var(--green)', background: 'var(--green-light)' } : {}} onClick={() => { setKind(key); setShow(false); }}>
            <Icon size={22} /><span>{label}</span>
          </button>
        ))}
      </div>
      <div className="field" style={{ marginTop: 16 }}><label>Tarih Aralığı</label>
        <div className="grid-2">
          <div className="input"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="input"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </div>
      <button className="btn btn-primary" onClick={() => setShow(true)}>Rapor Oluştur</button>
      {show && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">{KINDS.find((k) => k.key === kind).label}</div>
          {data.map(([a, b], i) => <div key={i} className="row pad small"><span>{a}</span><span className="num">{b}</span></div>)}
          {data.length === 0 && <div className="muted small">Bu aralıkta kayıt yok.</div>}
        </div>
      )}
    </div>
  );
}
