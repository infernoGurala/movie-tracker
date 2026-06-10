import { jwtVerify } from 'jose';

function getEncoder() {
  return new TextEncoder().encode(globalThis.JWT_SECRET || '');
}

export async function authenticate(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  try {
    const { payload } = await jwtVerify(match[1], getEncoder());
    return { userId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export async function requireAuth(request) {
  const user = await authenticate(request);
  if (!user) {
    return new Response(JSON.stringify({
      data: null,
      error: { message: 'Unauthorised', code: 401 },
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
