// Vercel sunucusuz fonksiyon: anlık bildirim aktarıcısı (Web Push).
// Uygulama bir olay üretince (örn. stok eşiğin altına düştü) buraya POST eder; fonksiyon
// bildirimi `data` dalındaki push-subscriptions.json'daki tüm cihazlara iletir.
//
// Yetki: istek, cihazın GitHub token'ını `Authorization: Bearer` ile taşır; fonksiyon bu
// token'ın repoya YAZMA yetkisi olduğunu GitHub'a sorarak doğrular. Böylece yalnızca
// Bulut Senkron bağlı cihazlar bildirim gönderebilir (repo açık olsa da).
// Test: GET /api/notify?endpoint=<abonelik endpoint'i> (aynı yetki) → yalnızca o cihaza test.
import webpush from 'web-push';

const OWNER = process.env.DATA_OWNER || 'rebirthsoftware-code';
const REPO = process.env.DATA_REPO || 'greencup';
const BRANCH = process.env.DATA_BRANCH || 'data';
const GH = 'https://api.github.com';
const ghHeaders = (token, accept = 'application/vnd.github+json') => ({ Accept: accept, Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' });

/** Gönderenin token'ı repoya yazabiliyor mu? */
async function authorized(token) {
  if (!token) return false;
  const r = await fetch(`${GH}/repos/${OWNER}/${REPO}`, { headers: ghHeaders(token), cache: 'no-store' });
  if (!r.ok) return false;
  const j = await r.json();
  return !!j.permissions?.push;
}

/** Abonelik listesi: yazma yetkili token varsa API'den (özel repo dahil), yoksa raw URL'den. */
async function readSubs(token) {
  const serverToken = process.env.GITHUB_TOKEN || token;
  const explicit = process.env.SUBS_URL;
  const r = explicit
    ? await fetch(`${explicit}${explicit.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store', headers: serverToken ? ghHeaders(serverToken, 'application/vnd.github.raw+json') : {} })
    : serverToken
      ? await fetch(`${GH}/repos/${OWNER}/${REPO}/contents/push-subscriptions.json?ref=${encodeURIComponent(BRANCH)}`, { cache: 'no-store', headers: ghHeaders(serverToken, 'application/vnd.github.raw+json') })
      : await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/push-subscriptions.json?t=${Date.now()}`, { cache: 'no-store' });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`abonelik listesi okunamadı: ${r.status}`);
  const j = await r.json().catch(() => null);
  if (!Array.isArray(j)) {
    if (j && typeof j.content === 'string') { try { const arr = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')); return Array.isArray(arr) ? arr : []; } catch { return []; } }
    return [];
  }
  return j.filter((s) => s && typeof s.endpoint === 'string' && s.keys?.p256dh && s.keys?.auth);
}

/** Yalnızca uygulama içi göreli yol kabul edilir (başka siteye yönlendirme yok). */
const safeUrl = (u) => (typeof u === 'string' && /^\/[^/\\]/.test(u) ? u.slice(0, 200) : '/app/');
const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export async function send(targets, payload) {
  const results = await Promise.allSettled(targets.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 24 * 3600, urgency: 'high', timeout: 5000 })));
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.statusCode || r.reason?.message);
  const gone = targets.filter((_, i) => results[i].status === 'rejected' && [404, 410].includes(results[i].reason?.statusCode)).map((s) => s.endpoint);
  return { sent, failed: errors.length, errors: errors.slice(0, 5), gone };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'yöntem desteklenmiyor' });
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT = 'mailto:info@greencup.com.tr' } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return res.status(500).json({ error: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY ortam değişkenleri eksik' });

  const token = (req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const isStatus = req.method === 'GET' && !req.query?.endpoint;

  let body = {};
  if (req.method === 'POST') {
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body && typeof req.body === 'object' ? req.body : {}); }
    catch { return res.status(400).json({ error: 'geçersiz JSON' }); }
    if (!text(body.title, 80)) return res.status(400).json({ error: 'title gerekli' });
  }

  if (!isStatus) {
    let ok = false;
    try { ok = await authorized(token); } catch { ok = false; }
    if (!ok) return res.status(401).json({ error: 'yetkisiz: Bulut Senkron bağlı bir cihazdan gönderilmeli' });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  let subs;
  try { subs = await readSubs(token); } catch (e) { return res.status(502).json({ error: e.message }); }

  if (isStatus) return res.status(200).json({ ok: true, subscriptions: subs.length });

  if (req.method === 'GET') {
    const endpoint = String(req.query.endpoint);
    const targets = subs.filter((s) => s.endpoint === endpoint);
    if (targets.length === 0) return res.status(404).json({ sent: 0, reason: 'Abonelik buluta henüz yazılmamış' });
    return res.status(200).json(await send(targets, { title: 'GreenCup · Test', body: 'Anlık bildirimler bu cihazda çalışıyor.', url: '/app/', tag: 'test' }));
  }

  const { excludeFrom } = body;
  const targets = typeof excludeFrom === 'string' && excludeFrom ? subs.filter((s) => s.endpoint !== excludeFrom) : subs;
  const payload = { title: text(body.title, 80), body: text(body.body, 200), url: safeUrl(body.url), tag: text(body.tag, 64) || 'greencup' };
  return res.status(200).json(await send(targets, payload));
}
