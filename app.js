(() => {
  const cfg = window.SITE_CONFIG || { brandName: 'NOVA BOT', products: [], paymentMethods: [] };
  const $ = (s) => document.querySelector(s);
  const money = (n) => `${cfg.currency || '€'}${Number(n || 0).toFixed(2)}`;

  document.querySelectorAll('[data-site-name]').forEach(el => el.textContent = cfg.brandName);
  $('#year').textContent = new Date().getFullYear();

  const productGrid = $('#product-grid');
  const productSelect = $('#product-select');
  const paymentGrid = $('#payment-grid');
  const paymentSelect = $('#payment-select');
  const paymentHelp = $('#payment-help');
  const quantity = $('#quantity');
  const proof = $('#proof');
  const proofName = $('#proof-name');
  const summaryProduct = $('#summary-product');
  const summaryQty = $('#summary-qty');
  const summaryTotal = $('#summary-total');

  cfg.products.forEach((p, i) => {
    productGrid.insertAdjacentHTML('beforeend', `
      <article class="product-card reveal">
        <div class="product-top"><span class="product-icon">${escapeHtml(p.icon)}</span><span class="payment-badge">${escapeHtml(p.badge || (i === 1 ? 'POPÜLER' : 'SİPARİŞ'))}</span></div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <div class="price"><b>${money(p.price)}</b><small>/ paket</small></div>
        <button type="button" class="btn btn-ghost card-btn" data-product="${escapeHtml(p.id)}">Bu paketi seç <span>→</span></button>
      </article>`);
    productSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} — ${money(p.price)}</option>`);
  });

  cfg.paymentMethods.forEach(pm => {
    paymentGrid.insertAdjacentHTML('beforeend', `
      <article class="payment-card reveal"><span class="payment-icon">${escapeHtml(pm.icon)}</span><h3>${escapeHtml(pm.name)}</h3><p>${escapeHtml(pm.note)}</p><small class="payment-tag">SİPARİŞE EKLENİR</small></article>`);
    paymentSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(pm.id)}">${escapeHtml(pm.name)}</option>`);
  });

  function selectedProduct() {
    return cfg.products.find(p => p.id === productSelect.value) || cfg.products[0];
  }
  function selectedPayment() {
    return cfg.paymentMethods.find(p => p.id === paymentSelect.value) || cfg.paymentMethods[0];
  }
  function updateSummary() {
    const p = selectedProduct();
    const qty = Math.max(1, Math.min(99, Number(quantity.value) || 1));
    quantity.value = qty;
    summaryProduct.textContent = p ? p.name : '—';
    summaryQty.textContent = qty;
    summaryTotal.textContent = money((p ? p.price : 0) * qty);
    const pm = selectedPayment();
    paymentHelp.innerHTML = pm ? `<span>ⓘ</span><div><strong>${escapeHtml(pm.name)}</strong><p>${escapeHtml(pm.help || pm.note || '')}</p></div>` : '';
  }
  updateSummary();

  document.addEventListener('click', e => {
    const productBtn = e.target.closest('[data-product]');
    if (productBtn) {
      productSelect.value = productBtn.dataset.product;
      updateSummary();
      $('#siparis').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => $('#customerName')?.focus(), 500);
      return;
    }
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      const next = Number(quantity.value || 1) + (qtyBtn.dataset.qty === 'plus' ? 1 : -1);
      quantity.value = Math.max(1, Math.min(99, next));
      updateSummary();
    }
  });
  productSelect.addEventListener('change', updateSummary);
  paymentSelect.addEventListener('change', updateSummary);
  quantity.addEventListener('input', updateSummary);
  proof.addEventListener('change', () => {
    const file = proof.files?.[0];
    proofName.textContent = file ? `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PNG / JPG / WEBP • maksimum 5 MB';
  });

  $('#order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = $('#form-message');
    const submit = $('#submit-text');
    const submitBtn = $('#submit-btn');
    msg.className = 'form-message'; msg.textContent = '';
    const file = proof.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) { msg.className = 'form-message error'; msg.textContent = 'Ekran görüntüsü 5 MB altında olmalı.'; return; }

    submit.textContent = 'Gönderiliyor…';
    submitBtn.disabled = true;
    try {
      const fd = new FormData(form);
      const res = await fetch('/api/orders', { method: 'POST', body: fd, credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Sipariş gönderilemedi.');
      msg.className = 'form-message success';
      msg.innerHTML = `Sipariş başarıyla alındı. <strong>#${escapeHtml(data.orderId)}</strong> numaranı sakla.`;
      form.reset(); productSelect.selectedIndex = 0; paymentSelect.selectedIndex = 0; quantity.value = 1; proofName.textContent = 'PNG / JPG / WEBP • maksimum 5 MB';
      updateSummary();
    } catch (err) {
      msg.className = 'form-message error'; msg.textContent = err.message || 'Bir hata oluştu.';
    } finally {
      submit.textContent = 'Siparişi Gönder';
      submitBtn.disabled = false;
    }
  });

  function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
})();
