// Kasa hesapları: nakit, banka hesapları ve kredi kartları.
// Her hesabın id'si kasa bakiyesi (state.cash[id]) ve hareketlerdeki hesap/yöntem alanıdır.
// Eski sürümdeki sabit üç hesap (nakit / banka / kart) aynı id'lerle korunur.

export const KIND_LABEL = { nakit: 'Nakit', banka: 'Banka Hesapları', kart: 'Kredi Kartları' };
export const KIND_ORDER = ['nakit', 'banka', 'kart'];

export const DEFAULT_ACCOUNTS = [
  { id: 'nakit', name: 'Nakit', kind: 'nakit', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'banka', name: 'Banka', kind: 'banka', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'kart', name: 'Kart', kind: 'kart', createdAt: '2026-01-01T00:00:00.000Z' },
];

/** Hızlı ekleme listesi (banka + kredi kartı çifti olarak eklenir). */
export const BANKS = [
  'Garanti BBVA', 'Kuveyt Türk', 'Ziraat Bankası', 'Şekerbank', 'Yapı Kredi', 'Halkbank', 'QNB Finansbank',
  'İş Bankası', 'Akbank', 'VakıfBank', 'DenizBank', 'TEB', 'ING', 'Enpara', 'Papara', 'Albaraka', 'Vakıf Katılım', 'Ziraat Katılım',
];
/** v4 geçişinde mevcut verilere otomatik eklenen bankalar (kullanıcı isteği). */
export const V4_BANKS = ['Garanti BBVA', 'Kuveyt Türk', 'Ziraat Bankası', 'Şekerbank', 'Yapı Kredi', 'Halkbank', 'QNB Finansbank'];

const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
export const slug = (name) => String(name || '').replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Banka adı → iki hesap: banka hesabı ve kredi kartı (id'ler addan türer; cihazlar arasında çakışmaz). */
export const bankPair = (name) => {
  const s = slug(name);
  return [
    { id: `acc-${s}`, name, kind: 'banka' },
    { id: `acc-${s}-kk`, name: `${name} Kredi Kartı`, kind: 'kart' },
  ];
};

export const accountById = (state, id) => (state.accounts || []).find((a) => a.id === id);
/** Hesap adı; silinmiş hesaplar "(silinmiş)" ekiyle, bilinmeyenler eski sabit etiket ya da id ile. */
export const accountName = (state, id) => {
  const a = accountById(state, id);
  if (a) return a.deleted ? `${a.name} (silinmiş)` : a.name;
  return { nakit: 'Nakit', banka: 'Banka', kart: 'Kart' }[id] || id || '-';
};

/** Aktif (silinmemiş) hesaplar türe göre gruplu ve sıralı: nakit → banka → kart; her grupta ekleme sırası. */
export function accountsByKind(state) {
  const list = (state.accounts || DEFAULT_ACCOUNTS).filter((a) => !a.deleted);
  return KIND_ORDER.map((kind) => ({ kind, label: KIND_LABEL[kind], items: list.filter((a) => a.kind === kind) })).filter((g) => g.items.length);
}

export const sortedAccounts = (state) => accountsByKind(state).flatMap((g) => g.items);
