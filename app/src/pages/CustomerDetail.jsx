import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { customerSummary, PAYMENT_LABEL, METHOD_LABEL } from '../store/selectors';
import { fmtMoney, fmtNum, fmtDate } from '../utils/format';
import { PageHeader, Avatar, StatusBadge, Empty, Sheet, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const TABS = ['Hareketler', 'Ürünler', 'Faturalar', 'Notlar'];
const TX_FILTERS = [
  { key: 'tumu', label: 'Tümü' }, { key: 'sale', label: 'Mal Verildi' },
  { key: 'payment', label: 'Tahsilat' }, { key: 'visit', label: 'Ziyaret' }, { key: 'note', label: 'Not' },
];
const TITLE = { sale: 'Mal Verildi', payment: 'Tahsilat', visit: 'Ziyaret', note: 'Not' };

export function TxItem({ t, products }) {
  const p = products.find((x) => x.id === t.productId);
  const Icon = t.type === 'sale' ? Ic.Truck : t.type === 'payment' ? Ic.Cash : t.type === 'visit' ? Ic.Target : Ic.Note;
  const cls = t.type === 'payment' ? 'pay' : t.type === 'visit' ? 'visit' : t.type === 'note' ? 'note' : '';
  return (
    <div className="tl-item">
      <div className={`tl-icon ${cls}`}><Icon size={18} /></div>
      <div className="tl-body">
        <div className="tl-head">
          <div><span className="tl-date">{fmtDate(t.date)}</span><span className="tl-title">{TITLE[t.type]}</span></div>
          {t.amount != null && <span className={`num ${t.type === 'payment' ? 'pos' : ''}`}>{fmtMoney(t.amount)}</span>}
        </div>
        {t.type === 'sale' && p && <div className="tl-sub">{fmtNum(t.qty)} {p.unit} {p.name}</div>}
        {t.note && <div className="tl-sub">{t.type === 'visit' ? 'Not: ' : ''}{t.note}</div>}
        <div className="tl-foot">
          {t.type === 'sale' && <span className={`badge ${t.invoiced ? 'badge--aktif' : 'badge--gecikmis'}`}>{t.invoiced ? 'Faturalı' : 'Faturasız'}</span>}
          {t.type === 'payment' && <span className="badge badge--blue">{METHOD_LABEL[t.method] || 'Nakit'}</span>}
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, addTransaction } = useStore();
  const toast = useToast();
  const customer = state.customers.find((c) => c.id === id);
  const [tab, setTab] = useState(0);
  const [txf, setTxf] = useState('tumu');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  if (!customer) return <div className="page"><PageHeader title="Müşteri" /><Empty>Müşteri bulunamadı.</Empty></div>;
  const s = customerSummary(state, customer);

  const saveNote = () => {
    if (!note.trim()) return;
    addTransaction({ customerId: id, type: 'note', note: note.trim() });
    setNote(''); setNoteOpen(false); toast('Not eklendi');
  };

  const filteredTx = s.txs.filter((t) => txf === 'tumu' || t.type === txf);
  const invoices = s.txs.filter((t) => t.type === 'sale' && t.invoiced);
  const notes = s.txs.filter((t) => t.type === 'note' || (t.type === 'visit' && t.note));

  return (
    <div className="page">
      <PageHeader title={tab === 0 ? 'Müşteri Detayı' : customer.name} to="/musteriler"
        right={<Link to={`/musteriler/${id}/duzenle`} className="icon-btn" aria-label="Düzenle"><Ic.Edit size={18} /></Link>} />

      <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Avatar customer={customer} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row"><div style={{ fontSize: 18, fontWeight: 800 }}>{customer.name}</div><StatusBadge status={s.status} /></div>
          <span className="badge badge--aktif" style={{ marginTop: 4 }}>{customer.type}</span>
          <div className="small muted" style={{ marginTop: 8, display: 'grid', gap: 4 }}>
            {customer.phone && <a href={`tel:${customer.phone.replace(/\s/g, '')}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Ic.Phone size={14} />{customer.phone}</a>}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Ic.MapPin size={14} />{customer.city}{customer.district ? ` / ${customer.district}` : ''}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Ic.Clock size={14} />Son ziyaret: {s.lastVisit ? fmtDate(s.lastVisit.date) : '-'}</div>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 12 }}>
        {TABS.map((t, i) => <button key={t} className={i === tab ? 'active' : ''} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <>
          <div className="card">
            <div className="card-title">Cari Durum</div>
            <div className="row pad"><span className="muted">Toplam Borç</span><span className="num">{fmtMoney(s.totalDebt)}</span></div>
            <div className="row pad"><span className="muted">Ödenen</span><span className="num">{fmtMoney(s.totalPaid)}</span></div>
            <div className="row pad"><span className={`bold ${s.balance > 0 ? 'neg' : 'pos'}`}>Kalan Bakiye</span><span className={`num ${s.balance > 0 ? 'neg' : 'pos'}`} style={{ fontSize: 17 }}>{fmtMoney(s.balance)}</span></div>
            <div className="row pad"><span className="muted">Son Ödeme</span><span className="bold">{s.lastPayment ? fmtDate(s.lastPayment.date) : '-'}</span></div>
          </div>

          <div className="chips" style={{ marginTop: 14 }}>
            {TX_FILTERS.map((f) => <button key={f.key} className={`chip ${txf === f.key ? 'active' : ''}`} onClick={() => setTxf(f.key)}>{f.label}</button>)}
          </div>
          <div className="tl">
            {filteredTx.map((t) => <TxItem key={t.id} t={t} products={state.products} />)}
            {filteredTx.length === 0 && <Empty>Hareket yok.</Empty>}
          </div>
        </>
      )}

      {tab === 1 && (
        <>
          <div className="card">
            <div className="card-title">Müşterideki Ürünler</div>
            {s.products.map((p) => (
              <div key={p.productId} className="row pad"><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Ic.Cup size={16} className="muted" />{p.name}</span><span className="num">{fmtNum(p.qty)} adet</span></div>
            ))}
            {s.products.length === 0 && <div className="muted small">Henüz ürün verilmedi.</div>}
          </div>
          <div className="card">
            <div className="card-title">Depoda Müşteriye Ait Ürünler</div>
            {s.reserved.map((r) => (
              <div key={r.productId} className="row pad"><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Ic.Box size={16} style={{ color: 'var(--gold)' }} />{r.name}</span><span className="num">{fmtNum(r.qty)} adet</span></div>
            ))}
            {s.reserved.length === 0 && <div className="muted small">Depoda rezerve ürün yok.</div>}
          </div>
        </>
      )}

      {tab === 2 && (
        <div className="list">
          {invoices.map((t) => (
            <Link key={t.id} to={`/fatura/${t.id}`} className="item">
              <div className="tl-icon"><Ic.FileText size={18} /></div>
              <div className="item-body">
                <div className="item-title">Fatura {t.invoiceNo ? `No: ${t.invoiceNo}` : ''}</div>
                <div className="item-sub">{fmtDate(t.date)} · {fmtNum(t.qty)} adet {state.products.find((p) => p.id === t.productId)?.name}</div>
              </div>
              <span className="num">{fmtMoney(t.amount)}</span>
              <Ic.ChevronRight size={18} className="muted" />
            </Link>
          ))}
          {invoices.length === 0 && <Empty>Fatura yok.</Empty>}
        </div>
      )}

      {tab === 3 && (
        <div className="tl">
          {notes.map((t) => <TxItem key={t.id} t={t} products={state.products} />)}
          {notes.length === 0 && <Empty>Not yok.</Empty>}
        </div>
      )}

      <div className="sticky-bottom btn-row">
        <button className="btn btn-primary" onClick={() => nav(`/islem?musteri=${id}`)}>Yeni İşlem</button>
        <button className="btn btn-outline" onClick={() => setNoteOpen(true)}>Not Ekle</button>
      </div>

      <Sheet open={noteOpen} onClose={() => setNoteOpen(false)} title="Not Ekle">
        <textarea className="input" placeholder="Örn: Yeni sezon siparişi konuşuldu..." value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveNote} disabled={!note.trim()}>Kaydet</button>
      </Sheet>
    </div>
  );
}
