# 02 — Auth Flow

Authentication logic for movie-tracker using Cloudflare Workers.

---

## Overview

Simple username + password auth. No OAuth, no magic links, no email verification.

**Technologies used:**
- `bcryptjs` — password hashing
- `jose` — JWT signing and verification
- HTTP-only cookie — session storage

---

## Registration Flow

```
Client                          Worker                      Supabase
  │                               │                              │
  │  POST /api/auth/register      │                              │
  │  { username, password }       │                              │
  │ ─────────────────────────── ► │                              │
  │                               │  Validate input              │
  │                               │  (username format,           │
  │                               │   password min 8 chars)      │
  │                               │                              │
  │                               │  SELECT * FROM users         │
  │                               │  WHERE username = ?  ─────► │
  │                               │ ◄─────────────────────────── │
  │                               │  (check for duplicate)       │
  │                               │                              │
  │                               │  Hash password with bcrypt   │
  │                               │  (cost factor: 10)           │
  │                               │                              │
  │                               │  INSERT INTO users ────────► │
  │                               │ ◄─────────────────────────── │
  │                               │  { id, username }            │
  │                               │                              │
  │                               │  Sign JWT                    │
  │                               │  payload: { sub: user.id,    │
  │                               │   username, exp: 30d }       │
  │                               │                              │
  │ ◄─────────────────────────── │                              │
  │  200 { user }                 │                              │
  │  Set-Cookie: session=<jwt>    │                              │
```

---

## Login Flow

```
Client                          Worker                      Supabase
  │                               │                              │
  │  POST /api/auth/login         │                              │
  │  { username, password }       │                              │
  │ ─────────────────────────── ► │                              │
  │                               │  SELECT * FROM users         │
  │                               │  WHERE username = ?  ─────► │
  │                               │ ◄─────────────────────────── │
  │                               │                              │
  │                               │  bcrypt.compare(             │
  │                               │    password,                 │
  │                               │    user.password_hash)       │
  │                               │                              │
  │                               │  If mismatch → 401           │
  │                               │                              │
  │                               │  Sign JWT                    │
  │                               │                              │
  │ ◄─────────────────────────── │                              │
  │  200 { user }                 │                              │
  │  Set-Cookie: session=<jwt>    │                              │
```

---

## Cookie Configuration

```
Set-Cookie: session=<jwt_token>;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Path=/;
  Max-Age=2592000  (30 days)
```

- `HttpOnly` — JS cannot read the cookie (XSS protection)
- `Secure` — only sent over HTTPS
- `SameSite=Lax` — CSRF protection
- 30 day expiry

---

## JWT Payload

```json
{
  "sub": "uuid-of-user",
  "username": "johnmoses",
  "iat": 1700000000,
  "exp": 1702592000
}
```

JWT is signed with a secret stored as a Cloudflare Worker Secret (`JWT_SECRET`).

---

## Auth Middleware (used on protected routes)

Every protected Worker route runs this before handler logic:

```
1. Read cookie: session=<token>
2. If missing → return 401
3. Verify JWT signature with JWT_SECRET
4. Check exp claim — if expired → return 401
5. Attach { userId, username } to request context
6. Proceed to handler
```

---

## Logout Flow

```
POST /api/auth/logout

Worker:
  → Set-Cookie: session=; Max-Age=0; HttpOnly; Secure; Path=/
  → Return 200 { success: true }
```

Clears the cookie. JWT is not explicitly invalidated (stateless) — expiry handles it.

---

## Password Rules

- Minimum 8 characters
- No maximum (bcrypt truncates at 72 chars internally — fine for normal passwords)
- No complexity requirements (keep it simple)
- Stored only as bcrypt hash — never in plaintext

---

## Security Considerations

| Threat | Mitigation |
|---|---|
| XSS reading session | HttpOnly cookie — JS cannot access |
| CSRF attacks | SameSite=Lax cookie policy |
| Brute force login | Rate limit: 10 login attempts / minute / IP |
| Password exposure | bcrypt hash only — raw password never stored |
| JWT secret exposure | Stored as Cloudflare Worker Secret (env var) |
| Expired sessions | JWT exp claim — auto-expires after 30 days |

---

## Cloudflare Worker Secrets Required

| Secret Name | Value |
|---|---|
| `JWT_SECRET` | Random 256-bit string |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `TMDB_API_KEY` | Your TMDB API key |
