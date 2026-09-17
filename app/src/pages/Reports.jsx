import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { allSummaries, monthlySeries, itemsLabel, reservedByProduct, ACCOUNT_LABEL, STATUS_LABEL, METHOD_LABEL } from '../store/selectors';
import { fmtMoney, fmtNum, fmtDate, today, downloadCsv } from '../utils/format';
import { PageHeader, DateField } from '../components/ui';
import BarChart from '../components/BarChart';
import * as Ic from '../components/Icons';

const KINDS = [
  { key: 'cari', label: 'Cari Raporu', icon: Ic.Receipt }, { key: 'stok', label: 'Stok Raporu', icon: Ic.Box },
  { key: 'kasa', label: 'Kasa Raporu', icon: Ic.Wallet }, { key: 'ziyaret', label: 'Ziyaret Raporu', icon: Ic.Target },
  { key: 'satis', label: 'Satış Raporu', icon: Ic.BarChart }, { key: 'tahsilat', label: 'Tahsilat Raporu', icon: Ic.Cash },
];
const monthStart = () => today().slice(0, 8) + '01';

export default function Reports() {
  const { state } = useStore();
  const [params] = useSearchParams();
  const [kind, setKind] = useState(params.get('r') || 'cari');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const series = useMemo(() => monthlySeries(state, 6), [state]);

  // Her rapor: başlık satırı + satırlar (ekranda ilk 2 sütun + son sütun gösterilir, CSV'de hepsi)
  const report = useMemo(() => {
    const inRange = (d) => d >= from && d <= to;
    const tx = state.transactions.filter((t) => inRange(t.date));
    const name = (id) => state.customers.find((c) => c.id === id)?.name || '-';
    const resv = reservedByProduct(state);
    switch (kind) {
      case 'cari': {
        const sums = allSummaries(state).filter((s) => s.balance !== 0).sort((a, b) => b.balance - a.balance);
        return { head: ['Müşteri', 'Durum', 'Toplam Borç', 'Ödenen', 'Gecikmiş', 'En Yakın Vade', 'Bakiye'],
          rows: sums.map((s) => [s.customer.name, STATUS_LABEL[s.status], s.totalDebt, s.totalPaid, s.overdueAmount, s.nextDue ? fmtDate(s.nextDue) : '', s.balance]),
          money: [2, 3, 4, 6], total: sums.reduce((a, s) => a + s.balance, 0) };
      }
      case 'stok':
        return { head: ['Ürün', 'Mevcut', 'Rezerve', 'Satılabilir', 'Birim Fiyat', 'Stok Değeri'],
          rows: state.products.map((p) => [p.name, p.stock || 0, resv[p.id] || 0, (p.stock || 0) - (resv[p.id] || 0), p.price || 0, Math.round((p.stock || 0) * (p.price || 0))]),
          money: [4, 5], total: state.products.reduce((a, p) => a + Math.round((p.stock || 0) * (p.price || 0)), 0) };
      case 'kasa': {
        const moves = state.cashMoves.filter((m) => inRange(m.date));
        return { head: ['Tarih', 'Açıklama', 'Hesap', 'Giren', 'Kullanıcı', 'Tutar'],
          rows: moves.map((m) => [fmtDate(m.date), m.title, ACCOUNT_LABEL[m.account], m.by || '', m.by || '', m.type === 'in' ? m.amount : -m.amount]).map((r) => [r[0], r[1], r[2], r[3], r[5]]),
          money: [4], total: moves.reduce((a, m) => a + (m.type === 'in' ? m.amount : -m.amount), 0) };
      }
      case 'ziyaret': {
        const v = tx.filter((t) => t.type === 'visit');
        return { head: ['Tarih', 'Müşteri', 'Kullanıcı', 'Not'], rows: v.map((t) => [fmtDate(t.date), name(t.customerId), t.by || '', t.note || '']), money: [], count: v.length };
      }
      case 'satis': {
        const s = tx.filter((t) => t.type === 'sale' && !t.fromReserve);
        return { head: ['Tarih', 'Müşteri', 'Ürünler', 'Fatura', 'Ödeme', 'Vade', 'Tutar'],
          rows: s.map((t) => [fmtDate(t.date), name(t.customerId), itemsLabel(t), t.invoiced ? (t.invoiceNo || 'Faturalı') : 'Faturasız', t.payment, t.dueDate ? fmtDate(t.dueDate) : '', t.amount]),
          money: [6], total: s.reduce((a, t) => a + t.amount, 0) };
      }
      case 'tahsilat': {
        const p = tx.filter((t) => t.type === 'payment');
        return { head: ['Tarih', 'Müşteri', 'Yöntem', 'Kullanıcı', 'Tutar'], rows: p.map((t) => [fmtDate(t.date), name(t.customerId), METHOD_LABEL[t.method] || '', t.by || '', t.amount]), money: [4], total: p.reduce((a, t) => a + t.amount, 0) };
      }
      default: return { head: [], rows: [], money: [] };
    }
  }, [state, kind, from, to]);

  const kindLabel = KINDS.find((k) => k.key === kind).label;
  const exportCsv = () => {
    const rows = [report.head, ...report.rows.map((r) => r.map((v, i) => (report.money.includes(i) && typeof v === 'number' ? v.toFixed(2).replace('.', ',') : v)))];
    downloadCsv(`${kindLabel.replace(/\s/g, '-')}_${from}_${to}.csv`, rows);
  };
  const cell = (v, i) => (report.money.includes(i) ? fmtMoney(v) : typeof v === 'number' ? fmtNum(v) : v);
  const last = report.head.length - 1;

  return (
    <div className="page">
      <PageHeader title="Raporlar" to="/daha" />
      <div className="card">
        <div className="card-title">Son 6 Ay · Satış ve Tahsilat</div>
        <BarChart data={series} />
      </div>
      <div className="grid-3" style={{ marginTop: 14 }}>
        {KINDS.map(({ key, label, icon: Icon }) => (
          <button key={key} className="quick" style={kind === key ? { borderColor: 'var(--green)', background: 'var(--green-light)' } : {}} onClick={() => setKind(key)}>
            <Icon size={22} /><span>{label}</span>
          </button>
        ))}
      </div>
      {!['cari', 'stok'].includes(kind) && (
        <div className="grid-2" style={{ marginTop: 16 }}>
          <DateField label="Başlangıç" value={from} onChange={setFrom} />
          <DateField label="Bitiş" value={to} onChange={setTo} />
        </div>
      )}
      <div className="card" style={{ marginTop: 8 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <div className="card-title" style={{ margin: 0 }}>{kindLabel}</div>
          <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={report.rows.length === 0}>Excel (CSV) İndir</button>
        </div>
        {report.rows.map((r, i) => (
          <div key={i} className="row pad small" style={{ alignItems: 'flex-start' }}>
            <span style={{ minWidth: 0 }}><div className="bold">{cell(r[0], 0)}</div><div className="muted xs">{r.slice(1, last).map((v, k) => cell(v, k + 1)).filter(Boolean).join(' · ')}</div></span>
            <span className={`num ${typeof r[last] === 'number' && r[last] < 0 ? 'neg' : ''}`} style={{ whiteSpace: 'nowrap' }}>{cell(r[last], last)}</span>
          </div>
        ))}
        {report.rows.length === 0 && <div className="muted small">Bu aralıkta kayıt yok.</div>}
        {report.rows.length > 0 && report.total != null && <div className="row pad" style={{ borderTop: '2px solid var(--border)' }}><span className="bold">Toplam</span><span className="num">{fmtMoney(report.total)}</span></div>}
        {report.count != null && <div className="row pad" style={{ borderTop: '2px solid var(--border)' }}><span className="bold">Toplam</span><span className="num">{report.count} ziyaret</span></div>}
      </div>
    </div>
  );
}
