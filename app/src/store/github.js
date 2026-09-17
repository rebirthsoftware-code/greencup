// GitHub "Contents" API üzerinden tek bir JSON dosyasını okuyup yazan ince istemci.
// Uygulamanın veritabanı: özel bir repodaki db.json dosyası.

const API = 'https://api.github.com';

export const DEFAULT_CFG = { owner: 'rebirthsoftware-code', repo: 'greencup', branch: 'data', path: 'db.json', token: '' };

const b64encode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = (b64) => {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

const headers = (token) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

const fileUrl = (cfg) =>
  `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}${cfg.branch ? `?ref=${encodeURIComponent(cfg.branch)}` : ''}`;

export class GithubError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function handle(res) {
  if (res.ok) return res.json();
  let msg = res.statusText;
  try { msg = (await res.json()).message || msg; } catch { /* boş gövde */ }
  throw new GithubError(res.status, msg);
}

/** Dosyayı getirir. Yoksa { data: null, sha: null } döner. */
export async function fetchDb(cfg) {
  const res = await fetch(fileUrl(cfg), { headers: headers(cfg.token), cache: 'no-store' });
  if (res.status === 404) return { data: null, sha: null };
  const json = await handle(res);
  return { data: JSON.parse(b64decode(json.content)), sha: json.sha };
}

/** Dosyayı yazar (sha verilmezse oluşturur). Yeni sha döner. */
export async function pushDb(cfg, data, sha) {
  const body = {
    message: `app: veri güncellendi (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`,
    content: b64encode(JSON.stringify(data, null, 1)),
  };
  if (sha) body.sha = sha;
  if (cfg.branch) body.branch = cfg.branch;
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`, {
    method: 'PUT', headers: { ...headers(cfg.token), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = await handle(res);
  return json.content.sha;
}

/** Bağlantı ve yetki testi: repo erişilebilir mi, yazma izni var mı? */
export async function testConnection(cfg) {
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}`, { headers: headers(cfg.token), cache: 'no-store' });
  const json = await handle(res);
  return { name: json.full_name, private: json.private, canWrite: !!json.permissions?.push, defaultBranch: json.default_branch };
}

const post = (cfg, path, body) => fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/${path}`, {
  method: 'POST', headers: { ...headers(cfg.token), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(handle);

/** Dal var mı? */
export async function branchExists(cfg) {
  const res = await fetch(`${API}/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`, { headers: headers(cfg.token), cache: 'no-store' });
  if (res.status === 404) return false;
  await handle(res);
  return true;
}

/**
 * Veri dosyasını ilk kez oluşturur. Dal yoksa, içinde yalnızca db.json olan
 * bağımsız (orphan) bir dal açar; site kodu bu dala karışmaz. Dosyanın blob sha'sını döner.
 */
export async function createDb(cfg, data) {
  if (await branchExists(cfg)) return pushDb(cfg, data, null);
  const blob = await post(cfg, 'git/blobs', { content: JSON.stringify(data, null, 1), encoding: 'utf-8' });
  const tree = await post(cfg, 'git/trees', { tree: [{ path: cfg.path, mode: '100644', type: 'blob', sha: blob.sha }] });
  const commit = await post(cfg, 'git/commits', { message: 'app: veri dalı oluşturuldu', tree: tree.sha, parents: [] });
  await post(cfg, 'git/refs', { ref: `refs/heads/${cfg.branch}`, sha: commit.sha });
  return blob.sha;
}
