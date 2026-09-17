import { useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { fmtMoney, fmtNum, fmtDate } from '../utils/format';
import { PageHeader, Avatar, Empty } from '../components/ui';

export default function Invoice() {
  const { id } = useParams();
  const { state } = useStore();
  const t = state.transactions.find((x) => x.id === id);
  const c = t && state.customers.find((x) => x.id === t.customerId);
  const p = t && state.products.find((x) => x.id === t.productId);
  if (!t || !c) return <div className="page"><PageHeader title="Fatura" /><Empty>Fatura bulunamadı.</Empty></div>;
  const kdv = Math.round(t.amount * state.settings.kdv / 100);

  return (
    <div className="page page--no-tabs">
      <PageHeader title="Fatura" />
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar customer={c} />
        <div><div className="bold">{c.name}</div><div className="small muted">Fatura No: {t.invoiceNo || '-'}</div><div className="small muted">{fmtDate(t.date)}</div></div>
      </div>
      <div className="card">
        <div className="row pad"><span>{p?.name}</span><span className="muted">{fmtNum(t.qty)}</span><span className="num">{fmtMoney(t.amount)}</span></div>
        <div className="row pad"><span className="bold">Toplam</span><span className="num">{fmtMoney(t.amount)}</span></div>
        <div className="row pad"><span className="muted">KDV (%{state.settings.kdv})</span><span className="num">{fmtMoney(kdv)}</span></div>
        <div className="row pad"><span className="bold" style={{ fontSize: 16 }}>Genel Toplam</span><span className="num" style={{ fontSize: 18 }}>{fmtMoney(t.amount + kdv)}</span></div>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>Fatura Görüntüle / Yazdır</button>
        <button className="btn btn-ghost" onClick={() => window.print()}>PDF Olarak Kaydet</button>
      </div>
    </div>
  );
}
