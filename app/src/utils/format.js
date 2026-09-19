const tl = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const tl2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('tr-TR');

export const fmtMoney = (v, sign = false) => {
  const a = Math.abs(v || 0);
  const s = `₺${Number.isInteger(a) ? tl.format(a) : tl2.format(a)}`;
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

/** CSV (Excel uyumlu: UTF-8 BOM, noktalı virgül) indirir. */
export function downloadCsv(filename, rows) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename; a.click();
}

/** Görseli küçültüp (en fazla `max` px) data URL döner: müşteri logosu için. */
export function resizeImage(file, max = 128) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Para/sayı metnini sayıya çevirir. Kurallar:
 *  - hem nokta hem virgül varsa sonda olan ondalık ayırıcıdır ("1.500,50" → 1500.5, "1,500.50" → 1500.5)
 *  - yalnızca virgül varsa ondalıktır ("3,7" → 3.7)
 *  - yalnızca nokta varsa: tek nokta ve ardından 1-2 hane ondalıktır ("3.7", "10.50"); ardından tam 3 hane
 *    veya birden çok nokta binlik ayırıcıdır ("1.500" → 1500, "1.500.000" → 1500000)
 */
export function parseMoney(v) {
  let s = String(v ?? '').trim().replace(/[₺\s]/g, '');
  if (!s) return 0;
  const neg = s.startsWith('-'); s = s.replace(/^[-+]/, '');
  const dots = (s.match(/\./g) || []).length, commas = (s.match(/,/g) || []).length;
  if (dots && commas) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(/,/g, '.') : s.replace(/,/g, '');
  } else if (commas) {
    const i = s.lastIndexOf(','); s = s.slice(0, i).replace(/,/g, '') + '.' + s.slice(i + 1);
  } else if (dots) {
    const tail = s.slice(s.lastIndexOf('.') + 1);
    if (dots === 1 && tail.length > 0 && tail.length <= 2) { /* ondalık */ } else s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}
/** Sayıyı giriş kutusu için virgüllü metne çevirir (3.7 → "3,7"). */
export const toInput = (n) => (n == null || n === '' ? '' : String(n).replace('.', ','));

/** Satır düzenleyicinin geçici alanlarını temizler. */
export const cleanItem = (i) => { const c = { ...i }; delete c.manual; delete c.priceStr; return c; };

/**
 * Tutar kutusu için canlı biçimlendirme. Hedef: iPhone'da (klavyede yalnızca virgül) ve
 * Android'de (nokta da yazılabiliyor) aynı sonuca ulaşmak; "13.636,56" gösterimi.
 *  - virgül varsa: noktalar binliktir, virgülden sonrası ondalık (en çok 2 hane)
 *  - virgül yok, tek nokta ve ardında 1-2 hane: "3.7" / "10.50" olduğu gibi bırakılır (yazım sürüyor;
 *    parseMoney ondalık okur, kutudan çıkınca virgüle çevrilir)
 *  - nokta ardında tam 3 hane: binlik ("13.636"), yeniden gruplanır
 *  - gruplanmış sayıdan sonra yazılan nokta ("13.636." / "13.636.5"): ondalık niyeti, virgüle çevrilir
 */
export function formatMoneyInput(raw) {
  const s = String(raw ?? '').replace(/[^\d.,]/g, '');
  if (!s) return '';
  const group = (digits) => digits.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (s.includes(',')) {
    const i = s.lastIndexOf(',');
    return `${group(s.slice(0, i)) || '0'},${s.slice(i + 1).replace(/[^\d]/g, '').slice(0, 2)}`;
  }
  const dots = (s.match(/\./g) || []).length;
  if (dots === 0) return group(s);
  const i = s.lastIndexOf('.'); const tail = s.slice(i + 1);
  if (dots === 1) {
    if (tail.length === 0) return s;                 // "13." yazılıyor: bekle
    if (tail.length <= 2) return s.replace(/^0+(?=\d)/, ''); // "3.7", "10.50": olduğu gibi
    return group(s);                                 // "1.500" / "1.5000": binlik
  }
  if (tail.length === 3) return group(s);            // "13.636" yeniden gruplama
  return `${group(s.slice(0, i)) || '0'},${tail.replace(/[^\d]/g, '').slice(0, 2)}`; // "13.636." / "13.636.5"
}
/** Kutudan çıkınca "3.7" → "3,7" (ondalık nokta virgüle). */
export const normalizeMoneyInput = (v) => (v && !v.includes(',') && /^\d+\.\d{1,2}$/.test(v) ? v.replace('.', ',') : v);
