// Olaya bağlı bildirimler: bir yerel değişiklik sonrasında yeni ortaya çıkan durumlar.
const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n || 0);

/** Stoğu eşiğin altında (veya sıfırda) olan ürün id'leri. */
export function lowStockIds(state) {
  const out = new Set();
  for (const p of state.products) {
    const stock = p.stock || 0;
    if (stock <= 0 || (p.minStock > 0 && stock <= p.minStock)) out.add(p.id);
  }
  return out;
}

/** prev → next geçişinde YENİ düşen ürünler için bildirim yükleri. */
export function stockAlerts(prev, next) {
  if (!prev || !next || prev === next) return [];
  const before = lowStockIds(prev);
  const after = lowStockIds(next);
  return next.products.filter((p) => after.has(p.id) && !before.has(p.id)).map((p) => {
    const stock = p.stock || 0;
    return {
      tag: `stock-${p.id}`,
      title: stock <= 0 ? `Stok tükendi: ${p.name}` : `Stok azaldı: ${p.name}`,
      body: stock <= 0 ? `Depoda ${p.name} kalmadı.` : `${fmt(stock)} ${p.unit || 'adet'} kaldı${p.minStock ? ` (eşik ${fmt(p.minStock)})` : ''}.`,
      url: '/app/stok',
    };
  });
}

/** Tüm yeni olayları toplar (ileride başka olay türleri de eklenebilir). */
export function newAlerts(prev, next) {
  return [...stockAlerts(prev, next)];
}
