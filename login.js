import { makeSession, cookieHeader } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return Response.json({ error:'ADMIN_PASSWORD secret tanımlı değil.' }, { status:500, headers:{'Cache-Control':'no-store'} });
  const body = await request.json().catch(()=>({}));
  const supplied = String(body.password || '');
  if (supplied !== String(env.ADMIN_PASSWORD)) return Response.json({ error:'Parola hatalı.' }, { status:401, headers:{'Cache-Control':'no-store'} });
  const token = await makeSession(env.ADMIN_PASSWORD);
  return Response.json({ ok:true }, { headers:{ 'Set-Cookie': cookieHeader(token), 'Cache-Control':'no-store' }});
}
