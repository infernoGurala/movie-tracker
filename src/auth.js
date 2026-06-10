import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { query } from './db.js';
import { jsonResponse, errorResponse } from './utils/response.js';
import { authenticate } from './middleware.js';

function getEncoder() {
  return new TextEncoder().encode(globalThis.JWT_SECRET || '');
}

function setCookie(jwt) {
  return `session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
}

function clearCookie() {
  return `session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function handleRegister(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
      return errorResponse('Username must be 3+ characters, lowercase, no spaces', 400);
    }

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    const existing = await query('GET', 'users', {
      select: 'id',
      where: { username },
      single: true,
    });

    if (existing) {
      return errorResponse('Username is already taken', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await query('POST', 'users', {
      select: 'id,username',
      data: { username, password_hash: passwordHash, display_name: username },
      single: true,
    });

    const jwt = await new SignJWT({ sub: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getEncoder());

    return new Response(JSON.stringify({ data: { user: { id: user.id, username: user.username } }, error: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie(jwt),
      },
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleLogin(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    const user = await query('GET', 'users', {
      select: 'id,username,password_hash,display_name,avatar_url,bio,favourite_quote',
      where: { username },
      single: true,
    });

    if (!user) {
      return errorResponse('Username or password is incorrect', 401);
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return errorResponse('Username or password is incorrect', 401);
    }

    const jwt = await new SignJWT({ sub: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getEncoder());

    return new Response(JSON.stringify({
      data: {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          favourite_quote: user.favourite_quote,
        },
      },
      error: null,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie(jwt),
      },
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function handleLogout() {
  return new Response(JSON.stringify({ data: { success: true }, error: null }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie(),
    },
  });
}

export async function handleMe(request) {
  const user = await authenticate(request);
  if (!user) {
    return errorResponse('Unauthorised', 401);
  }

  const profile = await query('GET', 'users', {
    select: 'id,username,display_name,avatar_url,bio,favourite_quote,created_at',
    where: { id: user.userId },
    single: true,
  });

  if (!profile) {
    return errorResponse('User not found', 404);
  }

  return jsonResponse({ user: profile });
}
