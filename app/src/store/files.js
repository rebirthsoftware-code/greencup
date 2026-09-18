// Belge (fatura PDF'i / fotoğraf) depolama: GitHub `data` dalında ayrı dosyalar.
// Her zaman token ile API üzerinden okunur/yazılır; repo özel olsa da çalışır.
import { GithubError } from './github';

const API = 'https://api.github.com';
const headers = (token, accept = 'application/vnd.github+json') => ({ Accept: accept, Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' });
const MAX_BYTES = 8 * 1024 * 1024;

async function handle(res) {
  if (res.ok) return res;
  let msg = res.statusText;
  try { msg = (await res.json()).message || msg; } catch { /* boş */ }
  throw new GithubError(res.status, msg);
}
const toBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1]); r.onerror = reject; r.readAsDataURL(blob);
});
const safeName = (name) => name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'dosya';

/** Fotoğrafı küçültür (uzun kenar max px, JPEG). PDF ve diğerleri olduğu gibi döner. */
export async function prepareFile(file, max = 1600) {
  if (!file.type.startsWith('image/')) {
    if (file.size > MAX_BYTES) throw new Error('Dosya 8 MB\'tan büyük');
    return { blob: file, name: file.name, type: file.type || 'application/octet-stream' };
  }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, name: file.name, type: file.type };
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
  return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg' };
}

/** Dosyayı yükler; ek kaydı döner. */
export async function uploadAttachment(cfg, { blob, name, type }, folder, by) {
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const path = `belgeler/${folder}/${id}-${safeName(name)}`;
  const content = await toBase64(blob);
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`, {
    method: 'PUT', headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `app: belge eklendi (${name})`, content, branch: cfg.branch }),
  });
  const j = await (await handle(res)).json();
  return { id, name, path, type, size: blob.size, sha: j.content.sha, addedAt: new Date().toISOString(), by };
}

/** Dosyayı repodan siler (sha gerekli; yoksa önce okunur). */
export async function deleteAttachment(cfg, att) {
  let sha = att.sha;
  if (!sha) {
    const r = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${att.path}?ref=${encodeURIComponent(cfg.branch)}`, { headers: headers(cfg.token), cache: 'no-store' });
    if (r.status === 404) return;
    sha = (await (await handle(r)).json()).sha;
  }
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${att.path}`, {
    method: 'DELETE', headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `app: belge silindi (${att.name})`, sha, branch: cfg.branch }),
  });
  if (res.status !== 404) await handle(res);
}

const urlCache = new Map();
/** Dosyayı token ile indirip görüntülenebilir (blob) URL döner; oturum boyunca önbelleklenir. */
export async function attachmentUrl(cfg, att) {
  if (urlCache.has(att.path)) return urlCache.get(att.path);
  const r = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${att.path}?ref=${encodeURIComponent(cfg.branch)}`, { headers: headers(cfg.token, 'application/vnd.github.raw+json'), cache: 'force-cache' });
  const blob = await (await handle(r)).blob();
  const typed = blob.type ? blob : new Blob([blob], { type: att.type });
  const url = URL.createObjectURL(typed);
  urlCache.set(att.path, url);
  return url;
}
export const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
