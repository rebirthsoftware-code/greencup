import { daysBetween, today } from '../utils/format.js';

const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || '') > (a.createdAt || '') ? 1 : -1);

/** Satışın ürün satırları (eski tek ürünlü kayıtlar da desteklenir). */
export const txItems = (t) => (Array.isArray(t.items) ? t.items : t.productId ? [{ productId: t.productId, name: t.productName || t.productId, qty: t.qty || 0, unit: 'adet', amount: t.amount || 0 }] : []);
export const itemsLabel = (t) => txItems(t).map((i) => `${fmtQty(i.qty)} ${i.unit || 'adet'} ${i.name}`).join(', ');
const fmtQty = (n) => new Intl.NumberFormat('tr-TR').format(n || 0);

/**
 * Ödemeleri satışlara en eskiden başlayarak dağıtır (FIFO). Her satış için ödenen tutarı
 * ve açık kalan bakiyeyi verir; vadesi geçmiş açık satışlar "gecikmiş" sayılır.
 */
export function allocate(sales, payments) {
  let pool = sum(payments, (p) => p.amount);
  const out = [];
  for (const s of [...sales].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    const paid = Math.min(s.amount, pool); pool -= paid;
    out.push({ sale: s, paid, open: s.amount - paid });
  }
  return { allocations: out, credit: pool }; // credit: satışlardan fazla ödenen (bizim borcumuz)
}

/** Müşteriye ait tüm türetilmiş bilgiler (bakiye, durum, ürünler, vade...). */
export function customerSummary(state, customer) {
  const t0 = today();
  const txs = state.transactions.filter((t) => t.customerId === customer.id).sort(byDateDesc);
  const sales = txs.filter((t) => t.type === 'sale');
  const payments = txs.filter((t) => t.type === 'payment');

  const totalDebt = sum(sales, (t) => t.amount);
  const totalPaid = sum(payments, (t) => t.amount);
  const balance = totalDebt - totalPaid;

  const lastPayment = payments[0];
  const lastVisit = txs.find((t) => t.type === 'visit');
  const lastSale = sales[0];

  const { allocations } = allocate(sales, payments);
  const openSales = allocations.filter((a) => a.open > 0);
  const overdueSales = openSales.filter((a) => {
    const due = a.sale.dueDate || (a.sale.date && daysBetween(a.sale.date, t0) >= state.settings.overdueDays ? a.sale.date : null);
    return due && due < t0;
  });
  const nextDue = openSales.map((a) => a.sale.dueDate).filter(Boolean).sort()[0] || null;
  const overdueAmount = sum(overdueSales, (a) => a.open);

  let status = 'aktif';
  if (balance > 0) status = overdueSales.length > 0 ? 'gecikmis' : 'takipte';
  else if (balance < 0) status = 'takipte';

  // Müşteriye verilen ürünler (toplam)
  const productsMap = {};
  for (const s of sales) for (const i of txItems(s)) {
    const k = i.productId || i.name;
    productsMap[k] = productsMap[k] || { productId: i.productId, name: state.products.find((p) => p.id === i.productId)?.name || i.name, qty: 0, unit: i.unit || 'adet' };
    productsMap[k].qty += i.qty;
  }
  const products = Object.values(productsMap);

  const reserved = state.reserved.filter((r) => r.customerId === customer.id).map((r) => ({
    ...r, name: state.products.find((p) => p.id === r.productId)?.name || r.productId,
  }));
  const plannedVisits = state.plannedVisits.filter((v) => v.customerId === customer.id && !v.done).sort((a, b) => (a.date < b.date ? -1 : 1));

  return { customer, txs, totalDebt, totalPaid, balance, status, lastPayment, lastVisit, lastSale, products, reserved, allocations, openSales, overdueSales, overdueAmount, nextDue, plannedVisits };
}

export function allSummaries(state) {
  return state.customers.map((c) => customerSummary(state, c));
}

/** Ürün bazında rezerve toplamı (depoda müşterilere ait). */
export function reservedByProduct(state) {
  const m = {};
  for (const r of state.reserved) m[r.productId] = (m[r.productId] || 0) + r.qty;
  return m;
}

/** Bildirimler: geciken alacaklar, yaklaşan vadeler, yaklaşan giderler, bugünkü ziyaret planı, uzun süredir ziyaret edilmeyenler, düşük stok. */
export function notifications(state) {
  const t = today();
  const sums = allSummaries(state);
  const out = [];
  for (const s of sums) {
    if (s.overdueSales.length) out.push({ kind: 'overdue', level: 'red', customerId: s.customer.id, title: `${s.customer.name} ödemesi gecikti`, sub: `${s.overdueSales.length} açık satış`, amount: s.overdueAmount, sort: 0 });
    else if (s.nextDue && daysBetween(t, s.nextDue) <= 3) out.push({ kind: 'due', level: 'orange', customerId: s.customer.id, title: `${s.customer.name} vadesi yaklaşıyor`, sub: daysBetween(t, s.nextDue) === 0 ? 'Bugün' : `${daysBetween(t, s.nextDue)} gün kaldı`, amount: s.balance, sort: 1 });
  }
  for (const e of state.expenses) if (!e.paid && daysBetween(t, e.due) <= 3) {
    const d = daysBetween(t, e.due);
    out.push({ kind: 'expense', level: d < 0 ? 'red' : 'orange', title: `Ödeme: ${e.title}`, sub: d < 0 ? `${-d} gün gecikti` : d === 0 ? 'Bugün' : `${d} gün kaldı`, amount: e.amount, to: '/daha/odemeler', sort: d < 0 ? 0 : 1 });
  }
  for (const v of state.plannedVisits) if (!v.done && v.date <= t) {
    const c = state.customers.find((x) => x.id === v.customerId);
    if (c) out.push({ kind: 'visit', level: v.date < t ? 'orange' : 'green', customerId: c.id, title: `Ziyaret: ${c.name}`, sub: v.date < t ? 'Planlanan tarih geçti' : 'Bugün planlı', to: `/ziyaret/${c.id}`, sort: 2 });
  }
  for (const s of sums) if (!s.lastVisit || daysBetween(s.lastVisit.date, t) >= 30) out.push({ kind: 'novisit', level: 'green', customerId: s.customer.id, title: `${s.customer.name} uzun süredir ziyaret edilmedi`, sub: s.lastVisit ? `${daysBetween(s.lastVisit.date, t)} gün önce` : 'Hiç ziyaret yok', sort: 3 });
  const resv = reservedByProduct(state);
  for (const p of state.products) { const sellable = (p.stock || 0) - (resv[p.id] || 0); if (sellable <= (p.minStock ?? 0) && (p.minStock ?? 0) > 0) out.push({ kind: 'stock', level: 'orange', title: `Stok azaldı: ${p.name}`, sub: `Satılabilir ${fmtQty(sellable)} ${p.unit}`, to: '/stok', sort: 2 }); }
  return out.sort((a, b) => a.sort - b.sort);
}

export function dashboard(state) {
  const sums = allSummaries(state);
  const receivable = sum(sums.filter((s) => s.balance > 0), (s) => s.balance);
  const payable = sum(sums.filter((s) => s.balance < 0), (s) => -s.balance);
  const cashTotal = sum(Object.values(state.cash));
  const t = today();
  const overdue = sums.filter((s) => s.status === 'gecikmis');
  const dueSoon = sums.filter((s) => s.status === 'takipte' && s.nextDue && daysBetween(t, s.nextDue) <= 3);
  const notVisited = sums.filter((s) => !s.lastVisit || daysBetween(s.lastVisit.date, t) >= 14);
  const expensesDue = state.expenses.filter((e) => !e.paid && daysBetween(t, e.due) <= 3);
  const visitsToday = state.plannedVisits.filter((v) => !v.done && v.date <= t);
  return { sums, receivable, payable, cashTotal, overdue, dueSoon, notVisited, expensesDue, visitsToday };
}

export function todayCashMoves(state) {
  const t = today();
  const moves = state.cashMoves.filter((m) => m.date === t);
  const net = sum(moves, (m) => (m.type === 'in' ? m.amount : -m.amount));
  return { moves, net };
}

/** Aylık satış ve tahsilat toplamları (son n ay), raporlar için. */
export function monthlySeries(state, months = 6) {
  const out = [];
  const d = new Date(); d.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = m.toISOString().slice(0, 7);
    const tx = state.transactions.filter((t) => t.date?.startsWith(key));
    out.push({ key, label: m.toLocaleDateString('tr-TR', { month: 'short' }), sales: sum(tx.filter((t) => t.type === 'sale'), (t) => t.amount), payments: sum(tx.filter((t) => t.type === 'payment'), (t) => t.amount) });
  }
  return out;
}

export const STATUS_LABEL = { gecikmis: 'Gecikmiş', takipte: 'Takipte', aktif: 'Aktif' };
export const PAYMENT_LABEL = { vadeli: 'Vadeli', pesin: 'Peşin', kismi: 'Kısmi' };
export const METHOD_LABEL = { nakit: 'Nakit', banka: 'Havale', kart: 'Kart' };
export const ACCOUNT_LABEL = { nakit: 'Nakit', banka: 'Banka', kart: 'Kart' };
