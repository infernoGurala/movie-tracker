# 01 — Features

Full feature list for movie-tracker, grouped by area.

---

## 1. Authentication

- Username + password registration
- Login with session cookie (JWT)
- No OAuth, no email verification (keep it simple)
- Logout clears session
- Usernames are unique and public-facing (used in profile URLs: `/u/john`)

---

## 2. Film Search & Logging

### Search
- Search any film by title via TMDB API
- Results show: poster, title, release year, TMDB rating
- Worldwide films — not limited to any region or language

### Log a Film
- Click any search result → opens a log modal
- Fields:
  - ✅ Watched date (defaults to today)
  - ⭐ Personal rating (1–10 stars, **public**)
  - 📝 Short review / note (**private** — only you can see it)
- Once logged, film is added to the user's watchlist

### Edit / Delete a Log
- User can edit their rating, review, or watched date at any time
- User can remove a film from their watchlist

---

## 3. Public Profile Page

URL: `/u/:username`

### Header Section
- Profile picture (uploaded or default avatar)
- Display name + username
- Bio (short text, optional)
- Favourite quote (optional)
- Followers count · Following count
- Follow / Unfollow button (visible to other users)

### Favourite Films Showcase
- User manually pins up to 5 films as their "Top Films"
- Displayed as large posters in a horizontal strip
- "See all favourites" expands to show the full favourites list (30+ films)
- Favourites are separate from the watchlist — user explicitly adds to this list

### Stats Summary (on profile)
- Total films watched this year
- Total films watched all-time
- Average rating given

---

## 4. Watchlist Page

Accessible at `/u/:username/films`

- Grid of all logged films (poster-first layout, IMDB-style)
- Filter by: year watched, rating, genre
- Sort by: date watched, rating, film release year, title
- Each film card shows: poster, title, user's rating (stars)
- Click a film card → opens film detail view

---

## 5. Film Detail View

Opens as a modal or dedicated page.

Shows (from TMDB):
- Large backdrop image
- Poster
- Title, release year, runtime, genres
- TMDB rating + vote count
- Overview / synopsis
- Top cast

Shows (from user's log):
- User's personal rating
- Watched date
- Private review (only shown to the logged-in owner)

---

## 6. Stats Dashboard

Accessible at `/u/:username/stats`

### Yearly Stats
- Films watched per year (bar chart)
- Current year count highlighted

### Heatmap
- GitHub-style contribution heatmap
- Each square = one day, colour intensity = number of films watched that day
- Full year view

### Dashboard Stats
- Films by month (bar chart)
- Top genres watched (donut chart)
- Most watched decade (e.g. 2010s, 1990s)
- Average rating over time (line chart)
- Longest watching streak (days in a row)

---

## 7. Follow System

- Follow any public user
- Unfollow at any time
- `/u/:username/followers` — list of followers
- `/u/:username/following` — list of people they follow
- No private accounts — all profiles are public

---

## 8. Home Feed

URL: `/` (when logged in)

- Chronological activity feed from people you follow
- Each feed item shows:
  - User avatar + username
  - Film poster (small)
  - Film title
  - Their rating (stars)
  - Time ago ("2 hours ago")
- No reviews shown in feed (those are private)
- Infinite scroll or "Load more" pagination

---

## 9. Discover / Search Users

- Search users by username
- Visit any public profile directly via `/u/:username`

---

## 10. Settings

URL: `/settings`

- Change profile picture
- Edit display name, bio, favourite quote
- Change password
- Manage favourite films list (add/remove/reorder pins)

---

## Feature Priority (Build Order)

| Priority | Feature |
|---|---|
| P0 | Auth (register, login, logout) |
| P0 | Film search via TMDB |
| P0 | Log a film (date, rating, review) |
| P0 | Public profile page |
| P1 | Watchlist page |
| P1 | Follow / Unfollow |
| P1 | Home feed |
| P2 | Stats dashboard |
| P2 | Heatmap |
| P2 | Favourite films showcase |
| P3 | Settings page |
| P3 | Film detail modal |
