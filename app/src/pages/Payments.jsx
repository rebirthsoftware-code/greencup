import { useState } from 'react';
import { useStore } from '../store/store';
import { ACCOUNT_LABEL } from '../store/selectors';
import { fmtMoney, fmtDayMonth, fmtDate, daysBetween, today, parseMoney } from '../utils/format';
import { PageHeader, Sheet, Segmented, Empty, DateField, DangerButton, useToast, Tabs } from '../components/ui';
import * as Ic from '../components/Icons';
import Attachments from '../components/Attachments';

export default function Payments() {
  const { state, payExpense, unpayExpense, addExpense, updateExpense, deleteExpense, setExpenseAttachments } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState(null);     // seçili gider (detay/düzenle)
  const [account, setAccount] = useState('banka');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', amount: '', due: today() });

  const t = today();
  const upcoming = state.expenses.filter((e) => !e.paid).sort((a, b) => (a.due < b.due ? -1 : 1));
  const past = state.expenses.filter((e) => e.paid).sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  const total = upcoming.reduce((a, e) => a + e.amount, 0);

  const open = (e) => { setSel(e); setF({ title: e.title, amount: String(e.amount), due: e.due }); };
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
    updateExpense(sel.id, { title: f.title.trim(), amount, due: f.due }); toast('Güncellendi'); setSel(null);
  };

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
              return (
                <div key={e.id} className="item" onClick={() => open(e)}>
                  <span className="dot" style={{ width: 12, height: 12, background: `var(--${color})` }} />
                  <div className="item-body">
                    <div className="item-title"><span style={{ color: `var(--${color})`, marginRight: 8 }}>{fmtDayMonth(e.due)}</span>{e.title}</div>
                    <div className="item-sub">{days < 0 ? `${-days} gün gecikti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num">{fmtMoney(e.amount)}</div>
                    <button className="btn btn-sm btn-primary" style={{ marginTop: 6, boxShadow: 'none' }} onClick={(ev) => { ev.stopPropagation(); setSel({ ...e, paying: true }); }}>Öde</button>
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
            <div key={e.id} className="item" onClick={() => open(e)}>
              <div className="tl-icon"><Ic.Check size={18} /></div>
              <div className="item-body"><div className="item-title">{e.title}</div><div className="item-sub">Ödendi: {fmtDate(e.paidAt)}{e.account ? ` · ${ACCOUNT_LABEL[e.account]}` : ''}{e.attachments?.length ? ` · ${e.attachments.length} belge` : ''}</div></div>
              <span className="num">{fmtMoney(e.amount)}</span>
            </div>
          ))}
          {past.length === 0 && <Empty>Geçmiş ödeme yok.</Empty>}
        </div>
      )}

      {/* Öde */}
      <Sheet open={!!sel?.paying} onClose={() => setSel(null)} title={sel ? `${sel.title} · ${fmtMoney(sel.amount)}` : ''}>
        <div className="field"><label>Hangi hesaptan?</label>
          <Segmented light value={account} onChange={setAccount} options={[{ value: 'nakit', label: 'Nakit' }, { value: 'banka', label: 'Banka' }, { value: 'kart', label: 'Kart' }]} /></div>
        <button className="btn btn-primary" onClick={() => { payExpense(sel.id, account); toast(`${sel.title} ödendi`); setSel(null); }}>Ödendi Olarak İşaretle</button>
      </Sheet>

      {/* Düzenle / sil */}
      <Sheet open={!!sel && !sel.paying} onClose={() => setSel(null)} title="Ödemeyi Düzenle">
        <div className="field"><label>Başlık</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div></div>
        <DateField label="Vade" value={f.due} onChange={(v) => setF({ ...f, due: v })} />
        {sel && <div className="field"><label>Fatura / Fiş</label><Attachments items={(state.expenses.find((x) => x.id === sel.id)?.attachments) || []} onChange={(list) => setExpenseAttachments(sel.id, list)} folder={`giderler/${sel.id}`} compact /></div>}
        {sel?.paid && <p className="xs muted" style={{ marginBottom: 12 }}>Bu ödeme {fmtDate(sel.paidAt)} tarihinde {ACCOUNT_LABEL[sel.account] || ''} hesabından ödendi. Tutarı değiştirmek kasayı etkilemez; yanlışsa "Ödenmedi yap" deyip yeniden ödeyin.</p>}
        <div className="stack">
          <div className="btn-row">
            <DangerButton className="btn btn-ghost" message="Ödeme kaydı silinsin mi? Ödendiyse kasa etkisi geri alınır." onConfirm={() => { deleteExpense(sel.id); toast('Silindi'); setSel(null); }}>Sil</DangerButton>
            <button className="btn btn-primary" onClick={saveEdit}>Kaydet</button>
          </div>
          {sel?.paid && <button className="btn btn-ghost" onClick={() => { unpayExpense(sel.id); toast('Ödenmedi olarak işaretlendi'); setSel(null); }}>Ödenmedi Yap (kasaya iade)</button>}
        </div>
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Yeni Ödeme">
        <div className="field"><label>Başlık</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Örn: Kira" /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div></div>
        <DateField label="Vade" value={f.due} onChange={(v) => setF({ ...f, due: v })} />
        <button className="btn btn-primary" onClick={saveNew} disabled={!f.title.trim() || !(parseMoney(f.amount) > 0)}>Kaydet</button>
      </Sheet>
    </div>
  );
}
