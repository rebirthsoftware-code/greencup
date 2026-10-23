// Cihaz içi geçmiş sürümler: IndexedDB'de tutulan tam durum anlık görüntüleri (snapshot).
// Günde bir kez (ilk değişiklikte) ve her riskli işlemden önce otomatik alınır; Ayarlar > Geçmiş Sürümler'den
// birleştirilebilir ya da geri dönülebilir. localStorage'dan bağımsızdır; üstüne yazma/temizleme bunları silmez.
const DB = 'greencup-snapshots';
const KEEP = 90;
const LAST_KEY = 'greencup.snap.last';

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB yok'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { const db = r.result; db.createObjectStore('meta', { keyPath: 'id' }); db.createObjectStore('data', { keyPath: 'id' }); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('blocked'));
  });
}
const tx = (db, stores, mode, fn) => new Promise((resolve, reject) => {
  const t = db.transaction(stores, mode); const out = fn(t);
  t.oncomplete = () => resolve(out); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
});
const req = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

export const snapshotMeta = (state, reason, id = Date.now()) => ({
  id, at: new Date(id).toISOString(), reason,
  customers: state.customers.length, transactions: state.transactions.length, products: state.products.length,
  cash: Object.values(state.cash || {}).reduce((a, b) => a + (b || 0), 0),
});

/** Anlık görüntü kaydeder; başarısızlık sessizdir (özel mod, depolama dolu). */
export async function saveSnapshot(state, reason) {
  try {
    const db = await open();
    const meta = snapshotMeta(state, reason);
    await tx(db, ['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').put(meta); t.objectStore('data').put({ id: meta.id, json: JSON.stringify(state) }); });
    await prune(db);
    db.close();
    return meta;
  } catch { return null; }
}
async function prune(db) {
  const metas = (await tx(db, ['meta'], 'readonly', (t) => req(t.objectStore('meta').getAll()))) || [];
  const extra = metas.sort((a, b) => b.id - a.id).slice(KEEP);
  if (extra.length) await tx(db, ['meta', 'data'], 'readwrite', (t) => { for (const m of extra) { t.objectStore('meta').delete(m.id); t.objectStore('data').delete(m.id); } });
}
export async function listSnapshots() {
  try { const db = await open(); const metas = await tx(db, ['meta'], 'readonly', (t) => req(t.objectStore('meta').getAll())); db.close(); return (metas || []).sort((a, b) => b.id - a.id); } catch { return []; }
}
export async function getSnapshot(id) {
  const db = await open(); const row = await tx(db, ['data'], 'readonly', (t) => req(t.objectStore('data').get(id))); db.close();
  if (!row) throw new Error('Sürüm bulunamadı'); return JSON.parse(row.json);
}
export async function deleteSnapshot(id) {
  try { const db = await open(); await tx(db, ['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').delete(id); t.objectStore('data').delete(id); }); db.close(); } catch { /* noop */ }
}
/** Günlük otomatik görüntü: bugün alınmadıysa alır. */
export async function dailySnapshot(state) {
  const today = new Date().toISOString().slice(0, 10);
  let last = null; try { last = localStorage.getItem(LAST_KEY); } catch { /* noop */ }
  if (last === today) return null;
  try { localStorage.setItem(LAST_KEY, today); } catch { /* noop */ } // aynı anda iki kez alınmasın
  const m = await saveSnapshot(state, 'günlük');
  if (!m) { try { localStorage.removeItem(LAST_KEY); } catch { /* noop */ } }
  return m;
}
export const REASON_LABEL = { 'günlük': 'Günlük otomatik', 'buluttan-once': 'Buluttan veri gelmeden önce', 'geri-yukleme-oncesi': 'Geri yükleme öncesi', 'birlestirme-oncesi': 'Birleştirme öncesi', 'degistirme-oncesi': 'Değiştirme öncesi', 'buluttan-alma-oncesi': 'Buluttan Al öncesi', 'temizleme-oncesi': 'Temizleme öncesi', 'ornek-veri-oncesi': 'Örnek veri öncesi', 'baglanti-oncesi': 'Bulut bağlantısı öncesi', 'elle': 'Elle alındı', 'surume-donus-oncesi': 'Sürüme dönüş öncesi' };
