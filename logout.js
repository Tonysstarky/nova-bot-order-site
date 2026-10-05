export async function onRequestPost() {
  return Response.json({ ok:true }, { headers:{ 'Set-Cookie':'admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0', 'Cache-Control':'no-store' }});
}
