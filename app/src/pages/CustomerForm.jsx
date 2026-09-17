import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { resizeImage } from '../utils/format';
import { PageHeader, Avatar, DangerButton, useToast } from '../components/ui';

const COLORS = ['#0E6B3F', '#1A1A1A', '#3B2A1E', '#7A4B2B', '#1F2A3A', '#22335A', '#8B1E3F', '#C28F27'];
const TYPES = ['Cafe & Restaurant', 'Coffee Shop', 'Cafe', 'Restaurant', 'Kurumsal', 'Bayi', 'Diğer'];

export default function CustomerForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { state, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const existing = id ? state.customers.find((c) => c.id === id) : null;
  const [f, setF] = useState(existing || { name: '', type: TYPES[0], phone: '', city: '', district: '', color: COLORS[0], tag: '', notes: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pickLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setF({ ...f, logo: await resizeImage(file, 128) }); } catch { toast('Görsel okunamadı'); }
  };
  const save = (e) => {
    e.preventDefault();
    const data = { ...f, name: f.name.trim(), tag: (f.tag || '').trim().toLocaleUpperCase('tr-TR') || undefined };
    if (!data.name) return;
    if (existing) { updateCustomer(id, data); toast('Müşteri güncellendi'); nav(-1); }
    else { addCustomer(data); toast('Müşteri eklendi'); nav('/musteriler'); }
  };

  return (
    <div className="page page--no-tabs">
      <PageHeader title={existing ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'} />
      <form onSubmit={save}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <Avatar customer={{ ...f, name: f.name || '?' }} size="lg" />
          <div className="stack" style={{ gap: 6 }}>
            <label className="btn btn-ghost btn-sm">Logo Yükle<input type="file" accept="image/*" hidden onChange={pickLogo} /></label>
            {f.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, logo: undefined })}>Logoyu Kaldır</button>}
          </div>
        </div>
        <div className="field"><label>Firma / Müşteri Adı</label>
          <div className="input"><input value={f.name} onChange={set('name')} placeholder="Örn: Goldbeans" required autoFocus={!existing} /></div></div>
        <div className="field"><label>Tür</label>
          <div className="input"><select value={f.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div></div>
        <div className="field"><label>Telefon</label>
          <div className="input"><input value={f.phone || ''} onChange={set('phone')} placeholder="05xx xxx xx xx" inputMode="tel" /></div></div>
        <div className="grid-2">
          <div className="field"><label>İl</label><div className="input"><input value={f.city || ''} onChange={set('city')} placeholder="Zonguldak" /></div></div>
          <div className="field"><label>İlçe</label><div className="input"><input value={f.district || ''} onChange={set('district')} placeholder="Merkez" /></div></div>
        </div>
        <div className="field"><label>Adres <span className="opt">(isteğe bağlı)</span></label>
          <div className="input"><input value={f.address || ''} onChange={set('address')} placeholder="Sokak, no..." /></div></div>
        <div className="field"><label>Kısaltma <span className="opt">(logo yoksa avatar için)</span></label>
          <div className="input"><input value={f.tag || ''} onChange={set('tag')} maxLength={3} placeholder="GB" /></div></div>
        <div className="field"><label>Renk</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setF({ ...f, color: c })} aria-label={c}
                style={{ width: 34, height: 34, borderRadius: '50%', background: c, outline: f.color === c ? '3px solid var(--green-soft)' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        {existing && (
          <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
            <DangerButton className="btn btn-ghost" message={`${existing.name} ve tüm hareketleri silinecek. Emin misiniz?`} onConfirm={() => { deleteCustomer(id); toast('Müşteri silindi'); nav('/musteriler', { replace: true }); }}>Müşteriyi Sil</DangerButton>
          </div>
        )}
        <div className="sticky-bottom"><button className="btn btn-primary" type="submit" disabled={!f.name.trim()}>Kaydet</button></div>
      </form>
    </div>
  );
}
