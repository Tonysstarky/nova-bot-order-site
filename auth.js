const COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 8;

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlText(text) { return b64url(new TextEncoder().encode(text)); }
function fromB64url(s) { return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0)); }
async function sign(data, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}
async function makeSession(secret) {
  const exp = Math.floor(Date.now()/1000) + MAX_AGE;
  const payload = b64urlText(JSON.stringify({ role:'admin', exp }));
  const sig = b64url(await sign(payload, secret));
  return `${payload}.${sig}`;
}
async function verifySession(token, secret) {
  if (!token || !secret) return false;
  const [payload, sig] = token.split('.'); if (!payload || !sig) return false;
  try {
    const expected = await sign(payload, secret);
    const got = fromB64url(sig);
    if (expected.length !== got.length) return false;
    let diff = 0; for(let i=0;i<expected.length;i++) diff |= expected[i]^got[i];
    if(diff !== 0) return false;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.role==='admin' && Number(data.exp) > Math.floor(Date.now()/1000);
  } catch { return false; }
}
function readCookie(request,name) {
  const raw = request.headers.get('Cookie') || '';
  const hit = raw.split(';').map(s=>s.trim()).find(v=>v.startsWith(name+'='));
  return hit ? hit.slice(name.length+1) : null;
}
function cookieHeader(value,maxAge=MAX_AGE) { return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`; }
async function requireAdmin(request, env) {
  const ok = await verifySession(readCookie(request, COOKIE), env.ADMIN_PASSWORD);
  return ok;
}
export { COOKIE, MAX_AGE, makeSession, verifySession, readCookie, cookieHeader, requireAdmin };
