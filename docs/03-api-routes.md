# 03 — API Routes

All Cloudflare Worker endpoints for movie-tracker.

Base URL: `https://movie-tracker.workers.dev`

---

## Auth Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Login, receive JWT cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Get current logged-in user info |

### POST `/api/auth/register`
```
Body: { username, password }
Returns: { user: { id, username } }
Errors: 400 (username taken), 400 (password too short)
```

### POST `/api/auth/login`
```
Body: { username, password }
Returns: { user: { id, username } }
Sets: HTTP-only JWT cookie
Errors: 401 (wrong credentials)
```

---

## User / Profile Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/users/:username` | Get public profile data |
| PATCH | `/api/users/me` | Update own profile (bio, avatar, quote) |
| GET | `/api/users/:username/followers` | Get follower list |
| GET | `/api/users/:username/following` | Get following list |
| POST | `/api/users/:username/follow` | Follow a user |
| DELETE | `/api/users/:username/follow` | Unfollow a user |

---

## Film Log Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/logs/:username` | Get all film logs for a user |
| POST | `/api/logs` | Log a new film (auth required) |
| PATCH | `/api/logs/:logId` | Edit a log entry (auth required) |
| DELETE | `/api/logs/:logId` | Delete a log entry (auth required) |

### POST `/api/logs`
```
Body: { tmdb_id, watched_date, rating, review }
Returns: { log: { id, tmdb_id, watched_date, rating, created_at } }
Note: review is stored but never returned to other users
```

### GET `/api/logs/:username`
```
Query params: year, genre, sort (date|rating|title), order (asc|desc)
Returns: [ { log_id, tmdb_id, title, poster_path, watched_date, rating } ]
Note: review field excluded from response for other users
```

---

## Feed Route

| Method | Route | Description |
|---|---|---|
| GET | `/api/feed` | Get home feed (auth required) |

### GET `/api/feed`
```
Query params: cursor (for pagination), limit (default 20)
Returns: [ { user: { username, avatar }, log: { tmdb_id, title, poster_path, rating, watched_date } } ]
Sorted: newest first
```

---

## Stats Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/stats/:username` | Get full stats for a user |

### GET `/api/stats/:username`
```
Query params: year (default current year)
Returns: {
  total_this_year,
  total_all_time,
  average_rating,
  by_month: [ { month, count } ],
  by_genre: [ { genre, count } ],
  by_decade: [ { decade, count } ],
  heatmap: [ { date, count } ],
  longest_streak
}
```

---

## Favourites Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/favourites/:username` | Get user's favourite films |
| POST | `/api/favourites` | Add a film to favourites (auth) |
| DELETE | `/api/favourites/:tmdb_id` | Remove from favourites (auth) |
| PATCH | `/api/favourites/reorder` | Reorder favourites list (auth) |

---

## TMDB Proxy Route

| Method | Route | Description |
|---|---|---|
| GET | `/api/tmdb/search?q=:query` | Search TMDB (proxied through Worker) |
| GET | `/api/tmdb/film/:tmdb_id` | Get full film details |

> TMDB API key is stored as a Cloudflare Worker secret — never exposed to the client.

---

## Response Format

All responses follow this envelope:

```
Success:
{ data: { ... }, error: null }

Error:
{ data: null, error: { message: "...", code: 400 } }
```

---

## Auth Middleware

All protected routes check for a valid JWT cookie.

If missing or expired:
```
{ data: null, error: { message: "Unauthorised", code: 401 } }
```
