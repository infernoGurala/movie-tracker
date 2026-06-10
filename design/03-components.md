# 03 — Components

Reusable UI component specifications for movie-tracker.

---

## Component: NavBar

**Location:** Persistent top bar across all pages (logged in).

**Structure:**
- Left: Logo — "movie-tracker" in Bebas Neue. The "●" dot after the name is `amber`.
- Centre: Search input — expands on focus. Placeholder: "Search films..."
- Right: User avatar (32px circle) + username + dropdown arrow

**Dropdown menu (on avatar click):**
- My Profile → `/u/:username`
- Stats → `/u/:username/stats`
- Settings → `/settings`
- Log out

**Behaviour:**
- Sticky on scroll
- Search input: typing triggers TMDB search, results appear as dropdown below the bar
- On mobile: logo left, hamburger menu right

---

## Component: FilmCard

**Used in:** Watchlist grid, favourites grid, search results.

**Sizes:** sm / md / lg (see design system poster sizes)

**Structure:**
```
┌──────────┐
│          │  ← poster (2:3 ratio)
│          │
│          │
└──────────┘
  Title       ← body text, truncated 1 line
  Year · ★4.5 ← caption, text-secondary
```

**Hover state:**
- Poster scales to 1.03
- Shadow deepens
- Overlay appears with "View" text centred

**Click:** Opens Film Detail modal.

---

## Component: FeedItem

**Used in:** Home feed.

**Structure:**
```
┌────┐  @username                 2h ago
│    │  Film Title
│    │  ★★★★☆  (4/5)
└────┘
```

- Avatar: 36px circle
- Poster: `poster-sm` (80×120px)
- Username links to their profile
- Film title links to film detail modal
- Time: relative ("2 hours ago", "yesterday", "3 Jan")

---

## Component: ProfileHeader

**Used in:** Public profile page.

**Structure:**
```
[avatar 80px]  Display Name      [Follow] / [Following ✓]
               @username
               "Favourite quote in italics"
               124 followers · 38 following
```

- Avatar: 80px circle, amber border (2px) if it's your own profile
- Follow button: amber primary button (other users), hidden (own profile)
- Following state: secondary button with checkmark
- Follower/following counts: link to respective list pages

---

## Component: StarRating (Display)

**Used in:** Film cards, feed items, film detail.

**Spec:**
- 5 stars representing a 10-point scale (each star = 2 points)
- 4/10 = 2 filled stars
- 7/10 = 3.5 stars (half star)
- Filled: `amber`
- Empty: `border`
- No interactive behaviour in display mode

---

## Component: StarRating (Input)

**Used in:** Log modal, edit log.

**Spec:**
- 10 individual stars (not 5)
- Hover highlights all stars up to cursor
- Click sets rating
- Selected state: amber fill
- Shows numeric value next to stars: "7 / 10"
- Clear button: "× Clear" in `text-muted`

---

## Component: SearchDropdown

**Used in:** NavBar search.

**Trigger:** Typing 2+ characters in search input.

**Structure:**
```
┌─────────────────────────────────┐
│ ┌────┐  Inception               │
│ │    │  2010 · Sci-Fi           │
│ └────┘  ★ 8.8                   │
│ ─────────────────────────────── │
│ ┌────┐  Interstellar            │
│ │    │  2014 · Sci-Fi           │
│ └────┘  ★ 8.6                   │
└─────────────────────────────────┘
```

- Max 6 results shown
- Click a result → opens Log Modal
- Keyboard navigation (↑↓ arrows, Enter to select, Esc to close)
- Loading state: subtle shimmer on poster placeholders
- No results: "No films found for '[query]'"

---

## Component: LogModal

**Used in:** Search result click.

**Behaviour:**
- Backdrop: `rgba(0,0,0,0.8)` with blur
- Click outside modal → closes
- Esc → closes
- On submit: shows loading state on button → success toast → closes

**Toast on success:**
```
✓ Inception logged
```
Appears bottom-right, fades after 3 seconds. Background: `surface-raised`, left border: `amber`.

---

## Component: Heatmap

**Used in:** Stats page.

**Spec:**
- 52 columns (weeks) × 7 rows (days)
- Cell: 12×12px square, 3px gap
- Colour scale: 5 levels (0–4+) from `surface` to `amber`
- Month labels: above each column group, `caption` size
- Day labels: Mon/Wed/Fri on left side, `caption` size
- Hover on cell: tooltip showing date + "N films"

---

## Component: StatCard

**Used in:** Stats page summary row.

**Structure:**
```
┌────────────┐
│  47        │  ← data font, large
│  films     │  ← caption, text-secondary
│  this year │  ← caption, text-muted
└────────────┘
```

- Background: `surface`
- Border: `border`
- Radius: `radius-md`
- 3 shown in a row on the stats page

---

## Component: GenreTag

**Used in:** Film detail view.

**Structure:**
```
[ Sci-Fi ]  [ Thriller ]  [ Drama ]
```

- Background: `surface-raised`
- Border: `border`
- Text: `text-secondary`, caption size
- Radius: `radius-sm`
- No click behaviour (display only)

---

## Component: EmptyState

**Used in:** Any screen with no data.

**Structure:**
```
        🎬
  Nothing here yet.
  Log your first film to start.
  [Search films →]   ← optional CTA
```

- Centred in the content area
- Icon: large, `text-muted`
- Heading: body text, `text-secondary`
- Sub-text: caption, `text-muted`
- CTA button: secondary variant, optional

---

## Component: FollowList

**Used in:** `/u/:username/followers` and `/following`.

**Structure:**
```
┌──────────────────────────────────────┐
│  [avatar]  @username          [Follow]│
│            Display name               │
│            42 films watched           │
└──────────────────────────────────────┘
```

- Each row links to the user's profile
- Follow button state managed inline
