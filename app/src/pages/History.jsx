import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { useSync } from '../store/sync';
import { listSnapshots, getSnapshot, deleteSnapshot, saveSnapshot, REASON_LABEL } from '../store/snapshots';
import { listCommits, fetchDbAt } from '../store/github';
import { normalizeState } from '../store/seed';
import { mergeStates } from '../store/merge';
import { fmtMoney } from '../utils/format';
import { PageHeader, Tabs, Sheet, Empty, DangerButton, useToast } from '../components/ui';
import * as Ic from '../components/Icons';

const when = (iso) => new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const counts = (s) => `${s.customers.length} müşteri · ${s.transactions.length} hareket · ${s.products.length} ürün`;

/** Geçmiş sürümler: bu cihazdaki otomatik anlık görüntüler ve buluttaki (GitHub) commit geçmişi. */
export default function History() {
  const { state, replaceState } = useStore();
  const sync = useSync();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [snaps, setSnaps] = useState([]);
  const [commits, setCommits] = useState(null); // null: yüklenmedi
  const [err, setErr] = useState('');
  const [sel, setSel] = useState(null); // { kind: 'snap'|'cloud', meta, data }
  const [busy, setBusy] = useState(false);

  const reload = () => listSnapshots().then(setSnaps);
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (tab !== 1 || commits !== null || !sync?.enabled) return;
    listCommits(sync.cfg, 60).then(setCommits).catch((e) => { setErr(e.message); setCommits([]); });
  }, [tab, commits, sync]);

  const openSnap = async (m) => { try { setBusy(true); const data = normalizeState(await getSnapshot(m.id)); setSel({ kind: 'snap', meta: m, data }); } catch (e) { toast(e.message); } finally { setBusy(false); } };
  const openCommit = async (c) => { try { setBusy(true); const data = normalizeState(await fetchDbAt(sync.cfg, c.sha)); setSel({ kind: 'cloud', meta: { id: c.sha, at: c.at, reason: 'bulut' }, data }); } catch (e) { toast(`Okunamadı: ${e.message}`); } finally { setBusy(false); } };
  const merge = async () => { await saveSnapshot(state, 'surume-donus-oncesi'); replaceState(mergeStates(state, sel.data)); toast('Birleştirildi; eksik kayıtlar geri geldi'); setSel(null); reload(); };
  const restore = async () => { await saveSnapshot(state, 'surume-donus-oncesi'); replaceState(sel.data); toast('Bu sürüme dönüldü'); setSel(null); reload(); };
  const takeNow = async () => { const m = await saveSnapshot(state, 'elle'); toast(m ? 'Anlık görüntü alındı' : 'Alınamadı (tarayıcı depolaması kapalı olabilir)'); reload(); };

  const diff = sel ? { c: sel.data.customers.length - state.customers.length, t: sel.data.transactions.length - state.transactions.length } : null;
  const onlyInSel = sel ? sel.data.customers.filter((c) => !state.customers.some((x) => x.id === c.id)).map((c) => c.name) : [];

  return (
    <div className="page">
      <PageHeader title="Geçmiş Sürümler" to="/daha/ayarlar" right={<button className="icon-btn" onClick={takeNow} aria-label="Şimdi anlık görüntü al"><Ic.Plus size={20} /></button>} />
      <Tabs value={tab} onChange={setTab} items={['Bu Cihaz', 'Bulut (GitHub)']} />
      <p className="small muted" style={{ marginBottom: 12 }}>Şu an: <b>{counts(state)}</b>. Bir sürüme dokunup <b>Birleştir</b> derseniz o sürümdeki eksik kayıtlar bugünküne eklenir, hiçbir şey silinmez. <b>Bu sürüme dön</b> ise bugünkü veriyi o sürümle değiştirir (önce otomatik görüntü alınır).</p>

      {tab === 0 && (
        <div className="card" style={{ padding: '4px 14px' }}>
          {snaps.map((m) => (
            <button key={m.id} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => openSnap(m)} disabled={busy}>
              <span><div className="bold">{when(m.at)}</div><div className="xs muted">{REASON_LABEL[m.reason] || m.reason} · {m.customers} müşteri · {m.transactions} hareket · kasa {fmtMoney(m.cash)}</div></span>
              <Ic.ChevronRight size={16} className="muted" />
            </button>
          ))}
          {snaps.length === 0 && <Empty icon={Ic.Clock}>Henüz anlık görüntü yok. Uygulama her gün ilk değişiklikte ve riskli işlemlerden önce otomatik alır; sağ üstteki + ile şimdi alabilirsiniz.</Empty>}
        </div>
      )}

      {tab === 1 && (
        <div className="card" style={{ padding: '4px 14px' }}>
          {!sync?.enabled && <div className="muted small" style={{ padding: '12px 0' }}>Bulut geçmişi için Ayarlar &gt; Bulut Senkron bağlı olmalı.</div>}
          {sync?.enabled && commits === null && <div className="muted small" style={{ padding: '12px 0' }}>Yükleniyor...</div>}
          {err && <div className="small neg" style={{ padding: '12px 0' }}>Hata: {err}</div>}
          {(commits || []).map((c) => (
            <button key={c.sha} className="row pad" style={{ width: '100%', textAlign: 'left' }} onClick={() => openCommit(c)} disabled={busy}>
              <span><div className="bold">{when(c.at)}</div><div className="xs muted">{c.message.split('\n')[0].replace('app: ', '')} · {c.sha.slice(0, 7)}</div></span>
              <Ic.ChevronRight size={16} className="muted" />
            </button>
          ))}
          {commits && commits.length === 0 && !err && <Empty icon={Ic.Cloud}>Bulutta geçmiş yok.</Empty>}
        </div>
      )}

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? `${when(sel.meta.at)} sürümü` : ''}>
        {sel && (
          <>
            <div className="row pad"><span className="muted">Bu sürüm</span><span className="bold">{counts(sel.data)}</span></div>
            <div className="row pad"><span className="muted">Şu an</span><span className="bold">{counts(state)}</span></div>
            <div className="row pad"><span className="muted">Fark</span><span className={`num ${diff.c < 0 || diff.t < 0 ? 'neg' : 'pos'}`}>{diff.c >= 0 ? '+' : ''}{diff.c} müşteri · {diff.t >= 0 ? '+' : ''}{diff.t} hareket</span></div>
            {onlyInSel.length > 0 && <div className="card small" style={{ margin: '10px 0' }}>Bugün olmayan müşteriler ({onlyInSel.length}): {onlyInSel.slice(0, 12).join(', ')}{onlyInSel.length > 12 ? '…' : ''}</div>}
            <div className="stack" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={merge}>Birleştir (önerilen)</button>
              <DangerButton className="btn btn-outline" message={`Bugünkü veri (${counts(state)}) bu sürümle (${counts(sel.data)}) DEĞİŞTİRİLECEK. Önce bugünkü halin anlık görüntüsü alınır. Devam?`} onConfirm={restore}>Bu sürüme dön</DangerButton>
              {sel.kind === 'snap' && <DangerButton className="btn btn-ghost" message="Bu anlık görüntü silinsin mi?" onConfirm={async () => { await deleteSnapshot(sel.meta.id); setSel(null); reload(); }}>Görüntüyü sil</DangerButton>}
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
