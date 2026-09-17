import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { PageHeader, useToast } from '../components/ui';

const COLORS = ['#0E6B3F', '#1A1A1A', '#3B2A1E', '#7A4B2B', '#1F2A3A', '#22335A', '#8B1E3F', '#C28F27'];
const TYPES = ['Cafe & Restaurant', 'Coffee Shop', 'Cafe', 'Restaurant', 'Kurumsal', 'Bayi', 'Diğer'];

export default function CustomerForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { state, addCustomer, updateCustomer } = useStore();
  const existing = id ? state.customers.find((c) => c.id === id) : null;
  const [f, setF] = useState(existing || { name: '', type: TYPES[0], phone: '', city: '', district: '', color: COLORS[0], tag: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    const data = { ...f, name: f.name.trim(), tag: f.tag.trim().toLocaleUpperCase('tr-TR') || undefined };
    if (!data.name) return;
    if (existing) { updateCustomer(id, data); toast('Müşteri güncellendi'); nav(-1); }
    else { addCustomer(data); toast('Müşteri eklendi'); nav('/musteriler'); }
  };

  return (
    <div className="page page--no-tabs">
      <PageHeader title={existing ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'} />
      <form onSubmit={save}>
        <div className="field"><label>Firma / Müşteri Adı</label>
          <div className="input"><input value={f.name} onChange={set('name')} placeholder="Örn: Goldbeans" required autoFocus /></div></div>
        <div className="field"><label>Tür</label>
          <div className="input"><select value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div></div>
        <div className="field"><label>Telefon</label>
          <div className="input"><input value={f.phone} onChange={set('phone')} placeholder="05xx xxx xx xx" inputMode="tel" /></div></div>
        <div className="grid-2">
          <div className="field"><label>İl</label><div className="input"><input value={f.city} onChange={set('city')} placeholder="Zonguldak" /></div></div>
          <div className="field"><label>İlçe</label><div className="input"><input value={f.district} onChange={set('district')} placeholder="Merkez" /></div></div>
        </div>
        <div className="field"><label>Kısaltma <span className="opt">(avatar için, isteğe bağlı)</span></label>
          <div className="input"><input value={f.tag || ''} onChange={set('tag')} maxLength={3} placeholder="GB" /></div></div>
        <div className="field"><label>Renk</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setF({ ...f, color: c })}
                style={{ width: 34, height: 34, borderRadius: '50%', background: c, outline: f.color === c ? '3px solid var(--green-soft)' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        <div className="sticky-bottom"><button className="btn btn-primary" type="submit" disabled={!f.name.trim()}>Kaydet</button></div>
      </form>
    </div>
  );
}
