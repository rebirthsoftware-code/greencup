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
| Ayarlar (profil, firma, yedekleme, sıfırlama) | `/daha/ayarlar` | ✅ |
| Kullanıcı yönetimi, giriş, anlık bildirim | – | ⏳ sunucu aşaması |

## Veri

Şimdilik tüm veri **cihazda** (`localStorage`) tutulur. İlk açılışta `src/store/seed.js` içindeki
örnek veri yüklenir. Ayarlar > Yedekleme ile JSON yedek alınıp geri yüklenebilir;
Ayarlar > Verileri Sıfırla ile örnek veriye dönülür.

Sunucuya (Supabase / Firebase) geçerken sadece `src/store/storage.js` değişir; ekranlar
`useStore()` üzerinden çalıştığı için etkilenmez.

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
    ├── store/        # seed, storage, store (context), selectors
    ├── styles/       # global.css (tema değişkenleri)
    └── utils/        # format (para, tarih)
```
