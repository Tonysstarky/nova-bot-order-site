import { requireAdmin } from '../../_lib/auth.js';
export async function onRequestGet({ request, env, params }) {
  if (!await requireAdmin(request, env)) return new Response('Unauthorized',{status:401});
  if (!env.PROOFS) return new Response('R2 not configured',{status:500});
  const raw = params.key;
  const key = Array.isArray(raw) ? raw.join('/') : String(raw || '');
  if (!key || key.includes('..')) return new Response('Not found',{status:404});
  const object = await env.PROOFS.get(key);
  if (!object) return new Response('Not found',{status:404});
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set('Cache-Control','private, no-store'); headers.set('Content-Disposition','inline');
  return new Response(object.body,{headers});
}
