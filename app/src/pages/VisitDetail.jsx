import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { customerSummary } from '../store/selectors';
import { fmtDate } from '../utils/format';
import { PageHeader, Avatar, Empty } from '../components/ui';
import * as Ic from '../components/Icons';

export default function VisitDetail() {
  const { id } = useParams();
  const { state } = useStore();
  const c = state.customers.find((x) => x.id === id);
  if (!c) return <div className="page"><PageHeader title="Müşteri Ziyareti" /><Empty>Müşteri bulunamadı.</Empty></div>;
  const s = customerSummary(state, c);
  const addr = encodeURIComponent(`${c.name} ${c.district || ''} ${c.city || ''}`.trim());
  const lastNote = s.txs.find((t) => t.type === 'visit' && t.note);

  return (
    <div className="page page--no-tabs">
      <PageHeader title="Müşteri Ziyareti" />
      <div className="card" style={{ display: 'flex', gap: 14 }}>
        <Avatar customer={c} size="lg" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{c.name}</div>
          <span className="badge badge--aktif">{c.type}</span>
          <div className="small muted" style={{ marginTop: 8, display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Ic.Phone size={14} />{c.phone || '-'}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Ic.MapPin size={14} />{c.city}{c.district ? ` / ${c.district}` : ''}</div>
          </div>
        </div>
      </div>
      <div className="grid-3" style={{ marginTop: 12 }}>
        <a href={`tel:${(c.phone || '').replace(/\s/g, '')}`} className="quick"><Ic.Phone size={20} /><span>Ara</span></a>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${addr}`} target="_blank" rel="noreferrer" className="quick"><Ic.Target size={20} /><span>Yol Tarifi</span></a>
        <a href={`https://www.google.com/maps/search/?api=1&query=${addr}`} target="_blank" rel="noreferrer" className="quick"><Ic.MapPin size={20} /><span>Harita</span></a>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="small bold">Son Ziyaret</div>
        <div className="muted">{s.lastVisit ? fmtDate(s.lastVisit.date) : 'Henüz ziyaret yok'}</div>
        <div className="small bold" style={{ marginTop: 10 }}>Son Görüşme</div>
        <div className="muted">{lastNote?.note || '-'}</div>
      </div>
      <div className="sticky-bottom"><Link to={`/islem?tur=visit&musteri=${id}`} className="btn btn-primary">Ziyaret Kaydı Ekle</Link></div>
    </div>
  );
}
