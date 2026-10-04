// Dönem yardımcıları: gün / hafta (Pazartesi başlangıç) / ay / yıl aralıkları, yerel saatle.
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export const UNITS = [{ value: 'day', label: 'Günlük' }, { value: 'week', label: 'Haftalık' }, { value: 'month', label: 'Aylık' }, { value: 'year', label: 'Yıllık' }];

/** Verilen tarihi kapsayan dönem: { from, to, label, short }. */
export function periodRange(unit, anchor) {
  const d = parse(anchor);
  if (unit === 'day') return { from: iso(d), to: iso(d), label: `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}, ${DAYS[d.getDay()]}`, short: `${d.getDate()} ${MONTHS[d.getMonth()]}` };
  if (unit === 'week') {
    const s = new Date(d); s.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const e = new Date(s); e.setDate(s.getDate() + 6);
    const same = s.getMonth() === e.getMonth();
    return { from: iso(s), to: iso(e), label: `${s.getDate()}${same ? '' : ' ' + MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS_LONG[e.getMonth()]} ${e.getFullYear()}`, short: `${s.getDate()}${same ? '' : ' ' + MONTHS[s.getMonth()]}–${e.getDate()} ${MONTHS[e.getMonth()]}` };
  }
  if (unit === 'month') {
    const s = new Date(d.getFullYear(), d.getMonth(), 1); const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: iso(s), to: iso(e), label: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, short: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
  }
  return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31`, label: `${d.getFullYear()}`, short: `${d.getFullYear()}` };
}

/** Dönemi n adım ileri/geri kaydırır; yeni dönemin bir tarihini döner. */
export function shiftPeriod(unit, anchor, n) {
  const d = parse(anchor);
  if (unit === 'day') d.setDate(d.getDate() + n);
  else if (unit === 'week') d.setDate(d.getDate() + 7 * n);
  else if (unit === 'month') { d.setDate(1); d.setMonth(d.getMonth() + n); }
  else { d.setMonth(0, 1); d.setFullYear(d.getFullYear() + n); }
  return iso(d);
}

/** Bitişi anchor olan son n dönem (eskiden yeniye). */
export function lastPeriods(unit, anchor, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(periodRange(unit, shiftPeriod(unit, anchor, -i)));
  return out;
}
