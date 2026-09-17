import { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as Ic from './Icons';
import { initials, fmtDate } from '../utils/format';
import { STATUS_LABEL } from '../store/selectors';

/* ---------- Tab bar ---------- */
const TABS = [
  { to: '/', label: 'Ana Sayfa', icon: Ic.Home, end: true },
  { to: '/musteriler', label: 'Müşteriler', icon: Ic.Users },
  { to: '/stok', label: 'Stok', icon: Ic.Box },
  { to: '/kasa', label: 'Kasa', icon: Ic.Wallet },
  { to: '/daha', label: 'Daha Fazla', icon: Ic.More },
];
export function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
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
export function Avatar({ customer, size }) {
  const cls = `avatar ${size === 'lg' ? 'avatar--lg' : size === 'sm' ? 'avatar--sm' : ''}`;
  return (
    <div className={cls} style={{ background: customer.color || '#0E6B3F' }}>
      {customer.logo ? <img src={customer.logo} alt="" /> : (customer.tag || initials(customer.name))}
    </div>
  );
}
export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status] || status}</span>;
}

/* ---------- Segmented ---------- */
export function Segmented({ value, onChange, options, light }) {
  return (
    <div className={`segmented ${light ? 'light' : ''}`}>
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Bottom sheet select ---------- */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
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
      {msg && <div className="toast">{msg}</div>}
    </ToastCtx.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);

/* ---------- Empty ---------- */
export const Empty = ({ children }) => <div className="empty">{children}</div>;

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
