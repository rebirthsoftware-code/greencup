// Örnek (demo) veri ve durum şeması yardımcıları.
// Uygulama ilk açılışta bu veriyle başlar; Ayarlar > Tümünü Temizle ile boş başlanır.

export const STATE_VERSION = 2;

export const seedProducts = [
  { id: 'p-7oz-karton',   name: '7oz Karton',      stock: 25000, unit: 'adet', price: 2.9 },
  { id: 'p-8oz-karton',   name: '8oz Karton',      stock: 18000, unit: 'adet', price: 3.1 },
  { id: 'p-14oz-dw',      name: '14oz Doublewall', stock: 12000, unit: 'adet', price: 6.0 },
  { id: 'p-14oz-pet',     name: '14oz PET',        stock: 30000, unit: 'adet', price: 3.7 },
  { id: 'p-16oz-pet',     name: '16oz PET',        stock: 20000, unit: 'adet', price: 4.1 },
  { id: 'p-islak-mendil', name: 'Islak Mendil',    stock: 15000, unit: 'adet', price: 0.9 },
  { id: 'p-pecete',       name: 'Peçete',          stock: 40000, unit: 'adet', price: 0.4 },
  { id: 'p-stick-seker',  name: 'Stick Şeker',     stock: 60000, unit: 'adet', price: 0.3 },
  { id: 'p-kraft-canta',  name: 'Kraft Çanta',     stock: 5000,  unit: 'adet', price: 5.5 },
];

export const seedCustomers = [
  { id: 'c-goldbeans', name: 'Goldbeans',             type: 'Cafe & Restaurant', phone: '0542 123 45 67', city: 'Zonguldak', district: 'Merkez',     color: '#1A1A1A', tag: 'GB' },
  { id: 'c-tuin',      name: 'Tuincoffee',            type: 'Coffee Shop',       phone: '0532 456 78 90', city: 'Zonguldak', district: 'Ereğli',     color: '#3B2A1E', tag: 'TC' },
  { id: 'c-argusto',   name: 'Argusto Cafe',          type: 'Cafe',              phone: '0533 111 22 33', city: 'Bartın',    district: 'Merkez',     color: '#2E2E2E', tag: 'AC' },
  { id: 'c-vento',     name: 'Vento Coffee',          type: 'Coffee Shop',       phone: '0544 999 88 77', city: 'Karabük',   district: 'Safranbolu', color: '#7A4B2B', tag: 'VC' },
  { id: 'c-tahirler',  name: 'Tahirler Otomotiv',     type: 'Kurumsal',          phone: '0372 222 33 44', city: 'Zonguldak', district: 'Kozlu',      color: '#1F2A3A', tag: 'TO' },
  { id: 'c-yamanoglu', name: 'Yamanoğlu Mühendislik', type: 'Kurumsal',          phone: '0372 555 66 77', city: 'Zonguldak', district: 'Merkez',     color: '#22335A', tag: 'YM' },
];

const item = (productId, qty, amount) => {
  const p = seedProducts.find((x) => x.id === productId);
  return { productId, name: p.name, unit: p.unit, qty, unitPrice: +(amount / qty).toFixed(2), amount };
};
const sale = (id, customerId, date, items, opts = {}) => ({
  id, customerId, type: 'sale', date, items, amount: items.reduce((a, i) => a + i.amount, 0),
  invoiced: true, payment: 'vadeli', dueDate: addDays(date, 30), ...opts,
});
export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// type: 'sale' (mal verildi) | 'payment' (tahsilat) | 'visit' (ziyaret) | 'note'
export const seedTransactions = [
  // Goldbeans
  sale('t1', 'c-goldbeans', '2026-08-15', [item('p-14oz-pet', 3000, 11000)]),
  { id: 't2',  customerId: 'c-goldbeans', type: 'payment', date: '2026-08-20', amount: 7500,  method: 'nakit' },
  { id: 't3',  customerId: 'c-goldbeans', type: 'visit',   date: '2026-08-28', note: 'Yeni sipariş konuşuldu.' },
  sale('t4', 'c-goldbeans', '2026-09-05', [item('p-14oz-dw', 2000, 12000)], { invoiced: false }),
  { id: 't5',  customerId: 'c-goldbeans', type: 'payment', date: '2026-09-10', amount: 3000, method: 'banka' },
  { id: 't5b', customerId: 'c-goldbeans', type: 'visit',   date: '2026-09-12', note: 'Yeni sipariş konuşuldu.' },
  sale('t6', 'c-goldbeans', '2026-09-16', [item('p-14oz-pet', 5000, 18500), item('p-pecete', 2000, 800)], { invoiceNo: '2026/0457' }),
  // Tuincoffee
  sale('t7', 'c-tuin', '2026-08-30', [item('p-14oz-pet', 3000, 11100)]),
  sale('t8', 'c-tuin', '2026-09-02', [item('p-8oz-karton', 1000, 3100)]),
  { id: 't9',  customerId: 'c-tuin', type: 'payment', date: '2026-09-16', amount: 5450, method: 'nakit' },
  { id: 't9b', customerId: 'c-tuin', type: 'visit',   date: '2026-09-16', note: 'Tahsilat alındı, kalan bakiye hatırlatıldı.' },
  // Argusto (peşin)
  sale('t10', 'c-argusto', '2026-08-25', [item('p-14oz-pet', 2500, 9250)], { payment: 'pesin', dueDate: '2026-08-25' }),
  { id: 't11', customerId: 'c-argusto', type: 'payment', date: '2026-08-25', amount: 9250, method: 'kart' },
  sale('t12', 'c-argusto', '2026-09-08', [item('p-14oz-dw', 1000, 6000)], { payment: 'pesin', dueDate: '2026-09-08' }),
  { id: 't13', customerId: 'c-argusto', type: 'payment', date: '2026-09-08', amount: 6000, method: 'nakit' },
  { id: 't13b', customerId: 'c-argusto', type: 'visit',  date: '2026-09-08', note: 'Teslimat yapıldı.' },
  // Vento (kısmi)
  sale('t14', 'c-vento', '2026-09-04', [item('p-16oz-pet', 1500, 6150), item('p-14oz-dw', 500, 3000)], { invoiced: false, payment: 'kismi' }),
  { id: 't16', customerId: 'c-vento', type: 'payment', date: '2026-09-04', amount: 5950, method: 'nakit' },
  { id: 't16b', customerId: 'c-vento', type: 'visit',  date: '2026-09-04', note: 'Kısmi ödeme alındı.' },
  // Tahirler
  sale('t17', 'c-tahirler', '2026-09-10', [item('p-14oz-pet', 1000, 3700)], { payment: 'pesin', dueDate: '2026-09-10' }),
  { id: 't18', customerId: 'c-tahirler', type: 'payment', date: '2026-09-10', amount: 3700, method: 'banka' },
  { id: 't18b', customerId: 'c-tahirler', type: 'visit',  date: '2026-09-10', note: 'Numune bırakıldı.' },
  // Yamanoğlu
  sale('t19', 'c-yamanoglu', '2026-08-28', [item('p-7oz-karton', 2000, 5800)]),
  { id: 't20', customerId: 'c-yamanoglu', type: 'payment', date: '2026-09-02', amount: 200, method: 'nakit' },
  { id: 't20b', customerId: 'c-yamanoglu', type: 'visit',  date: '2026-09-02', note: 'Ofis ziyareti.' },
];

// Depoda müşteriye ait (rezerve) mallar
export const seedReserved = [
  { id: 'r1', customerId: 'c-goldbeans', productId: 'p-14oz-pet', qty: 5000 },
  { id: 'r2', customerId: 'c-tuin',      productId: 'p-8oz-karton', qty: 1000 },
];

export const seedCash = { nakit: 21450, banka: 32800, kart: 8100 };

// Kasa hareketleri. type: 'in' | 'out'
export const seedCashMoves = [
  { id: 'k1', date: '2026-09-17', type: 'in',  amount: 15000, title: 'Tahsilat', account: 'nakit' },
  { id: 'k2', date: '2026-09-17', type: 'out', amount: 4500,  title: 'Yakıt',    account: 'kart' },
  { id: 'k3', date: '2026-09-17', type: 'out', amount: 2000,  title: 'Kargo',    account: 'nakit' },
];

// Benim ödemelerim (giderler)
export const seedExpenses = [
  { id: 'e1', title: 'Matbaa',            amount: 18000, due: '2026-09-17', paid: false },
  { id: 'e2', title: 'Kağıt Tedarikçisi', amount: 32500, due: '2026-09-20', paid: false },
  { id: 'e3', title: 'Kira',              amount: 15000, due: '2026-09-25', paid: false },
  { id: 'e4', title: 'Elektrik',          amount: 8750,  due: '2026-09-30', paid: false },
  { id: 'e5', title: 'Personel Maaşı',    amount: 12000, due: '2026-10-05', paid: false },
  { id: 'e6', title: 'Kira',              amount: 15000, due: '2026-08-25', paid: true, paidAt: '2026-08-24' },
];

export const seedPlannedVisits = [
  { id: 'v1', customerId: 'c-yamanoglu', date: '2026-09-18', note: 'Bakiye görüşmesi', done: false },
  { id: 'v2', customerId: 'c-vento',     date: '2026-09-19', note: '', done: false },
];

export const seedUsers = [
  { id: 'u1', name: 'Barış Kandemir', role: 'Yönetici' },
];

export const seedSettings = {
  userName: 'Barış Kandemir',
  userEmail: 'baris@greencup.com.tr',
  company: 'GreenCup Promosyon',
  companyAddress: '',
  taxNo: '',
  kdv: 20,
  overdueDays: 30,      // vade tarihi olmayan eski satışlar için gecikme eşiği
  defaultDueDays: 30,   // vadeli satışta varsayılan vade (gün)
  invoiceSeq: 1,        // sıradaki fatura numarası
};

export const makeSeed = () => ({
  version: STATE_VERSION,
  products: seedProducts,
  customers: seedCustomers,
  transactions: seedTransactions,
  reserved: seedReserved,
  cash: seedCash,
  cashMoves: seedCashMoves,
  expenses: seedExpenses,
  plannedVisits: seedPlannedVisits,
  users: seedUsers,
  tombstones: [],
  settings: seedSettings,
});

/** Boş başlangıç: hiç müşteri/ürün/hareket yok, kasa sıfır. Ayarlar ve kullanıcılar korunur. */
export const makeEmpty = (settings = seedSettings, users = seedUsers) => ({
  version: STATE_VERSION,
  products: [],
  customers: [],
  transactions: [],
  reserved: [],
  cash: { nakit: 0, banka: 0, kart: 0 },
  cashMoves: [],
  expenses: [],
  plannedVisits: [],
  users,
  tombstones: [],
  settings,
});

/**
 * Cihazdan veya buluttan gelen ham durumu bugünkü şemaya getirir:
 * eksik listeler boş, eksik ayarlar varsayılan, eski tek ürünlü satışlar `items` biçimine.
 */
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const base = makeEmpty();
  const s = { ...base, ...raw, settings: { ...seedSettings, ...(raw.settings || {}) } };
  for (const k of ['products', 'customers', 'transactions', 'reserved', 'cashMoves', 'expenses', 'plannedVisits', 'users', 'tombstones']) {
    if (!Array.isArray(s[k])) s[k] = [];
  }
  s.cash = { nakit: 0, banka: 0, kart: 0, ...(raw.cash || {}) };
  s.transactions = s.transactions.map((t) => {
    if (t.type !== 'sale' || Array.isArray(t.items)) return t;
    const p = s.products.find((x) => x.id === t.productId);
    const qty = t.qty || 0;
    return { ...t, items: [{ productId: t.productId, name: t.productName || p?.name || t.productId, unit: p?.unit || 'adet', qty, unitPrice: qty ? +((t.amount || 0) / qty).toFixed(2) : 0, amount: t.amount || 0 }] };
  });
  s.reserved = s.reserved.map((r, i) => (r.id ? r : { ...r, id: `r-${r.customerId}-${r.productId}-${i}` }));
  if (s.users.length === 0) s.users = [{ id: 'u1', name: s.settings.userName || 'Kullanıcı', role: 'Yönetici' }];
  s.version = STATE_VERSION;
  return s;
}
