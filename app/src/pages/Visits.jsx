import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { allSummaries } from '../store/selectors';
import { fmtDate, daysBetween, today } from '../utils/format';
import { PageHeader, Avatar, Empty, Sheet, SelectField, DateField, DangerButton, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

export default function Visits() {
  const { state, addPlannedVisit, updatePlannedVisit, deletePlannedVisit } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState(null); // null | 'new' | visit
  const [f, setF] = useState({ customerId: '', date: today(), note: '' });
  const t = today();
  const sums = useMemo(() => allSummaries(state).filter((s) => !q || s.customer.name.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR'))), [state, q]);
  const recent = [...sums].sort((a, b) => ((b.lastVisit?.date || '') > (a.lastVisit?.date || '') ? 1 : -1));
  const planned = state.plannedVisits.filter((v) => !v.done).map((v) => ({ ...v, customer: state.customers.find((c) => c.id === v.customerId) })).filter((v) => v.customer && (!q || v.customer.name.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')))).sort((a, b) => (a.date < b.date ? -1 : 1));
  const suggestions = [...sums].filter((s) => !planned.some((p) => p.customerId === s.customer.id)).sort((a, b) => ((a.lastVisit?.date || '') > (b.lastVisit?.date || '') ? 1 : -1)).slice(0, 5);
  const customerOpts = state.customers.map((c) => ({ value: c.id, label: c.name, c }));

  const openNew = (customerId = '') => { setF({ customerId, date: t, note: '' }); setPlan('new'); };
  const openEdit = (v) => { setF({ customerId: v.customerId, date: v.date, note: v.note || '' }); setPlan(v); };
  const save = () => {
    if (!f.customerId || !f.date) return;
    if (plan === 'new') { addPlannedVisit({ customerId: f.customerId, date: f.date, note: f.note.trim() }); toast('Ziyaret planlandı'); }
    else { updatePlannedVisit(plan.id, { customerId: f.customerId, date: f.date, note: f.note.trim() }); toast('Plan güncellendi'); }
    setPlan(null);
  };

  return (
    <div className="page">
      <PageHeader title="Ziyaretler" to="/daha" right={<>
        <button className="icon-btn" onClick={() => openNew()} aria-label="Ziyaret planla"><Ic.Calendar size={20} /></button>
        <Link to="/islem?tur=visit" className="icon-btn" aria-label="Ziyaret kaydı"><Ic.Plus size={20} /></Link>
      </>} />
      <div className="tabs">
        <button className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>Son Ziyaretler</button>
        <button className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>Ziyaret Planı</button>
      </div>
      <div className="search"><Ic.Search size={18} /><input placeholder="Müşteri ara..." value={q} onChange={(e) => setQ(e.target.value)} /></div>

      {tab === 0 && (
        <div className="list">
          {recent.map((s) => (
            <Link key={s.customer.id} to={`/ziyaret/${s.customer.id}`} className="item">
              <Avatar customer={s.customer} />
              <div className="item-body"><div className="item-title">{s.customer.name}</div><div className="item-sub">{s.customer.city}{s.customer.district ? ` / ${s.customer.district}` : ''}</div></div>
              <span className="small bold">{s.lastVisit ? fmtDate(s.lastVisit.date) : '-'}</span>
            </Link>
          ))}
          {recent.length === 0 && <Empty>Kayıt yok.</Empty>}
        </div>
      )}

      {tab === 1 && (
        <>
          <div className="list">
            {planned.map((v) => {
              const d = daysBetween(t, v.date);
              return (
                <div key={v.id} className="item" onClick={() => openEdit(v)}>
                  <Avatar customer={v.customer} />
                  <div className="item-body">
                    <div className="item-title">{v.customer.name}</div>
                    <div className="item-sub">{fmtDate(v.date)} · {d < 0 ? `${-d} gün geçti` : d === 0 ? 'Bugün' : d === 1 ? 'Yarın' : `${d} gün sonra`}{v.note ? ` · ${v.note}` : ''}</div>
                  </div>
                  <Link to={`/islem?tur=visit&musteri=${v.customerId}&plan=${v.id}`} className={`badge ${d < 0 ? 'badge--gecikmis' : d === 0 ? 'badge--takipte' : 'badge--aktif'}`} onClick={(e) => e.stopPropagation()}>Yapıldı</Link>
                </div>
              );
            })}
            {planned.length === 0 && <Empty>Planlı ziyaret yok. Sağ üstteki takvim simgesiyle planlayın.</Empty>}
          </div>
          {suggestions.length > 0 && (
            <>
              <h2 className="section-title">Öneri: uzun süredir gidilmeyenler</h2>
              <div className="list">
                {suggestions.map((s) => {
                  const days = s.lastVisit ? daysBetween(s.lastVisit.date, t) : null;
                  return (
                    <div key={s.customer.id} className="item" onClick={() => openNew(s.customer.id)}>
                      <Avatar customer={s.customer} />
                      <div className="item-body"><div className="item-title">{s.customer.name}</div><div className="item-sub">{days == null ? 'Hiç ziyaret edilmedi' : `${days} gün önce`}</div></div>
                      <span className="badge badge--neutral">Planla</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <Sheet open={!!plan} onClose={() => setPlan(null)} title={plan === 'new' ? 'Ziyaret Planla' : 'Planı Düzenle'}>
        <SelectField label="Müşteri" value={f.customerId} onChange={(v) => setF({ ...f, customerId: v })} options={customerOpts} placeholder="Müşteri seçin"
          renderOption={(o) => <><Avatar customer={o.c} size="sm" /><span style={{ flex: 1 }}>{o.label}</span></>} />
        <DateField label="Tarih" value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        <div className="field"><label>Not <span className="opt">(isteğe bağlı)</span></label><div className="input"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Örn: Numune götür" /></div></div>
        <div className="btn-row">
          {plan !== 'new' && <DangerButton className="btn btn-ghost" message="Plan silinsin mi?" onConfirm={() => { deletePlannedVisit(plan.id); toast('Plan silindi'); setPlan(null); }}>Sil</DangerButton>}
          <button className="btn btn-primary" onClick={save} disabled={!f.customerId || !f.date}>Kaydet</button>
        </div>
      </Sheet>
    </div>
  );
}
