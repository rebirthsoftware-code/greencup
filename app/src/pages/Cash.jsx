import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { todayCashMoves, accountName } from '../store/selectors';
import { accountsByKind, sortedAccounts, BANKS, bankPair, slug } from '../store/accounts';
import { fmtMoney, fmtDate, parseMoney, toInput } from '../utils/format';
import { PageHeader, Sheet, Segmented, DangerButton, useToast, MoneyInput, AccountSelect } from '../components/ui';
import * as Ic from '../components/Icons';

const KIND_ICON = { nakit: Ic.Cash, banka: Ic.Bank, kart: Ic.Card };
const KIND_OPTS = [{ value: 'nakit', label: 'Nakit' }, { value: 'banka', label: 'Banka' }, { value: 'kart', label: 'Kredi Kartı' }];

export default function Cash() {
  const { state, addCashMove, deleteCashMove, transferCash, adjustCash, addAccount, updateAccount, deleteAccount } = useStore();
  const toast = useToast();
  const accounts = sortedAccounts(state);
  const groups = accountsByKind(state);
  const first = accounts[0]?.id || 'nakit';
  const total = accounts.reduce((a, x) => a + (state.cash[x.id] || 0), 0);
  const { moves, net } = todayCashMoves(state);
  const [sheet, setSheet] = useState(null); // 'move' | 'transfer' | 'account-new' | { account } | move object
  const [f, setF] = useState({ type: 'out', account: first, amount: '', title: '' });
  const [tr, setTr] = useState({ from: first, to: accounts[1]?.id || first, amount: '', note: '' });
  const [adj, setAdj] = useState({ target: '', note: '' });
  const [acc, setAcc] = useState({ name: '', kind: 'banka', banks: [] });
  const [rename, setRename] = useState('');
  const [moveTo, setMoveTo] = useState('');
  const [showAll, setShowAll] = useState(false);

  const saveMove = () => {
    const amount = parseMoney(f.amount);
    if (!f.title.trim()) return toast('Açıklama girin (örn. Yakıt)');
    if (!(amount > 0)) return toast('Tutar sıfırdan büyük olmalı');
    addCashMove({ type: f.type, account: f.account, amount, title: f.title.trim() });
    toast('Kasa hareketi eklendi'); setSheet(null); setF({ type: 'out', account: first, amount: '', title: '' });
  };
  const saveTransfer = () => {
    const amount = parseMoney(tr.amount);
    if (tr.from === tr.to) return toast('Aynı hesaba transfer olmaz');
    if (!(amount > 0)) return toast('Tutar girin');
    transferCash(tr.from, tr.to, amount, tr.note.trim() || undefined);
    toast('Transfer yapıldı'); setSheet(null); setTr({ ...tr, amount: '', note: '' });
  };
  const selAcc = sheet?.account ? accounts.find((a) => a.id === sheet.account) : null;
  const openAccount = (a) => { setAdj({ target: toInput(state.cash[a.id] || 0), note: '' }); setRename(a.name); setMoveTo(accounts.find((x) => x.id !== a.id)?.id || ''); setSheet({ account: a.id }); };
  const accMoves = selAcc ? state.cashMoves.filter((m) => m.account === selAcc.id).slice(0, 15) : [];
  const saveAdjust = () => {
    if (adj.target.trim() === '') return toast('Gerçek bakiyeyi yazın');
    const target = parseMoney(adj.target);
    const cur = state.cash[selAcc.id] || 0;
    if (Math.abs(target - cur) < 0.005) return toast('Bakiye zaten bu');
    adjustCash(selAcc.id, target, adj.note);
    toast(`${selAcc.name} bakiyesi ${fmtMoney(target)} yapıldı`); setSheet(null);
  };
  const saveAccount = () => {
    const name = acc.name.trim();
    const pairs = acc.banks.flatMap(bankPair).filter((a) => !accounts.some((x) => x.id === a.id));
    if (!name && pairs.length === 0) return toast('Hesap adı girin veya listeden banka seçin');
    if (name) {
      const id = `acc-${slug(name)}${acc.kind === 'kart' ? '-kk' : acc.kind === 'nakit' ? '-nakit' : ''}`;
      if (accounts.some((a) => a.id === id || a.name.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'))) return toast('Bu hesap zaten var');
      addAccount({ id, name, kind: acc.kind });
    }
    for (const a of pairs) addAccount(a);
    toast(`${(name ? 1 : 0) + pairs.length} hesap eklendi`); setSheet(null); setAcc({ name: '', kind: 'banka', banks: [] });
  };
  const list = showAll ? state.cashMoves : moves;
  const sel = sheet && typeof sheet === 'object' && !sheet.account ? sheet : null;
  const adjDelta = selAcc && adj.target.trim() !== '' ? parseMoney(adj.target) - (state.cash[selAcc.id] || 0) : 0;
  const availableBanks = BANKS.filter((b) => !accounts.some((a) => a.id === bankPair(b)[0].id));

  return (
    <div className="page">
      <PageHeader title="Kasa" back={false} right={<>
        <button className="icon-btn" onClick={() => setSheet('transfer')} aria-label="Hesaplar arası transfer"><Ic.ArrowDown size={20} style={{ transform: 'rotate(-90deg)' }} /></button>
        <button className="icon-btn" onClick={() => setSheet('move')} aria-label="Hareket ekle"><Ic.Plus size={20} /></button>
      </>} />
      <div className="stat" style={{ minHeight: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div className="stat-head">Toplam Kasa</div><div className="stat-value" style={{ fontSize: 30 }}>{fmtMoney(total)}</div></div>
        <span className="stat-icon" style={{ width: 44, height: 44 }}><Ic.Wallet size={24} /></span>
      </div>

      <div className="row" style={{ marginTop: 18, marginBottom: 10 }}>
        <h2 className="section-title" style={{ margin: 0 }}>Hesaplar</h2>
        <span style={{ display: 'flex', gap: 6 }}><button className="btn btn-sm btn-primary" style={{ boxShadow: 'none' }} onClick={() => setSheet('transfer')}><Ic.ArrowDown size={14} style={{ transform: 'rotate(-90deg)' }} /> Transfer</button><button className="btn btn-sm btn-ghost" onClick={() => setSheet('account-new')}><Ic.Plus size={14} /> Hesap Ekle</button></span>
      </div>
      {groups.map((g) => {
        const Icon = KIND_ICON[g.kind];
        const sub = g.items.reduce((a, x) => a + (state.cash[x.id] || 0), 0);
        return (
          <div key={g.kind} className="card" style={{ marginBottom: 10 }}>
            <div className="row" style={{ marginBottom: 4 }}><div className="card-title" style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><Icon size={16} className="muted" />{g.label}</div>{g.items.length > 1 && <span className="xs muted">Toplam {fmtMoney(sub)}</span>}</div>
            {g.items.map((a) => (
              <button key={a.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => openAccount(a)}>
                <span>{a.name}</span>
                <span className={`num ${(state.cash[a.id] || 0) < 0 ? 'neg' : ''}`}>{fmtMoney(state.cash[a.id] || 0)} <Ic.ChevronRight size={14} className="muted" /></span>
              </button>
            ))}
          </div>
        );
      })}
      <div className="xs muted" style={{ padding: '0 4px 6px' }}>ATM'den para çekme, bankaya yatırma, kart borcu ödeme gibi hesaplar arası geçişler için <b>Transfer</b>. Hesaba dokunarak bakiyeyi düzeltebilir, adını değiştirebilirsiniz.</div>

      <div className="row" style={{ marginTop: 14, marginBottom: 10 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{showAll ? 'Tüm Hareketler' : 'Bugün'}</h2>
        <button className="btn btn-sm btn-ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Sadece bugün' : 'Tümünü gör'}</button>
      </div>
      <div className="card">
        {list.map((m) => (
          <button key={m.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSheet(m)}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`dot ${m.adjust ? 'orange' : m.type === 'in' ? 'green' : 'red'}`} />
              <span className={`num ${m.adjust ? 'muted' : m.type === 'in' ? 'pos' : 'neg'}`}>{fmtMoney(m.type === 'in' ? m.amount : -m.amount, true)}</span>
            </span>
            <span style={{ textAlign: 'right' }}><div>{m.title}{m.adjust && <span className="badge badge--takipte" style={{ marginLeft: 6 }}>Düzeltme</span>}</div><div className="xs"><b>{m.type === 'in' ? '→ ' : '← '}{accountName(state, m.account)}</b><span className="muted">{showAll ? ` · ${fmtDate(m.date)}` : ''}{m.by ? ` · ${m.by}` : ''}</span></div></span>
          </button>
        ))}
        {list.length === 0 && <div className="muted small">Hareket yok.</div>}
        {!showAll && <div className="row pad" style={{ borderTop: '2px solid var(--border)' }}><span className="bold">Net Hareket</span><span className={`num ${net >= 0 ? 'pos' : 'neg'}`}>{fmtMoney(net)}</span></div>}
      </div>

      <Link to="/daha/raporlar?r=kasa" className="btn btn-primary" style={{ marginTop: 16 }}>Detaylı Rapor</Link>

      <Sheet open={sheet === 'move'} onClose={() => setSheet(null)} title="Kasa Hareketi">
        <div className="field"><Segmented value={f.type} onChange={(v) => (v === 'transfer' ? setSheet('transfer') : setF({ ...f, type: v }))} options={[{ value: 'in', label: 'Giriş (+)' }, { value: 'out', label: 'Çıkış (−)' }, { value: 'transfer', label: 'Transfer' }]} /></div>
        <AccountSelect label="Hesap" value={f.account} onChange={(v) => setF({ ...f, account: v })} accounts={accounts} />
        <div className="field"><label>Açıklama</label><div className="input"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Örn: Yakıt" /></div></div>
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></div></div>
        <button className="btn btn-primary" onClick={saveMove}>Kaydet</button>
        {(!f.title.trim() || !(parseMoney(f.amount) > 0)) && <div className="xs" style={{ color: 'var(--orange)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>{!f.title.trim() ? 'Açıklama girin' : 'Tutar girin'}</div>}
      </Sheet>

      <Sheet open={sheet === 'transfer'} onClose={() => setSheet(null)} title="Hesaplar Arası Transfer">
        <p className="small muted" style={{ marginBottom: 10 }}>Para bir hesaptan çıkar, diğerine girer; toplam kasa değişmez. Örn. ATM'den çekim: Banka → Nakit. Bankaya yatırma: Nakit → Banka. Kart borcu ödeme: Banka → Kredi Kartı.</p>
        <AccountSelect label="Nereden" value={tr.from} onChange={(v) => setTr({ ...tr, from: v })} accounts={accounts} />
        <AccountSelect label="Nereye" value={tr.to} onChange={(v) => setTr({ ...tr, to: v })} accounts={accounts} />
        <div className="field"><label>Tutar</label><div className="input"><span className="suffix">₺</span><MoneyInput value={tr.amount} onChange={(v) => setTr({ ...tr, amount: v })} /></div>
          <span className="xs muted">{accountName(state, tr.from)} bakiyesi: {fmtMoney(state.cash[tr.from] || 0)}</span></div>
        <div className="field"><label>Açıklama <span className="opt">(isteğe bağlı)</span></label><div className="input"><input value={tr.note} onChange={(e) => setTr({ ...tr, note: e.target.value })} placeholder="Örn: Bankaya yatırıldı" /></div></div>
        <button className="btn btn-primary" onClick={saveTransfer}>Transfer Et</button>
        {(tr.from === tr.to || !parseMoney(tr.amount)) && <div className="xs" style={{ color: 'var(--orange)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>{tr.from === tr.to ? 'Farklı iki hesap seçin' : 'Tutar girin'}</div>}
      </Sheet>

      {/* Hesap detayı: bakiye düzelt, yeniden adlandır, sil */}
      <Sheet open={!!selAcc} onClose={() => setSheet(null)} title={selAcc ? selAcc.name : ''}>
        {selAcc && (
          <>
            <div className="row pad"><span className="muted">Mevcut bakiye</span><span className="num" style={{ fontSize: 17 }}>{fmtMoney(state.cash[selAcc.id] || 0)}</span></div>
            <div className="field" style={{ marginTop: 8 }}><label>Gerçek bakiye (bakiyeyi düzelt)</label>
              <div className="input"><span className="suffix">₺</span><MoneyInput value={adj.target} onChange={(v) => setAdj({ ...adj, target: v })} /></div>
              <span className="xs muted">Hesapta gerçekte ne kadar varsa onu yazın. Fark, gelir/gider sayılmayan bir "düzeltme" hareketi olarak kaydedilir.</span></div>
            <div className="field"><label>Not <span className="opt">(isteğe bağlı)</span></label><div className="input"><input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} placeholder="Örn: Sayım farkı" /></div></div>
            {Math.abs(adjDelta) >= 0.005 && <div className={`card small ${adjDelta < 0 ? 'neg' : 'pos'}`} style={{ marginBottom: 12 }}>Fark: {fmtMoney(adjDelta, true)} · {adjDelta < 0 ? 'bakiye düşürülecek' : 'bakiye artırılacak'}</div>}
            <button className="btn btn-primary" onClick={saveAdjust} disabled={Math.abs(adjDelta) < 0.005}>Bakiyeyi Düzelt</button>
            <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => { setTr({ ...tr, from: selAcc.id, to: accounts.find((x) => x.id !== selAcc.id)?.id || selAcc.id }); setSheet('transfer'); }}><Ic.ArrowDown size={16} style={{ transform: 'rotate(-90deg)' }} /> Bu hesaptan başka hesaba aktar</button>
            <div className="field" style={{ marginTop: 18 }}><label>Hesap adı</label>
              <div className="input"><input value={rename} onChange={(e) => setRename(e.target.value)} /><button className="btn btn-sm btn-ghost" style={{ boxShadow: 'none' }} disabled={!rename.trim() || rename.trim() === selAcc.name} onClick={() => { updateAccount(selAcc.id, { name: rename.trim() }); toast('Ad güncellendi'); setSheet(null); }}>Kaydet</button></div></div>
            <div className="btn-row">
              <Segmented light value={selAcc.kind} onChange={(v) => { updateAccount(selAcc.id, { kind: v }); }} options={KIND_OPTS} />
            </div>
            <div className="card-title" style={{ marginTop: 18 }}>Bu hesabın hareketleri</div>
            {accMoves.map((m) => (
              <div key={m.id} className="row pad">
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}><span className={`dot ${m.adjust ? 'orange' : m.type === 'in' ? 'green' : 'red'}`} /><span style={{ minWidth: 0 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div><div className="xs muted">{fmtDate(m.date)}{m.by ? ` · ${m.by}` : ''}</div></span></span>
                <span className={`num ${m.adjust ? 'muted' : m.type === 'in' ? 'pos' : 'neg'}`} style={{ flexShrink: 0 }}>{fmtMoney(m.type === 'in' ? m.amount : -m.amount, true)}</span>
              </div>
            ))}
            {accMoves.length === 0 && <div className="muted small">Bu hesapta hareket yok.</div>}
            {accMoves.length === 15 && <Link to="/daha/raporlar?r=kasa" className="xs" style={{ color: 'var(--green)', fontWeight: 700 }}>Tümü için kasa raporu →</Link>}
            <div style={{ marginTop: 16 }}>
              {accounts.length > 1 && Math.abs(state.cash[selAcc.id] || 0) >= 0.005 && (
                <AccountSelect label="Silmeden önce bakiyeyi şu hesaba aktar" value={moveTo} onChange={setMoveTo} accounts={accounts} exclude={selAcc.id} />
              )}
              {accounts.length > 1
                ? <DangerButton className="btn btn-ghost" message={Math.abs(state.cash[selAcc.id] || 0) >= 0.005 ? `${selAcc.name} hesabındaki ${fmtMoney(state.cash[selAcc.id])} ${accountName(state, moveTo)} hesabına aktarılıp hesap silinecek. Emin misiniz?` : `${selAcc.name} hesabı silinsin mi? Geçmiş hareketlerde adı korunur.`} onConfirm={() => { deleteAccount(selAcc.id, moveTo); toast('Hesap silindi'); setSheet(null); }}>Hesabı Sil</DangerButton>
                : <span className="xs muted">Tek hesap silinemez.</span>}
            </div>
          </>
        )}
      </Sheet>

      {/* Yeni hesap */}
      <Sheet open={sheet === 'account-new'} onClose={() => setSheet(null)} title="Hesap Ekle">
        <div className="field"><label>Hesap adı</label><div className="input"><input value={acc.name} onChange={(e) => setAcc({ ...acc, name: e.target.value })} placeholder="Örn: Garanti BBVA" /></div></div>
        <div className="field"><label>Tür</label><Segmented light value={acc.kind} onChange={(v) => setAcc({ ...acc, kind: v })} options={KIND_OPTS} /></div>
        {availableBanks.length > 0 && (
          <div className="field"><label>Veya listeden seç <span className="opt">(banka hesabı + kredi kartı birlikte eklenir)</span></label>
            <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
              {availableBanks.map((b) => { const on = acc.banks.includes(b); return <button key={b} type="button" className={`chip ${on ? 'active' : ''}`} onClick={() => setAcc({ ...acc, banks: on ? acc.banks.filter((x) => x !== b) : [...acc.banks, b] })}>{on ? '✓ ' : ''}{b}</button>; })}
            </div>
          </div>
        )}
        <button className="btn btn-primary" onClick={saveAccount}>Ekle</button>
      </Sheet>

      <Sheet open={!!sel} onClose={() => setSheet(null)} title={sel ? sel.title : ''}>
        {sel && (
          <>
            <div className="row pad"><span className="muted">Tutar</span><span className={`num ${sel.type === 'in' ? 'pos' : 'neg'}`}>{fmtMoney(sel.type === 'in' ? sel.amount : -sel.amount, true)}</span></div>
            <div className="row pad"><span className="muted">Hesap</span><span>{accountName(state, sel.account)}</span></div>
            <div className="row pad"><span className="muted">Tarih</span><span>{fmtDate(sel.date)}</span></div>
            {sel.adjust && <div className="row pad"><span className="muted">Tür</span><span>Bakiye düzeltme (gelir/gider değil)</span></div>}
            {sel.by && <div className="row pad"><span className="muted">Giren</span><span>{sel.by}</span></div>}
            {sel.txId && <p className="xs muted" style={{ margin: '10px 0' }}>Bu hareket bir tahsilat veya ödemeye bağlı; silmek için ilgili kaydı müşteri detayından ya da ödemelerden silin.</p>}
            {!sel.txId && <div style={{ marginTop: 12 }}><DangerButton className="btn btn-ghost" message={sel.transferId ? 'Transferin iki ayağı da silinecek. Emin misiniz?' : 'Kasa hareketi silinsin mi? Bakiye geri alınır.'} onConfirm={() => { deleteCashMove(sel.id); toast('Silindi'); setSheet(null); }}>Hareketi Sil</DangerButton></div>}
          </>
        )}
      </Sheet>
    </div>
  );
}
