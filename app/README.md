# GreenCup Müşteri Takip Uygulaması

Siteden bağımsız çalışan, mobil öncelikli **müşteri takip ve cari yönetim** uygulaması (PWA).
Telefonda "Ana ekrana ekle" ile uygulama gibi kurulur, çevrimdışı açılır.

## Çalıştırma

```bash
cd app
npm install
npm run dev       # http://localhost:5174 (aynı ağdaki telefondan da açılır)
npm run build     # dist/ klasörüne üretim derlemesi
npm run preview   # üretim derlemesini yerelde dene
npm run lint
```

## Ekranlar

| Ekran | Yol | Durum |
|---|---|---|
| Açılış ekranı | – | ✅ |
| Ana menü (özet kartlar, hızlı işlemler, bugün) | `/` | ✅ |
| Müşteriler (arama, filtre) | `/musteriler` | ✅ |
| Müşteri detayı (cari durum, hareketler, ürünler, faturalar, notlar) | `/musteriler/:id` | ✅ |
| Yeni / düzenle müşteri | `/musteriler/yeni`, `/musteriler/:id/duzenle` | ✅ |
| Yeni işlem: mal ver, tahsilat, ziyaret | `/islem` | ✅ |
| Stok / depo (benim stokum, müşteri malları) | `/stok` | ✅ |
| Kasa (hesaplar, günlük hareket) | `/kasa` | ✅ |
| Benim ödemelerim | `/daha/odemeler` | ✅ |
| Ziyaretler + ziyaret detayı (ara, yol tarifi, harita) | `/daha/ziyaretler`, `/ziyaret/:id` | ✅ |
| Fatura görüntüleme / yazdırma | `/fatura/:id` | ✅ |
| Raporlar | `/daha/raporlar` | ✅ (temel liste) |
| Ayarlar (profil, firma, bulut senkron, yedekleme, tümünü temizle, örnek veri) | `/daha/ayarlar` | ✅ |
| Bulut senkron (GitHub `data` dalı) | Ayarlar | ✅ |
| Kullanıcı yönetimi, giriş, anlık bildirim | – | ⏳ |

## Canlı adres

**https://greencup.vercel.app/app/**

Uygulama, sitenin mevcut Vercel projesiyle birlikte yayınlanır; ayrı proje gerekmez.
Kökteki `npm run build`, siteyi derledikten sonra `npm run build:app` ile bu uygulamayı
`--mode embedded` olarak `dist/app/` altına derler (`base: /app/`). Kökteki `vercel.json`,
`/app/*` isteklerini `app/index.html`'e yönlendirir (SPA) ve `data` dalına yapılan veri
commit'lerinin dağıtım tetiklemesini kapatır. `main`'e giden her push canlıyı günceller.

`app/vercel.json`, uygulamayı ileride ayrı bir Vercel projesi olarak (Root Directory: `app`)
yayınlamak istenirse hazır durur.

## Veri: GitHub üzerinde veritabanı

Veriler `localStorage`'da tutulur **ve** GitHub'daki bu repoda, `data` dalındaki `db.json`
dosyasına senkronize edilir (`src/store/github.js`, `src/store/sync.jsx`). Repo herkese açık
olduğu için bu dosya da herkese açıktır; bu, bilinçli bir tercihtir.

Kurulum (her cihazda bir kez):
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → *Generate new token*.
   Repository access: yalnızca `greencup`. Permissions → Repository → **Contents: Read and write**.
2. Uygulamada Ayarlar → **Bulut Senkron (GitHub)** → token'ı yapıştırın → *Bağlantıyı Test Et* → *Kaydet ve Bağla*.
3. `data` dalı yoksa uygulama, içinde yalnızca `db.json` olan bağımsız bir dal olarak kendisi oluşturur.

Nasıl çalışır:
- Her değişiklik 1,5 sn sonra `db.json`'a commit edilir; commit geçmişi değişiklik geçmişidir.
- Açılışta ve uygulamaya geri dönüldüğünde uzaktaki sürüm kontrol edilir; yerelde bekleyen değişiklik yoksa uzaktaki uygulanır.
- İki cihaz aynı anda yazarsa son yazan kazanır (sha çakışmasında bir kez yeniden denenir).
- Çevrimdışıyken değişiklikler cihazda bekler, bağlantı gelince yazılır.
- Token yalnızca cihazda saklanır, uygulama paketine ve repoya girmez.

Ana sayfadaki bulut simgesi durumu gösterir: gri kapalı, yeşil güncel, turuncu bekleyen değişiklik, kırmızı hata.

Bulut senkron kapalıyken tüm veri yalnızca **cihazda** (`localStorage`) tutulur. İlk açılışta `src/store/seed.js` içindeki
örnek veri yüklenir. Ayarlar > Yedekleme ile JSON yedek alınıp geri yüklenebilir;
Ayarlar > **Tümünü Temizle** ile boş başlanır (ayarlar korunur), **Örnek Veriyi Yükle** ile demo veriye dönülür.

İleride gerçek bir veritabanına geçilirse yalnızca `src/store/github.js` ve `sync.jsx` değişir; ekranlar `useStore()` üzerinden çalıştığı için etkilenmez.

### Veri modeli (özet)

- `customers` – müşteri (ad, tür, telefon, il/ilçe, renk, kısaltma)
- `products` – ürün (mevcut, rezerve, birim fiyat)
- `transactions` – hareket: `sale` (mal verildi), `payment` (tahsilat), `visit` (ziyaret), `note`
- `reserved` – depoda müşteriye ait ürünler
- `cash` / `cashMoves` – kasa hesapları ve hareketleri
- `expenses` – benim ödemelerim
- `settings` – kullanıcı, firma, KDV, gecikme eşiği

Müşteri bakiyesi, durumu (Aktif / Takipte / Gecikmiş) ve müşterideki ürünler hareketlerden
türetilir (`src/store/selectors.js`).

## Yapı

```
app/
├── public/           # manifest, ikonlar, service worker
└── src/
    ├── components/   # Icons, ui (TabBar, PageHeader, Sheet, Toast...), Splash
    ├── pages/        # her ekran bir dosya
    ├── store/        # seed, storage, store (context), selectors, github (API), sync
    ├── styles/       # global.css (tema değişkenleri)
    └── utils/        # format (para, tarih)
```
