import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { makeSeed } from './seed';
import { loadState, saveState, clearState } from './storage';
import { uid, today } from '../utils/format';

const StoreCtx = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_CUSTOMER': {
      const c = { id: uid(), color: '#0E6B3F', ...action.customer };
      return { ...state, customers: [c, ...state.customers] };
    }
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) };

    case 'ADD_TRANSACTION': {
      const t = { id: uid(), date: today(), ...action.tx };
      let next = { ...state, transactions: [t, ...state.transactions] };

      if (t.type === 'sale' && t.productId) {
        // Stoktan düş (rezerveden karşılanıyorsa rezerveyi düş)
        next.products = next.products.map((p) =>
          p.id === t.productId ? { ...p, stock: Math.max(0, p.stock - t.qty) } : p
        );
        if (t.payment === 'pesin' || t.payment === 'kismi') {
          const paid = t.payment === 'pesin' ? t.amount : t.paidNow || 0;
          if (paid > 0) {
            const pay = { id: uid(), customerId: t.customerId, type: 'payment', date: t.date, amount: paid, method: t.method || 'nakit' };
            next.transactions = [pay, ...next.transactions];
            next = applyCashIn(next, pay.method, paid, 'Tahsilat');
          }
        }
      }
      if (t.type === 'payment') next = applyCashIn(next, t.method || 'nakit', t.amount, 'Tahsilat');
      return next;
    }

    case 'PAY_EXPENSE': {
      const e = state.expenses.find((x) => x.id === action.id);
      if (!e || e.paid) return state;
      let next = { ...state, expenses: state.expenses.map((x) => (x.id === action.id ? { ...x, paid: true, paidAt: today() } : x)) };
      const acc = action.account || 'banka';
      next = { ...next, cash: { ...next.cash, [acc]: next.cash[acc] - e.amount },
        cashMoves: [{ id: uid(), date: today(), type: 'out', amount: e.amount, title: e.title, account: acc }, ...next.cashMoves] };
      return next;
    }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [{ id: uid(), paid: false, ...action.expense }, ...state.expenses] };

    case 'ADD_CASH_MOVE': {
      const m = { id: uid(), date: today(), ...action.move };
      const delta = m.type === 'in' ? m.amount : -m.amount;
      return { ...state, cash: { ...state.cash, [m.account]: state.cash[m.account] + delta }, cashMoves: [m, ...state.cashMoves] };
    }

    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, { id: uid(), unit: 'adet', reserved: 0, ...action.product }] };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'REPLACE':
      return action.state && typeof action.state === 'object' ? action.state : state;
    case 'RESET':
      return makeSeed();
    default:
      return state;
  }
}

function applyCashIn(state, account, amount, title) {
  return {
    ...state,
    cash: { ...state.cash, [account]: (state.cash[account] || 0) + amount },
    cashMoves: [{ id: uid(), date: today(), type: 'in', amount, title, account }, ...state.cashMoves],
  };
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() || makeSeed());
  useEffect(() => { saveState(state); }, [state]);

  // Eylem fonksiyonları sabittir (dispatch değişmez); sadece state değişir.
  const actions = useMemo(() => ({
    dispatch,
    addCustomer: (customer) => dispatch({ type: 'ADD_CUSTOMER', customer }),
    updateCustomer: (id, patch) => dispatch({ type: 'UPDATE_CUSTOMER', id, patch }),
    addTransaction: (tx) => dispatch({ type: 'ADD_TRANSACTION', tx }),
    payExpense: (id, account) => dispatch({ type: 'PAY_EXPENSE', id, account }),
    addExpense: (expense) => dispatch({ type: 'ADD_EXPENSE', expense }),
    addCashMove: (move) => dispatch({ type: 'ADD_CASH_MOVE', move }),
    updateProduct: (id, patch) => dispatch({ type: 'UPDATE_PRODUCT', id, patch }),
    addProduct: (product) => dispatch({ type: 'ADD_PRODUCT', product }),
    updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
    reset: () => { clearState(); dispatch({ type: 'RESET' }); },
    replaceState: (state) => dispatch({ type: 'REPLACE', state }),
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
