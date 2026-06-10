# 02 — UI Screens

Screen-by-screen layout for movie-tracker.

---

## Screen 1: Landing Page (logged out)

URL: `/`

```
┌─────────────────────────────────────────────┐
│  movie-tracker●          [Log in]  [Sign up] │
├─────────────────────────────────────────────┤
│                                             │
│   [3 blurred film posters fading left]      │
│                                             │
│   TRACK EVERY                               │
│   FILM YOU WATCH.          ← Bebas Neue     │
│                                             │
│   Build your watchlist. Follow friends.     │
│   See your year in film.    ← body text     │
│                                             │
│   [Sign up free →]     ← amber button       │
│                                             │
├─────────────────────────────────────────────┤
│   Preview: 3 fake profile cards (social     │
│   proof feel — "Arjun watched 47 films")    │
└─────────────────────────────────────────────┘
```

---

## Screen 2: Login / Register

URL: `/login` and `/register`

```
┌─────────────────────────────────────────────┐
│  movie-tracker●                             │
├─────────────────────────────────────────────┤
│                                             │
│              ┌──────────────┐               │
│              │  Log in      │  ← heading    │
│              │              │               │
│              │  Username    │               │
│              │  [________]  │               │
│              │              │               │
│              │  Password    │               │
│              │  [________]  │               │
│              │              │               │
│              │  [Log in →]  │  ← amber btn  │
│              │              │               │
│              │  No account? │               │
│              │  Sign up     │               │
│              └──────────────┘               │
│                                             │
└─────────────────────────────────────────────┘
```

- Card sits centred on `ink` background
- Card background: `surface-raised`
- Minimal — no decoration

---

## Screen 3: Home Feed

URL: `/` (logged in)

```
┌─────────────────────────────────────────────┐
│  movie-tracker●    [🔍 Search...]   [@user] │
├──────────────────────────┬──────────────────┤
│                          │  YOUR YEAR       │
│  FEED                    │  ─────────────── │
│  ─────────────────────   │  47 films  2026  │
│                          │  ↑ amber streak  │
│  ┌────┐ @alex            │                  │
│  │    │ Inception  ★★★★★ │  WHO TO FOLLOW   │
│  │    │ 2 hours ago      │  ─────────────── │
│  └────┘                  │  @ravi   [Follow]│
│                          │  @priya  [Follow]│
│  ┌────┐ @priya           │                  │
│  │    │ Dune II   ★★★★   │                  │
│  │    │ 5 hours ago      │                  │
│  └────┘                  │                  │
│                          │                  │
│  [Load more]             │                  │
└──────────────────────────┴──────────────────┘
```

- Left: feed (main column, ~65% width)
- Right: sidebar with year count + suggested follows (~35%)
- Feed items: small poster + username + film title + rating + time
- Sidebar is sticky on scroll

---

## Screen 4: Public Profile Page

URL: `/u/:username`

```
┌─────────────────────────────────────────────┐
│  [← back]                            @user  │
├─────────────────────────────────────────────┤
│  ┌────┐  John Moses                         │
│  │ 👤 │  @johnmoses                         │
│  └────┘  "Cinema is the mirror of the soul" │
│           124 followers · 38 following      │
│           [Follow]                          │
├─────────────────────────────────────────────┤
│  TOP FILMS                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │    │ │    │ │    │ │    │ │    │        │
│  │    │ │    │ │    │ │    │ │    │        │
│  └────┘ └────┘ └────┘ └────┘ └────┘        │
│  [See all favourites ↓]                     │
├─────────────────────────────────────────────┤
│  FILMS  │  STATS                            │
│  ───────────────────────────────────────    │
│  [film grid — most recent first]            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │    │ │    │ │    │ │    │ │    │ │    │ │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ │
└─────────────────────────────────────────────┘
```

- Profile header: avatar, name, username, quote, follow counts, follow button
- Top Films: 5 large posters in a row — expandable
- Tabs: Films | Stats (switches the lower section)

---

## Screen 5: Expanded Favourites

Triggered by "See all favourites ↓" — expands inline below the top 5 strip.

```
┌─────────────────────────────────────────────┐
│  TOP FILMS                [Collapse ↑]      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │    │ │    │ │    │ │    │ │    │        │ ← pinned top 5
│  └────┘ └────┘ └────┘ └────┘ └────┘        │
│  ─────────────────────────────────────────  │
│  ALL FAVOURITES (32)                        │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │  │ │  │ │  │ │  │ │  │ │  │ │  │ │  │  │ ← smaller grid
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
└─────────────────────────────────────────────┘
```

---

## Screen 6: Stats Tab

URL: `/u/:username/stats`

```
┌─────────────────────────────────────────────┐
│  FILMS  │  STATS ←(active)                  │
├─────────────────────────────────────────────┤
│  2026  [2025] [2024]  ← year selector       │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 47       │  │ ★ 7.2    │  │ 6        │  │
│  │ films    │  │ avg      │  │ streak   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  HEATMAP — 2026                             │
│  Jan ─────────────────────────────────────  │
│  [heatmap grid]                             │
│                                             │
│  BY MONTH          │  BY GENRE              │
│  [bar chart]       │  [donut chart]         │
│                    │                        │
│  BY DECADE                                  │
│  [horizontal bar chart]                     │
└─────────────────────────────────────────────┘
```

---

## Screen 7: Film Log Modal

Triggered when user clicks a search result.

```
┌────────────────────────────────┐
│                           [✕]  │
│  ┌──────┐  Inception           │
│  │      │  2010 · 148 min      │
│  │      │  ★ 8.8 TMDB          │
│  │      │  Sci-Fi, Thriller    │
│  └──────┘                      │
│  ────────────────────────────  │
│  Watched on   [📅 today]       │
│                                │
│  Your rating                   │
│  ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆         │
│                                │
│  Private note (optional)       │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  [Log Film →]    ← amber btn   │
└────────────────────────────────┘
```

- Opens as a centered modal with backdrop blur
- Modal background: `surface-raised`
- Shadow: `shadow-modal`

---

## Screen 8: Film Detail View

Triggered when clicking any film from a watchlist.

```
┌─────────────────────────────────────────────┐
│  [backdrop image — full width, dimmed]      │
│                                             │
│  ┌──────┐  INCEPTION               [✕]      │
│  │      │  2010 · Christopher Nolan         │
│  │      │  148 min · Sci-Fi · Thriller      │
│  │      │  ★★★★★ 8.8  (2.4M votes)         │
│  └──────│                                   │
│         │  A thief who steals corporate...  │
│         │                                   │
│         │  CAST                             │
│         │  DiCaprio · Hardy · Page...       │
│                                             │
│  ──────────────── YOUR LOG ──────────────── │
│  Watched: 12 Jan 2026  │  Your rating: ★★★★ │
│  [Edit log]  [Remove]                       │
└─────────────────────────────────────────────┘
```

---

## Screen 9: Settings Page

URL: `/settings`

```
┌─────────────────────────────────────────────┐
│  SETTINGS                                   │
│  ─────────────────────────────────────────  │
│                                             │
│  Profile Picture   [current avatar] [Change]│
│  Display Name      [____________]           │
│  Bio               [____________]           │
│  Favourite Quote   [____________]           │
│                            [Save changes]   │
│                                             │
│  ─────────────────────────────────────────  │
│  Favourite Films                            │
│  [manage list — drag to reorder]            │
│                                             │
│  ─────────────────────────────────────────  │
│  Change Password                            │
│  Current password  [____________]           │
│  New password      [____________]           │
│  Confirm new       [____________]           │
│                            [Update →]       │
└─────────────────────────────────────────────┘
```

---

## Responsive Behaviour

| Breakpoint | Layout Change |
|---|---|
| < 768px | Single column, sidebar hidden |
| < 768px | Nav collapses to logo + hamburger |
| < 768px | Film grid goes to 3 columns (was 6) |
| < 480px | Film grid goes to 2 columns |
| < 480px | Profile top films scroll horizontally |
