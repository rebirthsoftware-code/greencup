const tl = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('tr-TR');

export const fmtMoney = (v, sign = false) => {
  const s = `₺${tl.format(Math.abs(v || 0))}`;
  if (!sign) return v < 0 ? `-${s}` : s;
  return v > 0 ? `+${s}` : v < 0 ? `-${s}` : s;
};
export const fmtNum = (v) => num.format(v || 0);
export const fmtPrice = (v) => `₺${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v || 0)}`;

export const fmtDate = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const fmtDayMonth = (iso) => {
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]}`;
};
export const today = () => new Date().toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
export const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toLocaleUpperCase('tr-TR')).join('');
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
