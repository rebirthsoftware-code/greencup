import { useState } from 'react';
import { useStore } from '../store/store';
import { fmtMoney, fmtDayMonth, fmtDate, daysBetween, today } from '../utils/format';
import { PageHeader, Sheet, Segmented, Empty, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

export default function Payments() {
  const { state, payExpense, addExpense } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [paying, setPaying] = useState(null);
  const [account, setAccount] = useState('banka');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', amount: '', due: today() });

  const t = today();
  const upcoming = state.expenses.filter((e) => !e.paid).sort((a, b) => (a.due < b.due ? -1 : 1));
  const past = state.expenses.filter((e) => e.paid).sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  const total = upcoming.reduce((a, e) => a + e.amount, 0);

  const confirmPay = () => { payExpense(paying.id, account); toast(`${paying.title} ödendi`); setPaying(null); };
  const saveNew = () => {
    const amount = parseFloat(String(f.amount).replace(',', '.'));
    if (!f.title.trim() || !amount) return;
    addExpense({ title: f.title.trim(), amount, due: f.due }); toast('Ödeme eklendi'); setAdding(false); setF({ title: '', amount: '', due: t });
  };

  return (
    <div className="page">
      <PageHeader title="Benim Ödemelerim" to="/daha" right={<button className="icon-btn" onClick={() => setAdding(true)} aria-label="Ekle"><Ic.Plus size={20} /></button>} />
      <div className="tabs">
        <button className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>Yaklaşan Ödemeler</button>
        <button className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>Geçmiş</button>
      </div>

      {tab === 0 && (
        <>
          <div className="list">
            {upcoming.map((e) => {
              const days = daysBetween(t, e.due);
              const color = days <= 0 ? 'red' : days <= 7 ? 'orange' : 'green';
              return (
                <div key={e.id} className="item">
                  <span className="dot" style={{ width: 12, height: 12, background: `var(--${color})` }} />
                  <div className="item-body">
                    <div className="item-title"><span style={{ color: `var(--${color})`, marginRight: 8 }}>{fmtDayMonth(e.due)}</span>{e.title}</div>
                    <div className="item-sub">{days < 0 ? `${-days} gün gecikti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num">{fmtMoney(e.amount)}</div>
                    <button className="btn btn-sm btn-primary" style={{ marginTop: 6, boxShadow: 'none' }} onClick={() => setPaying(e)}>Öde</button>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && <Empty>Yaklaşan ödeme yok.</Empty>}
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="bold">Toplam Yaklaşan Ödeme</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>{fmtMoney(total)}</div>
          </div>
        </>
      )}

      {tab === 1 && (
        <div className="list">
          {past.map((e) => (
            <div key={e.id} className="item">
              <div className="tl-icon"><Ic.Check size={18} /></div>
              <div className="item-body"><div className="item-title">{e.title}</div><div className="item-sub">Ödendi: {fmtDate(e.paidAt)}</div></div>
              <span className="num">{fmtMoney(e.amount)}</span>
            </div>
          ))}
          {past.length === 0 && <Empty>Geçmiş ödeme yok.</Empty>}
        </div>
      )}

      <Sheet open={!!paying} onClose={() => setPaying(null)} title={paying ? `${paying.title} · ${fmtMoney(paying.amount)}` : ''}>
        <div className="field"><label>Hangi hesaptan?</label>
          <Segmented light value={account} onChange={setAccount} options={[{ value: 'nakit', label: 'Nakit' }, { value: 'banka', label: 'Banka' }, { value: 'kart', label: 'Kart' }]} /></div>
        <button className="btn btn-primary" onClick={confirmPay}>Ödendi Olarak İşaretle</button>
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Yeni Ödeme">
        <div className="field"><label>Başlık</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Örn: Kira" /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div></div>
        <div className="field"><label>Vade</label><div className="input"><input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></div></div>
        <button className="btn btn-primary" onClick={saveNew}>Kaydet</button>
      </Sheet>
    </div>
  );
}
