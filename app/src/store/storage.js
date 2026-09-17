// Cihaz üstü kalıcı depolama (localStorage). Bulut senkron için bkz. sync.jsx / github.js.
const KEY = 'greencup.app.v1';
const DEVICE_KEY = 'greencup.device.v1'; // cihaza özel: aktif kullanıcı, PIN (senkronlanmaz)

export function loadState() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* depolama dolu veya kapalı */ }
}
export function clearState() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

export function loadDevice() {
  try { return JSON.parse(localStorage.getItem(DEVICE_KEY)) || {}; } catch { return {}; }
}
export function saveDevice(patch) {
  const next = { ...loadDevice(), ...patch };
  try { localStorage.setItem(DEVICE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  return next;
}
