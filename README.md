# NOVA BOT — single upload version

GitHub web uploader ile klasör derdi olmadan yayınlamak için bu sürümde müşteri sitesi, admin paneli, CSS/JS ve API tek `worker.js` dosyasında toplandı.

## Cloudflare
- Deploy command: `npx wrangler deploy`
- D1 binding: `DB`
- R2 bucket binding: `PROOFS`
- Secret: `ADMIN_PASSWORD`

## D1
`schema.sql` dosyasını D1 database'e uygula.

Admin: `/admin/`
