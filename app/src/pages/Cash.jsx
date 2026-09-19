import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { todayCashMoves, ACCOUNT_LABEL } from '../store/selectors';
import { fmtMoney, fmtDate, parseMoney } from '../utils/format';
import { PageHeader, Sheet, Segmented, DangerButton, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const ACC = [{ key: 'nakit', label: 'Nakit', icon: Ic.Cash }, { key: 'banka', label: 'Banka', icon: Ic.Bank }, { key: 'kart', label: 'Kart', icon: Ic.Card }];

export default function Cash() {
  const { state, addCashMove, deleteCashMove, transferCash } = useStore();
  const toast = useToast();
  const total = Object.values(state.cash).reduce((a, b) => a + b, 0);
  const { moves, net } = todayCashMoves(state);
  const [sheet, setSheet] = useState(null); // 'move' | 'transfer' | move object
  const [f, setF] = useState({ type: 'out', account: 'nakit', amount: '', title: '' });
  const [tr, setTr] = useState({ from: 'nakit', to: 'banka', amount: '', note: '' });
  const [showAll, setShowAll] = useState(false);

  const saveMove = () => {
    const amount = parseMoney(f.amount);
    if (!f.title.trim()) return toast('Açıklama girin (örn. Yakıt)');
    if (!(amount > 0)) return toast('Tutar sıfırdan büyük olmalı');
    addCashMove({ type: f.type, account: f.account, amount, title: f.title.trim() });
    toast('Kasa hareketi eklendi'); setSheet(null); setF({ type: 'out', account: 'nakit', amount: '', title: '' });
  };
  const saveTransfer = () => {
    const amount = parseMoney(tr.amount);
    if (tr.from === tr.to) return toast('Aynı hesaba transfer olmaz');
    if (!(amount > 0)) return toast('Tutar girin');
    transferCash(tr.from, tr.to, amount, tr.note.trim() || undefined);
    toast('Transfer yapıldı'); setSheet(null); setTr({ from: 'nakit', to: 'banka', amount: '', note: '' });
  };
  const list = showAll ? state.cashMoves : moves;
  const sel = sheet && typeof sheet === 'object' ? sheet : null;

  return (
    <div className="page">
      <PageHeader title="Kasa" back={false} right={<>
        <button className="icon-btn" onClick={() => setSheet('transfer')} aria-label="Hesaplar arası transfer"><Ic.ArrowDown size={20} style={{ transform: 'rotate(-90deg)' }} /></button>
        <button className="icon-btn" onClick={() => setSheet('move')} aria-label="Hareket ekle"><Ic.Plus size={20} /></button>
      </>} />
      <div className="stat" style={{ minHeight: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div className="stat-head">Kasa Bakiyesi</div><div className="stat-value" style={{ fontSize: 30 }}>{fmtMoney(total)}</div></div>
        <span className="stat-icon" style={{ width: 44, height: 44 }}><Ic.Wallet size={24} /></span>
      </div>

      <h2 className="section-title">Hesaplar</h2>
      <div className="card">
        {ACC.map(({ key, label, icon: Icon }) => (
          <div key={key} className="row pad"><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon size={18} className="muted" />{label}</span><span className="num">{fmtMoney(state.cash[key])}</span></div>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setSheet('transfer')}>Hesaplar Arası Transfer</button>
      </div>

      <div className="row" style={{ marginTop: 18, marginBottom: 10 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{showAll ? 'Tüm Hareketler' : 'Bugün'}</h2>
        <button className="btn btn-sm btn-ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Sadece bugün' : 'Tümünü gör'}</button>
      </div>
      <div className="card">
        {list.map((m) => (
          <button key={m.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSheet(m)}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`dot ${m.type === 'in' ? 'green' : 'red'}`} />
              <span className={`num ${m.type === 'in' ? 'pos' : 'neg'}`}>{fmtMoney(m.type === 'in' ? m.amount : -m.amount, true)}</span>
            </span>
            <span style={{ textAlign: 'right' }}><div>{m.title}</div><div className="xs muted">{showAll ? `${fmtDate(m.date)} · ` : ''}{ACCOUNT_LABEL[m.account]}{m.by ? ` · ${m.by}` : ''}</div></span>
          </button>
        ))}
        {list.length === 0 && <div className="muted small">Hareket yok.</div>}
        {!showAll && <div className="row pad" style={{ borderTop: '2px solid var(--border)' }}><span className="bold">Net Hareket</span><span className={`num ${net >= 0 ? 'pos' : 'neg'}`}>{fmtMoney(net)}</span></div>}
      </div>

      <Link to="/daha/raporlar?r=kasa" className="btn btn-primary" style={{ marginTop: 16 }}>Detaylı Rapor</Link>

      <Sheet open={sheet === 'move'} onClose={() => setSheet(null)} title="Kasa Hareketi">
        <div className="field"><Segmented value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: 'in', label: 'Giriş (+)' }, { value: 'out', label: 'Çıkış (−)' }]} /></div>
        <div className="field"><label>Hesap</label><Segmented light value={f.account} onChange={(v) => setF({ ...f, account: v })} options={ACC.map((a) => ({ value: a.key, label: a.label }))} /></div>
        <div className="field"><label>Açıklama</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Örn: Yakıt" /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0" /></div></div>
        <button className="btn btn-primary" onClick={saveMove} disabled={!f.title.trim() || !(parseMoney(f.amount) > 0)}>Kaydet</button>
        {(!f.title.trim() || !(parseMoney(f.amount) > 0)) && <div className="xs muted" style={{ textAlign: 'center', marginTop: 8 }}>{!f.title.trim() ? 'Açıklama girin' : 'Tutar girin'}</div>}
      </Sheet>

      <Sheet open={sheet === 'transfer'} onClose={() => setSheet(null)} title="Hesaplar Arası Transfer">
        <div className="field"><label>Nereden</label><Segmented light value={tr.from} onChange={(v) => setTr({ ...tr, from: v })} options={ACC.map((a) => ({ value: a.key, label: a.label }))} /></div>
        <div className="field"><label>Nereye</label><Segmented light value={tr.to} onChange={(v) => setTr({ ...tr, to: v })} options={ACC.map((a) => ({ value: a.key, label: a.label }))} /></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={tr.amount} onChange={(e) => setTr({ ...tr, amount: e.target.value })} placeholder="0" /></div>
          <span className="xs muted">{ACCOUNT_LABEL[tr.from]} bakiyesi: {fmtMoney(state.cash[tr.from])}</span></div>
        <div className="field"><label>Açıklama <span className="opt">(isteğe bağlı)</span></label><div className="input"><input value={tr.note} onChange={(e) => setTr({ ...tr, note: e.target.value })} placeholder="Örn: Bankaya yatırıldı" /></div></div>
        <button className="btn btn-primary" onClick={saveTransfer} disabled={tr.from === tr.to || !parseMoney(tr.amount)}>Transfer Et</button>
      </Sheet>

      <Sheet open={!!sel} onClose={() => setSheet(null)} title={sel ? sel.title : ''}>
        {sel && (
          <>
            <div className="row pad"><span className="muted">Tutar</span><span className={`num ${sel.type === 'in' ? 'pos' : 'neg'}`}>{fmtMoney(sel.type === 'in' ? sel.amount : -sel.amount, true)}</span></div>
            <div className="row pad"><span className="muted">Hesap</span><span>{ACCOUNT_LABEL[sel.account]}</span></div>
            <div className="row pad"><span className="muted">Tarih</span><span>{fmtDate(sel.date)}</span></div>
            {sel.by && <div className="row pad"><span className="muted">Giren</span><span>{sel.by}</span></div>}
            {sel.txId && <p className="xs muted" style={{ margin: '10px 0' }}>Bu hareket bir tahsilat veya ödemeye bağlı; silmek için ilgili kaydı müşteri detayından ya da ödemelerden silin.</p>}
            {!sel.txId && <div style={{ marginTop: 12 }}><DangerButton className="btn btn-ghost" message={sel.transferId ? 'Transferin iki ayağı da silinecek. Emin misiniz?' : 'Kasa hareketi silinsin mi? Bakiye geri alınır.'} onConfirm={() => { deleteCashMove(sel.id); toast('Silindi'); setSheet(null); }}>Hareketi Sil</DangerButton></div>}
          </>
        )}
      </Sheet>
    </div>
  );
}
