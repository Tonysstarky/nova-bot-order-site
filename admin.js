(() => {
  const $ = s => document.querySelector(s);
  let orders = [];
  const statusLabels = { pending:'Bekliyor', paid:'Tamamlandı', cancelled:'İptal' };
  const cfg = window.SITE_CONFIG || { brandName:'NOVA BOT', currency:'€' };

  async function request(url, options = {}) {
    const res = await fetch(url, { credentials:'same-origin', cache:'no-store', ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.error || 'İşlem başarısız.'); err.status = res.status; throw err; }
    return data;
  }
  async function init() {
    try { const s = await request('/api/session'); s.authenticated ? showPanel() : showLogin(); }
    catch { showLogin(); }
  }
  function showLogin(){ $('#login-view').classList.remove('hidden'); $('#panel-view').classList.add('hidden'); $('#password').focus(); }
  function showPanel(){ $('#login-view').classList.add('hidden'); $('#panel-view').classList.remove('hidden'); loadOrders(); }

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    $('#login-message').textContent='';
    const button = $('#login-form button'); button.disabled = true;
    try { await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#password').value})}); $('#password').value=''; showPanel(); }
    catch(err){ $('#login-message').textContent=err.message; }
    finally { button.disabled = false; }
  });
  $('#logout-btn').addEventListener('click', async()=>{ await request('/api/logout',{method:'POST'}).catch(()=>{}); showLogin(); });
  $('#refresh-btn').addEventListener('click', loadOrders);
  $('#search').addEventListener('input', renderOrders);
  $('#status-filter').addEventListener('change', renderOrders);
  $('#export-btn').addEventListener('click', exportCsv);

  async function loadOrders(){
    $('#orders-list').innerHTML='<div class="empty">Siparişler yükleniyor…</div>';
    try { const data = await request('/api/orders'); orders = data.orders || []; updateStats(); renderOrders(); }
    catch(err){ if (err.status===401) return showLogin(); $('#orders-list').innerHTML=`<div class="empty">${escapeHtml(err.message)}</div>`; }
  }
  function updateStats(){
    $('#stat-total').textContent=orders.length;
    $('#stat-pending').textContent=orders.filter(o=>o.status==='pending').length;
    $('#stat-paid').textContent=orders.filter(o=>o.status==='paid').length;
    const revenue=orders.filter(o=>o.status==='paid').reduce((s,o)=>s + Number(o.total||0),0);
    $('#stat-revenue').textContent=`${escapeHtml(cfg.currency || '€')}${revenue.toFixed(2)}`;
  }
  function renderOrders(){
    const q=$('#search').value.trim().toLowerCase();
    const status=$('#status-filter').value;
    const list=orders.filter(o=>{
      const hay=[o.id,o.customer_name,o.contact,o.product_name,o.payment_method,o.payment_reference,o.note].join(' ').toLowerCase();
      return (!q || hay.includes(q)) && (status==='all' || o.status===status);
    });
    if(!list.length){$('#orders-list').innerHTML='<div class="empty">Gösterilecek sipariş yok.</div>';return;}
    $('#orders-list').innerHTML=list.map(o=>`<div class="order-row">
      <div class="customer"><span class="order-id">#${escapeHtml(o.id)}</span><strong>${escapeHtml(o.customer_name)}</strong><small>${escapeHtml(o.contact)}</small></div>
      <div><span class="product-name">${escapeHtml(o.product_name)}</span><span class="order-meta">${Number(o.quantity)} adet • ${escapeHtml(cfg.currency || '€')}${Number(o.total||0).toFixed(2)}</span></div>
      <div><span class="payment-name">${escapeHtml(o.payment_method)}</span><span class="order-meta">${escapeHtml(o.payment_reference || 'Referans yok')}</span></div>
      <div>${statusSelect(o)}</div>
      <div>${o.proof_key ? `<a class="proof-link" href="/api/proofs/${encodeURIComponent(o.proof_key)}" target="_blank" rel="noopener noreferrer">Dekontu aç ↗</a>` : '<span class="order-meta">Dekont yok</span>'}</div>
      <div class="row-actions"><button class="ghost" data-delete="${escapeHtml(o.id)}">Sil</button></div>
    </div>`).join('');
    document.querySelectorAll('[data-status]').forEach(el=>el.addEventListener('change',()=>updateStatus(el.dataset.status, el.value)));
    document.querySelectorAll('[data-delete]').forEach(el=>el.addEventListener('click',()=>deleteOrder(el.dataset.delete)));
  }
  function statusSelect(o){ return `<select data-status="${escapeHtml(o.id)}" class="status ${escapeHtml(o.status)}">${Object.entries(statusLabels).map(([k,v])=>`<option value="${k}" ${o.status===k?'selected':''}>${v}</option>`).join('')}</select>`; }
  async function updateStatus(id,status){ try { await request(`/api/orders/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}); const o=orders.find(x=>String(x.id)===String(id)); if(o)o.status=status; updateStats(); renderOrders(); } catch(err){ alert(err.message); loadOrders(); } }
  async function deleteOrder(id){ if(!confirm(`#${id} siparişi silinsin mi?`))return; try{ await request(`/api/orders/${encodeURIComponent(id)}`,{method:'DELETE'}); orders=orders.filter(o=>String(o.id)!==String(id)); updateStats(); renderOrders(); }catch(err){alert(err.message)} }
  function exportCsv(){
    const headers=['Sipariş','Tarih','Müşteri','İletişim','Ürün','Adet','Toplam','Ödeme','Referans','Durum','Not'];
    const rows=orders.map(o=>[o.id,o.created_at,o.customer_name,o.contact,o.product_name,o.quantity,o.total,o.payment_method,o.payment_reference||'',statusLabels[o.status]||o.status,o.note||'']);
    const csv='\uFEFF'+[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url;a.download=`nova-bot-siparisler-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  init();
})();
