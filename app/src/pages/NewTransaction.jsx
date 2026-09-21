import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { addDays } from '../store/seed';
import { fmtMoney, fmtNum, fmtPrice, today, parseMoney, toInput } from '../utils/format';
import { PageHeader, SelectField, Segmented, Avatar, DateField, useToast, MoneyInput } from '../components/ui';
import { useSync } from '../store/sync';
import { prepareFile, uploadAttachment } from '../store/files';
import { loadDevice } from '../store/storage';
import { uid } from '../utils/format';
import * as Ic from '../components/Icons';
import { cleanItem } from '../utils/format';

const TYPES = [
  { value: 'sale', label: 'Mal Ver' }, { value: 'debt', label: 'Borç Ekle' }, { value: 'payment', label: 'Tahsilat' }, { value: 'visit', label: 'Ziyaret' },
];
const TITLES = { sale: 'Mal Ver / Yeni İşlem', debt: 'Borç Ekle', payment: 'Tahsilat Gir', visit: 'Ziyaret Kaydı' };

/** Çok ürünlü satır düzenleyici (yeni işlem ve düzenleme ekranlarında ortak). */
export function ItemsEditor({ items, onChange, products }) {
  const setRow = (i, patch) => {
    const next = items.map((r, k) => (k === i ? { ...r, ...patch } : r));
    const r = next[i];
    if (patch.productId !== undefined) {
      const p = products.find((x) => x.id === patch.productId);
      if (p) { r.name = p.name; r.unit = p.unit; if (!r.manual) { r.unitPrice = p.price; r.priceStr = toInput(p.price); } }
    }
    r.amount = Math.round((r.qty || 0) * (r.unitPrice || 0) * 100) / 100;
    onChange(next);
  };
  const add = () => {
    const p = products.find((x) => !items.some((r) => r.productId === x.id)) || products[0];
    onChange([...items, { productId: p?.id || '', name: p?.name || '', unit: p?.unit || 'adet', qty: 0, unitPrice: p?.price || 0, priceStr: toInput(p?.price || 0), amount: 0 }]);
  };
  return (
    <div className="field">
      <label>Ürünler</label>
      <div className="line xs muted" style={{ marginBottom: 2 }}><span>Ürün</span><span>Miktar</span><span>Birim ₺</span><span /></div>
      {items.map((r, i) => {
        const p = products.find((x) => x.id === r.productId);
        return (
          <div className="line" key={i}>
            <div className="input"><select value={r.productId} onChange={(e) => setRow(i, { productId: e.target.value })}>
              <option value="">Ürün seçin</option>
              {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select></div>
            <div className="input"><input inputMode="numeric" value={r.qty || ''} placeholder="0" onChange={(e) => setRow(i, { qty: parseInt(e.target.value.replace(/\D/g, '') || '0', 10) })} /></div>
            <div className="input"><MoneyInput value={r.priceStr ?? toInput(r.unitPrice)} onChange={(v) => setRow(i, { unitPrice: parseMoney(v), priceStr: v, manual: true })} /></div>
            <button type="button" className="rm" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Satırı kaldır"><Ic.X size={18} /></button>
            {p && r.qty > p.stock && <div className="xs neg" style={{ gridColumn: '1 / -1', marginTop: -4 }}>Stok yetersiz: {p.name} mevcut {fmtNum(p.stock)} {p.unit}</div>}
          </div>
        );
      })}
      <button type="button" className="btn btn-ghost btn-sm" onClick={add} disabled={products.length === 0}><Ic.Plus size={16} /> Ürün satırı ekle</button>
    </div>
  );
}

export default function NewTransaction() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { state, addTransaction, setAttachments } = useStore();
  const sync = useSync();
  const [pending, setPending] = useState([]); // kaydedilince yüklenecek dosyalar
  const [saving, setSaving] = useState(false);
  const planId = params.get('plan') || undefined;

  const [type, setType] = useState(params.get('tur') || 'sale');
  const [customerId, setCustomerId] = useState(params.get('musteri') || '');
  const [items, setItems] = useState(() => {
    const p = state.products[0];
    return p ? [{ productId: p.id, name: p.name, unit: p.unit, qty: 0, unitPrice: p.price, amount: 0 }] : [];
  });
  const [amount, setAmount] = useState('');
  const [invoiced, setInvoiced] = useState(params.get('fatura') === '1');
  const [payment, setPayment] = useState('vadeli');
  const [paidNow, setPaidNow] = useState('');
  const [method, setMethod] = useState('nakit');
  const [date, setDate] = useState(today());
  const [dueDate, setDueDateRaw] = useState(addDays(today(), state.settings.defaultDueDays || 30));
  const [dueTouched, setDueTouched] = useState(false);
  const setDueDate = (v) => { setDueTouched(true); setDueDateRaw(v); };
  const setDateAndDue = (v) => { setDate(v); if (!dueTouched && v) setDueDateRaw(addDays(v, state.settings.defaultDueDays || 30)); };
  const [note, setNote] = useState('');

  const customer = state.customers.find((c) => c.id === customerId);
  const customerOpts = useMemo(() => state.customers.map((c) => ({ value: c.id, label: c.name, c })), [state.customers]);

  const validItems = items.filter((i) => i.productId && i.qty > 0);
  const total = validItems.reduce((a, i) => a + i.amount, 0);
  const amountN = type === 'sale' ? total : parseMoney(amount);
  const paidNowN = parseMoney(paidNow);

  const missing = !customerId ? 'Müşteri seçin'
    : type === 'sale' && validItems.length === 0 ? 'En az bir ürün ve miktar girin'
    : type === 'sale' && amountN <= 0 ? 'Tutar sıfır olamaz (birim fiyat girin)'
    : type === 'sale' && payment === 'kismi' && !(paidNowN > 0 && paidNowN < amountN) ? 'Kısmi ödemede "şimdi ödenen" sıfırdan büyük ve toplamdan küçük olmalı'
    : type === 'payment' && amountN <= 0 ? 'Tahsilat tutarı girin'
    : type === 'debt' && amountN <= 0 ? 'Borç tutarı girin' : '';
  const valid = customerId && (
    (type === 'sale' && validItems.length > 0 && amountN > 0 && (payment !== 'kismi' || (paidNowN > 0 && paidNowN < amountN))) ||
    (type === 'payment' && amountN > 0) ||
    (type === 'debt' && amountN > 0) ||
    (type === 'visit')
  );

  const save = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    const base = { customerId, date, note: note.trim() || undefined };
    if (type === 'sale') {
      const id = uid();
      addTransaction({ ...base, id, type: 'sale', items: validItems.map(cleanItem), amount: amountN, invoiced, payment,
        dueDate: payment === 'pesin' ? date : dueDate, paidNow: payment === 'kismi' ? paidNowN : undefined, method });
      if (pending.length && sync?.enabled) {
        setSaving(true);
        const added = [];
        try { for (const f of pending) added.push(await uploadAttachment(sync.cfg, await prepareFile(f), `${date.slice(0, 4)}/${id}`, loadDevice().userName)); }
        catch (err) { toast(`Belge yüklenemedi: ${err.message}`); }
        if (added.length) setAttachments(id, added);
        setSaving(false);
      }
      toast(pending.length ? 'İşlem ve belgeler kaydedildi' : 'İşlem kaydedildi');
    } else if (type === 'payment') {
      addTransaction({ ...base, type: 'payment', amount: amountN, method });
      toast('Tahsilat kaydedildi');
    } else if (type === 'debt') {
      addTransaction({ ...base, type: 'debt', amount: amountN, dueDate });
      toast('Borç kaydedildi');
    } else {
      addTransaction({ ...base, type: 'visit', note: note.trim() || 'Ziyaret yapıldı.' }, planId);
      toast('Ziyaret kaydedildi');
    }
    nav(`/musteriler/${customerId}`, { replace: true });
  };

  return (
    <div className="page page--no-tabs">
      <PageHeader title={TITLES[type]} />
      <form onSubmit={save}>
        <div className="field"><label>İşlem Türü</label><Segmented value={type} onChange={setType} options={TYPES} light /></div>

        <SelectField label="Müşteri" value={customerId} onChange={setCustomerId} options={customerOpts} placeholder={state.customers.length ? 'Müşteri seçin' : 'Henüz müşteri yok'}
          renderOption={(o) => <><Avatar customer={o.c} size="sm" /><span style={{ flex: 1 }}>{o.label}</span></>} />
        {state.customers.length === 0 && <div className="card small" style={{ marginTop: -8, marginBottom: 16 }}>Önce <Link to="/musteriler/yeni" style={{ color: 'var(--green)', fontWeight: 700 }}>müşteri ekleyin</Link>.</div>}

        {type === 'sale' && (
          <>
            {state.products.length === 0
              ? <div className="card small" style={{ marginBottom: 16 }}>Önce <Link to="/stok" style={{ color: 'var(--green)', fontWeight: 700 }}>Stok / Depo</Link> ekranından ürün ekleyin.</div>
              : <ItemsEditor items={items} onChange={setItems} products={state.products} />}
            <div className="card row" style={{ marginBottom: 16 }}><span className="bold">Toplam</span><span className="num" style={{ fontSize: 18 }}>{fmtMoney(total)}</span></div>
            <div className="field"><label>Fatura Durumu</label>
              <Segmented value={invoiced ? 'f' : 'nf'} onChange={(v) => setInvoiced(v === 'f')} options={[{ value: 'f', label: 'Faturalı' }, { value: 'nf', label: 'Faturasız' }]} light /></div>
            <div className="field"><label>Ödeme Durumu</label>
              <Segmented value={payment} onChange={setPayment} options={[{ value: 'vadeli', label: 'Vadeli' }, { value: 'pesin', label: 'Peşin' }, { value: 'kismi', label: 'Kısmi' }]} light /></div>
            {payment === 'kismi' && (
              <div className="field"><label>Şimdi Ödenen</label>
                <div className="input"><span className="suffix">₺</span><MoneyInput value={paidNow} onChange={setPaidNow} /></div>
                {paidNowN > 0 && amountN > paidNowN && <span className="xs muted">Kalan {fmtMoney(amountN - paidNowN)} vadeye yazılır.</span>}
              </div>
            )}
          </>
        )}

        {type === 'payment' && (
          <div className="field"><label>Tutar</label>
            <div className="input"><span className="suffix">₺</span><MoneyInput value={amount} onChange={setAmount} autoFocus /></div></div>
        )}
        {type === 'debt' && (
          <>
            <div className="card small" style={{ marginBottom: 14 }}>Mal girişi yapmadan müşterinin bakiyesine borç ekler (örn. eski defterden devir, önceki alacak). Stok ve kasa değişmez; borç vadesi geçince gecikmiş sayılır.</div>
            <div className="field"><label>Borç Tutarı</label>
              <div className="input"><span className="suffix">₺</span><MoneyInput value={amount} onChange={setAmount} autoFocus /></div></div>
          </>
        )}

        {(type === 'payment' || (type === 'sale' && payment !== 'vadeli')) && (
          <div className="field"><label>Ödeme Yöntemi</label>
            <Segmented value={method} onChange={setMethod} options={[{ value: 'nakit', label: 'Nakit' }, { value: 'banka', label: 'Havale' }, { value: 'kart', label: 'Kart' }]} light /></div>
        )}

        <DateField label="Tarih" value={date} onChange={setDateAndDue} />
        {((type === 'sale' && payment !== 'pesin') || type === 'debt') && <DateField label="Vade Tarihi" value={dueDate} onChange={setDueDate} min={date} />}

        <div className="field"><label>Not <span className="opt">(isteğe bağlı)</span></label>
          <textarea className="input" placeholder={type === 'debt' ? 'Örn: Eski defterden devir bakiyesi' : 'Örn: Yeni sezon siparişi...'} value={note} onChange={(e) => setNote(e.target.value)} /></div>

        {type === 'sale' && (
          <div className="field"><label>Fatura Belgesi <span className="opt">(PDF veya fotoğraf, isteğe bağlı)</span></label>
            {pending.length > 0 && <div className="attach-list">{pending.map((f, i) => <div key={i} className="attach-item"><span className="tl-icon"><Ic.FileText size={16} /></span><span className="attach-name"><b>{f.name}</b><span>{Math.round(f.size / 1024)} KB</span></span><button type="button" className="rm" onClick={() => setPending(pending.filter((_, k) => k !== i))} aria-label="Kaldır"><Ic.X size={16} /></button></div>)}</div>}
            <div className="attach-actions">
              <label className="btn btn-ghost btn-sm"><Ic.FileText size={15} /> PDF / Dosya ekle<input type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => { setPending([...pending, ...e.target.files]); e.target.value = ''; }} /></label>
              <label className="btn btn-ghost btn-sm"><Ic.Target size={15} /> Fotoğraf çek<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { setPending([...pending, ...e.target.files]); e.target.value = ''; }} /></label>
            </div>
            {!sync?.enabled && pending.length > 0 && <span className="xs neg">Belgeler için Bulut Senkron bağlı olmalı; işlem belgesiz kaydedilir.</span>}
          </div>
        )}

        {customer && type !== 'visit' && amountN > 0 && (
          <div className="card small muted" style={{ marginBottom: 12 }}>
            {type === 'sale'
              ? `${customer.name} için ${validItems.length} kalem, ${fmtMoney(amountN)}: ${payment === 'pesin' ? 'peşin tahsil edilecek' : payment === 'kismi' ? `${fmtMoney(paidNowN)} şimdi, kalanı vadeye` : `vade ${dueDate.split('-').reverse().join('.')}`}.`
              : type === 'debt' ? `${customer.name} bakiyesine ${fmtMoney(amountN)} borç eklenecek (vade ${dueDate.split('-').reverse().join('.')}).`
              : `${customer.name} carisinden ${fmtMoney(amountN)} düşülecek, kasaya eklenecek.`}
          </div>
        )}
        {type === 'sale' && validItems.length > 0 && <div className="xs muted" style={{ marginBottom: 12 }}>Birim fiyatlar ürün kartından gelir ({validItems.map((i) => `${i.name}: ${fmtPrice(i.unitPrice)}`).join(', ')}); satırda değiştirebilirsiniz.</div>}

        <div className="sticky-bottom">
          {missing && <div className="xs" style={{ color: 'var(--orange)', textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>{missing}</div>}
          <button className="btn btn-primary" type="submit" disabled={!valid || saving}>{saving ? 'Belgeler yükleniyor...' : 'Kaydet'}</button>
        </div>
      </form>
    </div>
  );
}
