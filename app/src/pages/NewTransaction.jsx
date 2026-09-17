import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { fmtMoney, fmtNum, fmtPrice, today } from '../utils/format';
import { PageHeader, SelectField, Segmented, Avatar, useToast } from '../components/ui';

const TYPES = [
  { value: 'sale', label: 'Mal Ver' }, { value: 'payment', label: 'Tahsilat' }, { value: 'visit', label: 'Ziyaret' },
];
const TITLES = { sale: 'Mal Ver / Yeni İşlem', payment: 'Tahsilat Gir', visit: 'Ziyaret Kaydı' };

export default function NewTransaction() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { state, addTransaction } = useStore();

  const [type, setType] = useState(params.get('tur') || 'sale');
  const [customerId, setCustomerId] = useState(params.get('musteri') || '');
  const [productId, setProductId] = useState(state.products[0]?.id || '');
  const [qty, setQty] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiced, setInvoiced] = useState(params.get('fatura') === '1');
  const [payment, setPayment] = useState('vadeli');
  const [paidNow, setPaidNow] = useState('');
  const [method, setMethod] = useState('nakit');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [autoAmount, setAutoAmount] = useState(true);

  const product = state.products.find((p) => p.id === productId);
  const customer = state.customers.find((c) => c.id === customerId);
  const customerOpts = useMemo(() => state.customers.map((c) => ({ value: c.id, label: c.name, c })), [state.customers]);
  const productOpts = useMemo(() => state.products.map((p) => ({ value: p.id, label: `${p.name} (${fmtNum(p.stock)} ${p.unit})` })), [state.products]);

  const qtyN = parseInt(qty || '0', 10);
  const suggested = product ? Math.round(qtyN * product.price) : 0;
  const amountN = type === 'sale' && autoAmount ? suggested : parseFloat((amount || '0').toString().replace(',', '.')) || 0;

  const valid = customerId && (
    (type === 'sale' && productId && qtyN > 0 && amountN > 0) ||
    (type === 'payment' && amountN > 0) ||
    (type === 'visit')
  );

  const save = (e) => {
    e.preventDefault();
    if (!valid) return;
    const base = { customerId, date, note: note.trim() || undefined };
    if (type === 'sale') {
      addTransaction({ ...base, type: 'sale', productId, qty: qtyN, amount: amountN, invoiced, payment,
        paidNow: payment === 'kismi' ? parseFloat(paidNow || '0') : undefined, method,
        invoiceNo: invoiced ? `${date.slice(0, 4)}/${String(state.transactions.length + 1).padStart(4, '0')}` : undefined });
      toast('İşlem kaydedildi');
    } else if (type === 'payment') {
      addTransaction({ ...base, type: 'payment', amount: amountN, method });
      toast('Tahsilat kaydedildi');
    } else {
      addTransaction({ ...base, type: 'visit', note: note.trim() || 'Ziyaret yapıldı.' });
      toast('Ziyaret kaydedildi');
    }
    nav(`/musteriler/${customerId}`, { replace: true });
  };

  return (
    <div className="page page--no-tabs">
      <PageHeader title={TITLES[type]} />
      <form onSubmit={save}>
        <div className="field"><label>İşlem Türü</label><Segmented value={type} onChange={setType} options={TYPES} light /></div>

        <SelectField label="Müşteri" value={customerId} onChange={setCustomerId} options={customerOpts} placeholder="Müşteri seçin"
          renderOption={(o) => <><Avatar customer={o.c} size="sm" /><span style={{ flex: 1 }}>{o.label}</span></>} />

        {type === 'sale' && (
          <>
            <SelectField label="Ürün" value={productId} onChange={setProductId} options={productOpts} />
            <div className="field"><label>Miktar</label>
              <div className="input"><input inputMode="numeric" placeholder="5.000" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} /><span className="suffix">{product?.unit || 'adet'}</span></div>
              {product && qtyN > product.stock && <span className="xs neg">Stok yetersiz: mevcut {fmtNum(product.stock)} {product.unit}</span>}
            </div>
            <div className="field"><label>Tutar {product && <span className="opt">(birim {fmtPrice(product.price)})</span>}</label>
              <div className="input"><span className="suffix">₺</span>
                <input inputMode="decimal" value={autoAmount ? (suggested || '') : amount} placeholder="0"
                  onChange={(e) => { setAutoAmount(false); setAmount(e.target.value); }} />
                {!autoAmount && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAutoAmount(true)}>Otomatik</button>}
              </div>
            </div>
            <div className="field"><label>Fatura Durumu</label>
              <Segmented value={invoiced ? 'f' : 'nf'} onChange={(v) => setInvoiced(v === 'f')} options={[{ value: 'f', label: 'Faturalı' }, { value: 'nf', label: 'Faturasız' }]} light /></div>
            <div className="field"><label>Ödeme Durumu</label>
              <Segmented value={payment} onChange={setPayment} options={[{ value: 'vadeli', label: 'Vadeli' }, { value: 'pesin', label: 'Peşin' }, { value: 'kismi', label: 'Kısmi' }]} light /></div>
            {payment === 'kismi' && (
              <div className="field"><label>Şimdi Ödenen</label>
                <div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={paidNow} onChange={(e) => setPaidNow(e.target.value)} placeholder="0" /></div></div>
            )}
          </>
        )}

        {type === 'payment' && (
          <div className="field"><label>Tutar</label>
            <div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus /></div></div>
        )}

        {(type === 'payment' || (type === 'sale' && payment !== 'vadeli')) && (
          <div className="field"><label>Ödeme Yöntemi</label>
            <Segmented value={method} onChange={setMethod} options={[{ value: 'nakit', label: 'Nakit' }, { value: 'banka', label: 'Havale' }, { value: 'kart', label: 'Kart' }]} light /></div>
        )}

        <div className="field"><label>Tarih</label><div className="input"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div></div>

        <div className="field"><label>Not <span className="opt">(isteğe bağlı)</span></label>
          <textarea className="input" placeholder="Örn: Yeni sezon siparişi..." value={note} onChange={(e) => setNote(e.target.value)} /></div>

        {customer && type !== 'visit' && amountN > 0 && (
          <div className="card small muted" style={{ marginBottom: 12 }}>
            {type === 'sale' ? `${customer.name} için ${fmtNum(qtyN)} ${product?.unit} ${product?.name}, ${fmtMoney(amountN)} ${payment === 'pesin' ? 'peşin tahsil edilecek' : payment === 'kismi' ? 'kısmen tahsil, kalanı cariye işlenecek' : 'cariye borç yazılacak'}.` : `${customer.name} carisinden ${fmtMoney(amountN)} düşülecek, kasaya eklenecek.`}
          </div>
        )}

        <div className="sticky-bottom"><button className="btn btn-primary" type="submit" disabled={!valid}>Kaydet</button></div>
      </form>
    </div>
  );
}
