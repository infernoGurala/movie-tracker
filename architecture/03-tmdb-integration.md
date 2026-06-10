# 03 — TMDB Integration

How movie-tracker uses The Movie Database (TMDB) API.

---

## Overview

TMDB provides all real film data: posters, titles, release years, genres, cast, ratings, runtime.

The TMDB API key is **never exposed to the client**. All TMDB calls are proxied through the Cloudflare Worker.

- TMDB API Docs: https://developer.themoviedb.org/docs
- Free tier: 40 requests/second — more than enough
- Base URL: `https://api.themoviedb.org/3`
- Image CDN: `https://image.tmdb.org/t/p/`

---

## API Key Setup

1. Register at https://www.themoviedb.org/
2. Go to Settings → API → Request API key (free)
3. Store as Cloudflare Worker Secret: `TMDB_API_KEY`

---

## Endpoints Used

### 1. Search Films

Used when a user types in the search bar.

```
GET https://api.themoviedb.org/3/search/movie
  ?query=inception
  &include_adult=false
  &language=en-US
  &page=1
  &api_key=YOUR_KEY
```

**Response (simplified):**
```json
{
  "results": [
    {
      "id": 27205,
      "title": "Inception",
      "release_date": "2010-07-16",
      "poster_path": "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      "vote_average": 8.365,
      "vote_count": 36247,
      "genre_ids": [28, 878, 53]
    }
  ]
}
```

### 2. Film Details

Used when opening the Film Detail modal.

```
GET https://api.themoviedb.org/3/movie/27205
  ?append_to_response=credits
  &api_key=YOUR_KEY
```

**Response includes:**
- Full details (title, overview, runtime, genres)
- Backdrop image path
- Credits (top cast names)

---

## Image URLs

TMDB images are served from their CDN. Poster path must be combined with a base URL and a size.

**Sizes used in this app:**

| Usage | Size Code | Dimensions |
|---|---|---|
| Search dropdown | `w92` | 92px wide |
| Film card (sm) | `w154` | 154px wide |
| Film card (md/lg) | `w342` | 342px wide |
| Film detail view | `w500` | 500px wide |
| Backdrop | `w1280` | 1280px wide |

**Example:**
```
https://image.tmdb.org/t/p/w342/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg
```

---

## Caching Strategy

TMDB data is cached at **log time** to avoid repeated API calls.

When a user logs a film, the Worker fetches full TMDB details and stores these fields directly in the `film_logs` table:

- `title`
- `poster_path`
- `release_year`
- `genres` (array of genre names)
- `runtime_minutes`

**Why cache?**
- Film details rarely change
- Avoids hitting TMDB on every profile/feed load
- Allows the app to work even if TMDB is temporarily unreachable

**What is NOT cached:**
- TMDB vote average (fetched live in film detail modal)
- Cast details (fetched live in film detail modal)

---

## Proxy Route in the Worker

The Worker exposes two TMDB proxy endpoints:

### Search Proxy
```
GET /api/tmdb/search?q=inception

Worker:
  1. Extract q from query params
  2. Call TMDB search endpoint with API key
  3. Map response to simplified format:
     { id, title, year, poster_path, rating }
  4. Return to client
```

### Film Detail Proxy
```
GET /api/tmdb/film/27205

Worker:
  1. Extract tmdb_id from path
  2. Call TMDB /movie/:id?append_to_response=credits
  3. Map to full detail format
  4. Return to client
```

**TMDB API key is injected server-side — never sent to the browser.**

---

## Genre ID Map

TMDB returns genre IDs, not names. The Worker maps IDs to names using this static map (no extra API call needed):

| ID | Genre |
|---|---|
| 28 | Action |
| 12 | Adventure |
| 16 | Animation |
| 35 | Comedy |
| 80 | Crime |
| 99 | Documentary |
| 18 | Drama |
| 10751 | Family |
| 14 | Fantasy |
| 36 | History |
| 27 | Horror |
| 10402 | Music |
| 9648 | Mystery |
| 10749 | Romance |
| 878 | Science Fiction |
| 10770 | TV Movie |
| 53 | Thriller |
| 10752 | War |
| 37 | Western |

---

## Rate Limits & Error Handling

- TMDB free tier: ~40 requests/second
- If TMDB returns 429 (rate limited): return cached data if available, else return empty results with error message
- If TMDB returns 404: return `{ error: "Film not found" }`
- Network failures: return last cached result or empty state

---

## Languages

TMDB supports worldwide films in all languages.

- Default search language: `en-US` (English titles + descriptions)
- TMDB has titles and posters in Telugu, Hindi, Korean, Japanese, and many others
- Future improvement: let users set a preferred language for metadata
