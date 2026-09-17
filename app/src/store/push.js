// Anlık bildirim aboneliği: tarayıcı push aboneliğini alır ve GitHub `data` dalındaki
// push-subscriptions.json dosyasına yazar. Gönderimi Vercel'deki /api/notify yapar.
import { VAPID_PUBLIC_KEY } from '../push-config';
import { GithubError } from './github';

const API = 'https://api.github.com';
const FILE = 'push-subscriptions.json';
const headers = (token) => ({ Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' });
const b64 = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; for (const b of bytes) bin += String.fromCharCode(b); return btoa(bin); };
const unb64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function readFile(cfg) {
  const r = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${FILE}?ref=${encodeURIComponent(cfg.branch)}`, { headers: headers(cfg.token), cache: 'no-store' });
  if (r.status === 404) return { list: [], sha: null };
  if (!r.ok) throw new GithubError(r.status, (await r.json().catch(() => ({}))).message || r.statusText);
  const j = await r.json();
  return { list: JSON.parse(unb64(j.content)), sha: j.sha };
}
async function writeFile(cfg, list, sha, message) {
  const body = { message, content: b64(JSON.stringify(list, null, 1)), branch: cfg.branch };
  if (sha) body.sha = sha;
  const r = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${FILE}`, { method: 'PUT', headers: { ...headers(cfg.token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new GithubError(r.status, (await r.json().catch(() => ({}))).message || r.statusText);
}
/** Dosyayı oku-değiştir-yaz; sha çakışırsa bir kez daha dener. */
async function updateList(cfg, fn, message) {
  for (let i = 0; i < 2; i++) {
    const { list, sha } = await readFile(cfg);
    try { await writeFile(cfg, fn(list), sha, message); return; }
    catch (e) { if (!(e instanceof GithubError && (e.status === 409 || e.status === 422)) || i === 1) throw e; }
  }
}

export async function getSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Bildirimlere abone ol ve aboneliği buluta yaz. */
export async function subscribePush(cfg, userName) {
  if (!pushSupported()) throw new Error('Bu tarayıcı anlık bildirimi desteklemiyor');
  if (isIOS() && !isStandalone()) throw new Error('iPhone\'da önce Paylaş → Ana Ekrana Ekle ile kurun, sonra uygulamadan açın');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Bildirim izni verilmedi');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON();
  const entry = { endpoint: json.endpoint, keys: json.keys, userName: userName || '', ua: navigator.userAgent.slice(0, 80), createdAt: new Date().toISOString() };
  await updateList(cfg, (list) => [...list.filter((s) => s.endpoint !== entry.endpoint), entry], `app: bildirim aboneliği eklendi (${userName || 'cihaz'})`);
  return entry;
}

/** Aboneliği kaldır (cihazdan ve buluttan). */
export async function unsubscribePush(cfg) {
  const sub = await getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  if (cfg?.token) await updateList(cfg, (list) => list.filter((s) => s.endpoint !== endpoint), 'app: bildirim aboneliği kaldırıldı');
}

/** Sunucudan bu cihaza test bildirimi iste. */
export async function sendTestPush(apiUrl) {
  const sub = await getSubscription();
  if (!sub) throw new Error('Önce bildirimleri açın');
  const r = await fetch(`${apiUrl}?endpoint=${encodeURIComponent(sub.endpoint)}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Sunucu hatası ${r.status}`);
  if (!j.sent) throw new Error(j.reason || 'Gönderilemedi (abonelik henüz buluta yazılmamış olabilir)');
  return j;
}

/** Olay bildirimi: tüm abone cihazlara gönderilmek üzere sunucuya ilet. */
export async function notifyAll(cfg, apiUrl, payload, { excludeSelf = false } = {}) {
  let from = (await getSubscription().catch(() => null))?.endpoint;
  if (!from) { const { list } = await readFile(cfg); from = list[0]?.endpoint; }
  if (!from) return { sent: 0, reason: 'abone cihaz yok' };
  const r = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from, excludeFrom: excludeSelf ? from : undefined, ...payload }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Sunucu hatası ${r.status}`);
  return j;
}
