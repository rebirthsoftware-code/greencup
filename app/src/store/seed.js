// Örnek (demo) veri. Uygulama ilk açılışta bu veriyle başlar; sonrasında
// cihazda saklanan veri kullanılır. Ayarlar > Verileri sıfırla ile geri yüklenir.

export const seedProducts = [
  { id: 'p-7oz-karton',   name: '7oz Karton',      stock: 25000, reserved: 5000,  unit: 'adet', price: 2.9 },
  { id: 'p-8oz-karton',   name: '8oz Karton',      stock: 18000, reserved: 3000,  unit: 'adet', price: 3.1 },
  { id: 'p-14oz-dw',      name: '14oz Doublewall', stock: 12000, reserved: 2000,  unit: 'adet', price: 6.0 },
  { id: 'p-14oz-pet',     name: '14oz PET',        stock: 30000, reserved: 5000,  unit: 'adet', price: 3.7 },
  { id: 'p-16oz-pet',     name: '16oz PET',        stock: 20000, reserved: 3000,  unit: 'adet', price: 4.1 },
  { id: 'p-islak-mendil', name: 'Islak Mendil',    stock: 15000, reserved: 2000,  unit: 'adet', price: 0.9 },
  { id: 'p-pecete',       name: 'Peçete',          stock: 40000, reserved: 5000,  unit: 'adet', price: 0.4 },
  { id: 'p-stick-seker',  name: 'Stick Şeker',     stock: 60000, reserved: 10000, unit: 'adet', price: 0.3 },
  { id: 'p-kraft-canta',  name: 'Kraft Çanta',     stock: 5000,  reserved: 1000,  unit: 'adet', price: 5.5 },
];

export const seedCustomers = [
  { id: 'c-goldbeans', name: 'Goldbeans',             type: 'Cafe & Restaurant', phone: '0542 123 45 67', city: 'Zonguldak', district: 'Merkez',  color: '#1A1A1A', tag: 'GB' },
  { id: 'c-tuin',      name: 'Tuincoffee',            type: 'Coffee Shop',       phone: '0532 456 78 90', city: 'Zonguldak', district: 'Ereğli',  color: '#3B2A1E', tag: 'TC' },
  { id: 'c-argusto',   name: 'Argusto Cafe',          type: 'Cafe',              phone: '0533 111 22 33', city: 'Bartın',    district: 'Merkez',  color: '#2E2E2E', tag: 'AC' },
  { id: 'c-vento',     name: 'Vento Coffee',          type: 'Coffee Shop',       phone: '0544 999 88 77', city: 'Karabük',   district: 'Safranbolu', color: '#7A4B2B', tag: 'VC' },
  { id: 'c-tahirler',  name: 'Tahirler Otomotiv',     type: 'Kurumsal',          phone: '0372 222 33 44', city: 'Zonguldak', district: 'Kozlu',   color: '#1F2A3A', tag: 'TO' },
  { id: 'c-yamanoglu', name: 'Yamanoğlu Mühendislik', type: 'Kurumsal',          phone: '0372 555 66 77', city: 'Zonguldak', district: 'Merkez',  color: '#22335A', tag: 'YM' },
];

// type: 'sale' (mal verildi) | 'payment' (tahsilat) | 'visit' (ziyaret) | 'note'
export const seedTransactions = [
  // Goldbeans
  { id: 't1',  customerId: 'c-goldbeans', type: 'sale',    date: '2026-08-15', productId: 'p-14oz-pet', qty: 3000, amount: 11000, invoiced: true,  payment: 'vadeli' },
  { id: 't2',  customerId: 'c-goldbeans', type: 'payment', date: '2026-08-20', amount: 7500,  method: 'nakit' },
  { id: 't3',  customerId: 'c-goldbeans', type: 'visit',   date: '2026-08-28', note: 'Yeni sipariş konuşuldu.' },
  { id: 't4',  customerId: 'c-goldbeans', type: 'sale',    date: '2026-09-05', productId: 'p-14oz-dw',  qty: 2000, amount: 12000, invoiced: false, payment: 'vadeli' },
  { id: 't5',  customerId: 'c-goldbeans', type: 'payment', date: '2026-09-10', amount: 10000, method: 'banka' },
  { id: 't5b', customerId: 'c-goldbeans', type: 'visit',   date: '2026-09-12', note: 'Yeni sipariş konuşuldu.' },
  { id: 't6',  customerId: 'c-goldbeans', type: 'sale',    date: '2026-09-16', productId: 'p-14oz-pet', qty: 5000, amount: 18500, invoiced: true,  payment: 'vadeli', invoiceNo: '2026/0457' },
  // Tuincoffee
  { id: 't7',  customerId: 'c-tuin', type: 'sale',    date: '2026-08-30', productId: 'p-14oz-pet', qty: 3000, amount: 11100, invoiced: true, payment: 'vadeli' },
  { id: 't8',  customerId: 'c-tuin', type: 'sale',    date: '2026-09-02', productId: 'p-8oz-karton', qty: 1000, amount: 3100, invoiced: true, payment: 'vadeli' },
  { id: 't9',  customerId: 'c-tuin', type: 'payment', date: '2026-09-16', amount: 5450, method: 'nakit' },
  { id: 't9b', customerId: 'c-tuin', type: 'visit',   date: '2026-09-16', note: 'Tahsilat alındı, kalan bakiye hatırlatıldı.' },
  // Argusto
  { id: 't10', customerId: 'c-argusto', type: 'sale',    date: '2026-08-25', productId: 'p-14oz-pet', qty: 2500, amount: 9250, invoiced: true, payment: 'pesin' },
  { id: 't11', customerId: 'c-argusto', type: 'payment', date: '2026-08-25', amount: 9250, method: 'kart' },
  { id: 't12', customerId: 'c-argusto', type: 'sale',    date: '2026-09-08', productId: 'p-14oz-dw',  qty: 1000, amount: 6000, invoiced: true, payment: 'pesin' },
  { id: 't13', customerId: 'c-argusto', type: 'payment', date: '2026-09-08', amount: 6000, method: 'nakit' },
  { id: 't13b', customerId: 'c-argusto', type: 'visit',  date: '2026-09-08', note: 'Teslimat yapıldı.' },
  // Vento
  { id: 't14', customerId: 'c-vento', type: 'sale',    date: '2026-09-04', productId: 'p-16oz-pet', qty: 1500, amount: 6150, invoiced: false, payment: 'kismi' },
  { id: 't15', customerId: 'c-vento', type: 'sale',    date: '2026-09-04', productId: 'p-14oz-dw',  qty: 500,  amount: 3000, invoiced: false, payment: 'kismi' },
  { id: 't16', customerId: 'c-vento', type: 'payment', date: '2026-09-04', amount: 5950, method: 'nakit' },
  { id: 't16b', customerId: 'c-vento', type: 'visit',  date: '2026-09-04', note: 'Kısmi ödeme alındı.' },
  // Tahirler
  { id: 't17', customerId: 'c-tahirler', type: 'sale',    date: '2026-09-10', productId: 'p-14oz-pet', qty: 1000, amount: 3700, invoiced: true, payment: 'pesin' },
  { id: 't18', customerId: 'c-tahirler', type: 'payment', date: '2026-09-10', amount: 3700, method: 'banka' },
  { id: 't18b', customerId: 'c-tahirler', type: 'visit',  date: '2026-09-10', note: 'Numune bırakıldı.' },
  // Yamanoğlu
  { id: 't19', customerId: 'c-yamanoglu', type: 'sale',    date: '2026-08-28', productId: 'p-7oz-karton', qty: 2000, amount: 5800, invoiced: true, payment: 'vadeli' },
  { id: 't20', customerId: 'c-yamanoglu', type: 'payment', date: '2026-09-02', amount: 200, method: 'nakit' },
  { id: 't20b', customerId: 'c-yamanoglu', type: 'visit',  date: '2026-09-02', note: 'Ofis ziyareti.' },
];

// Müşterideki emanet / depodaki müşteriye ait mallar (rezerve)
export const seedReserved = [
  { customerId: 'c-goldbeans', productId: 'p-14oz-pet', qty: 5000 },
  { customerId: 'c-tuin',      productId: 'p-8oz-karton', qty: 1000 },
];

export const seedCash = { nakit: 21450, banka: 32800, kart: 8100 };

// Kasa hareketleri (gider/gelir). type: 'in' | 'out'
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

export const seedSettings = {
  userName: 'Barış Kandemir',
  userEmail: 'baris@greencup.com.tr',
  company: 'GreenCup Promosyon',
  kdv: 20,
  overdueDays: 30, // bu kadar gün ödeme gelmezse "gecikmiş"
};

export const makeSeed = () => ({
  version: 1,
  products: seedProducts,
  customers: seedCustomers,
  transactions: seedTransactions,
  reserved: seedReserved,
  cash: seedCash,
  cashMoves: seedCashMoves,
  expenses: seedExpenses,
  settings: seedSettings,
});

/** Boş başlangıç: hiç müşteri/ürün/hareket yok, kasa sıfır. Ayarlar korunur. */
export const makeEmpty = (settings = seedSettings) => ({
  version: 1,
  products: [],
  customers: [],
  transactions: [],
  reserved: [],
  cash: { nakit: 0, banka: 0, kart: 0 },
  cashMoves: [],
  expenses: [],
  settings,
});
