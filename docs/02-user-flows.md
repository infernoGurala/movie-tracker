# 02 — User Flows

Step-by-step journeys through movie-tracker.

---

## Flow 1: New User Registration

1. User lands on `/` — sees the landing page (not logged in)
2. Clicks "Sign Up"
3. Enters: username, password, confirm password
4. Submits → Worker validates (username unique, password length)
5. Password hashed with bcrypt → stored in Supabase `users` table
6. JWT issued → stored as HTTP-only cookie
7. Redirected to `/` (home feed — empty state with "Follow some users to see their activity")

---

## Flow 2: Login

1. User visits `/login`
2. Enters username + password
3. Worker fetches user by username → compares bcrypt hash
4. If match → JWT issued → cookie set → redirect to `/`
5. If fail → error message: "Username or password is incorrect"

---

## Flow 3: Log a Film

1. User clicks search bar (anywhere in the app — persistent in nav)
2. Types a film title → TMDB API called → results appear as dropdown cards
3. User clicks a result → Log Modal opens
4. Modal shows: film poster, title, year (from TMDB)
5. User fills in:
   - Watched date (date picker, defaults to today)
   - Rating (1–10 star selector)
   - Short review (textarea, optional, private)
6. Clicks "Log Film"
7. Entry saved to Supabase `film_logs` table
8. Modal closes → film appears in user's watchlist
9. Activity appears in followers' feeds

---

## Flow 4: Visit Someone's Profile

1. User searches for a username OR clicks a username in the feed
2. Navigates to `/u/:username`
3. Sees: header, top 5 pinned films, recent watchlist, stats summary
4. Clicks "Follow" → follow record saved → button changes to "Following"
5. Clicks "See all favourites" → expands full favourites grid below pinned section
6. Clicks "Films" tab → goes to `/u/:username/films` (full watchlist)
7. Clicks "Stats" tab → goes to `/u/:username/stats`

---

## Flow 5: View the Home Feed

1. Logged-in user visits `/`
2. Feed loads: chronological list of film logs from followed users
3. Each item: avatar, username, film poster, title, rating, time ago
4. User scrolls → "Load more" fetches older items
5. User clicks a film poster → film detail view opens
6. User clicks a username → goes to their profile

---

## Flow 6: Manage Favourite Films

1. User goes to `/settings` → "Favourite Films" section
2. Sees current pinned films (up to 5 shown on profile)
3. Clicks "Add to Favourites" → search modal opens
4. Finds a film → adds it → appears in the list
5. Can drag to reorder
6. First 5 in the list = pinned showcase on profile
7. Rest appear in "See all favourites" expanded view

---

## Flow 7: View Stats

1. User visits `/u/:username/stats`
2. Page loads with:
   - Year selector (defaults to current year)
   - Film count for selected year
   - Heatmap for the year
   - Month-by-month bar chart
   - Genre donut chart
   - Decade breakdown
3. User changes year → all stats update

---

## Empty States

| Screen | Empty State Message |
|---|---|
| Home feed (no follows) | "Follow people to see their activity here." |
| Watchlist (no films) | "Nothing logged yet. Search for a film to start." |
| Favourites (none pinned) | "Pin your favourite films to showcase them here." |
| Stats (new user) | "Log your first film to start tracking your year." |
| Search results (no match) | "No results for '[query]'. Try a different title." |
