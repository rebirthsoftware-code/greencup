import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { makeSeed, makeEmpty, normalizeState } from './seed';
import { loadState, saveState, clearState, loadDevice } from './storage';
import { uid, today } from '../utils/format';

const StoreCtx = createContext(null);

const now = () => new Date().toISOString();
const by = () => loadDevice().userName || undefined;
const stamp = (obj) => ({ ...obj, updatedAt: now() });

/* ---- yardımcılar: yan etkiler ---- */
const cashIn = (state, account, amount, title, txId) => ({
  ...state,
  cash: { ...state.cash, [account]: (state.cash[account] || 0) + amount },
  cashMoves: [{ id: uid(), date: today(), type: 'in', amount, title, account, txId }, ...state.cashMoves],
});
const cashOut = (state, account, amount, title, ref) => ({
  ...state,
  cash: { ...state.cash, [account]: (state.cash[account] || 0) - amount },
  cashMoves: [{ id: uid(), date: today(), type: 'out', amount, title, account, ...ref }, ...state.cashMoves],
});
/** Bir hareketin kasa etkisini geri alır (bağlı kasa hareketlerini siler). */
const undoCash = (state, txId, legacy) => {
  let linked = state.cashMoves.filter((m) => m.txId === txId);
  if (linked.length === 0 && legacy) { // eski sürümde bağ kurulmamış: tarih+tutar+hesap ile eşleşen ilk hareketi bul
    const m = state.cashMoves.find((x) => !x.txId && x.type === legacy.type && x.amount === legacy.amount && x.account === legacy.account && x.title === legacy.title);
    if (m) linked = [m];
  }
  if (linked.length === 0) return state;
  const cash = { ...state.cash };
  const ids = new Set(linked.map((m) => m.id));
  for (const m of linked) cash[m.account] = (cash[m.account] || 0) - (m.type === 'in' ? m.amount : -m.amount);
  const at = now();
  return { ...state, cash, cashMoves: state.cashMoves.filter((m) => !ids.has(m.id)), tombstones: [...state.tombstones, ...linked.map((m) => ({ id: m.id, at }))] };
};
const adjustStock = (products, items, sign) => {
  if (!items?.length) return products;
  return products.map((p) => {
    const it = items.filter((i) => i.productId === p.id);
    if (it.length === 0) return p;
    const d = it.reduce((a, i) => a + i.qty, 0) * sign;
    return { ...p, stock: Math.max(0, (p.stock || 0) + d) };
  });
};
const tomb = (state, id) => ({ ...state, tombstones: [...state.tombstones, { id, at: now() }] });

/** Satış eklendiğinde yan etkiler: stok düşer, peşin/kısmi ödeme kasaya girer. */
function applySale(state, t) {
  let next = { ...state, products: adjustStock(state.products, t.items, -1) };
  const paid = t.payment === 'pesin' ? t.amount : t.payment === 'kismi' ? (t.paidNow || 0) : 0;
  if (paid > 0) {
    const pay = { id: uid(), customerId: t.customerId, type: 'payment', date: t.date, amount: paid, method: t.method || 'nakit', saleId: t.id, by: t.by, createdAt: t.createdAt };
    next = { ...next, transactions: [pay, ...next.transactions] };
    next = cashIn(next, pay.method, paid, 'Tahsilat', pay.id);
  }
  return next;
}
function undoTx(state, t) {
  let next = state;
  if (t.type === 'sale') next = { ...next, products: adjustStock(next.products, t.items, +1) };
  if (t.type === 'payment') next = undoCash(next, t.id, { type: 'in', amount: t.amount, account: t.method || 'nakit', title: 'Tahsilat' });
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    /* ---- müşteri ---- */
    case 'ADD_CUSTOMER':
      return { ...state, customers: [stamp({ id: uid(), color: '#0E6B3F', createdAt: now(), ...action.customer }), ...state.customers] };
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map((c) => (c.id === action.id ? stamp({ ...c, ...action.patch }) : c)) };
    case 'DELETE_CUSTOMER': {
      let next = state;
      const ids = [];
      for (const t of state.transactions) if (t.customerId === action.id) { next = undoTx(next, t); ids.push(t.id); }
      for (const r of state.reserved) if (r.customerId === action.id) ids.push(r.id);
      for (const v of state.plannedVisits) if (v.customerId === action.id) ids.push(v.id);
      next = {
        ...next,
        customers: next.customers.filter((c) => c.id !== action.id),
        transactions: next.transactions.filter((t) => t.customerId !== action.id),
        reserved: next.reserved.filter((r) => r.customerId !== action.id),
        plannedVisits: next.plannedVisits.filter((v) => v.customerId !== action.id),
      };
      for (const id of [action.id, ...ids]) next = tomb(next, id);
      return next;
    }

    /* ---- hareket ---- */
    case 'ADD_TRANSACTION': {
      const t = { id: uid(), date: today(), by: by(), createdAt: now(), ...action.tx };
      let next = { ...state, transactions: [t, ...state.transactions] };
      if (t.type === 'sale') {
        if (t.invoiced && !t.invoiceNo) {
          t.invoiceNo = `${t.date.slice(0, 4)}/${String(state.settings.invoiceSeq || 1).padStart(4, '0')}`;
          next = { ...next, settings: { ...next.settings, invoiceSeq: (state.settings.invoiceSeq || 1) + 1 } };
        }
        next = applySale(next, t);
      }
      if (t.type === 'payment') next = cashIn(next, t.method || 'nakit', t.amount, 'Tahsilat', t.id);
      if (t.type === 'visit' && action.planId) {
        next = { ...next, plannedVisits: next.plannedVisits.map((v) => (v.id === action.planId ? stamp({ ...v, done: true, txId: t.id }) : v)) };
      }
      return next;
    }
    case 'UPDATE_TRANSACTION': {
      const old = state.transactions.find((t) => t.id === action.id);
      if (!old) return state;
      let next = undoTx(state, old);
      const t = stamp({ ...old, ...action.patch });
      next = { ...next, transactions: next.transactions.map((x) => (x.id === action.id ? t : x)) };
      if (t.type === 'sale') {
        next = { ...next, products: adjustStock(next.products, t.items, -1) };
        // Peşin satışta otomatik oluşturulan tahsilat satışla birlikte güncellenir; vadeliye dönerse kaldırılır
        const linked = next.transactions.find((x) => x.type === 'payment' && x.saleId === t.id);
        if (linked && t.payment === 'pesin' && linked.amount !== t.amount) {
          next = undoCash(next, linked.id, { type: 'in', amount: linked.amount, account: linked.method || 'nakit', title: 'Tahsilat' });
          const upd = stamp({ ...linked, amount: t.amount, date: t.date });
          next = { ...next, transactions: next.transactions.map((x) => (x.id === linked.id ? upd : x)) };
          next = cashIn(next, upd.method || 'nakit', upd.amount, 'Tahsilat', upd.id);
        } else if (linked && t.payment === 'vadeli') {
          next = undoCash(next, linked.id, { type: 'in', amount: linked.amount, account: linked.method || 'nakit', title: 'Tahsilat' });
          next = tomb({ ...next, transactions: next.transactions.filter((x) => x.id !== linked.id) }, linked.id);
        }
      }
      if (t.type === 'payment') next = cashIn(next, t.method || 'nakit', t.amount, 'Tahsilat', t.id);
      return next;
    }
    case 'SET_ATTACHMENTS': // yan etkisiz: yalnızca ek listesi
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.id ? stamp({ ...t, attachments: action.attachments }) : t)) };
    case 'SET_EXPENSE_ATTACHMENTS':
      return { ...state, expenses: state.expenses.map((e) => (e.id === action.id ? stamp({ ...e, attachments: action.attachments }) : e)) };
    case 'DELETE_TRANSACTION': {
      const old = state.transactions.find((t) => t.id === action.id);
      if (!old) return state;
      let next = undoTx(state, old);
      next = { ...next, transactions: next.transactions.filter((t) => t.id !== action.id) };
      next = tomb(next, action.id);
      if (old.type === 'sale') { // satışla birlikte oluşan otomatik tahsilat(lar) da gider
        for (const p of state.transactions.filter((x) => x.type === 'payment' && x.saleId === old.id)) {
          next = undoCash(next, p.id, { type: 'in', amount: p.amount, account: p.method || 'nakit', title: 'Tahsilat' });
          next = tomb({ ...next, transactions: next.transactions.filter((x) => x.id !== p.id) }, p.id);
        }
      }
      return next;
    }

    /* ---- rezerve (depoda müşteriye ait mal) ---- */
    case 'ADD_RESERVED':
      return { ...state, reserved: [stamp({ id: uid(), createdAt: now(), ...action.entry }), ...state.reserved] };
    case 'UPDATE_RESERVED':
      return { ...state, reserved: state.reserved.map((r) => (r.id === action.id ? stamp({ ...r, ...action.patch }) : r)) };
    case 'DELETE_RESERVED':
      return tomb({ ...state, reserved: state.reserved.filter((r) => r.id !== action.id) }, action.id);
    case 'DELIVER_RESERVED': {
      // Rezervden teslim: rezerve düşer, stok düşer, müşteriye "rezerveden teslim" hareketi yazılır (bedeli daha önce alınmış)
      const r = state.reserved.find((x) => x.id === action.id);
      if (!r) return state;
      const qty = Math.min(action.qty, r.qty);
      const p = state.products.find((x) => x.id === r.productId);
      const t = { id: uid(), customerId: r.customerId, type: 'sale', date: today(), by: by(), createdAt: now(), fromReserve: true,
        items: [{ productId: r.productId, name: p?.name || r.productId, unit: p?.unit || 'adet', qty, unitPrice: 0, amount: 0 }],
        amount: 0, invoiced: false, payment: 'pesin', note: action.note || 'Rezerveden teslim' };
      let next = { ...state, transactions: [t, ...state.transactions], products: adjustStock(state.products, t.items, -1) };
      const left = r.qty - qty;
      next = left > 0
        ? { ...next, reserved: next.reserved.map((x) => (x.id === r.id ? stamp({ ...x, qty: left }) : x)) }
        : tomb({ ...next, reserved: next.reserved.filter((x) => x.id !== r.id) }, r.id);
      return next;
    }

    /* ---- giderler ---- */
    case 'ADD_EXPENSE':
      return { ...state, expenses: [stamp({ id: uid(), paid: false, createdAt: now(), ...action.expense }), ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: state.expenses.map((e) => (e.id === action.id ? stamp({ ...e, ...action.patch }) : e)) };
    case 'DELETE_EXPENSE': {
      const e = state.expenses.find((x) => x.id === action.id);
      if (!e) return state;
      let next = e.paid ? undoCash(state, e.id, { type: 'out', amount: e.amount, account: e.account || 'banka', title: e.title }) : state;
      next = { ...next, expenses: next.expenses.filter((x) => x.id !== action.id) };
      return tomb(next, action.id);
    }
    case 'PAY_EXPENSE': {
      const e = state.expenses.find((x) => x.id === action.id);
      if (!e || e.paid) return state;
      const acc = action.account || 'banka';
      let next = { ...state, expenses: state.expenses.map((x) => (x.id === action.id ? stamp({ ...x, paid: true, paidAt: today(), account: acc }) : x)) };
      return cashOut(next, acc, e.amount, e.title, { txId: e.id });
    }
    case 'UNPAY_EXPENSE': {
      const e = state.expenses.find((x) => x.id === action.id);
      if (!e || !e.paid) return state;
      const next = undoCash(state, e.id, { type: 'out', amount: e.amount, account: e.account || 'banka', title: e.title });
      return { ...next, expenses: next.expenses.map((x) => (x.id === action.id ? stamp({ ...x, paid: false, paidAt: undefined, account: undefined }) : x)) };
    }

    /* ---- kasa ---- */
    case 'ADD_CASH_MOVE': {
      const m = { id: uid(), date: today(), by: by(), createdAt: now(), ...action.move };
      const delta = m.type === 'in' ? m.amount : -m.amount;
      return { ...state, cash: { ...state.cash, [m.account]: (state.cash[m.account] || 0) + delta }, cashMoves: [m, ...state.cashMoves] };
    }
    case 'DELETE_CASH_MOVE': {
      const m = state.cashMoves.find((x) => x.id === action.id);
      if (!m) return state;
      const delta = m.type === 'in' ? -m.amount : m.amount;
      let next = { ...state, cash: { ...state.cash, [m.account]: (state.cash[m.account] || 0) + delta }, cashMoves: state.cashMoves.filter((x) => x.id !== action.id) };
      if (m.transferId) { // transferin diğer ayağını da sil
        const other = next.cashMoves.find((x) => x.transferId === m.transferId);
        if (other) {
          const d2 = other.type === 'in' ? -other.amount : other.amount;
          next = { ...next, cash: { ...next.cash, [other.account]: (next.cash[other.account] || 0) + d2 }, cashMoves: next.cashMoves.filter((x) => x.id !== other.id) };
          next = tomb(next, other.id);
        }
      }
      return tomb(next, action.id);
    }
    case 'TRANSFER_CASH': {
      const { from, to, amount, note } = action;
      if (!amount || from === to) return state;
      const transferId = uid(); const date = today(); const created = now();
      const label = { nakit: 'Nakit', banka: 'Banka', kart: 'Kart' };
      return {
        ...state,
        cash: { ...state.cash, [from]: (state.cash[from] || 0) - amount, [to]: (state.cash[to] || 0) + amount },
        cashMoves: [
          { id: uid(), date, type: 'in',  amount, title: note || `Transfer: ${label[from]} → ${label[to]}`, account: to,   transferId, createdAt: created },
          { id: uid(), date, type: 'out', amount, title: note || `Transfer: ${label[from]} → ${label[to]}`, account: from, transferId, createdAt: created },
          ...state.cashMoves,
        ],
      };
    }

    /* ---- ürünler ---- */
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => (p.id === action.id ? stamp({ ...p, ...action.patch }) : p)) };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, stamp({ id: uid(), unit: 'adet', stock: 0, price: 0, createdAt: now(), ...action.product })] };
    case 'DELETE_PRODUCT':
      return tomb({ ...state, products: state.products.filter((p) => p.id !== action.id) }, action.id);

    /* ---- ziyaret planı ---- */
    case 'ADD_PLANNED_VISIT':
      return { ...state, plannedVisits: [stamp({ id: uid(), done: false, createdAt: now(), ...action.visit }), ...state.plannedVisits] };
    case 'UPDATE_PLANNED_VISIT':
      return { ...state, plannedVisits: state.plannedVisits.map((v) => (v.id === action.id ? stamp({ ...v, ...action.patch }) : v)) };
    case 'DELETE_PLANNED_VISIT':
      return tomb({ ...state, plannedVisits: state.plannedVisits.filter((v) => v.id !== action.id) }, action.id);

    /* ---- kullanıcılar ---- */
    case 'ADD_USER':
      return { ...state, users: [...state.users, stamp({ id: uid(), role: 'Kullanıcı', createdAt: now(), ...action.user })] };
    case 'UPDATE_USER':
      return { ...state, users: state.users.map((u) => (u.id === action.id ? stamp({ ...u, ...action.patch }) : u)) };
    case 'DELETE_USER':
      return state.users.length <= 1 ? state : tomb({ ...state, users: state.users.filter((u) => u.id !== action.id) }, action.id);

    /* ---- genel ---- */
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch, updatedAt: now() } };
    case 'REPLACE':
      return action.state && typeof action.state === 'object' ? action.state : state;
    case 'RESET':
      return makeSeed();
    case 'CLEAR':
      return makeEmpty(state.settings, state.users);
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => normalizeState(loadState()) || makeSeed());
  useEffect(() => { saveState(state); }, [state]);

  // Eylem fonksiyonları sabittir (dispatch değişmez); sadece state değişir.
  const actions = useMemo(() => ({
    dispatch,
    addCustomer: (customer) => dispatch({ type: 'ADD_CUSTOMER', customer }),
    updateCustomer: (id, patch) => dispatch({ type: 'UPDATE_CUSTOMER', id, patch }),
    deleteCustomer: (id) => dispatch({ type: 'DELETE_CUSTOMER', id }),
    addTransaction: (tx, planId) => dispatch({ type: 'ADD_TRANSACTION', tx, planId }),
    updateTransaction: (id, patch) => dispatch({ type: 'UPDATE_TRANSACTION', id, patch }),
    deleteTransaction: (id) => dispatch({ type: 'DELETE_TRANSACTION', id }),
    setAttachments: (id, attachments) => dispatch({ type: 'SET_ATTACHMENTS', id, attachments }),
    setExpenseAttachments: (id, attachments) => dispatch({ type: 'SET_EXPENSE_ATTACHMENTS', id, attachments }),
    addReserved: (entry) => dispatch({ type: 'ADD_RESERVED', entry }),
    updateReserved: (id, patch) => dispatch({ type: 'UPDATE_RESERVED', id, patch }),
    deleteReserved: (id) => dispatch({ type: 'DELETE_RESERVED', id }),
    deliverReserved: (id, qty, note) => dispatch({ type: 'DELIVER_RESERVED', id, qty, note }),
    addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', expense }),
    updateExpense: (id, patch) => dispatch({ type: 'UPDATE_EXPENSE', id, patch }),
    deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', id }),
    payExpense: (id, account) => dispatch({ type: 'PAY_EXPENSE', id, account }),
    unpayExpense: (id) => dispatch({ type: 'UNPAY_EXPENSE', id }),
    addCashMove: (move) => dispatch({ type: 'ADD_CASH_MOVE', move }),
    deleteCashMove: (id) => dispatch({ type: 'DELETE_CASH_MOVE', id }),
    transferCash: (from, to, amount, note) => dispatch({ type: 'TRANSFER_CASH', from, to, amount, note }),
    updateProduct: (id, patch) => dispatch({ type: 'UPDATE_PRODUCT', id, patch }),
    addProduct: (product) => dispatch({ type: 'ADD_PRODUCT', product }),
    deleteProduct: (id) => dispatch({ type: 'DELETE_PRODUCT', id }),
    addPlannedVisit: (visit) => dispatch({ type: 'ADD_PLANNED_VISIT', visit }),
    updatePlannedVisit: (id, patch) => dispatch({ type: 'UPDATE_PLANNED_VISIT', id, patch }),
    deletePlannedVisit: (id) => dispatch({ type: 'DELETE_PLANNED_VISIT', id }),
    addUser: (user) => dispatch({ type: 'ADD_USER', user }),
    updateUser: (id, patch) => dispatch({ type: 'UPDATE_USER', id, patch }),
    deleteUser: (id) => dispatch({ type: 'DELETE_USER', id }),
    updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
    reset: () => { clearState(); dispatch({ type: 'RESET' }); },
    replaceState: (state) => dispatch({ type: 'REPLACE', state }),
    clearAll: () => dispatch({ type: 'CLEAR' }),
  }), []);
  const api = useMemo(() => ({ state, ...actions }), [state, actions]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore, StoreProvider içinde kullanılmalı');
  return ctx;
};
