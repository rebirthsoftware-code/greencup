import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { customerSummary, METHOD_LABEL, PAYMENT_LABEL, txItems, itemsLabel } from '../store/selectors';
import { fmtMoney, fmtNum, fmtDate, parseMoney, today } from '../utils/format';
import { PageHeader, Avatar, StatusBadge, Empty, Sheet, Segmented, DateField, DangerButton, useToast } from '../components/ui';
import { ItemsEditor } from './NewTransaction';
import { cleanItem } from '../utils/format';
import * as Ic from '../components/Icons';

const TABS = ['Hareketler', 'Ürünler', 'Faturalar', 'Notlar'];
const TX_FILTERS = [
  { key: 'tumu', label: 'Tümü' }, { key: 'sale', label: 'Mal Verildi' },
  { key: 'payment', label: 'Tahsilat' }, { key: 'visit', label: 'Ziyaret' }, { key: 'note', label: 'Not' },
];
const TITLE = { sale: 'Mal Verildi', payment: 'Tahsilat', visit: 'Ziyaret', note: 'Not' };

export function TxItem({ t, alloc, onClick }) {
  const Icon = t.type === 'sale' ? Ic.Truck : t.type === 'payment' ? Ic.Cash : t.type === 'visit' ? Ic.Target : Ic.Note;
  const cls = t.type === 'payment' ? 'pay' : t.type === 'visit' ? 'visit' : t.type === 'note' ? 'note' : '';
  const overdue = t.type === 'sale' && alloc?.open > 0 && t.dueDate && t.dueDate < today();
  return (
    <div className="tl-item" onClick={onClick}>
      <div className={`tl-icon ${cls}`}><Icon size={18} /></div>
      <div className="tl-body">
        <div className="tl-head">
          <div><span className="tl-date">{fmtDate(t.date)}</span><span className="tl-title">{t.fromReserve ? 'Rezerveden Teslim' : TITLE[t.type]}</span></div>
          {t.amount != null && !t.fromReserve && <span className={`num ${t.type === 'payment' ? 'pos' : ''}`}>{fmtMoney(t.amount)}</span>}
        </div>
        {t.type === 'sale' && <div className="tl-sub">{itemsLabel(t)}</div>}
        {t.note && <div className="tl-sub">{t.type === 'visit' ? 'Not: ' : ''}{t.note}</div>}
        {t.type === 'sale' && !t.fromReserve && (
          <div className="tl-meta">
            {t.dueDate && t.payment !== 'pesin' ? `Vade: ${fmtDate(t.dueDate)}` : PAYMENT_LABEL[t.payment] || ''}
            {alloc && alloc.open > 0 ? ` · Açık: ${fmtMoney(alloc.open)}` : alloc ? ' · Ödendi' : ''}
          </div>
        )}
        {t.by && <div className="tl-meta">{t.by}</div>}
        <div className="tl-foot" style={{ gap: 6 }}>
          {overdue && <span className="badge badge--gecikmis">Gecikmiş</span>}
          {t.type === 'sale' && !t.fromReserve && <span className={`badge ${t.invoiced ? 'badge--aktif' : 'badge--gecikmis'}`}>{t.invoiced ? `Faturalı${t.invoiceNo ? ' · ' + t.invoiceNo : ''}` : 'Faturasız'}</span>}
          {t.type === 'payment' && <span className="badge badge--blue">{METHOD_LABEL[t.method] || 'Nakit'}</span>}
        </div>
      </div>
    </div>
  );
}

/** Hareket düzenleme / silme alt sayfası */
function TxEditor({ tx, onClose }) {
  const { state, updateTransaction, deleteTransaction } = useStore();
  const toast = useToast();
  const [f, setF] = useState(() => ({ ...tx, items: txItems(tx).map((i) => ({ ...i })), amountStr: String(tx.amount ?? '') }));
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const total = f.type === 'sale' ? f.items.filter((i) => i.productId && i.qty > 0).reduce((a, i) => a + i.amount, 0) : parseMoney(f.amountStr);
  const save = () => {
    const patch = { date: f.date, note: f.note?.trim() || undefined };
    if (f.type === 'sale') Object.assign(patch, { items: f.items.filter((i) => i.productId && i.qty > 0).map(cleanItem), amount: total, invoiced: f.invoiced, payment: f.payment, dueDate: f.dueDate });
    if (f.type === 'payment') Object.assign(patch, { amount: total, method: f.method });
    if ((f.type === 'sale' || f.type === 'payment') && !(total > 0) && !tx.fromReserve) return toast('Tutar sıfır olamaz');
    updateTransaction(tx.id, patch); toast('Güncellendi'); onClose();
  };
  return (
    <Sheet open onClose={onClose} title={`${TITLE[tx.type]} · Düzenle`}>
      <DateField label="Tarih" value={f.date} onChange={set('date')} />
      {f.type === 'sale' && !tx.fromReserve && (
        <>
          <ItemsEditor items={f.items} onChange={set('items')} products={state.products} />
          <div className="card row" style={{ marginBottom: 14 }}><span className="bold">Toplam</span><span className="num">{fmtMoney(total)}</span></div>
          <div className="field"><label>Fatura</label><Segmented light value={f.invoiced ? 'f' : 'nf'} onChange={(v) => set('invoiced')(v === 'f')} options={[{ value: 'f', label: 'Faturalı' }, { value: 'nf', label: 'Faturasız' }]} /></div>
          <div className="field"><label>Ödeme</label><Segmented light value={f.payment} onChange={set('payment')} options={[{ value: 'vadeli', label: 'Vadeli' }, { value: 'pesin', label: 'Peşin' }, { value: 'kismi', label: 'Kısmi' }]} /></div>
          {f.payment !== 'pesin' && <DateField label="Vade Tarihi" value={f.dueDate || ''} onChange={set('dueDate')} />}
        </>
      )}
      {f.type === 'payment' && (
        <>
          <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={f.amountStr} onChange={(e) => set('amountStr')(e.target.value)} /></div></div>
          <div className="field"><label>Yöntem</label><Segmented light value={f.method || 'nakit'} onChange={set('method')} options={[{ value: 'nakit', label: 'Nakit' }, { value: 'banka', label: 'Havale' }, { value: 'kart', label: 'Kart' }]} /></div>
        </>
      )}
      <div className="field"><label>Not</label><textarea className="input" value={f.note || ''} onChange={(e) => set('note')(e.target.value)} /></div>
      <div className="btn-row">
        <DangerButton className="btn btn-ghost" message="Bu hareket silinecek; stok ve kasa etkisi geri alınacak. Emin misiniz?" onConfirm={() => { deleteTransaction(tx.id); toast('Silindi'); onClose(); }}>Sil</DangerButton>
        <button className="btn btn-primary" onClick={save}>Kaydet</button>
      </div>
    </Sheet>
  );
}

/** Rezerve ekle / teslim et alt sayfası */
function ReserveSheet({ customerId, entry, onClose }) {
  const { state, addReserved, deliverReserved, deleteReserved, updateReserved } = useStore();
  const toast = useToast();
  const [productId, setProductId] = useState(entry?.productId || state.products[0]?.id || '');
  const [qty, setQty] = useState('');
  const n = parseInt(qty || '0', 10);
  const p = state.products.find((x) => x.id === productId);
  if (!entry) {
    return (
      <Sheet open onClose={onClose} title="Depoya Rezerve Ekle">
        <p className="small muted" style={{ marginBottom: 10 }}>Müşteriye ait olup depoda beklettiğiniz mal. Stoktan düşülmez, satılabilir miktardan ayrılır.</p>
        <div className="field"><label>Ürün</label><div className="input"><select value={productId} onChange={(e) => setProductId(e.target.value)}>{state.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div></div>
        <div className="field"><label>Miktar</label><div className="input"><input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} placeholder="0" /><span className="suffix">{p?.unit || 'adet'}</span></div></div>
        <button className="btn btn-primary" disabled={!productId || n <= 0} onClick={() => { addReserved({ customerId, productId, qty: n }); toast('Rezerve eklendi'); onClose(); }}>Kaydet</button>
      </Sheet>
    );
  }
  return (
    <Sheet open onClose={onClose} title={`${entry.name} · ${fmtNum(entry.qty)} adet rezerve`}>
      <div className="field"><label>Teslim edilecek miktar</label><div className="input"><input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} placeholder={String(entry.qty)} /><span className="suffix">adet</span></div>
        <span className="xs muted">Teslim edilen miktar stoktan ve rezerveden düşer, müşteri hareketlerine "Rezerveden Teslim" yazılır.</span></div>
      <div className="stack">
        <button className="btn btn-primary" disabled={n <= 0 || n > entry.qty} onClick={() => { deliverReserved(entry.id, n); toast('Teslim edildi'); onClose(); }}>Teslim Et</button>
        <div className="btn-row">
          <button className="btn btn-ghost" disabled={n <= 0} onClick={() => { updateReserved(entry.id, { qty: n }); toast('Miktar güncellendi'); onClose(); }}>Miktarı {n > 0 ? fmtNum(n) : '…'} yap</button>
          <DangerButton className="btn btn-ghost" message="Rezerve kaydı silinsin mi?" onConfirm={() => { deleteReserved(entry.id); toast('Silindi'); onClose(); }}>Sil</DangerButton>
        </div>
      </div>
    </Sheet>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, addTransaction, deleteCustomer } = useStore();
  const toast = useToast();
  const customer = state.customers.find((c) => c.id === id);
  const [tab, setTab] = useState(0);
  const [txf, setTxf] = useState('tumu');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [editTx, setEditTx] = useState(null);
  const [reserve, setReserve] = useState(null); // null | 'new' | entry

  if (!customer) return <div className="page"><PageHeader title="Müşteri" /><Empty>Müşteri bulunamadı.</Empty></div>;
  const s = customerSummary(state, customer);
  const allocOf = (t) => s.allocations.find((a) => a.sale.id === t.id);

  const saveNote = () => {
    if (!note.trim()) return;
    addTransaction({ customerId: id, type: 'note', note: note.trim() });
    setNote(''); setNoteOpen(false); toast('Not eklendi');
  };
  const removeCustomer = () => {
    deleteCustomer(id); toast('Müşteri silindi'); nav('/musteriler', { replace: true });
  };

  const filteredTx = s.txs.filter((t) => txf === 'tumu' || t.type === txf);
  const invoices = s.txs.filter((t) => t.type === 'sale' && t.invoiced);
  const notes = s.txs.filter((t) => t.type === 'note' || (t.type === 'visit' && t.note));

  return (
    <div className="page">
      <PageHeader title={tab === 0 ? 'Müşteri Detayı' : customer.name} to="/musteriler"
        right={<Link to={`/musteriler/${id}/duzenle`} className="icon-btn" aria-label="Düzenle"><Ic.Edit size={18} /></Link>} />

      <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Avatar customer={customer} size="lg" status={s.status} />
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
            {s.overdueAmount > 0 && <div className="row pad"><span className="neg bold">Gecikmiş</span><span className="num neg">{fmtMoney(s.overdueAmount)}</span></div>}
            <div className="row pad"><span className="muted">En Yakın Vade</span><span className="bold">{s.nextDue ? fmtDate(s.nextDue) : '-'}</span></div>
            <div className="row pad"><span className="muted">Son Ödeme</span><span className="bold">{s.lastPayment ? fmtDate(s.lastPayment.date) : '-'}</span></div>
          </div>
          {s.plannedVisits.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-title">Planlı Ziyaret</div>
              {s.plannedVisits.map((v) => <div key={v.id} className="row pad"><span>{fmtDate(v.date)}{v.note ? ` · ${v.note}` : ''}</span><Link to={`/islem?tur=visit&musteri=${id}&plan=${v.id}`} className="btn btn-sm btn-primary" style={{ boxShadow: 'none' }}>Yapıldı</Link></div>)}
            </div>
          )}

          <div className="chips" style={{ marginTop: 14 }}>
            {TX_FILTERS.map((f) => <button key={f.key} className={`chip ${txf === f.key ? 'active' : ''}`} onClick={() => setTxf(f.key)}>{f.label}</button>)}
          </div>
          <div className="tl">
            {filteredTx.map((t) => <TxItem key={t.id} t={t} alloc={allocOf(t)} onClick={() => setEditTx(t)} />)}
            {filteredTx.length === 0 && <Empty>Hareket yok.</Empty>}
          </div>
          <div className="xs muted" style={{ textAlign: 'center', marginTop: 10 }}>Düzenlemek veya silmek için harekete dokunun.</div>
        </>
      )}

      {tab === 1 && (
        <>
          <div className="card">
            <div className="card-title">Müşterideki Ürünler</div>
            {s.products.map((p) => (
              <div key={p.productId || p.name} className="row pad"><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Ic.Cup size={16} className="muted" />{p.name}</span><span className="num">{fmtNum(p.qty)} {p.unit}</span></div>
            ))}
            {s.products.length === 0 && <div className="muted small">Henüz ürün verilmedi.</div>}
          </div>
          <div className="card">
            <div className="row" style={{ marginBottom: 6 }}><div className="card-title" style={{ margin: 0 }}>Depoda Müşteriye Ait Ürünler</div><button className="btn btn-sm btn-ghost" onClick={() => setReserve('new')} disabled={state.products.length === 0}><Ic.Plus size={14} /> Ekle</button></div>
            {s.reserved.map((r) => (
              <button key={r.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => setReserve(r)}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Ic.Box size={16} style={{ color: 'var(--gold)' }} />{r.name}</span>
                <span className="num">{fmtNum(r.qty)} adet <Ic.ChevronRight size={14} className="muted" /></span>
              </button>
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
                <div className="item-sub">{fmtDate(t.date)} · {itemsLabel(t)}</div>
              </div>
              <span className="num">{fmtMoney(t.amount)}</span>
              <Ic.ChevronRight size={18} className="muted" />
            </Link>
          ))}
          {invoices.length === 0 && <Empty>Fatura yok.</Empty>}
        </div>
      )}

      {tab === 3 && (
        <>
          <div className="tl">
            {notes.map((t) => <TxItem key={t.id} t={t} onClick={() => setEditTx(t)} />)}
            {notes.length === 0 && <Empty>Not yok.</Empty>}
          </div>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <DangerButton className="btn btn-ghost" message={`${customer.name} ve tüm hareketleri silinecek. Stok ve kasa etkileri geri alınır. Emin misiniz?`} onConfirm={removeCustomer}><Ic.Trash size={16} /> Müşteriyi Sil</DangerButton>
          </div>
        </>
      )}

      <div className="sticky-bottom btn-row">
        <button className="btn btn-primary" onClick={() => nav(`/islem?musteri=${id}`)}>Yeni İşlem</button>
        <button className="btn btn-outline" onClick={() => setNoteOpen(true)}>Not Ekle</button>
      </div>

      <Sheet open={noteOpen} onClose={() => setNoteOpen(false)} title="Not Ekle">
        <textarea className="input" placeholder="Örn: Yeni sezon siparişi konuşuldu..." value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveNote} disabled={!note.trim()}>Kaydet</button>
      </Sheet>
      {editTx && <TxEditor tx={editTx} onClose={() => setEditTx(null)} />}
      {reserve && <ReserveSheet customerId={id} entry={reserve === 'new' ? null : reserve} onClose={() => setReserve(null)} />}
    </div>
  );
}
