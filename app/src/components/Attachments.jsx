import { useEffect, useState } from 'react';
import { useSync } from '../store/sync';
import { prepareFile, uploadAttachment, deleteAttachment, attachmentUrl, fmtBytes } from '../store/files';
import { loadDevice } from '../store/storage';
import { Sheet, DangerButton, useToast } from './ui';
import * as Ic from './Icons';

/** Belge önizleme (görsel inline, PDF yeni sekmede). */
function Preview({ att, onClose, onRemove }) {
  const sync = useSync();
  const [url, setUrl] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { let on = true; attachmentUrl(sync.cfg, att).then((u) => on && setUrl(u)).catch((e) => on && setErr(e.message)); return () => { on = false; }; }, [att, sync.cfg]);
  const isImg = att.type?.startsWith('image/');
  return (
    <Sheet open onClose={onClose} title={att.name}>
      {err && <div className="card small neg">{err}</div>}
      {!url && !err && <div className="muted small" style={{ padding: 20, textAlign: 'center' }}>Yükleniyor...</div>}
      {url && isImg && <img src={url} alt={att.name} style={{ width: '100%', borderRadius: 12, display: 'block' }} />}
      {url && !isImg && (
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="tl-icon"><Ic.FileText size={18} /></span>
          <div style={{ flex: 1 }}><div className="bold">{att.name}</div><div className="xs muted">{fmtBytes(att.size)} · {att.type}</div></div>
        </div>
      )}
      {url && <a className="btn btn-primary" style={{ marginTop: 12 }} href={url} target="_blank" rel="noreferrer">{isImg ? 'Tam Boyut Aç' : 'PDF\'i Aç'}</a>}
      <div className="xs muted" style={{ marginTop: 10 }}>{att.by ? `${att.by} · ` : ''}{new Date(att.addedAt).toLocaleDateString('tr-TR')}</div>
      {onRemove && <div style={{ marginTop: 12 }}><DangerButton className="btn btn-ghost" message={`${att.name} silinsin mi?`} onConfirm={onRemove}>Bu belgeyi sil</DangerButton></div>}
    </Sheet>
  );
}

/**
 * Belge listesi + ekleme/silme. `items` mevcut ekler; `onChange(nextItems)` kaydeder.
 * `folder` repodaki alt klasör (örn. 2026/txId). Bulut bağlı değilse yalnızca uyarı gösterir.
 */
export default function Attachments({ items = [], onChange, folder, compact = false }) {
  const sync = useSync();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const enabled = sync?.enabled;

  const add = async (e) => {
    const files = [...(e.target.files || [])]; e.target.value = '';
    if (!files.length) return;
    if (!enabled) return toast('Belge eklemek için Bulut Senkron bağlı olmalı');
    setBusy(true);
    const added = [];
    try {
      for (const f of files) {
        const prepared = await prepareFile(f);
        added.push(await uploadAttachment(sync.cfg, prepared, folder, loadDevice().userName));
      }
      onChange([...items, ...added]); toast(added.length > 1 ? `${added.length} belge eklendi` : 'Belge eklendi');
    } catch (err) { toast(`Yüklenemedi: ${err.message}`); if (added.length) onChange([...items, ...added]); }
    finally { setBusy(false); }
  };
  const remove = async (att) => {
    onChange(items.filter((a) => a.id !== att.id)); setOpen(null);
    try { if (enabled) await deleteAttachment(sync.cfg, att); toast('Belge silindi'); } catch (err) { toast(`Dosya repodan silinemedi: ${err.message}`); }
  };

  return (
    <div className="attach">
      {items.length > 0 && (
        <div className="attach-list">
          {items.map((a) => (
            <button type="button" key={a.id} className="attach-item" onClick={() => setOpen(a)}>
              <span className={`tl-icon ${a.type?.startsWith('image/') ? 'visit' : ''}`}>{a.type?.startsWith('image/') ? <Ic.Cup size={16} /> : <Ic.FileText size={16} />}</span>
              <span className="attach-name"><b>{a.name}</b><span>{fmtBytes(a.size)}</span></span>
            </button>
          ))}
        </div>
      )}
      {onChange && (
        <div className="attach-actions">
          <label className={`btn btn-ghost btn-sm ${busy ? 'disabled' : ''}`}><Ic.FileText size={15} /> {busy ? 'Yükleniyor...' : compact ? 'Belge ekle' : 'PDF / Dosya ekle'}<input type="file" accept="application/pdf,image/*" multiple hidden onChange={add} disabled={busy} /></label>
          <label className={`btn btn-ghost btn-sm ${busy ? 'disabled' : ''}`}><Ic.Target size={15} /> Fotoğraf çek<input type="file" accept="image/*" capture="environment" hidden onChange={add} disabled={busy} /></label>
        </div>
      )}
      {onChange && !enabled && <div className="xs muted" style={{ marginTop: 6 }}>Belge eklemek için Ayarlar → Bulut Senkron bağlı olmalı.</div>}
      {open && <Preview att={open} onClose={() => setOpen(null)} onRemove={onChange ? () => remove(open) : undefined} />}
    </div>
  );
}
