import { requireAdmin } from '../_lib/auth.js';

const MAX_PROOF = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/png','image/jpeg','image/webp']);
const PRODUCTS = {
  basic: { name:'Basic Paket', price:19 },
  pro: { name:'Pro Paket', price:39 },
  premium: { name:'Premium Paket', price:69 }
};
const PAYMENT_METHODS = new Set(['bank','paypal','crypto']);
const PAYMENT_LABELS = { bank:'Banka Havalesi / SEPA', paypal:'PayPal', crypto:'USDT / Kripto' };

function json(data, status=200, extraHeaders={}) {
  return Response.json(data, { status, headers:{ 'Cache-Control':'no-store', ...extraHeaders } });
}

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({error:'Yetkisiz.'},401);
  if (!env.DB) return json({error:'D1 DB binding yok.'},500);
  const { results = [] } = await env.DB.prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 500`).all();
  return json({ orders: results });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({error:'D1 DB binding yok.'},500);
  const form = await request.formData().catch(()=>null);
  if (!form) return json({error:'Form okunamadı.'},400);

  const customerName = String(form.get('customerName') || '').trim();
  const contact = String(form.get('contact') || '').trim();
  const product = String(form.get('product') || '').trim();
  const rawQuantity = Number(form.get('quantity') || 1);
  const quantity = Math.max(1, Math.min(99, Number.isFinite(rawQuantity) ? Math.floor(rawQuantity) : 1));
  const paymentMethod = String(form.get('paymentMethod') || '').trim();
  const paymentReference = String(form.get('paymentReference') || '').trim();
  const note = String(form.get('note') || '').trim();
  const rawProof = form.get('proof');

  if (!customerName || !contact || !product || !paymentMethod) return json({error:'Zorunlu alanları doldur.'},400);
  if (!PRODUCTS[product]) return json({error:'Geçersiz ürün seçimi.'},400);
  if (!PAYMENT_METHODS.has(paymentMethod)) return json({error:'Geçersiz ödeme yöntemi.'},400);
  if (customerName.length > 80 || contact.length > 120 || paymentReference.length > 120 || note.length > 600) return json({error:'Alanlardan biri izin verilen uzunluğu aşıyor.'},400);

  const hasFile = rawProof && typeof rawProof.arrayBuffer === 'function' && rawProof.size > 0;
  if (hasFile && rawProof.size > MAX_PROOF) return json({error:'Ekran görüntüsü 5 MB altında olmalı.'},400);
  if (hasFile && !allowedTypes.has(rawProof.type)) return json({error:'Sadece PNG, JPG veya WEBP yükleyebilirsin.'},400);

  const catalogItem = PRODUCTS[product];
  const total = catalogItem.price * quantity;
  const orderId = crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
  let proofKey = null;

  if (hasFile) {
    if (!env.PROOFS) return json({error:'R2 PROOFS binding yok. Ekran görüntüsü özelliği için R2 bağla.'},500);
    const ext = rawProof.type === 'image/png' ? 'png' : rawProof.type === 'image/webp' ? 'webp' : 'jpg';
    proofKey = `${new Date().toISOString().slice(0,10)}/${orderId}.${ext}`;
    await env.PROOFS.put(proofKey, await rawProof.arrayBuffer(), {
      httpMetadata:{ contentType:rawProof.type, cacheControl:'private, no-store' }
    });
  }

  try {
    await env.DB.prepare(`INSERT INTO orders (id, customer_name, contact, product_id, product_name, quantity, unit_price, total, payment_method, payment_reference, note, proof_key, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`)
      .bind(orderId, customerName, contact, product, catalogItem.name, quantity, catalogItem.price, total, PAYMENT_LABELS[paymentMethod], paymentReference, note, proofKey).run();
  } catch (err) {
    if (proofKey && env.PROOFS) await env.PROOFS.delete(proofKey).catch(()=>{});
    return json({error:'Sipariş kaydedilemedi. Lütfen tekrar dene.'},500);
  }

  return json({ ok:true, orderId },201);
}
