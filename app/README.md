# GreenCup Müşteri Takip Uygulaması

Siteden bağımsız çalışan, mobil öncelikli **müşteri takip ve cari yönetim** uygulaması (PWA).
Telefonda "Ana ekrana ekle" ile uygulama gibi kurulur, çevrimdışı açılır. Simge ve açılış ekranı sitenin logosudur;
manifest maskable ikonlar, kısayollar (Yeni Müşteri, Mal Ver, Tahsilat) ve iPhone açılış görselleri içerir.
Ana sayfadaki "Ana ekrana ekle" kartı Android'de tek dokunuşla kurulum, iPhone'da adımları gösterir.

## Çalıştırma

```bash
cd app
npm install
npm run dev       # http://localhost:5174 (aynı ağdaki telefondan da açılır)
npm run build     # dist/ klasörüne üretim derlemesi
npm run preview   # üretim derlemesini yerelde dene
npm run lint
```

## Ekranlar ve özellikler

| Alan | Neler var |
|---|---|
| Açılış, PIN kilidi | Cihaza özel 4-6 haneli PIN; açılışta ve 5 dk arka plandan sonra sorar |
| Ana menü | Özet kartlar, hızlı işlemler, "Bugün" özeti, bildirim rozeti, bulut durumu |
| Bildirimler | Geciken alacaklar, yaklaşan vadeler/giderler, günün ziyaret planı, uzun süredir gidilmeyenler, azalan stok |
| Müşteriler | Arama, filtre; logo yükleme; müşteri düzenleme ve silme (hareketleriyle birlikte) |
| Müşteri detayı | Cari durum (FIFO ile açık/gecikmiş tutar, en yakın vade), hareketler (dokunarak düzenle/sil), ürünler, depodaki rezerve mallar (ekle, teslim et), faturalar, notlar, planlı ziyaretler |
| Yeni işlem | **Çok ürünlü** mal verme (satır başına miktar ve birim fiyat), vade tarihi, faturalı/faturasız, vadeli/peşin/kısmi; tahsilat; ziyaret |
| Stok / Depo | Ürün ekle/düzenle/sil, birim, uyarı eşiği; rezerve müşteri kayıtlarından türetilir |
| Kasa | Nakit/banka/kart, hareket ekle/sil, **hesaplar arası transfer** |
| Benim ödemelerim | Ekle, düzenle, sil, öde / ödenmedi yap |
| Ziyaretler | Son ziyaretler; **ziyaret planı** (tarih ata, yapıldı olarak kapat), öneriler |
| Fatura | Çok satırlı, firma bilgileri, KDV, yazdır/PDF (resmi e-Fatura değildir) |
| Raporlar | Son 6 ay satış/tahsilat grafiği; cari, stok, kasa, ziyaret, satış, tahsilat raporları; **Excel (CSV) indir** |
| Ayarlar | Firma bilgileri (adres, VKN, KDV, varsayılan vade, fatura no), **kullanıcılar** (cihaz başına aktif kullanıcı, hareketlerde "kim girdi"), PIN, bulut senkron, JSON yedek, tümünü temizle / örnek veri |

Sunucu gerektirdiği için bu sürümde olmayanlar: şifreli çok kullanıcılı giriş, resmi e-Fatura entegrasyonu.

## Fatura belgeleri (PDF / fotoğraf)

Satışlara (Mal Ver → Fatura Belgesi; müşteri detayı → Faturalar; fatura sayfası) ve giderlere belge eklenir.
Fotoğraflar 1600 px'e küçültülüp JPEG olarak, PDF'ler olduğu gibi (en fazla 8 MB) `data` dalında
`belgeler/<yıl>/<işlem id>/` altına yazılır; kayıtta yalnızca yol ve boyut tutulur (`db.json` büyümez).
Okuma ve yazma her zaman token ile GitHub API üzerinden yapılır; **repo özel olsa da çalışır**.
Silinen işlemlerin dosyaları repoda kalır (geçmiş için); belge silme ise dosyayı da siler.

## Repoyu özele çevirme

Uygulama ve senkron değişmeden çalışır. Yalnızca bildirim fonksiyonu abonelik listesini raw URL'den okuduğu için
Vercel'e `GITHUB_TOKEN` (fine-grained, yalnızca bu repo, Contents: Read) ortam değişkeni eklenmeli; varsa API üzerinden okur.

## Anlık bildirimler (Web Push)

Bir ürünün satılabilir miktarı uyarı eşiğinin altına düştüğünde veya tükendiğinde, değişikliği yapan cihaz
olayı üretir ve Vercel'deki `api/notify.js` üzerinden **tüm abone telefonlara** anında bildirim gider
(uygulama kapalıyken de). Zamanlanmış görev yoktur; bildirim olaya bağlıdır.

Parçalar:
- `app/public/sw.js` – `push` ve `notificationclick` olayları.
- `app/src/store/push.js` – abone ol / kaldır; abonelikler `data` dalındaki `push-subscriptions.json` dosyasına yazılır (GitHub token'ı ile).
- `app/src/store/alerts.js` – yerel değişiklik sonrası yeni ortaya çıkan durumlar (şimdilik: stok azaldı / tükendi).
- `api/notify.js` – aktarıcı. `POST {from, title, body, url, tag}`: `from` kayıtlı bir abonelik olmalı (yetki). `GET ?endpoint=` test bildirimi.

Kurulum (bir kez, Vercel panelinde → Settings → Environment Variables):
- `VAPID_PUBLIC_KEY` = `app/src/push-config.js` içindeki açık anahtar
- `VAPID_PRIVATE_KEY` = eşleşen özel anahtar (repoya konmaz)
- `VAPID_SUBJECT` = `mailto:...` (isteğe bağlı)

Sonra her telefonda: Ayarlar → **Anlık Bildirimler** → *Bildirimleri Aç* → *Test Bildirimi Gönder*.
iPhone'da önce Safari → Paylaş → **Ana Ekrana Ekle**, uygulamayı ana ekrandan açıp sonra bildirimleri açın (iOS 16.4+).
Uyarı eşiği ürün kartındadır (Stok / Depo → ürüne dokun); 0 ise yalnızca tükenince bildirilir.

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
3. `data` dalı yoksa uygulama, içinde `db.json` ve bir `vercel.json` (`ignoreCommand: exit 0`) olan bağımsız bir dal olarak kendisi oluşturur;
   böylece Vercel veri commit'lerini derlemeye çalışmaz. Eski dallara bu dosya ilk açılışta otomatik eklenir.

Nasıl çalışır:
- Her değişiklik 1,5 sn sonra `db.json`'a commit edilir; commit geçmişi değişiklik geçmişidir.
- Açılışta ve uygulamaya geri dönüldüğünde uzaktaki sürüm kontrol edilir; yerelde bekleyen değişiklik yoksa uzaktaki uygulanır.
- İki cihaz aynı anda yazarsa kayıtlar **birleştirilir** (`src/store/merge.js`): listelerde id bazında birleşme, aynı kayıtta son düzenleyen kazanır, bir tarafta silinen kayıt geri gelmez, kasa ve stok diğer tarafın hareketleriyle düzeltilir.
- Çevrimdışıyken değişiklikler cihazda bekler, bağlantı gelince yazılır.
- Token yalnızca cihazda saklanır, uygulama paketine ve repoya girmez.

Ana sayfadaki bulut simgesi durumu gösterir: gri kapalı, yeşil güncel, turuncu bekleyen değişiklik, kırmızı hata.

Bulut senkron kapalıyken tüm veri yalnızca **cihazda** (`localStorage`) tutulur. İlk açılışta `src/store/seed.js` içindeki
örnek veri yüklenir. Ayarlar > Yedekleme ile JSON yedek alınıp geri yüklenebilir;
Ayarlar > **Tümünü Temizle** ile boş başlanır (ayarlar korunur), **Örnek Veriyi Yükle** ile demo veriye dönülür.

İleride gerçek bir veritabanına geçilirse yalnızca `src/store/github.js` ve `sync.jsx` değişir; ekranlar `useStore()` üzerinden çalıştığı için etkilenmez.

### Veri modeli (özet)

- `customers` – müşteri (ad, tür, telefon, il/ilçe, adres, renk, kısaltma, logo)
- `products` – ürün (mevcut stok, birim, birim fiyat, uyarı eşiği)
- `transactions` – hareket: `sale` (mal verildi; `items[]`, `dueDate`), `payment` (tahsilat), `visit`, `note`; `by` = giren kullanıcı
- `reserved` – depoda müşteriye ait ürünler
- `cash` / `cashMoves` – kasa hesapları ve hareketleri (`txId` ile hareketlere bağlı, `transferId` ile transfer çiftleri)
- `expenses` – benim ödemelerim
- `plannedVisits` – ziyaret planı
- `users` – kullanıcı listesi (tüm cihazlarda ortak)
- `tombstones` – silinen kayıt id'leri (birleştirme için)
- `settings` – firma, KDV, varsayılan vade, gecikme eşiği, fatura sırası

Eski tek ürünlü kayıtlar açılışta `items` biçimine çevrilir (`normalizeState`).

Müşteri bakiyesi, durumu (Aktif / Takipte / Gecikmiş) ve müşterideki ürünler hareketlerden
türetilir (`src/store/selectors.js`).

## Yapı

```
app/
├── public/           # manifest, ikonlar, service worker
└── src/
    ├── components/   # Icons, ui (TabBar, Sheet, DateField...), Splash, PinLock, BarChart
    ├── pages/        # her ekran bir dosya
    ├── store/        # seed, storage, store (reducer), selectors, github (API), sync, merge, pin
    ├── styles/       # global.css (tema değişkenleri)
    └── utils/        # format (para, tarih)
```
