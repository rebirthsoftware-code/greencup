import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { allSummaries } from '../store/selectors';
import { fmtNum } from '../utils/format';
import { PageHeader, Avatar, Empty, Sheet, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

export default function Stock() {
  const { state, addProduct, updateProduct } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); // null | 'new' | product
  const [form, setForm] = useState({ name: '', stock: '', reserved: '', price: '' });

  const ql = q.trim().toLocaleLowerCase('tr-TR');
  const products = state.products.filter((p) => !ql || p.name.toLocaleLowerCase('tr-TR').includes(ql));
  const sums = allSummaries(state).filter((s) => s.products.length > 0 && (!ql || s.customer.name.toLocaleLowerCase('tr-TR').includes(ql)));

  const openNew = () => { setForm({ name: '', stock: '', reserved: '', price: '' }); setEdit('new'); };
  const openEdit = (p) => { setForm({ name: p.name, stock: String(p.stock), reserved: String(p.reserved), price: String(p.price) }); setEdit(p); };
  const save = () => {
    const data = { name: form.name.trim(), stock: parseInt(form.stock || '0', 10), reserved: parseInt(form.reserved || '0', 10), price: parseFloat(String(form.price).replace(',', '.')) || 0 };
    if (!data.name) return;
    if (edit === 'new') { addProduct(data); toast('Ürün eklendi'); } else { updateProduct(edit.id, data); toast('Ürün güncellendi'); }
    setEdit(null);
  };

  return (
    <div className="page">
      <PageHeader title="Stok / Depo" back={false} right={<button className="icon-btn" onClick={openNew} aria-label="Ürün ekle"><Ic.Plus size={20} /></button>} />
      <div className="tabs">
        <button className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>Benim Stokum</button>
        <button className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>Müşteri Malları</button>
      </div>
      <div className="search"><Ic.Search size={18} /><input placeholder={tab === 0 ? 'Ürün ara...' : 'Müşteri ara...'} value={q} onChange={(e) => setQ(e.target.value)} /></div>

      {tab === 0 && (
        <div className="card" style={{ padding: '4px 10px' }}>
          <table className="table">
            <thead><tr><th>Ürün</th><th>Mevcut</th><th>Rezerve</th><th>Satılabilir</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} onClick={() => openEdit(p)}>
                  <td className="name"><Ic.Cup size={16} className="muted" />{p.name}</td>
                  <td>{fmtNum(p.stock)}</td>
                  <td className="muted">{fmtNum(p.reserved)}</td>
                  <td className="bold">{fmtNum(p.stock - p.reserved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <Empty>Ürün bulunamadı.</Empty>}
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
                  <div key={p.productId} className="row small"><span className="muted">{p.name}</span><span className="num">{fmtNum(p.qty)} adet</span></div>
                ))}
              </div>
            </Link>
          ))}
          {sums.length === 0 && <Empty>Kayıt yok.</Empty>}
        </div>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Yeni Ürün' : 'Ürünü Düzenle'}>
        <div className="field"><label>Ürün Adı</label><div className="input"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="14oz PET" /></div></div>
        <div className="grid-2">
          <div className="field"><label>Mevcut</label><div className="input"><input inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} /></div></div>
          <div className="field"><label>Rezerve</label><div className="input"><input inputMode="numeric" value={form.reserved} onChange={(e) => setForm({ ...form, reserved: e.target.value.replace(/\D/g, '') })} /></div></div>
        </div>
        <div className="field"><label>Birim Fiyat (₺)</label><div className="input"><input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div></div>
        <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>Kaydet</button>
      </Sheet>
    </div>
  );
}
