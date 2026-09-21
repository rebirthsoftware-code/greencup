import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { customerSummary, METHOD_LABEL, PAYMENT_LABEL, txItems, itemsLabel, TX_TITLE, txTitle } from '../store/selectors';
import { fmtMoney, fmtNum, fmtDate, parseMoney, toInput, today } from '../utils/format';
import { PageHeader, Avatar, StatusBadge, Empty, Sheet, Segmented, Tabs, DateField, DangerButton, useToast, MoneyInput } from '../components/ui';
import { ItemsEditor } from './NewTransaction';
import { cleanItem } from '../utils/format';
import * as Ic from '../components/Icons';
import Attachments from '../components/Attachments';
import GoodsSheet from '../components/GoodsSheets';

const TABS = ['Hareketler', 'Ürünler', 'Faturalar', 'Notlar'];
const TX_FILTERS = [
  { key: 'tumu', label: 'Tümü' }, { key: 'sale', label: 'Mal Verildi' }, { key: 'debt', label: 'Borç' },
  { key: 'payment', label: 'Tahsilat' }, { key: 'visit', label: 'Ziyaret' }, { key: 'note', label: 'Not' },
];
const TITLE = TX_TITLE;

export function TxItem({ t, alloc, onClick }) {
  const Icon = t.type === 'sale' ? (t.fromReserve ? Ic.Box : Ic.Truck) : t.type === 'debt' ? Ic.Receipt : t.type === 'payment' ? Ic.Cash : t.type === 'visit' ? Ic.Target : Ic.Note;
  const cls = t.type === 'payment' ? 'pay' : t.type === 'visit' ? 'visit' : t.type === 'note' ? 'note' : '';
  const owes = (t.type === 'sale' || t.type === 'debt') && t.amount > 0;
  const overdue = owes && alloc?.open > 0 && t.dueDate && t.dueDate < today();
  return (
    <div className="tl-item" onClick={onClick}>
      <div className={`tl-icon ${cls}`}><Icon size={18} /></div>
      <div className="tl-body">
        <div className="tl-head">
          <div><span className="tl-date">{fmtDate(t.date)}</span><span className="tl-title">{txTitle(t)}</span></div>
          {(t.amount > 0 || (t.type === 'payment' && t.amount != null)) && <span className={`num ${t.type === 'payment' ? 'pos' : ''}`}>{fmtMoney(t.amount)}</span>}
        </div>
        {t.type === 'sale' && <div className="tl-sub">{itemsLabel(t)}</div>}
        {t.note && <div className="tl-sub">{t.type === 'visit' ? 'Not: ' : ''}{t.note}</div>}
        {owes && (
          <div className="tl-meta">
            {t.dueDate && t.payment !== 'pesin' ? `Vade: ${fmtDate(t.dueDate)}` : PAYMENT_LABEL[t.payment] || (t.type === 'debt' ? 'Borç' : '')}
            {alloc && alloc.open > 0 ? ` · Açık: ${fmtMoney(alloc.open)}` : alloc ? ' · Ödendi' : ''}
          </div>
        )}
        {t.by && <div className="tl-meta">{t.by}</div>}
        <div className="tl-foot" style={{ gap: 6 }}>
          {overdue && <span className="badge badge--gecikmis">Gecikmiş</span>}
          {t.type === 'sale' && !t.fromReserve && <span className={`badge ${t.invoiced ? 'badge--aktif' : 'badge--gecikmis'}`}>{t.invoiced ? `Faturalı${t.invoiceNo ? ' · ' + t.invoiceNo : ''}` : 'Faturasız'}</span>}
          {t.type === 'payment' && <span className="badge badge--blue">{METHOD_LABEL[t.method] || 'Nakit'}</span>}
          {t.attachments?.length > 0 && <span className="badge badge--neutral"><Ic.FileText size={12} /> {t.attachments.length} belge</span>}
        </div>
      </div>
    </div>
  );
}

/** Hareket düzenleme / silme alt sayfası */
function TxEditor({ tx, onClose }) {
  const { state, updateTransaction, deleteTransaction, setAttachments } = useStore();
  const toast = useToast();
  const [f, setF] = useState(() => ({ ...tx, items: txItems(tx).map((i) => ({ ...i })), amountStr: toInput(tx.amount ?? '') }));
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const total = f.type === 'sale' && !tx.fromReserve ? f.items.filter((i) => i.productId && i.qty > 0).reduce((a, i) => a + i.amount, 0) : parseMoney(f.amountStr);
  const save = () => {
    const patch = { date: f.date, note: f.note?.trim() || undefined };
    if (f.type === 'sale' && !tx.fromReserve) Object.assign(patch, { items: f.items.filter((i) => i.productId && i.qty > 0).map(cleanItem), amount: total, invoiced: f.invoiced, payment: f.payment, dueDate: f.dueDate });
    if (f.type === 'sale' && tx.fromReserve) Object.assign(patch, { amount: total, payment: total > 0 ? 'vadeli' : 'pesin', dueDate: total > 0 ? (f.dueDate || f.date) : f.date, items: f.items.map((i) => ({ ...i, amount: total, unitPrice: i.qty ? Math.round((total / i.qty) * 100) / 100 : 0 })) });
    if (f.type === 'payment') Object.assign(patch, { amount: total, method: f.method });
    if (f.type === 'debt') Object.assign(patch, { amount: total, dueDate: f.dueDate || f.date });
    if ((f.type === 'sale' || f.type === 'payment' || f.type === 'debt') && !(total > 0) && !tx.fromReserve) return toast('Tutar sıfır olamaz');
    updateTransaction(tx.id, patch); toast('Güncellendi'); onClose();
  };
  return (
    <Sheet open onClose={onClose} title={`${txTitle(tx)} · Düzenle`}>
      <DateField label="Tarih" value={f.date} onChange={set('date')} />
      {f.type === 'sale' && !tx.fromReserve && (
        <>
          <ItemsEditor items={f.items} onChange={set('items')} products={state.products} />
          <div className="card row" style={{ marginBottom: 14 }}><span className="bold">Toplam</span><span className="num">{fmtMoney(total)}</span></div>
          <div className="field"><label>Fatura</label><Segmented light value={f.invoiced ? 'f' : 'nf'} onChange={(v) => set('invoiced')(v === 'f')} options={[{ value: 'f', label: 'Faturalı' }, { value: 'nf', label: 'Faturasız' }]} /></div>
          <div className="field"><label>Ödeme</label><Segmented light value={f.payment} onChange={set('payment')} options={[{ value: 'vadeli', label: 'Vadeli' }, { value: 'pesin', label: 'Peşin' }, { value: 'kismi', label: 'Kısmi' }]} /></div>
          {f.payment !== 'pesin' && <DateField label="Vade Tarihi" value={f.dueDate || ''} onChange={set('dueDate')} />}
          <div className="field"><label>Belgeler</label><Attachments items={tx.attachments || []} onChange={(list) => setAttachments(tx.id, list)} folder={`${(tx.date || '').slice(0, 4)}/${tx.id}`} compact /></div>
        </>
      )}
      {f.type === 'sale' && tx.fromReserve && (
        <>
          <div className="card small muted" style={{ marginBottom: 12 }}>{itemsLabel(tx)} · müşteri malı teslimi (stoğunuzu etkilemez)</div>
          <div className="field"><label>Tutar <span className="opt">(0 = bedelsiz teslim)</span></label><div className="input"><span className="suffix">₺</span><MoneyInput value={f.amountStr} onChange={set('amountStr')} /></div></div>
          {total > 0 && <DateField label="Vade Tarihi" value={f.dueDate || ''} onChange={set('dueDate')} />}
        </>
      )}
      {f.type === 'debt' && (
        <>
          <div className="field"><label>Borç Tutarı</label><div className="input"><span className="suffix">₺</span><MoneyInput value={f.amountStr} onChange={set('amountStr')} /></div></div>
          <DateField label="Vade Tarihi" value={f.dueDate || ''} onChange={set('dueDate')} />
        </>
      )}
      {f.type === 'payment' && (
        <>
          <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><MoneyInput value={f.amountStr} onChange={set('amountStr')} /></div></div>
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

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, addTransaction, deleteCustomer, setAttachments } = useStore();
  const toast = useToast();
  const customer = state.customers.find((c) => c.id === id);
  const [tab, setTab] = useState(0);
  const [txf, setTxf] = useState('tumu');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [editTx, setEditTx] = useState(null);
  const [goods, setGoods] = useState(null); // null | { kind: 'reserved'|'production', entry|null }

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

      <div className="cust-hero">
        <div className="cust-hero-top">
          <Avatar customer={customer} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 20, color: '#fff' }}>{customer.name}</div>
            <div className="cust-hero-type">{customer.type}{customer.city ? ` · ${customer.city}${customer.district ? ' / ' + customer.district : ''}` : ''}</div>
          </div>
          <StatusBadge status={s.status} />
        </div>
        <div className="cust-hero-balance">
          <div><span>Kalan Bakiye</span><b>{fmtMoney(s.balance)}</b></div>
          <div><span>Gecikmiş</span><b>{fmtMoney(s.overdueAmount)}</b></div>
          <div><span>En Yakın Vade</span><b>{s.nextDue ? fmtDate(s.nextDue) : '-'}</b></div>
        </div>
        <div className="cust-hero-actions">
          {customer.phone && <a href={`tel:${customer.phone.replace(/\s/g, '')}`}><Ic.Phone size={16} />Ara</a>}
          <Link to={`/ziyaret/${id}`}><Ic.MapPin size={16} />Harita</Link>
          <button onClick={() => setNoteOpen(true)}><Ic.Note size={16} />Not</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}><Tabs value={tab} onChange={setTab} items={TABS} /></div>

      {tab === 0 && (
        <>
          <div className="card">
            <div className="card-title">Cari Durum</div>
            <div className="row pad"><span className="muted">Toplam Borç</span><span className="num">{fmtMoney(s.totalDebt)}</span></div>
            <div className="row pad"><span className="muted">Ödenen</span><span className="num">{fmtMoney(s.totalPaid)}</span></div>
            <div className="row pad"><span className={`bold ${s.balance > 0 ? 'neg' : 'pos'}`}>Kalan Bakiye</span><span className={`num ${s.balance > 0 ? 'neg' : 'pos'}`} style={{ fontSize: 17 }}>{fmtMoney(s.balance)}</span></div>
            <div className="row pad"><span className="muted">Son Ödeme</span><span className="bold">{s.lastPayment ? fmtDate(s.lastPayment.date) : '-'}</span></div>
            <div className="row pad"><span className="muted">Son Ziyaret</span><span className="bold">{s.lastVisit ? fmtDate(s.lastVisit.date) : '-'}</span></div>
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
            <div className="row" style={{ marginBottom: 6 }}><div className="card-title" style={{ margin: 0 }}>Depoda Müşteriye Ait Mallar</div><button className="btn btn-sm btn-ghost" onClick={() => setGoods({ kind: 'reserved', entry: null })}><Ic.Plus size={14} /> Ekle</button></div>
            {s.reserved.map((r) => (
              <button key={r.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => setGoods({ kind: 'reserved', entry: r })}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Ic.Box size={16} style={{ color: 'var(--gold)' }} />{r.name}</span>
                <span className="num">{fmtNum(r.qty)} {r.unit} <Ic.ChevronRight size={14} className="muted" /></span>
              </button>
            ))}
            {s.reserved.length === 0 && <div className="muted small">Depoda müşteriye ait mal yok. Sizin stoğunuzdan ayrı tutulur.</div>}
          </div>
          <div className="card">
            <div className="row" style={{ marginBottom: 6 }}><div className="card-title" style={{ margin: 0 }}>Üretimde</div><button className="btn btn-sm btn-ghost" onClick={() => setGoods({ kind: 'production', entry: null })}><Ic.Plus size={14} /> Ekle</button></div>
            {s.production.map((r) => (
              <button key={r.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => setGoods({ kind: 'production', entry: r })}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}><Ic.Box size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} /><span><span style={{ display: 'block' }}>{r.name}</span>{r.dueDate && <span className={`xs ${r.dueDate <= today() ? 'neg' : 'muted'}`}>Teslim: {fmtDate(r.dueDate)}</span>}</span></span>
                <span className="num" style={{ flexShrink: 0 }}>{fmtNum(r.qty)} {r.unit} <Ic.ChevronRight size={14} className="muted" /></span>
              </button>
            ))}
            {s.production.length === 0 && <div className="muted small">Üretimde mal yok.</div>}
          </div>
        </>
      )}

      {tab === 2 && (
        <div className="list">
          {invoices.map((t) => (
            <div key={t.id} className="card" style={{ padding: 12 }}>
              <Link to={`/fatura/${t.id}`} className="row" style={{ gap: 12 }}>
                <div className="tl-icon"><Ic.FileText size={18} /></div>
                <div className="item-body">
                  <div className="item-title">Fatura {t.invoiceNo ? `No: ${t.invoiceNo}` : ''}</div>
                  <div className="item-sub">{fmtDate(t.date)} · {itemsLabel(t)}</div>
                </div>
                <span className="num">{fmtMoney(t.amount)}</span>
                <Ic.ChevronRight size={18} className="muted" />
              </Link>
              <div style={{ marginTop: 10 }}>
                <Attachments items={t.attachments || []} onChange={(list) => setAttachments(t.id, list)} folder={`${(t.date || '').slice(0, 4)}/${t.id}`} compact />
              </div>
            </div>
          ))}
          {invoices.length === 0 && <Empty>Faturalı satış yok. Mal verirken "Faturalı" seçin ve belgeyi ekleyin.</Empty>}
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
      {goods && <GoodsSheet kind={goods.kind} customerId={id} entry={goods.entry} onClose={() => setGoods(null)} />}
    </div>
  );
}
