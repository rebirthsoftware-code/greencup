// Olaya bağlı bildirimler: bir yerel değişiklik sonrasında yeni ortaya çıkan durumlar.
import { reservedByProduct } from './selectors';

const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n || 0);

/** Satılabilir miktarı eşiğin altında (veya sıfırda) olan ürün id'leri. */
export function lowStockIds(state) {
  const resv = reservedByProduct(state);
  const out = new Set();
  for (const p of state.products) {
    const sellable = (p.stock || 0) - (resv[p.id] || 0);
    if (sellable <= 0 || (p.minStock > 0 && sellable <= p.minStock)) out.add(p.id);
  }
  return out;
}

/** prev → next geçişinde YENİ düşen ürünler için bildirim yükleri. */
export function stockAlerts(prev, next) {
  if (!prev || !next || prev === next) return [];
  const before = lowStockIds(prev);
  const after = lowStockIds(next);
  const resv = reservedByProduct(next);
  return next.products.filter((p) => after.has(p.id) && !before.has(p.id)).map((p) => {
    const sellable = (p.stock || 0) - (resv[p.id] || 0);
    return {
      tag: `stock-${p.id}`,
      title: sellable <= 0 ? `Stok tükendi: ${p.name}` : `Stok azaldı: ${p.name}`,
      body: sellable <= 0 ? `Satılabilir ${p.name} kalmadı.` : `Satılabilir ${fmt(sellable)} ${p.unit || 'adet'} kaldı${p.minStock ? ` (eşik ${fmt(p.minStock)})` : ''}.`,
      url: '/app/stok',
    };
  });
}

/** Tüm yeni olayları toplar (ileride başka olay türleri de eklenebilir). */
export function newAlerts(prev, next) {
  return [...stockAlerts(prev, next)];
}
