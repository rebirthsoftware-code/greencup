// İki durumun (yerel ↔ bulut) birleştirilmesi. İki cihaz aynı anda yazdığında
// "son yazan kazanır" yerine kayıt bazında birleştirme yapılır:
//  - listelerde kayıtlar id ile eşleşir; iki tarafta da olan kayıt için updatedAt geç olan kazanır
//  - bir tarafta silinmiş (tombstone) kayıt diğer tarafta geri gelmez
//  - kasa bakiyesi: buluttaki bakiye + yalnızca yerelde olan kasa hareketleri
//  - ayarlar: updatedAt geç olan
const LISTS = ['products', 'customers', 'transactions', 'reserved', 'cashMoves', 'expenses', 'plannedVisits', 'users'];

const later = (a, b) => ((a?.updatedAt || a?.createdAt || '') >= (b?.updatedAt || b?.createdAt || '') ? a : b);

export function mergeStates(local, remote) {
  const dead = new Set([...(local.tombstones || []), ...(remote.tombstones || [])].map((t) => t.id));
  const out = { ...remote };

  for (const k of LISTS) {
    const map = new Map();
    for (const r of remote[k] || []) if (!dead.has(r.id)) map.set(r.id, r);
    for (const l of local[k] || []) {
      if (dead.has(l.id)) continue;
      map.set(l.id, map.has(l.id) ? later(l, map.get(l.id)) : l);
    }
    out[k] = [...map.values()];
  }

  // Kasa: buluttaki bakiye + yalnızca yerelde olan hareketler − yalnızca bulutta olup silinmiş hareketler
  const remoteMoveIds = new Set((remote.cashMoves || []).map((m) => m.id));
  const cash = { ...remote.cash };
  for (const m of local.cashMoves || []) {
    if (remoteMoveIds.has(m.id) || dead.has(m.id)) continue;
    cash[m.account] = (cash[m.account] || 0) + (m.type === 'in' ? m.amount : -m.amount);
  }
  for (const m of remote.cashMoves || []) {
    if (!dead.has(m.id) || (local.tombstones || []).every((t) => t.id !== m.id)) continue;
    cash[m.account] = (cash[m.account] || 0) - (m.type === 'in' ? m.amount : -m.amount);
  }
  out.cash = cash;

  // Sıralama: tarih ve oluşturma zamanına göre (yeni üstte)
  const desc = (a, b) => ((b.date || '') + (b.createdAt || '')).localeCompare((a.date || '') + (a.createdAt || ''));
  out.transactions.sort(desc); out.cashMoves.sort(desc);

  out.settings = later(local.settings, remote.settings) === local.settings ? { ...remote.settings, ...local.settings } : { ...local.settings, ...remote.settings };
  // Ürün stoğu: kayıt olarak geç düzenlenen taraf esas alınır (eşitlikte bulut), sonra
  // yalnızca diğer tarafta yapılan satışlar düşülür ve diğer tarafta silinen satışlar geri eklenir.
  const qtyIn = (txs, productId) => txs.filter((t) => t.type === 'sale').flatMap((t) => t.items || []).filter((i) => i.productId === productId).reduce((a, i) => a + i.qty, 0);
  const localTxIds = new Set((local.transactions || []).map((t) => t.id));
  const remoteTxIds = new Set((remote.transactions || []).map((t) => t.id));
  const localTomb = new Set((local.tombstones || []).map((t) => t.id));
  const remoteTomb = new Set((remote.tombstones || []).map((t) => t.id));
  const localOnly = (local.transactions || []).filter((t) => !remoteTxIds.has(t.id) && !remoteTomb.has(t.id));
  const remoteOnly = (remote.transactions || []).filter((t) => !localTxIds.has(t.id) && !localTomb.has(t.id));
  const deletedLocally = (remote.transactions || []).filter((t) => localTomb.has(t.id));
  const deletedRemotely = (local.transactions || []).filter((t) => remoteTomb.has(t.id));
  out.products = out.products.map((p) => {
    const L = (local.products || []).find((x) => x.id === p.id);
    const R = (remote.products || []).find((x) => x.id === p.id);
    if (!L || !R) return p;
    const lt = L.updatedAt || '', rt = R.updatedAt || '';
    if (lt > rt) return { ...L, stock: Math.max(0, (L.stock || 0) - qtyIn(remoteOnly, p.id) + qtyIn(deletedRemotely, p.id)) };
    return { ...R, stock: Math.max(0, (R.stock || 0) - qtyIn(localOnly, p.id) + qtyIn(deletedLocally, p.id)) };
  });

  // Tombstone listesi birleşir, 90 günden eskiler atılır
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
  const tomb = new Map();
  for (const t of [...(remote.tombstones || []), ...(local.tombstones || [])]) if (t.at >= cutoff) tomb.set(t.id, t);
  out.tombstones = [...tomb.values()];
  return out;
}
