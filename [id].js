import { requireAdmin } from '../../_lib/auth.js';
export async function onRequestPatch({ request, env, params }) {
  if (!await requireAdmin(request, env)) return Response.json({error:'Yetkisiz.'},{status:401});
  const id = String(params.id || ''); const body = await request.json().catch(()=>({})); const status = String(body.status || '');
  if (!['pending','paid','cancelled'].includes(status)) return Response.json({error:'Geçersiz durum.'},{status:400});
  await env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(status,id).run(); return Response.json({ok:true});
}
export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return Response.json({error:'Yetkisiz.'},{status:401});
  const id=String(params.id||''); const row=await env.DB.prepare('SELECT proof_key FROM orders WHERE id=?').bind(id).first();
  await env.DB.prepare('DELETE FROM orders WHERE id=?').bind(id).run();
  if(row?.proof_key && env.PROOFS) await env.PROOFS.delete(row.proof_key).catch(()=>{});
  return Response.json({ok:true});
}
