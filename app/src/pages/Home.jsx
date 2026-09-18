import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useSync } from '../store/sync';
import { dashboard, notifications, monthlySeries, reservedByProduct, itemsLabel } from '../store/selectors';
import { fmtMoney, fmtNum, fmtDate, daysBetween, today } from '../utils/format';
import { useCountUp } from '../utils/hooks';
import { loadDevice } from '../store/storage';
import { asset } from '../utils/asset';
import { Avatar } from '../components/ui';
import * as Ic from '../components/Icons';
import InstallPrompt from '../components/InstallPrompt';

const Quick = ({ to, icon: Icon, label, tone = '' }) => (
  <Link to={to} className="quick"><span className={`qi ${tone}`}><Icon size={22} /></span><span>{label}</span></Link>
);
const Section = ({ title, to, linkLabel = 'Tümü', children }) => (
  <>
    <div className="row" style={{ marginTop: 22, marginBottom: 10 }}>
      <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
      {to && <Link to={to} className="hero-link" style={{ color: 'var(--green)' }}>{linkLabel} <Ic.ChevronRight size={14} /></Link>}
    </div>
    {children}
  </>
);

export default function Home() {
  const { state } = useStore();
  const nav = useNavigate();
  const d = dashboard(state);
  const alerts = notifications(state).filter((n) => n.level !== 'green');
  const series = monthlySeries(state, 6);
  const sync = useSync();
  const [q, setQ] = useState('');
  const syncColor = !sync.enabled ? 'var(--text-3)' : sync.status === 'error' ? 'var(--red)' : sync.status === 'syncing' || sync.meta.dirty ? 'var(--orange)' : 'var(--green)';
  const syncTitle = !sync.enabled ? 'Bulut senkron kapalı' : sync.status === 'error' ? `Senkron hatası: ${sync.error}` : sync.status === 'syncing' ? 'Senkronize ediliyor' : sync.meta.dirty ? 'Bekleyen değişiklik' : 'Bulut ile güncel';
  const firstName = (loadDevice().userName || state.settings.userName || '').split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const dateLine = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  const receivable = useCountUp(d.receivable);
  const cashTotal = useCountUp(d.cashTotal);
  const t = today();

  // Bugün: eyleme dönük listeler
  const overdue = [...d.overdue].sort((a, b) => b.overdueAmount - a.overdueAmount).slice(0, 3);
  const visitsToday = d.visitsToday.map((v) => ({ ...v, customer: state.customers.find((c) => c.id === v.customerId) })).filter((v) => v.customer).slice(0, 3);
  const expensesDue = d.expensesDue.slice(0, 3);
  const resv = reservedByProduct(state);
  const lowStock = state.products.filter((p) => { const s = (p.stock || 0) - (resv[p.id] || 0); return s <= 0 || (p.minStock > 0 && s <= p.minStock); }).slice(0, 3);
  const dueSoon = d.dueSoon.slice(0, 3);
  const nothingToday = overdue.length + visitsToday.length + expensesDue.length + lowStock.length + dueSoon.length === 0;

  // Bu ay
  const m = series[series.length - 1] || { sales: 0, payments: 0 };
  const prev = series[series.length - 2] || { sales: 0, payments: 0 };
  const delta = prev.payments ? Math.round(((m.payments - prev.payments) / prev.payments) * 100) : null;

  // Son hareketler (tüm müşteriler)
  const recent = [...state.transactions].filter((x) => x.type !== 'note').sort((a, b) => ((b.date || '') + (b.createdAt || '')).localeCompare((a.date || '') + (a.createdAt || ''))).slice(0, 5)
    .map((x) => ({ ...x, customer: state.customers.find((c) => c.id === x.customerId) })).filter((x) => x.customer);

  const search = (e) => { e.preventDefault(); if (q.trim()) nav(`/musteriler?q=${encodeURIComponent(q.trim())}`); };

  return (
    <div className="page">
      <header className="page-header home-header">
        <img src={asset('logo-greencup.png')} alt="GreenCup" style={{ height: 34 }} />
        <div style={{ flex: 1 }} />
        <Link to="/daha/ayarlar" className="icon-btn" aria-label={syncTitle} title={syncTitle} style={{ color: syncColor }}><Ic.Cloud size={20} /></Link>
        <Link to="/bildirimler" className="icon-btn" aria-label="Bildirimler"><Ic.Bell size={20} />{alerts.length > 0 && <span className="badge-dot">{alerts.length}</span>}</Link>
      </header>

      <div style={{ marginBottom: 14 }}>
        <div className="display" style={{ fontSize: 22 }}>Hoş geldin {firstName} 👋</div>
        <div className="muted small">{greet}, bugün güzel geçsin. <span className="xs" style={{ color: 'var(--text-3)' }}>· {dateLine}</span></div>
      </div>
      <InstallPrompt />

      <form className="search" onSubmit={search} style={{ marginBottom: 14 }}>
        <Ic.Search size={18} />
        <input placeholder="Müşteri ara..." value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </form>

      <div className="grid-2">
        <Link to="/musteriler" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Users size={16} /></span>Müşteriler</div>
          <div className="stat-value">{fmtNum(state.customers.length)}</div>
          <div className="stat-sub">{d.overdue.length > 0 ? `${d.overdue.length} gecikmiş · ${d.sums.filter((s) => s.balance > 0).length} borçlu` : `${d.sums.filter((s) => s.balance > 0).length} borçlu müşteri`}</div>
        </Link>
        <Link to="/musteriler?f=borclu" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Receipt size={16} /></span>Cari Alacak</div>
          <div className="stat-value">{fmtMoney(Math.round(receivable))}</div>
          <div className="stat-sub">{overdue.length > 0 ? `${fmtMoney(d.overdue.reduce((a, s) => a + s.overdueAmount, 0))} gecikmiş` : 'Gecikme yok'}</div>
        </Link>
        <Link to="/stok" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Box size={16} /></span>Depo</div>
          <div className="stat-value">{fmtNum(state.products.length)}</div>
          <div className="stat-sub">{lowStock.length > 0 ? `${lowStock.length} üründe stok azaldı` : 'Ürün çeşidi · stok yeterli'}</div>
        </Link>
        <Link to="/kasa" className="stat">
          <div className="stat-head"><span className="stat-icon"><Ic.Wallet size={16} /></span>Kasa</div>
          <div className="stat-value">{fmtMoney(Math.round(cashTotal))}</div>
          <div className="stat-sub">Nakit {fmtMoney(state.cash.nakit)} · Banka {fmtMoney(state.cash.banka)}</div>
        </Link>
      </div>

      <Section title="Hızlı İşlemler">
        <div className="grid-3">
          <Quick to="/musteriler/yeni" icon={Ic.UserPlus} label="Yeni Müşteri" />
          <Quick to="/islem?tur=sale" icon={Ic.Truck} label="Mal Ver" tone="blue" />
          <Quick to="/islem?tur=payment" icon={Ic.Cash} label="Tahsilat Gir" tone="gold" />
        </div>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <Quick to="/islem?tur=sale&fatura=1" icon={Ic.FileText} label="Fatura Ekle" tone="purple" />
          <Quick to="/islem?tur=visit" icon={Ic.Target} label="Ziyaret Ekle" tone="orange" />
        </div>
      </Section>

      <Section title="Bugün" to="/bildirimler">
        {nothingToday && <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="tl-icon"><Ic.Check size={18} /></span><div><div className="bold">Her şey yolunda</div><div className="small muted">Geciken ödeme, yaklaşan vade ya da planlı ziyaret yok.</div></div></div>}
        {overdue.length > 0 && (
          <div className="card">
            <div className="today-head"><span className="dot red" /><span className="bold">Ödemesi geciken müşteriler</span><span className="muted xs">{d.overdue.length}</span></div>
            {overdue.map((s) => (
              <div key={s.customer.id} className="today-row">
                <Link to={`/musteriler/${s.customer.id}`} className="today-main">
                  <Avatar customer={s.customer} size="sm" />
                  <span className="today-text"><b>{s.customer.name}</b><span>{fmtMoney(s.overdueAmount)} gecikmiş · toplam {fmtMoney(s.balance)}</span></span>
                </Link>
                <div className="today-actions">
                  {s.customer.phone && <a href={`tel:${s.customer.phone.replace(/\s/g, '')}`} className="mini" aria-label="Ara"><Ic.Phone size={15} /></a>}
                  <Link to={`/islem?tur=payment&musteri=${s.customer.id}`} className="mini primary">Tahsilat</Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {dueSoon.length > 0 && (
          <div className="card">
            <div className="today-head"><span className="dot orange" /><span className="bold">Vadesi yaklaşan</span></div>
            {dueSoon.map((s) => (
              <div key={s.customer.id} className="today-row">
                <Link to={`/musteriler/${s.customer.id}`} className="today-main">
                  <Avatar customer={s.customer} size="sm" />
                  <span className="today-text"><b>{s.customer.name}</b><span>{daysBetween(t, s.nextDue) === 0 ? 'Bugün' : `${daysBetween(t, s.nextDue)} gün kaldı`} · {fmtMoney(s.balance)}</span></span>
                </Link>
                <div className="today-actions"><Link to={`/islem?tur=payment&musteri=${s.customer.id}`} className="mini primary">Tahsilat</Link></div>
              </div>
            ))}
          </div>
        )}
        {visitsToday.length > 0 && (
          <div className="card">
            <div className="today-head"><span className="dot green" /><span className="bold">Bugünkü ziyaretler</span></div>
            {visitsToday.map((v) => (
              <div key={v.id} className="today-row">
                <Link to={`/ziyaret/${v.customer.id}`} className="today-main">
                  <Avatar customer={v.customer} size="sm" />
                  <span className="today-text"><b>{v.customer.name}</b><span>{v.date < t ? `Plan ${fmtDate(v.date)}, gecikti` : 'Bugün planlı'}{v.note ? ` · ${v.note}` : ''}</span></span>
                </Link>
                <div className="today-actions"><Link to={`/islem?tur=visit&musteri=${v.customer.id}&plan=${v.id}`} className="mini primary">Yapıldı</Link></div>
              </div>
            ))}
          </div>
        )}
        {expensesDue.length > 0 && (
          <div className="card">
            <div className="today-head"><span className="dot orange" /><span className="bold">Ödemelerim</span></div>
            {expensesDue.map((e) => {
              const dd = daysBetween(t, e.due);
              return (
                <div key={e.id} className="today-row">
                  <Link to="/daha/odemeler" className="today-main">
                    <span className="tl-icon visit" style={{ width: 36, height: 36 }}><Ic.Cash size={16} /></span>
                    <span className="today-text"><b>{e.title}</b><span>{dd < 0 ? `${-dd} gün gecikti` : dd === 0 ? 'Bugün' : `${dd} gün kaldı`} · {fmtMoney(e.amount)}</span></span>
                  </Link>
                  <div className="today-actions"><Link to="/daha/odemeler" className="mini">Öde</Link></div>
                </div>
              );
            })}
          </div>
        )}
        {lowStock.length > 0 && (
          <div className="card">
            <div className="today-head"><span className="dot orange" /><span className="bold">Stok azaldı</span></div>
            {lowStock.map((p) => { const s = (p.stock || 0) - (resv[p.id] || 0); return (
              <div key={p.id} className="today-row">
                <Link to="/stok" className="today-main">
                  <span className="tl-icon" style={{ width: 36, height: 36, background: 'var(--orange-bg)', color: 'var(--orange)' }}><Ic.Box size={16} /></span>
                  <span className="today-text"><b>{p.name}</b><span>{s <= 0 ? 'Tükendi' : `Satılabilir ${fmtNum(s)} ${p.unit}${p.minStock ? ` · eşik ${fmtNum(p.minStock)}` : ''}`}</span></span>
                </Link>
              </div>
            ); })}
          </div>
        )}
      </Section>

      <Section title="Bu Ay" to="/daha/raporlar?r=satis" linkLabel="Raporlar">
        <div className="card month">
          <div className="month-kpis">
            <div><span>Satış</span><b>{fmtMoney(m.sales)}</b></div>
            <div><span>Tahsilat</span><b className="pos">{fmtMoney(m.payments)}</b>{delta != null && <em className={delta >= 0 ? 'pos' : 'neg'}>{delta >= 0 ? '▲' : '▼'} %{Math.abs(delta)}</em>}</div>
            <div><span>Açık kalan</span><b className={m.sales - m.payments > 0 ? 'neg' : ''}>{fmtMoney(Math.max(0, m.sales - m.payments))}</b></div>
          </div>
          <div className="month-bars" aria-hidden>
            {series.map((x) => { const max = Math.max(1, ...series.map((y) => Math.max(y.sales, y.payments))); return (
              <div key={x.key} className="month-col"><div className="bars"><i style={{ height: `${(x.sales / max) * 100}%` }} /><i className="p" style={{ height: `${(x.payments / max) * 100}%` }} /></div><span>{x.label}</span></div>
            ); })}
          </div>
          <div className="chart-legend"><span><i style={{ background: 'var(--green)' }} />Satış</span><span><i style={{ background: 'var(--blue)' }} />Tahsilat</span></div>
        </div>
      </Section>

      <Section title="Son Hareketler" to="/musteriler">
        <div className="card" style={{ padding: '4px 14px' }}>
          {recent.map((x) => {
            const Icon = x.type === 'sale' ? Ic.Truck : x.type === 'payment' ? Ic.Cash : Ic.Target;
            const cls = x.type === 'payment' ? 'pay' : x.type === 'visit' ? 'visit' : '';
            return (
              <Link key={x.id} to={`/musteriler/${x.customerId}`} className="today-row">
                <span className="today-main">
                  <span className={`tl-icon ${cls}`} style={{ width: 36, height: 36 }}><Icon size={16} /></span>
                  <span className="today-text"><b>{x.customer.name}</b><span>{fmtDate(x.date)} · {x.type === 'sale' ? (x.fromReserve ? 'Rezerveden teslim' : itemsLabel(x)) : x.type === 'payment' ? 'Tahsilat' : 'Ziyaret'}{x.by ? ` · ${x.by}` : ''}</span></span>
                </span>
                {x.amount != null && !x.fromReserve && <span className={`num ${x.type === 'payment' ? 'pos' : ''}`}>{x.type === 'payment' ? '+' : ''}{fmtMoney(x.amount)}</span>}
              </Link>
            );
          })}
          {recent.length === 0 && <div className="muted small" style={{ padding: '12px 0' }}>Henüz hareket yok.</div>}
        </div>
      </Section>
    </div>
  );
}
