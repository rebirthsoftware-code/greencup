import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { allSummaries, reservedByProduct } from '../store/selectors';
import { fmtNum, parseMoney } from '../utils/format';
import { PageHeader, Avatar, Empty, Sheet, DangerButton, useToast, Tabs } from '../components/ui';
import * as Ic from '../components/Icons';

export default function Stock() {
  const { state, addProduct, updateProduct, deleteProduct } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); // null | 'new' | product
  const [form, setForm] = useState({ name: '', stock: '', price: '', minStock: '', unit: 'adet' });

  const ql = q.trim().toLocaleLowerCase('tr-TR');
  const resv = reservedByProduct(state);
  const products = state.products.filter((p) => !ql || p.name.toLocaleLowerCase('tr-TR').includes(ql));
  const sums = allSummaries(state).filter((s) => s.products.length > 0 && (!ql || s.customer.name.toLocaleLowerCase('tr-TR').includes(ql)));
  const usedIn = (id) => state.transactions.filter((t) => t.type === 'sale' && (t.items || []).some((i) => i.productId === id)).length;

  const openNew = () => { setForm({ name: '', stock: '', price: '', minStock: '', unit: 'adet' }); setEdit('new'); };
  const openEdit = (p) => { setForm({ name: p.name, stock: String(p.stock ?? ''), price: String(p.price ?? ''), minStock: String(p.minStock ?? ''), unit: p.unit || 'adet' }); setEdit(p); };
  const save = () => {
    const data = { name: form.name.trim(), stock: parseInt(form.stock || '0', 10), price: parseMoney(form.price), minStock: parseInt(form.minStock || '0', 10), unit: form.unit || 'adet' };
    if (!data.name) return;
    if (edit === 'new') { addProduct(data); toast('Ürün eklendi'); } else { updateProduct(edit.id, data); toast('Ürün güncellendi'); }
    setEdit(null);
  };

  return (
    <div className="page">
      <PageHeader title="Stok / Depo" back={false} right={<button className="icon-btn" onClick={openNew} aria-label="Ürün ekle"><Ic.Plus size={20} /></button>} />
      <Tabs value={tab} onChange={setTab} items={['Benim Stokum', 'Müşteri Malları']} />
      <div className="search"><Ic.Search size={18} /><input placeholder={tab === 0 ? 'Ürün ara...' : 'Müşteri ara...'} value={q} onChange={(e) => setQ(e.target.value)} /></div>

      {tab === 0 && (
        <div className="card" style={{ padding: '4px 10px' }}>
          <table className="table">
            <thead><tr><th>Ürün</th><th>Mevcut</th><th>Rezerve</th><th>Satılabilir</th></tr></thead>
            <tbody>
              {products.map((p) => {
                const r = resv[p.id] || 0; const sellable = (p.stock || 0) - r; const low = p.minStock > 0 && sellable <= p.minStock;
                return (
                  <tr key={p.id} onClick={() => openEdit(p)}>
                    <td className="name"><Ic.Cup size={16} className="muted" />{p.name}{low && <span className="badge badge--takipte" style={{ marginLeft: 6 }}>Az</span>}</td>
                    <td>{fmtNum(p.stock)}</td>
                    <td className="muted">{fmtNum(r)}</td>
                    <td className="bold">{fmtNum(sellable)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && <Empty>{state.products.length === 0 ? <>Henüz ürün yok. Sağ üstteki <b>+</b> ile ekleyin.</> : 'Ürün bulunamadı.'}</Empty>}
          {products.length > 0 && <div className="xs muted" style={{ padding: '8px 4px' }}>Rezerve: depoda müşterilere ait mallar (müşteri detayından yönetilir). Düzenlemek için satıra dokunun.</div>}
        </div>
      )}

      {tab === 1 && (
        <div className="list">
          {sums.map((s) => (
            <Link key={s.customer.id} to={`/musteriler/${s.customer.id}`} className="item" style={{ alignItems: 'flex-start' }}>
              <Avatar customer={s.customer} />
              <div className="item-body">
                <div className="item-title" style={{ marginBottom: 4 }}>{s.customer.name}</div>
                {s.products.map((p) => (
                  <div key={p.productId || p.name} className="row small"><span className="muted">{p.name}</span><span className="num">{fmtNum(p.qty)} {p.unit}</span></div>
                ))}
                {s.reserved.length > 0 && <div className="xs" style={{ color: 'var(--gold)', marginTop: 4 }}>Depoda rezerve: {s.reserved.map((r) => `${fmtNum(r.qty)} ${r.name}`).join(', ')}</div>}
              </div>
            </Link>
          ))}
          {sums.length === 0 && <Empty>Kayıt yok.</Empty>}
        </div>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Yeni Ürün' : 'Ürünü Düzenle'}>
        <div className="field"><label>Ürün Adı</label><div className="input"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="14oz PET" /></div></div>
        <div className="grid-2">
          <div className="field"><label>Mevcut Stok</label><div className="input"><input inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} /></div></div>
          <div className="field"><label>Birim</label><div className="input"><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{['adet', 'koli', 'paket', 'kg'].map((u) => <option key={u}>{u}</option>)}</select></div></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Birim Fiyat (₺)</label><div className="input"><input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div></div>
          <div className="field"><label>Uyarı Eşiği</label><div className="input"><input inputMode="numeric" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value.replace(/\D/g, '') })} placeholder="0" /></div></div>
        </div>
        <span className="xs muted" style={{ display: 'block', marginTop: -8, marginBottom: 14 }}>Satılabilir miktar eşiğin altına inince bildirim çıkar (0 = kapalı).</span>
        <div className="btn-row">
          {edit !== 'new' && <DangerButton className="btn btn-ghost" message={usedIn(edit?.id) ? `Bu ürün ${usedIn(edit.id)} satışta geçiyor; geçmiş kayıtlarda adı korunur. Silinsin mi?` : 'Ürün silinsin mi?'} onConfirm={() => { deleteProduct(edit.id); toast('Ürün silindi'); setEdit(null); }}>Sil</DangerButton>}
          <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>Kaydet</button>
        </div>
      </Sheet>
    </div>
  );
}
