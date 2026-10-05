# NOVA BOT — D1-only Worker

Cloudflare Worker olarak çalışır. Müşteri sitesi, gizli admin paneli ve sipariş API’si tek `worker.js` içindedir. Siparişler yalnızca Cloudflare D1 üzerinde tutulur; R2, dosya yükleme veya dekont depolaması kullanılmaz.

## Cloudflare bindings
- D1 binding: `DB` → ör. `nova-bot-db`
- Runtime secret: `ADMIN_PASSWORD` → `tony1984`

## Deploy
Cloudflare Workers Builds için deploy command: `npx wrangler deploy`

D1 veritabanına `schema.sql` içeriğini bir kez uygulayın.
