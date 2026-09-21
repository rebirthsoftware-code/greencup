import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { goodsByCustomer } from '../store/selectors';
import { fmtNum, fmtPrice, fmtDate, parseMoney, toInput, today } from '../utils/format';
import { PageHeader, Avatar, Empty, Sheet, DangerButton, useToast, Tabs, MoneyInput } from '../components/ui';
import GoodsSheet, { MoveToCustomerSheet } from '../components/GoodsSheets';
import * as Ic from '../components/Icons';

const EMPTY_FORM = { name: '', stock: '', price: '', minStock: '', unit: 'adet' };

export default function Stock() {
  const { state, addProduct, updateProduct, deleteProduct } = useStore();
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() => Math.min(2, Math.max(0, parseInt(params.get('tab') || '0', 10) || 0)));
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); // null | 'new' | product
  const [move, setMove] = useState(null); // ürün → müşteri malına taşı
  const [goods, setGoods] = useState(null); // null | { kind, entry|null }
  const [form, setForm] = useState(EMPTY_FORM);

  const ql = q.trim().toLocaleLowerCase('tr-TR');
  const has = (s) => !ql || (s || '').toLocaleLowerCase('tr-TR').includes(ql);
  const products = state.products.filter((p) => has(p.name));
  const kind = tab === 1 ? 'reserved' : 'production';
  const groups = goodsByCustomer(state, kind).filter((g) => has(g.customer.name) || g.items.some((r) => has(r.name)));
  const usedIn = (id) => (id ? state.transactions.filter((t) => t.type === 'sale' && (t.items || []).some((i) => i.productId === id)).length : 0);
  const t0 = today();

  const openNew = () => { setForm(EMPTY_FORM); setEdit('new'); };
  const openEdit = (p) => { setForm({ name: p.name, stock: String(p.stock ?? ''), price: toInput(p.price ?? ''), minStock: String(p.minStock ?? ''), unit: p.unit || 'adet' }); setEdit(p); };
  const save = () => {
    const data = { name: form.name.trim(), stock: parseInt(form.stock || '0', 10), price: parseMoney(form.price), minStock: parseInt(form.minStock || '0', 10), unit: form.unit || 'adet' };
    if (!data.name) return toast('Ürün adı girin');
    if (edit === 'new') { addProduct(data); toast('Ürün eklendi'); } else { updateProduct(edit.id, data); toast('Ürün güncellendi'); }
    setEdit(null);
  };
  const addLabel = ['Ürün ekle', 'Depoya müşteri malı ekle', 'Üretime ekle'][tab];
  const onAdd = () => (tab === 0 ? openNew() : setGoods({ kind, entry: null }));
  const totalOf = (key) => state[key].reduce((a, r) => a + (r.qty || 0), 0);

  return (
    <div className="page">
      <PageHeader title="Stok / Depo" back={false} right={<button className="icon-btn" onClick={onAdd} aria-label={addLabel} disabled={tab > 0 && state.customers.length === 0}><Ic.Plus size={20} /></button>} />
      <Tabs value={tab} onChange={setTab} items={['Stoğum', 'Müşteri Malları', 'Üretimde']} />
      <div className="search"><Ic.Search size={18} /><input placeholder={tab === 0 ? 'Ürün ara...' : 'Müşteri veya ürün ara...'} value={q} onChange={(e) => setQ(e.target.value)} /></div>

      {tab === 0 && (
        <div className="card" style={{ padding: '4px 10px' }}>
          <table className="table">
            <thead><tr><th>Ürün</th><th>Mevcut</th><th>Birim ₺</th></tr></thead>
            <tbody>
              {products.map((p) => {
                const low = (p.stock || 0) <= 0 || (p.minStock > 0 && (p.stock || 0) <= p.minStock);
                return (
                  <tr key={p.id} onClick={() => openEdit(p)}>
                    <td className="name"><Ic.Cup size={16} className="muted" />{p.name}{low && <span className="badge badge--takipte" style={{ marginLeft: 6 }}>{(p.stock || 0) <= 0 ? 'Yok' : 'Az'}</span>}</td>
                    <td className="bold">{fmtNum(p.stock)} <span className="xs muted">{p.unit}</span></td>
                    <td className="muted">{p.price ? fmtPrice(p.price) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && <Empty>{state.products.length === 0 ? <>Henüz ürün yok. Sağ üstteki <b>+</b> ile ekleyin.</> : 'Ürün bulunamadı.'}</Empty>}
          {products.length > 0 && <div className="xs muted" style={{ padding: '8px 4px' }}>Yalnızca sizin satılabilir stoğunuz. Müşterilere ait mallar "Müşteri Malları" ve "Üretimde" sekmelerinde ayrı tutulur. Düzenlemek için satıra dokunun.</div>}
        </div>
      )}

      {tab > 0 && (
        <div className="list">
          {state.customers.length === 0 && <div className="card small" style={{ marginBottom: 10 }}>Önce <Link to="/musteriler/yeni" style={{ color: 'var(--green)', fontWeight: 700 }}>müşteri ekleyin</Link>.</div>}
          {groups.map((g) => (
            <div key={g.customer.id} className="card" style={{ padding: 12 }}>
              <Link to={`/musteriler/${g.customer.id}`} className="row" style={{ gap: 10, marginBottom: 6 }}>
                <Avatar customer={g.customer} size="sm" />
                <div className="item-body"><div className="item-title">{g.customer.name}</div><div className="item-sub">{g.items.length} kalem · {tab === 1 ? 'depoda' : 'üretimde'}</div></div>
                <Ic.ChevronRight size={18} className="muted" />
              </Link>
              {g.items.filter((r) => has(g.customer.name) || has(r.name)).map((r) => {
                const late = tab === 2 && r.dueDate && r.dueDate <= t0;
                return (
                  <button key={r.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => setGoods({ kind, entry: r })}>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
                      <Ic.Box size={16} style={{ color: tab === 1 ? 'var(--gold)' : 'var(--blue)', flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 600 }}>{r.name}</span>
                        {(r.dueDate || r.note) && <span className={`xs ${late ? 'neg' : 'muted'}`}>{r.dueDate ? `Teslim: ${fmtDate(r.dueDate)}${late ? ' · tarih geldi' : ''}` : ''}{r.dueDate && r.note ? ' · ' : ''}{r.note || ''}</span>}
                      </span>
                    </span>
                    <span className="num" style={{ flexShrink: 0 }}>{fmtNum(r.qty)} {r.unit} <Ic.ChevronRight size={14} className="muted" /></span>
                  </button>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && state.customers.length > 0 && (
            <Empty icon={Ic.Box}>{tab === 1
              ? <>Depoda müşteriye ait mal yok. Sağ üstteki <b>+</b> ile ekleyin; sizin stoğunuzdan ayrı tutulur.</>
              : <>Üretimde mal yok. Müşteri için verdiğiniz üretim siparişlerini <b>+</b> ile ekleyin; bitince "Depoya Al" ya da "Teslim Et".</>}</Empty>
          )}
          {groups.length > 0 && <div className="xs muted" style={{ padding: '4px 4px 8px' }}>Toplam {fmtNum(totalOf(kind))} birim · Kayda dokunarak {tab === 1 ? 'teslim edin veya düzenleyin' : 'depoya alın, teslim edin veya düzenleyin'}.</div>}
        </div>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Yeni Ürün' : 'Ürünü Düzenle'}>
        <div className="field"><label>Ürün Adı</label><div className="input"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="14oz PET" /></div></div>
        <div className="grid-2">
          <div className="field"><label>Mevcut Stok</label><div className="input"><input inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} /></div></div>
          <div className="field"><label>Birim</label><div className="input"><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{['adet', 'koli', 'paket', 'kg'].map((u) => <option key={u}>{u}</option>)}</select></div></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Birim Fiyat (₺)</label><div className="input"><MoneyInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} /></div></div>
          <div className="field"><label>Uyarı Eşiği</label><div className="input"><input inputMode="numeric" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value.replace(/\D/g, '') })} placeholder="0" /></div></div>
        </div>
        <span className="xs muted" style={{ display: 'block', marginTop: -8, marginBottom: 14 }}>Stok eşiğin altına inince bildirim çıkar (0 = kapalı).</span>
        {edit !== 'new' && edit && (
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => { setMove(edit); setEdit(null); }} disabled={state.customers.length === 0}><Ic.Users size={15} /> Bu ürün bir müşteriye ait → Müşteri Malına Taşı</button>
        )}
        <div className="btn-row">
          {edit && edit !== 'new' && <DangerButton className="btn btn-ghost" message={usedIn(edit.id) ? `Bu ürün ${usedIn(edit.id)} satışta geçiyor; geçmiş kayıtlarda adı korunur. Silinsin mi?` : 'Ürün silinsin mi?'} onConfirm={() => { deleteProduct(edit.id); toast('Ürün silindi'); setEdit(null); }}>Sil</DangerButton>}
          <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>Kaydet</button>
        </div>
      </Sheet>
      {move && <MoveToCustomerSheet product={move} onClose={() => setMove(null)} />}
      {goods && <GoodsSheet kind={goods.kind} entry={goods.entry} onClose={() => setGoods(null)} />}
    </div>
  );
}
