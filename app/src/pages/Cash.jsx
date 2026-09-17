import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { todayCashMoves } from '../store/selectors';
import { fmtMoney, fmtDate } from '../utils/format';
import { PageHeader, Sheet, Segmented, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const ACC = [{ key: 'nakit', label: 'Nakit', icon: Ic.Cash }, { key: 'banka', label: 'Banka', icon: Ic.Bank }, { key: 'kart', label: 'Kart', icon: Ic.Card }];

export default function Cash() {
  const { state, addCashMove } = useStore();
  const toast = useToast();
  const total = Object.values(state.cash).reduce((a, b) => a + b, 0);
  const { moves, net } = todayCashMoves(state);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ type: 'out', account: 'nakit', amount: '', title: '' });
  const [showAll, setShowAll] = useState(false);

  const save = () => {
    const amount = parseFloat(String(f.amount).replace(',', '.'));
    if (!amount || !f.title.trim()) return;
    addCashMove({ type: f.type, account: f.account, amount, title: f.title.trim() });
    toast('Kasa hareketi eklendi'); setOpen(false); setF({ type: 'out', account: 'nakit', amount: '', title: '' });
  };
  const list = showAll ? state.cashMoves : moves;

  return (
    <div className="page">
      <PageHeader title="Kasa" back={false} right={<button className="icon-btn" onClick={() => setOpen(true)} aria-label="Hareket ekle"><Ic.Plus size={20} /></button>} />
      <div className="stat" style={{ minHeight: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div className="stat-head">Kasa Bakiyesi</div><div className="stat-value" style={{ fontSize: 30 }}>{fmtMoney(total)}</div></div>
        <span className="stat-icon" style={{ width: 44, height: 44 }}><Ic.Wallet size={24} /></span>
      </div>

      <h2 className="section-title">Hesaplar</h2>
      <div className="card">
        {ACC.map(({ key, label, icon: Icon }) => (
          <div key={key} className="row pad"><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon size={18} className="muted" />{label}</span><span className="num">{fmtMoney(state.cash[key])}</span></div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 18, marginBottom: 10 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{showAll ? 'Tüm Hareketler' : 'Bugün'}</h2>
        <button className="btn btn-sm btn-ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Sadece bugün' : 'Tümünü gör'}</button>
      </div>
      <div className="card">
        {list.map((m) => (
          <div key={m.id} className="row pad">
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`dot ${m.type === 'in' ? 'green' : 'red'}`} />
              <span className={`num ${m.type === 'in' ? 'pos' : 'neg'}`}>{fmtMoney(m.type === 'in' ? m.amount : -m.amount, true)}</span>
            </span>
            <span style={{ textAlign: 'right' }}><div>{m.title}</div>{showAll && <div className="xs muted">{fmtDate(m.date)} · {m.account}</div>}</span>
          </div>
        ))}
        {list.length === 0 && <div className="muted small">Hareket yok.</div>}
        {!showAll && <div className="row pad" style={{ borderTop: '2px solid var(--border)' }}><span className="bold">Net Hareket</span><span className={`num ${net >= 0 ? 'pos' : 'neg'}`}>{fmtMoney(net)}</span></div>}
      </div>

      <Link to="/daha/raporlar" className="btn btn-primary" style={{ marginTop: 16 }}>Detaylı Rapor</Link>

      <Sheet open={open} onClose={() => setOpen(false)} title="Kasa Hareketi">
        <div className="field"><Segmented value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: 'in', label: 'Giriş (+)' }, { value: 'out', label: 'Çıkış (−)' }]} /></div>
        <div className="field"><label>Hesap</label><Segmented light value={f.account} onChange={(v) => setF({ ...f, account: v })} options={ACC.map((a) => ({ value: a.key, label: a.label }))} /></div>
        <div className="field"><label>Açıklama</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Örn: Yakıt" /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0" /></div></div>
        <button className="btn btn-primary" onClick={save}>Kaydet</button>
      </Sheet>
    </div>
  );
}
