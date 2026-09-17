import { useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { txItems } from '../store/selectors';
import { fmtMoney, fmtNum, fmtDate, fmtPrice } from '../utils/format';
import { PageHeader, Avatar, Empty } from '../components/ui';

export default function Invoice() {
  const { id } = useParams();
  const { state } = useStore();
  const t = state.transactions.find((x) => x.id === id);
  const c = t && state.customers.find((x) => x.id === t.customerId);
  if (!t || !c) return <div className="page"><PageHeader title="Fatura" /><Empty>Fatura bulunamadı.</Empty></div>;
  const items = txItems(t);
  const kdvRate = state.settings.kdv || 0;
  const kdv = Math.round(t.amount * kdvRate) / 100;
  const s = state.settings;

  return (
    <div className="page page--no-tabs invoice">
      <PageHeader title="Fatura" />
      <div className="card print-header">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="bold" style={{ fontSize: 16 }}>{s.company}</div>
            {s.companyAddress && <div className="small muted">{s.companyAddress}</div>}
            {s.taxNo && <div className="small muted">VKN: {s.taxNo}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="bold">{t.invoiceNo ? `No: ${t.invoiceNo}` : 'Fatura'}</div>
            <div className="small muted">{fmtDate(t.date)}</div>
            {t.dueDate && t.payment !== 'pesin' && <div className="small muted">Vade: {fmtDate(t.dueDate)}</div>}
          </div>
        </div>
      </div>
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar customer={c} />
        <div><div className="bold">{c.name}</div><div className="small muted">{c.type}{c.city ? ` · ${c.city}${c.district ? ' / ' + c.district : ''}` : ''}</div>{c.phone && <div className="small muted">{c.phone}</div>}</div>
      </div>
      <div className="card" style={{ padding: '4px 10px' }}>
        <table className="table">
          <thead><tr><th>Ürün</th><th>Miktar</th><th>Birim</th><th>Tutar</th></tr></thead>
          <tbody>
            {items.map((i, k) => <tr key={k}><td>{i.name}</td><td>{fmtNum(i.qty)} {i.unit || 'adet'}</td><td>{fmtPrice(i.unitPrice ?? (i.qty ? i.amount / i.qty : 0))}</td><td className="bold">{fmtMoney(i.amount)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="row pad"><span className="bold">Ara Toplam</span><span className="num">{fmtMoney(t.amount)}</span></div>
        <div className="row pad"><span className="muted">KDV (%{kdvRate})</span><span className="num">{fmtMoney(kdv)}</span></div>
        <div className="row pad"><span className="bold" style={{ fontSize: 16 }}>Genel Toplam</span><span className="num" style={{ fontSize: 18 }}>{fmtMoney(t.amount + kdv)}</span></div>
      </div>
      {t.note && <div className="card small muted">Not: {t.note}</div>}
      <p className="xs muted" style={{ marginTop: 10 }}>Bu belge uygulama içi satış özetidir; resmi e-Fatura/e-Arşiv yerine geçmez.</p>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>Yazdır / PDF Olarak Kaydet</button>
      </div>
    </div>
  );
}
