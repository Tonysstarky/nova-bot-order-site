# NOVA BOT — gerçek sipariş sitesi + gizli admin paneli

Bu proje Cloudflare Pages üzerinde çalışacak şekilde hazırlanmış, müşteri sitesi ile özel admin panelinden oluşan bağımsız bir sipariş sistemidir.

## Akış

`Müşteri sitesi → Pages Function → D1 / R2 → Admin paneli`

Bot API'si, Discord, Telegram ve webhook bağlantısı **yoktur**. Site sadece siparişleri toplar ve yöneticinin panelinde gösterir.

## Müşteri tarafı

- Modern, mobil uyumlu, animasyonlu vitrin
- Gerçek ürün kartları ve otomatik adet/toplam hesaplama
- Ödeme yöntemi seçimi
- Ödeme referansı alanı
- PNG/JPG/WEBP dekont yükleme (5 MB)
- Sipariş oluşturulduğunda benzersiz sipariş numarası
- Açıklama, güvenlik ve ödeme bilgileri

Ürün ve ödeme yöntemlerini `public/site-config.js` içinden değiştir.

## Admin tarafı

Admin URL'si: `/admin/`

- Sunucu tarafı parola kontrolü
- 8 saatlik imzalı HttpOnly + Secure + SameSite oturumu
- Bekleyen / tamamlanan / iptal durumları
- Arama ve durum filtresi
- Ciro özeti
- Dekont görüntüleme
- Sipariş silme
- CSV dışa aktarma

Production'da admin parolasını Cloudflare **Secret** olarak `ADMIN_PASSWORD` adıyla tanımla. Bu sürümde istenen parola `tony1984`.

## Cloudflare kurulumu

1. Bu klasörü GitHub'a yükle.
2. Cloudflare Dashboard → Workers & Pages → Pages üzerinden repo'yu bağla.
3. Build command boş bırakılabilir; build output directory `public`.
4. Pages → Settings → Bindings bölümünden bir D1 database'i `DB` adıyla bağla.
5. Bir R2 bucket'i `PROOFS` adıyla bağla.
6. D1 üzerinde `schema.sql` dosyasını çalıştır.
7. Settings → Variables and Secrets bölümünde **Secret** olarak `ADMIN_PASSWORD=tony1984` oluştur.
8. Yeni deploy yap.

Cloudflare Pages Functions, kökteki `/functions` klasörünü otomatik route eder; D1 ve R2 kaynakları Pages Functions binding olarak kullanılabilir. citeturn688296search0turn688296search1

Cloudflare config kullanıyorsan `wrangler.toml` içindeki `pages_build_output_dir = "./public"` alanının gerçek Pages proje ayarınla aynı olduğundan emin ol. Cloudflare, deploy öncesi dashboard ayarlarıyla Wrangler config'inin uyumlu olmasını özellikle öneriyor. citeturn688296search3turn688296search4

## Yerel geliştirme

`.dev.vars.example` dosyasını `.dev.vars` olarak kopyala. Sonra Cloudflare'ın güncel Wrangler sürümüyle:

```bash
npx wrangler pages dev public
```

## Dosya yapısı

```text
public/                 müşteri sitesi
public/admin/           gizli yönetici arayüzü
functions/api/          API endpoint'leri
functions/_lib/auth.js  admin oturumu
schema.sql              D1 tablo yapısı
wrangler.toml           Pages ayarı
```

## Önemli

Bu paket gerçek para çekimi yapan bir ödeme gateway'i değildir. Havale/SEPA, PayPal veya kripto gibi yöntemi müşteriden seçtirir, referansı ve isteğe bağlı dekontu siparişe kaydeder. Gerçek otomatik ödeme almak için ayrıca seçilecek sağlayıcının resmi API entegrasyonu gerekir.
