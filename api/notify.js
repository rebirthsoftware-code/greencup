// Vercel sunucusuz fonksiyon: anlık bildirim aktarıcısı (Web Push).
// Uygulama bir olay üretince (örn. stok eşiğin altına düştü) buraya POST eder; fonksiyon
// bildirimi `data` dalındaki push-subscriptions.json'daki tüm cihazlara iletir.
// Yetki: isteği gönderen `from` alanında abonelik listesinde kayıtlı bir endpoint vermelidir
// (endpoint'ler tahmin edilemez; listeyi yalnızca GitHub token'ı olan cihazlar okuyabilir).
// Test: GET /api/notify?endpoint=<abonelik endpoint'i> → yalnızca o cihaza test bildirimi.
import webpush from 'web-push';

const OWNER = process.env.DATA_OWNER || 'rebirthsoftware-code';
const REPO = process.env.DATA_REPO || 'greencup';
const BRANCH = process.env.DATA_BRANCH || 'data';
const SUBS_URL = process.env.SUBS_URL || `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/push-subscriptions.json`;

async function readSubs() {
  // Repo özelse GITHUB_TOKEN ile API üzerinden (raw URL çalışmaz); açıksa raw URL yeterli.
  const token = process.env.GITHUB_TOKEN;
  const r = token
    ? await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/push-subscriptions.json?ref=${encodeURIComponent(BRANCH)}`, { cache: 'no-store', headers: { Accept: 'application/vnd.github.raw+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } })
    : await fetch(`${SUBS_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`abonelik listesi okunamadı: ${r.status}${token ? '' : ' (repo özelse Vercel\'e GITHUB_TOKEN ekleyin)'}`);
  return r.json();
}

export async function send(targets, payload) {
  const results = await Promise.allSettled(targets.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 24 * 3600, urgency: 'high' })));
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.statusCode || r.reason?.message);
  const gone = targets.filter((_, i) => results[i].status === 'rejected' && [404, 410].includes(results[i].reason?.statusCode)).map((s) => s.endpoint);
  return { sent, failed: errors.length, errors: errors.slice(0, 5), gone };
}

export default async function handler(req, res) {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT = 'mailto:info@greencup.com.tr' } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return res.status(500).json({ error: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY ortam değişkenleri eksik' });
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  let subs;
  try { subs = await readSubs(); } catch (e) { return res.status(502).json({ error: e.message }); }

  if (req.method === 'GET') {
    const endpoint = req.query?.endpoint;
    if (!endpoint) return res.status(200).json({ ok: true, subscriptions: subs.length });
    const targets = subs.filter((s) => s.endpoint === endpoint);
    if (targets.length === 0) return res.status(404).json({ sent: 0, reason: 'Abonelik buluta henüz yazılmamış' });
    return res.status(200).json(await send(targets, { title: 'GreenCup · Test', body: 'Anlık bildirimler bu cihazda çalışıyor.', url: '/app/', tag: 'test' }));
  }

  if (req.method === 'POST') {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { from, title, body, url, tag, excludeFrom } = b;
    if (!from || !subs.some((s) => s.endpoint === from)) return res.status(401).json({ error: 'yetkisiz: from alanı kayıtlı bir abonelik olmalı' });
    if (!title) return res.status(400).json({ error: 'title gerekli' });
    const targets = excludeFrom ? subs.filter((s) => s.endpoint !== from) : subs;
    return res.status(200).json(await send(targets, { title: String(title).slice(0, 80), body: String(body || '').slice(0, 200), url: url || '/app/', tag: tag || 'greencup' }));
  }
  return res.status(405).json({ error: 'yöntem desteklenmiyor' });
}
