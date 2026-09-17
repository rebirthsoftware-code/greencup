// Cihaz üstü kalıcı depolama. Şimdilik localStorage; ileride backend
// (Supabase/Firebase) veya IndexedDB'ye geçerken sadece bu dosya değişir.
const KEY = 'greencup.app.v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* depolama dolu veya kapalı: sessizce geç */
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
