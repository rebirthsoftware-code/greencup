import { daysBetween, today } from '../utils/format';

const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);

/** Müşteriye ait tüm türetilmiş bilgiler (bakiye, durum, ürünler...) */
export function customerSummary(state, customer) {
  const txs = state.transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const totalDebt = sum(txs.filter((t) => t.type === 'sale'), (t) => t.amount);
  const totalPaid = sum(txs.filter((t) => t.type === 'payment'), (t) => t.amount);
  const balance = totalDebt - totalPaid; // + => müşteri bize borçlu, - => bizim borcumuz

  const lastPayment = txs.find((t) => t.type === 'payment');
  const lastVisit = txs.find((t) => t.type === 'visit');
  const lastSale = txs.find((t) => t.type === 'sale');

  // Durum: bakiye yoksa aktif; ödeme belirlenen gün sayısından uzun süredir gelmemişse gecikmiş; aksi takipte
  let status = 'aktif';
  if (balance > 0) {
    const ref = lastPayment?.date || lastSale?.date;
    const days = ref ? daysBetween(ref, today()) : 0;
    status = days >= state.settings.overdueDays || balance >= 20000 ? 'gecikmis' : 'takipte';
  } else if (balance < 0) {
    status = 'takipte';
  }

  // Müşterideki ürünler (toplam verilen)
  const productsMap = {};
  for (const t of txs) if (t.type === 'sale' && t.productId) productsMap[t.productId] = (productsMap[t.productId] || 0) + t.qty;
  const products = Object.entries(productsMap).map(([productId, qty]) => ({
    productId, qty, name: state.products.find((p) => p.id === productId)?.name || productId,
  }));

  const reserved = state.reserved.filter((r) => r.customerId === customer.id).map((r) => ({
    ...r, name: state.products.find((p) => p.id === r.productId)?.name || r.productId,
  }));

  return { customer, txs, totalDebt, totalPaid, balance, status, lastPayment, lastVisit, lastSale, products, reserved };
}

export function allSummaries(state) {
  return state.customers.map((c) => customerSummary(state, c));
}

export function dashboard(state) {
  const sums = allSummaries(state);
  const receivable = sum(sums.filter((s) => s.balance > 0), (s) => s.balance);
  const payable = sum(sums.filter((s) => s.balance < 0), (s) => -s.balance);
  const cashTotal = sum(Object.values(state.cash));
  const overdue = sums.filter((s) => s.status === 'gecikmis');
  const t = today();
  const deliveriesToday = state.transactions.filter((x) => x.type === 'sale' && x.date === t);
  const notVisited = sums.filter((s) => !s.lastVisit || daysBetween(s.lastVisit.date, t) >= 14);
  const expensesDue = state.expenses.filter((e) => !e.paid && daysBetween(t, e.due) <= 3);
  return { sums, receivable, payable, cashTotal, overdue, deliveriesToday, notVisited, expensesDue };
}

export function todayCashMoves(state) {
  const t = today();
  const moves = state.cashMoves.filter((m) => m.date === t);
  const net = sum(moves, (m) => (m.type === 'in' ? m.amount : -m.amount));
  return { moves, net };
}

export const STATUS_LABEL = { gecikmis: 'Gecikmiş', takipte: 'Takipte', aktif: 'Aktif' };
export const PAYMENT_LABEL = { vadeli: 'Vadeli', pesin: 'Peşin', kismi: 'Kısmi' };
export const METHOD_LABEL = { nakit: 'Nakit', banka: 'Havale', kart: 'Kart' };
