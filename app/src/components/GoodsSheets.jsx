import { useState } from 'react';
import { useStore } from '../store/store';
import { fmtNum, fmtMoney, parseMoney, today } from '../utils/format';
import { addDays } from '../store/seed';
import { Sheet, DangerButton, useToast, MoneyInput, DateField, Segmented } from './ui';

const UNITS = ['adet', 'koli', 'paket', 'kg'];
const CUSTOM = '__custom';
const KIND = {
  reserved: { title: 'Depoya Müşteri Malı Ekle', hint: 'Depoda beklettiğiniz, müşteriye ait mal (baskılı bardak vb.). Sizin stoğunuzdan ayrı tutulur, stoktan düşmez.' },
  production: { title: 'Üretime Ekle', hint: 'Müşteri için üretimde olan sipariş. Üretim bitince "Depoya Al" ya da doğrudan "Teslim Et".' },
};
const numOnly = (v) => v.replace(/\D/g, '');

/** Müşteri malı ekleme / teslim / düzenleme alt sayfası (depoda ve üretimde ortak). */
export default function GoodsSheet({ kind = 'reserved', customerId, entry, onClose }) {
  const { state, addReserved, updateReserved, deleteReserved, deliverReserved, addProduction, updateProduction, deleteProduction, productionToStock, productionDeliver } = useStore();
  const toast = useToast();
  const isProd = kind === 'production';

  /* ---- yeni kayıt ---- */
  const [cust, setCust] = useState(customerId || entry?.customerId || state.customers[0]?.id || '');
  const [productId, setProductId] = useState(entry ? (entry.productId || CUSTOM) : (state.products[0]?.id || CUSTOM));
  const [name, setName] = useState(entry?.productId ? '' : (entry?.name || ''));
  const [unit, setUnit] = useState(entry?.unit || 'adet');
  const [qty, setQty] = useState(entry ? String(entry.qty) : '');
  const [note, setNote] = useState(entry?.note || '');
  const [dueDate, setDueDate] = useState(entry?.dueDate || '');
  /* ---- teslim ---- */
  const [mode, setMode] = useState(isProd ? 'stock' : 'deliver');
  const [dQty, setDQty] = useState(entry ? String(entry.qty) : '');
  const [amount, setAmount] = useState('');
  const [dDue, setDDue] = useState(addDays(today(), state.settings.defaultDueDays || 30));

  const product = state.products.find((p) => p.id === productId);
  const n = parseInt(qty || '0', 10);
  const dn = parseInt(dQty || '0', 10);
  const amountN = parseMoney(amount);
  const goods = () => ({ customerId: cust, productId: productId === CUSTOM ? undefined : productId, name: productId === CUSTOM ? name.trim() : product?.name, unit: productId === CUSTOM ? unit : (product?.unit || 'adet') });
  const nameOk = productId === CUSTOM ? name.trim().length > 0 : !!product;

  const customerSel = !customerId && (
    <div className="field"><label>Müşteri</label><div className="input"><select value={cust} onChange={(e) => setCust(e.target.value)}>
      {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select></div></div>
  );
  const productFields = (
    <>
      <div className="field"><label>Ürün</label><div className="input"><select value={productId} onChange={(e) => setProductId(e.target.value)}>
        {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        <option value={CUSTOM}>Listede yok / müşteriye özel ürün…</option>
      </select></div></div>
      {productId === CUSTOM && (
        <div className="grid-2">
          <div className="field"><label>Ürün Adı</label><div className="input"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="14oz Baskılı Bardak" autoFocus /></div></div>
          <div className="field"><label>Birim</label><div className="input"><select value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div></div>
        </div>
      )}
    </>
  );

  if (!entry) {
    const save = () => {
      if (!cust) return toast('Müşteri seçin');
      if (!nameOk) return toast('Ürün adı girin');
      if (!(n > 0)) return toast('Miktar girin');
      const g = { ...goods(), qty: n, note: note.trim() || undefined };
      if (isProd) { addProduction({ ...g, dueDate: dueDate || undefined }); toast('Üretime eklendi'); }
      else { addReserved(g); toast('Depoya eklendi'); }
      onClose();
    };
    return (
      <Sheet open onClose={onClose} title={KIND[kind].title}>
        <p className="small muted" style={{ marginBottom: 10 }}>{KIND[kind].hint}</p>
        {customerSel}
        {productFields}
        <div className="field"><label>Miktar</label><div className="input"><input inputMode="numeric" value={qty} onChange={(e) => setQty(numOnly(e.target.value))} placeholder="0" /><span className="suffix">{productId === CUSTOM ? unit : (product?.unit || 'adet')}</span></div></div>
        {isProd && <DateField label="Tahmini Teslim Tarihi (isteğe bağlı)" value={dueDate} onChange={setDueDate} />}
        <div className="field"><label>Not <span className="opt">(isteğe bağlı)</span></label><div className="input"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder={isProd ? 'Örn: Matbaada, logo onaylandı' : 'Örn: Raf B-3'} /></div></div>
        <button className="btn btn-primary" disabled={!cust || !nameOk || !(n > 0)} onClick={save}>Kaydet</button>
      </Sheet>
    );
  }

  /* ---- mevcut kayıt: teslim / depoya al / düzenle ---- */
  const cName = state.customers.find((c) => c.id === entry.customerId)?.name || '';
  const deliverOpts = { amount: amountN > 0 ? amountN : 0, dueDate: amountN > 0 ? dDue : undefined };
  const deliver = () => {
    if (isProd) productionDeliver(entry.id, dn, deliverOpts); else deliverReserved(entry.id, dn, deliverOpts);
    toast(amountN > 0 ? `Teslim edildi, ${fmtMoney(amountN)} borç yazıldı` : 'Teslim edildi'); onClose();
  };
  const toStock = () => { productionToStock(entry.id, dn); toast('Depoya alındı'); onClose(); };
  const saveEdit = () => {
    if (!(n > 0)) return toast('Miktar girin');
    const patch = { qty: n, note: note.trim() || undefined };
    if (!entry.productId) { patch.name = name.trim() || entry.name; patch.unit = unit; }
    if (isProd) { patch.dueDate = dueDate || undefined; updateProduction(entry.id, patch); } else updateReserved(entry.id, patch);
    toast('Güncellendi'); onClose();
  };
  const remove = () => { if (isProd) deleteProduction(entry.id); else deleteReserved(entry.id); toast('Silindi'); onClose(); };
  const modes = isProd
    ? [{ value: 'stock', label: 'Depoya Al' }, { value: 'deliver', label: 'Teslim Et' }, { value: 'edit', label: 'Düzenle' }]
    : [{ value: 'deliver', label: 'Teslim Et' }, { value: 'edit', label: 'Düzenle' }];
  const qtyField = (label, hint) => (
    <div className="field"><label>{label}</label>
      <div className="input"><input inputMode="numeric" value={dQty} onChange={(e) => setDQty(numOnly(e.target.value))} placeholder={String(entry.qty)} /><span className="suffix">{entry.unit}</span></div>
      {hint && <span className="xs muted">{hint}</span>}
      {dn > entry.qty && <span className="xs neg">En fazla {fmtNum(entry.qty)} {entry.unit}</span>}
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={`${entry.name} · ${fmtNum(entry.qty)} ${entry.unit}`}>
      <p className="small muted" style={{ marginBottom: 10 }}>{cName} · {isProd ? `Üretimde${entry.dueDate ? `, teslim ${entry.dueDate.split('-').reverse().join('.')}` : ''}` : 'Depoda'}{entry.note ? ` · ${entry.note}` : ''}</p>
      <div className="field"><Segmented value={mode} onChange={setMode} options={modes} light /></div>

      {mode === 'stock' && (
        <>
          {qtyField('Depoya alınacak miktar', 'Üretimden düşer, "Depoda" listesine eklenir.')}
          <button className="btn btn-primary" disabled={!(dn > 0) || dn > entry.qty} onClick={toStock}>Depoya Al</button>
        </>
      )}
      {mode === 'deliver' && (
        <>
          {qtyField('Teslim edilecek miktar', 'Müşteri hareketlerine "Müşteri Malı Teslim" yazılır; sizin stoğunuz değişmez.')}
          <div className="field"><label>Tutar <span className="opt">(müşteriye borç yazılacaksa)</span></label>
            <div className="input"><span className="suffix">₺</span><MoneyInput value={amount} onChange={setAmount} /></div>
            <span className="xs muted">Boş bırakılırsa bedelsiz teslim (ücreti daha önce alınmış / ayrıca borç yazılmış).</span></div>
          {amountN > 0 && <DateField label="Vade Tarihi" value={dDue} onChange={setDDue} min={today()} />}
          <button className="btn btn-primary" disabled={!(dn > 0) || dn > entry.qty} onClick={deliver}>Teslim Et{amountN > 0 ? ` · ${fmtMoney(amountN)}` : ''}</button>
        </>
      )}
      {mode === 'edit' && (
        <>
          {!entry.productId && (
            <div className="grid-2">
              <div className="field"><label>Ürün Adı</label><div className="input"><input value={name} onChange={(e) => setName(e.target.value)} /></div></div>
              <div className="field"><label>Birim</label><div className="input"><select value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div></div>
            </div>
          )}
          <div className="field"><label>Miktar</label><div className="input"><input inputMode="numeric" value={qty} onChange={(e) => setQty(numOnly(e.target.value))} /><span className="suffix">{entry.unit}</span></div></div>
          {isProd && <DateField label="Tahmini Teslim Tarihi" value={dueDate} onChange={setDueDate} />}
          <div className="field"><label>Not</label><div className="input"><input value={note} onChange={(e) => setNote(e.target.value)} /></div></div>
          <div className="btn-row">
            <DangerButton className="btn btn-ghost" message="Kayıt silinsin mi?" onConfirm={remove}>Sil</DangerButton>
            <button className="btn btn-primary" disabled={!(n > 0)} onClick={saveEdit}>Kaydet</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Ürün kartını müşteri malına taşıma (stoktaki miktar müşteriye yazılır, ürün kartı silinir). */
export function MoveToCustomerSheet({ product, onClose }) {
  const { state, productToCustomer } = useStore();
  const toast = useToast();
  const [cust, setCust] = useState(state.customers[0]?.id || '');
  return (
    <Sheet open onClose={onClose} title="Müşteri Malına Taşı">
      <p className="small muted" style={{ marginBottom: 10 }}><b>{product.name}</b> ({fmtNum(product.stock || 0)} {product.unit}) bir müşteriye aitse buradan taşıyın: miktar o müşterinin "Depoda" listesine yazılır, ürün sizin stok listenizden kaldırılır. Geçmiş satış kayıtları korunur.</p>
      <div className="field"><label>Müşteri</label><div className="input"><select value={cust} onChange={(e) => setCust(e.target.value)}>
        {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></div></div>
      {state.customers.length === 0 && <span className="xs neg">Önce müşteri ekleyin.</span>}
      <button className="btn btn-primary" disabled={!cust} onClick={() => { productToCustomer(product.id, cust); toast('Müşteri malına taşındı'); onClose(); }}>Taşı</button>
    </Sheet>
  );
}
