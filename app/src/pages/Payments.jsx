import { useState } from 'react';
import { useStore } from '../store/store';
import { accountName, expensePayments, expensePaid, expenseRemaining } from '../store/selectors';
import { sortedAccounts } from '../store/accounts';
import { fmtMoney, fmtDayMonth, fmtDate, daysBetween, today, parseMoney, toInput, formatMoneyInput } from '../utils/format';
import { PageHeader, Sheet, Empty, DateField, DangerButton, useToast, Tabs, MoneyInput, AccountSelect } from '../components/ui';
import * as Ic from '../components/Icons';
import Attachments from '../components/Attachments';

export default function Payments() {
  const { state, payExpense, unpayExpense, deleteExpensePayment, addExpense, updateExpense, deleteExpense, setExpenseAttachments } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState(null);     // seçili gider (detay/düzenle) | { ...e, paying: true }
  const accounts = sortedAccounts(state);
  const [account, setAccount] = useState(() => (accounts.find((a) => a.id === 'banka') || accounts[0])?.id || 'banka');
  const [payAmount, setPayAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', amount: '', due: today() });

  const t = today();
  const live = (e) => state.expenses.find((x) => x.id === e.id) || e; // güncel kayıt
  const upcoming = state.expenses.filter((e) => !e.paid).sort((a, b) => (a.due < b.due ? -1 : 1));
  const past = state.expenses.filter((e) => e.paid).sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  const total = upcoming.reduce((a, e) => a + expenseRemaining(e), 0);

  const open = (e) => { setSel(e); setF({ title: e.title, amount: toInput(e.amount), due: e.due }); };
  const openPay = (e) => { setPayAmount(formatMoneyInput(toInput(expenseRemaining(e)))); setSel({ ...e, paying: true }); };
  const saveNew = () => {
    const amount = parseMoney(f.amount);
    if (!f.title.trim()) return toast('Başlık girin (örn. Kira)');
    if (!(amount > 0)) return toast('Tutar girin');
    addExpense({ title: f.title.trim(), amount, due: f.due }); toast('Ödeme eklendi'); setAdding(false); setF({ title: '', amount: '', due: t });
  };
  const saveEdit = () => {
    const amount = parseMoney(f.amount);
    if (!f.title.trim()) return toast('Başlık girin');
    if (!(amount > 0)) return toast('Tutar girin');
    if (amount < expensePaid(sel)) return toast(`Tutar ödenenden (${fmtMoney(expensePaid(sel))}) küçük olamaz`);
    updateExpense(sel.id, { title: f.title.trim(), amount, due: f.due, paid: amount - expensePaid(sel) <= 0.005 }); toast('Güncellendi'); setSel(null);
  };
  const doPay = () => {
    const e = live(sel); const remaining = expenseRemaining(e); const amount = parseMoney(payAmount);
    if (!(amount > 0)) return toast('Ödenen tutarı girin');
    if (amount > remaining + 0.005) return toast(`Kalan ${fmtMoney(remaining)}; daha fazlası ödenemez`);
    payExpense(e.id, account, amount);
    const left = Math.round((remaining - amount) * 100) / 100;
    toast(left > 0.005 ? `${fmtMoney(amount)} ödendi, kalan ${fmtMoney(left)}` : `${e.title} tamamen ödendi`);
    setSel(null);
  };
  const payN = parseMoney(payAmount);
  const selLive = sel ? live(sel) : null;
  const selRemaining = selLive ? expenseRemaining(selLive) : 0;

  return (
    <div className="page">
      <PageHeader title="Benim Ödemelerim" to="/daha" right={<button className="icon-btn" onClick={() => { setF({ title: '', amount: '', due: t }); setAdding(true); }} aria-label="Ekle"><Ic.Plus size={20} /></button>} />
      <Tabs value={tab} onChange={setTab} items={['Yaklaşan Ödemeler', 'Geçmiş']} />

      {tab === 0 && (
        <>
          <div className="list">
            {upcoming.map((e) => {
              const days = daysBetween(t, e.due);
              const color = days <= 0 ? 'red' : days <= 7 ? 'orange' : 'green';
              const paid = expensePaid(e);
              return (
                <div key={e.id} className="item" onClick={() => open(e)}>
                  <span className="dot" style={{ width: 12, height: 12, background: `var(--${color})` }} />
                  <div className="item-body">
                    <div className="item-title"><span style={{ color: `var(--${color})`, marginRight: 8 }}>{fmtDayMonth(e.due)}</span>{e.title}</div>
                    <div className="item-sub">{days < 0 ? `${-days} gün gecikti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}{paid > 0 ? ` · ${fmtMoney(paid)} ödendi / ${fmtMoney(e.amount)}` : ''}</div>
                    {paid > 0 && <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, (paid / e.amount) * 100)}%`, height: '100%', background: 'var(--green)' }} /></div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num">{fmtMoney(expenseRemaining(e))}</div>
                    {paid > 0 && <div className="xs muted">kalan</div>}
                    <button className="btn btn-sm btn-primary" style={{ marginTop: 6, boxShadow: 'none' }} onClick={(ev) => { ev.stopPropagation(); openPay(e); }}>Öde</button>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && <Empty>Yaklaşan ödeme yok.</Empty>}
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="bold">Toplam Kalan Ödeme</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>{fmtMoney(total)}</div>
          </div>
        </>
      )}

      {tab === 1 && (
        <div className="list">
          {past.map((e) => (
            <div key={e.id} className="item" onClick={() => open(e)}>
              <div className="tl-icon"><Ic.Check size={18} /></div>
              <div className="item-body"><div className="item-title">{e.title}</div><div className="item-sub">Ödendi: {fmtDate(e.paidAt)}{expensePayments(e).length > 1 ? ` · ${expensePayments(e).length} parça` : e.account ? ` · ${accountName(state, e.account)}` : ''}{e.attachments?.length ? ` · ${e.attachments.length} belge` : ''}</div></div>
              <span className="num">{fmtMoney(e.amount)}</span>
            </div>
          ))}
          {past.length === 0 && <Empty>Geçmiş ödeme yok.</Empty>}
        </div>
      )}

      {/* Öde (tam veya kısmi) */}
      <Sheet open={!!sel?.paying} onClose={() => setSel(null)} title={sel ? `${sel.title} · ${fmtMoney(sel.amount)}` : ''}>
        {selLive && (
          <>
            {expensePaid(selLive) > 0 && <div className="row pad" style={{ marginBottom: 4 }}><span className="muted">Şimdiye kadar ödenen</span><span className="num pos">{fmtMoney(expensePaid(selLive))}</span></div>}
            <div className="row pad"><span className="muted">Kalan</span><span className="num" style={{ fontSize: 17 }}>{fmtMoney(selRemaining)}</span></div>
            <div className="field" style={{ marginTop: 10 }}><label>Şimdi ödenen tutar</label>
              <div className="input"><span className="suffix">₺</span><MoneyInput value={payAmount} onChange={setPayAmount} /></div>
              <div className="chips" style={{ marginTop: 8, marginBottom: 0 }}>
                <button type="button" className={`chip ${Math.abs(payN - selRemaining) < 0.005 ? 'active' : ''}`} onClick={() => setPayAmount(formatMoneyInput(toInput(selRemaining)))}>Tamamı</button>
                <button type="button" className="chip" onClick={() => setPayAmount(formatMoneyInput(toInput(Math.round(selRemaining * 50) / 100)))}>Yarısı</button>
              </div>
              {payN > 0 && payN < selRemaining - 0.005 && <span className="xs muted" style={{ display: 'block', marginTop: 6 }}>Kısmi ödeme: kalan {fmtMoney(selRemaining - payN)} "Yaklaşan Ödemeler"de kalır.</span>}
              {payN > selRemaining + 0.005 && <span className="xs neg" style={{ display: 'block', marginTop: 6 }}>Kalandan fazla girdiniz.</span>}
            </div>
            <AccountSelect label="Hangi hesaptan?" value={account} onChange={setAccount} accounts={accounts} />
            <button className="btn btn-primary" onClick={doPay}>{payN > 0 && payN < selRemaining - 0.005 ? `${fmtMoney(payN)} Öde (kısmi)` : 'Tamamını Öde'}</button>
          </>
        )}
      </Sheet>

      {/* Düzenle / sil */}
      <Sheet open={!!sel && !sel.paying} onClose={() => setSel(null)} title="Ödemeyi Düzenle">
        <div className="field"><label>Başlık</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div></div>
        <div className="field"><label>Toplam Tutar</label><div className="input"><span className="suffix">₺</span><MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></div></div>
        <DateField label="Vade" value={f.due} onChange={(v) => setF({ ...f, due: v })} />
        {selLive && expensePayments(selLive).length > 0 && (
          <div className="field"><label>Yapılan ödemeler</label>
            {expensePayments(selLive).map((p) => (
              <div key={p.id} className="row pad small">
                <span><div className="bold">{fmtMoney(p.amount)}</div><div className="xs muted">{fmtDate(p.date)} · {accountName(state, p.account)}{p.by ? ` · ${p.by}` : ''}</div></span>
                {!p.legacy && <DangerButton message={`${fmtMoney(p.amount)} tutarlı ödeme geri alınsın mı? Kasaya iade edilir.`} onConfirm={() => { deleteExpensePayment(selLive.id, p.id); toast('Ödeme geri alındı'); }}><Ic.Trash size={14} /></DangerButton>}
              </div>
            ))}
            <div className="row pad small" style={{ borderTop: '2px solid var(--border)' }}><span className="bold">Kalan</span><span className="num">{fmtMoney(selRemaining)}</span></div>
          </div>
        )}
        {sel && <div className="field"><label>Fatura / Fiş</label><Attachments items={(state.expenses.find((x) => x.id === sel.id)?.attachments) || []} onChange={(list) => setExpenseAttachments(sel.id, list)} folder={`giderler/${sel.id}`} compact /></div>}
        <div className="stack">
          <div className="btn-row">
            <DangerButton className="btn btn-ghost" message="Ödeme kaydı silinsin mi? Yapılan ödemelerin kasa etkisi geri alınır." onConfirm={() => { deleteExpense(sel.id); toast('Silindi'); setSel(null); }}>Sil</DangerButton>
            <button className="btn btn-primary" onClick={saveEdit}>Kaydet</button>
          </div>
          {selLive && !selLive.paid && selRemaining > 0 && <button className="btn btn-outline" onClick={() => openPay(selLive)}>Ödeme Yap</button>}
          {selLive && expensePayments(selLive).length > 0 && <button className="btn btn-ghost" onClick={() => { unpayExpense(sel.id); toast('Tüm ödemeler geri alındı (kasaya iade)'); setSel(null); }}>Tüm ödemeleri geri al</button>}
        </div>
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Yeni Ödeme">
        <div className="field"><label>Başlık</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Örn: Kira" /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></div></div>
        <DateField label="Vade" value={f.due} onChange={(v) => setF({ ...f, due: v })} />
        <button className="btn btn-primary" onClick={saveNew}>Kaydet</button>
        {(!f.title.trim() || !(parseMoney(f.amount) > 0)) && <div className="xs" style={{ color: 'var(--orange)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>{!f.title.trim() ? 'Başlık girin' : 'Tutar girin'}</div>}
      </Sheet>
    </div>
  );
}
