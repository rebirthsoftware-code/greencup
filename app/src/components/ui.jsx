import { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { tap } from '../utils/hooks';
import * as Ic from './Icons';
import { KIND_LABEL, KIND_ORDER } from '../store/accounts';
import { useStore } from '../store/store';
import { fmtMoney } from '../utils/format';
import { initials, fmtDate, formatMoneyInput, normalizeMoneyInput } from '../utils/format';
import { STATUS_LABEL } from '../store/selectors';

/* ---------- Tab bar (ortada yükseltilmiş + düğmesi) ---------- */
const TABS_L = [
  { to: '/', label: 'Ana Sayfa', icon: Ic.Home, end: true },
  { to: '/musteriler', label: 'Müşteriler', icon: Ic.Users },
];
const TABS_R = [
  { to: '/stok', label: 'Stok', icon: Ic.Box },
  { to: '/daha', label: 'Daha Fazla', icon: Ic.More },
];
const Tab = ({ to, label, icon: Icon, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')} onClick={tap}>
    <Icon size={22} />
    <span>{label}</span>
  </NavLink>
);
export function TabBar() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const go = (to) => { setOpen(false); nav(to); };
  return (
    <>
      <nav className="tabbar">
        {TABS_L.map((t) => <Tab key={t.to} {...t} />)}
        <button className={`fab ${open ? 'open' : ''}`} onClick={() => { tap(); setOpen(!open); }} aria-label="Yeni işlem"><Ic.Plus size={26} /></button>
        {TABS_R.map((t) => <Tab key={t.to} {...t} />)}
      </nav>
      <Sheet open={open} onClose={() => setOpen(false)} title="Ne yapmak istiyorsunuz?">
        <div className="fab-grid">
          <button onClick={() => go('/islem?tur=sale')}><span className="qi blue"><Ic.Truck size={22} /></span>Mal Ver</button>
          <button onClick={() => go('/islem?tur=payment')}><span className="qi gold"><Ic.Cash size={22} /></span>Tahsilat Gir</button>
          <button onClick={() => go('/islem?tur=visit')}><span className="qi orange"><Ic.Target size={22} /></span>Ziyaret Ekle</button>
          <button onClick={() => go('/musteriler/yeni')}><span className="qi"><Ic.UserPlus size={22} /></span>Yeni Müşteri</button>
          <button onClick={() => go('/islem?tur=sale&fatura=1')}><span className="qi purple"><Ic.FileText size={22} /></span>Fatura Ekle</button>
          <button onClick={() => go('/kasa')}><span className="qi"><Ic.Wallet size={22} /></span>Kasa</button>
        </div>
      </Sheet>
    </>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, back = true, to, right, children }) {
  const nav = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button className="back" onClick={() => (to ? nav(to) : nav(-1))} aria-label="Geri">
          <Ic.ChevronLeft size={24} />
        </button>
      )}
      <h1>{title}</h1>
      {right && <div className="actions">{right}</div>}
      {children}
    </header>
  );
}

/* ---------- Avatar / Badge ---------- */
export function Avatar({ customer, size, status }) {
  const cls = `avatar ${size === 'lg' ? 'avatar--lg' : size === 'sm' ? 'avatar--sm' : ''} ${status ? `ring-${status}` : ''}`;
  return (
    <div className={cls} style={{ background: customer.color || '#0E6B3F' }}>
      {customer.logo ? <img src={customer.logo} alt="" /> : (customer.tag || initials(customer.name))}
    </div>
  );
}
export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status] || status}</span>;
}

/* ---------- Segmented (kayan gösterge) ---------- */
export function Segmented({ value, onChange, options, light }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className={`segmented seg ${light ? 'light' : ''}`} style={{ '--n': options.length, '--i': idx }}>
      <span className="seg-ind" aria-hidden />
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'active' : ''} onClick={() => { tap(); onChange(o.value); }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
/** Hesap seçici: dokununca nakit / banka hesapları / kredi kartları gruplu ve bakiyeli liste açılır. */
export function AccountSelect({ value, onChange, accounts, label, exclude, labelFor, hint }) {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const list = (accounts || state.accounts || []).filter((a) => !a.deleted && a.id !== exclude);
  const groups = KIND_ORDER.map((kind) => ({ kind, label: KIND_LABEL[kind], items: list.filter((a) => a.kind === kind) })).filter((g) => g.items.length);
  const sel = list.find((a) => a.id === value);
  const name = sel ? sel.name : value ? (labelFor ? labelFor(value) : value) : 'Hesap seçin';
  const bal = (id) => fmtMoney(state.cash[id] || 0);
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="input select" onClick={() => setOpen(true)} role="button">
        <span style={{ flex: 1, color: sel || value ? 'inherit' : 'var(--text-3)' }}>{name}</span>
        {sel && <span className="xs muted" style={{ marginRight: 6 }}>{bal(sel.id)}</span>}
        <Ic.ChevronDown className="chev" size={20} />
      </div>
      {hint && <span className="xs muted">{hint}</span>}
      <Sheet open={open} onClose={() => setOpen(false)} title={label || 'Hesap'}>
        {groups.map((g) => (
          <div key={g.kind} style={{ marginBottom: 8 }}>
            <div className="card-title" style={{ margin: '6px 0 2px' }}>{g.label}</div>
            {g.items.map((a) => (
              <div key={a.id} className={`opt-row ${a.id === value ? 'active' : ''}`} onClick={() => { onChange(a.id); setOpen(false); }}>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span className={`num ${(state.cash[a.id] || 0) < 0 ? 'neg' : 'muted'}`} style={{ fontSize: 13 }}>{bal(a.id)}</span>
                {a.id === value && <Ic.Check size={18} />}
              </div>
            ))}
          </div>
        ))}
        {groups.length === 0 && <Empty>Hesap yok. Kasa sayfasından "Hesap Ekle" ile ekleyin.</Empty>}
      </Sheet>
    </div>
  );
}
/** Sayfa içi sekmeler (Segmented ile aynı görünüm, dizi değerli). */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs seg" style={{ '--n': items.length, '--i': value }}>
      <span className="seg-ind" aria-hidden />
      {items.map((t, i) => <button key={t} type="button" className={i === value ? 'active' : ''} onClick={() => { tap(); onChange(i); }}>{t}</button>)}
    </div>
  );
}

/* ---------- Bottom sheet select ---------- */
export function Sheet({ open, onClose, title, children }) {
  const bgRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // iOS/Android: klavye açılınca görünür alan küçülür ama sabit (fixed) katman küçülmez;
    // alt sayfayı görünür alana (visualViewport) göre boyutlandır ki Kaydet butonu klavyenin altında kalmasın.
    const vv = window.visualViewport;
    const fit = () => {
      const el = bgRef.current; if (!el) return;
      if (vv && vv.height < window.innerHeight - 80) { el.style.top = `${vv.offsetTop}px`; el.style.height = `${vv.height}px`; el.classList.add('kbd'); }
      else { el.style.top = ''; el.style.height = ''; el.classList.remove('kbd'); }
    };
    const onFocus = (e) => { if (e.target?.closest?.('.sheet')) setTimeout(() => { fit(); e.target.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); }, 250); };
    vv?.addEventListener('resize', fit); vv?.addEventListener('scroll', fit); document.addEventListener('focusin', onFocus);
    fit();
    return () => { document.body.style.overflow = prev; vv?.removeEventListener('resize', fit); vv?.removeEventListener('scroll', fit); document.removeEventListener('focusin', onFocus); };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="sheet-bg" ref={bgRef} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  );
}

export function SelectField({ label, value, options, onChange, placeholder = 'Seçin', renderOption }) {
  const [open, setOpen] = useState(false);
  const sel = options.find((o) => o.value === value);
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="input select" onClick={() => setOpen(true)} role="button">
        <span style={{ flex: 1, color: sel ? 'inherit' : 'var(--text-3)' }}>{sel ? sel.label : placeholder}</span>
        <Ic.ChevronDown className="chev" size={20} />
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o) => (
          <div key={o.value} className={`opt-row ${o.value === value ? 'active' : ''}`}
            onClick={() => { onChange(o.value); setOpen(false); }}>
            {renderOption ? renderOption(o) : <span style={{ flex: 1 }}>{o.label}</span>}
            {o.value === value && <Ic.Check size={18} />}
          </div>
        ))}
      </Sheet>
    </div>
  );
}

/* ---------- Toast ---------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast"><Ic.Check size={16} />{msg}</div>}
    </ToastCtx.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);

/* ---------- Empty ---------- */
export const Empty = ({ children, icon: Icon = Ic.Cup }) => (
  <div className="empty">
    <span className="empty-art"><Icon size={28} /></span>
    <div>{children}</div>
  </div>
);

/* ---------- Tarih alanı (cihaz biçiminden bağımsız gün.ay.yıl gösterimi) ---------- */
export function DateField({ label, value, onChange, min, max, required }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="input">
        <input type="date" value={value || ''} min={min} max={max} required={required} onChange={(e) => onChange(e.target.value)} lang="tr-TR" />
        <span className="suffix">{value ? fmtDate(value) : ''}</span>
      </div>
    </div>
  );
}

/* ---------- Onaylı sil düğmesi ---------- */
export function DangerButton({ onConfirm, message = 'Silinsin mi? Bu işlem geri alınamaz.', children, className = 'btn btn-ghost btn-sm' }) {
  return <button type="button" className={className} style={{ color: 'var(--red)' }} onClick={() => { if (confirm(message)) onConfirm(); }}>{children}</button>;
}

/* ---------- Tutar girişi (yazarken 13.636,56 biçimler; iPhone'da nokta gerekmez) ---------- */
export function MoneyInput({ value, onChange, placeholder = '0', autoFocus, id }) {
  return (
    <input id={id} inputMode="decimal" autoComplete="off" value={value ?? ''} placeholder={placeholder} autoFocus={autoFocus}
      onChange={(e) => onChange(formatMoneyInput(e.target.value))} onBlur={() => { const n = normalizeMoneyInput(value ?? ''); if (n !== (value ?? '')) onChange(n); }} />
  );
}
