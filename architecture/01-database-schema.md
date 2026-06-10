# 01 — Database Schema

Supabase (PostgreSQL) tables for movie-tracker.

---

## Table: `users`

Stores all registered accounts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `username` | text | Unique, lowercase, no spaces |
| `password_hash` | text | bcrypt hash — never exposed via API |
| `display_name` | text | Nullable, defaults to username |
| `bio` | text | Nullable, max 200 chars |
| `favourite_quote` | text | Nullable, max 150 chars |
| `avatar_url` | text | Nullable, URL to image |
| `created_at` | timestamptz | Default: now() |

**Indexes:**
- Unique index on `username`

---

## Table: `film_logs`

Every film a user has logged as watched.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `tmdb_id` | integer | TMDB film ID |
| `title` | text | Cached from TMDB at log time |
| `poster_path` | text | Cached from TMDB (e.g. `/abc123.jpg`) |
| `release_year` | integer | Cached from TMDB |
| `genres` | text[] | Array of genre names, cached from TMDB |
| `runtime_minutes` | integer | Cached from TMDB |
| `watched_date` | date | When the user watched it |
| `rating` | smallint | 1–10, public |
| `review` | text | Private note, nullable, max 500 chars |
| `created_at` | timestamptz | When log was created |

**Indexes:**
- Index on `user_id`
- Index on `(user_id, watched_date)`
- Index on `tmdb_id`

**Notes:**
- TMDB data is cached at log time to avoid repeated API calls
- `review` is never returned in API responses to other users

---

## Table: `favourites`

Films a user has manually marked as a favourite.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `tmdb_id` | integer | TMDB film ID |
| `title` | text | Cached |
| `poster_path` | text | Cached |
| `release_year` | integer | Cached |
| `sort_order` | integer | Lower = shown first in showcase |
| `created_at` | timestamptz | When added |

**Indexes:**
- Index on `user_id`
- Unique constraint on `(user_id, tmdb_id)`

**Notes:**
- First 5 by `sort_order` = pinned showcase on profile
- Rest = expandable "all favourites" section

---

## Table: `follows`

Follow relationships between users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `follower_id` | uuid | FK → users.id (person who followed) |
| `following_id` | uuid | FK → users.id (person being followed) |
| `created_at` | timestamptz | When follow happened |

**Indexes:**
- Unique constraint on `(follower_id, following_id)`
- Index on `follower_id`
- Index on `following_id`

---

## Table: `sessions`

JWT session management (optional — can use stateless JWT only).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `token_hash` | text | Hashed JWT for revocation |
| `expires_at` | timestamptz | Session expiry |
| `created_at` | timestamptz | When session was created |

**Notes:**
- If using stateless JWT only, this table can be skipped
- Useful for "log out all devices" functionality later

---

## Relationships Diagram

```
users
  │
  ├── film_logs (user_id)
  │     └── many logs per user
  │
  ├── favourites (user_id)
  │     └── many favourites per user
  │
  └── follows
        ├── follower_id → users.id
        └── following_id → users.id
```

---

## Row Level Security (RLS) Policies

### `users` table
- SELECT: public (anyone can read profiles)
- UPDATE: only own row (`auth.uid() = id`)

### `film_logs` table
- SELECT (all columns except `review`): public
- SELECT (including `review`): only own rows
- INSERT: authenticated users only
- UPDATE/DELETE: only own rows

### `favourites` table
- SELECT: public
- INSERT/UPDATE/DELETE: only own rows

### `follows` table
- SELECT: public
- INSERT: authenticated, `follower_id = auth.uid()`
- DELETE: only own follows

---

## Key Queries

### Home Feed
```sql
SELECT
  u.username, u.avatar_url,
  fl.tmdb_id, fl.title, fl.poster_path,
  fl.rating, fl.watched_date
FROM film_logs fl
JOIN follows f ON f.following_id = fl.user_id
JOIN users u ON u.id = fl.user_id
WHERE f.follower_id = :current_user_id
ORDER BY fl.created_at DESC
LIMIT 20 OFFSET :cursor
```

### Yearly Stats
```sql
SELECT
  COUNT(*) as total,
  AVG(rating) as avg_rating,
  DATE_TRUNC('month', watched_date) as month
FROM film_logs
WHERE user_id = :user_id
  AND EXTRACT(YEAR FROM watched_date) = :year
GROUP BY month
ORDER BY month
```

### Heatmap Data
```sql
SELECT watched_date, COUNT(*) as count
FROM film_logs
WHERE user_id = :user_id
  AND watched_date >= :year_start
  AND watched_date <= :year_end
GROUP BY watched_date
```
