# 01 — Design System

Visual language for movie-tracker.

---

## Design Direction

**Tone:** Dark cinema. Not generic dark mode — the specific atmosphere of a film theatre right before the lights go down. Deep blacks, dim warm greys, and one accent colour that feels like a projection light.

**Not this:** Rounded glassmorphism cards with purple gradients. Blue-tinted "modern SaaS" grids. Generic CRUD dashboards.

**This instead:** Dense, editorial. Posters are the visual heroes — the UI steps back and lets them breathe. Typography is tight, confident, and slightly condensed. The accent is a single warm amber — like a projector bulb.

---

## Colour Palette

| Name | Hex | Usage |
|---|---|---|
| `ink` | `#0A0A0B` | Page background |
| `surface` | `#141416` | Cards, panels |
| `surface-raised` | `#1C1C1F` | Modals, dropdowns |
| `border` | `#2A2A2E` | Dividers, card borders |
| `text-primary` | `#F0EDE8` | Headlines, primary text |
| `text-secondary` | `#8A8780` | Metadata, secondary labels |
| `text-muted` | `#4A4845` | Placeholder text, disabled |
| `amber` | `#E8A838` | Accent — ratings, CTA buttons, active states |
| `amber-dim` | `#7A5A1E` | Hover states, subtle highlights |
| `danger` | `#C0392B` | Delete actions, errors |

---

## Typography

### Typefaces

| Role | Font | Source |
|---|---|---|
| Display / Headlines | **Bebas Neue** | Google Fonts — condensed, cinematic |
| Body / UI | **Inter** | Google Fonts — clean, readable at small sizes |
| Data / Numbers | **JetBrains Mono** | Google Fonts — stats, counts, years |

### Type Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `display-xl` | 48px / Bebas | 400 | Page titles, hero text |
| `display-lg` | 32px / Bebas | 400 | Section headers |
| `heading` | 18px / Inter | 600 | Card titles, modal headers |
| `body` | 14px / Inter | 400 | General content |
| `caption` | 12px / Inter | 400 | Metadata, timestamps |
| `data` | 16px / JetBrains Mono | 500 | Counts, ratings, years |
| `data-sm` | 12px / JetBrains Mono | 400 | Small stats labels |

### Line Height & Letter Spacing
- Display: `line-height: 0.95`, `letter-spacing: 0.02em`
- Body: `line-height: 1.6`
- Data: `line-height: 1.2`, `letter-spacing: -0.02em`

---

## Spacing Scale

Uses an 8px base grid.

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | Tags, badges |
| `radius-md` | 8px | Cards, inputs |
| `radius-lg` | 12px | Modals |
| `radius-pill` | 999px | Buttons, avatars |

---

## Shadows

```
shadow-card:  0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)
shadow-modal: 0 24px 48px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.5)
shadow-poster: 0 8px 24px rgba(0,0,0,0.7)
```

---

## Poster Component

Film posters are the visual core of the UI. Rules:

- Always display at native 2:3 aspect ratio — never stretched
- Background behind poster: `ink` — no colour bleed
- On hover: subtle scale (1.03) + shadow deepens
- Broken image fallback: dark rectangle with film title initials centred in `text-muted`
- Poster sizes:
  - `poster-sm`: 80×120px (feed items)
  - `poster-md`: 120×180px (watchlist grid)
  - `poster-lg`: 180×270px (profile showcase)
  - `poster-xl`: 240×360px (film detail view)

---

## Star Rating Component

- 10-point rating displayed as 5 filled/half-filled stars
- Filled star colour: `amber`
- Empty star colour: `border`
- Half star: left half `amber`, right half `border`
- Non-interactive (display): smaller (14px)
- Interactive (input): larger (24px), hover highlights

---

## Heatmap

- Inspired by GitHub contribution graph
- Cell size: 12×12px, gap: 3px
- Colour scale (films watched that day):
  - 0: `surface` (barely visible square)
  - 1: `#3D2F0D`
  - 2: `#6B5015`
  - 3: `#9A7520`
  - 4+: `amber` (#E8A838)
- Month labels above in `caption` / `text-muted`
- Day labels (Mon/Wed/Fri) on left in `caption` / `text-muted`

---

## Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `amber` | `ink` | — |
| Secondary | `surface-raised` | `text-primary` | `border` |
| Ghost | transparent | `text-secondary` | — |
| Danger | `danger` | white | — |

- All buttons: `radius-pill`, `space-4` horizontal padding, `space-2` vertical
- Hover: 8% brightness increase
- Active: 5% brightness decrease
- Font: Inter 14px weight 500

---

## Input Fields

- Background: `surface`
- Border: `border` (1px solid)
- Focus border: `amber`
- Text: `text-primary`
- Placeholder: `text-muted`
- Radius: `radius-md`
- Padding: `space-3` vertical, `space-4` horizontal

---

## Navigation Bar

- Background: `ink` with `border-bottom: 1px solid border`
- Height: 56px
- Contents (left → right):
  - Logo: "movie-tracker" in Bebas Neue, `amber` accent dot
  - Search bar (centred, expands on focus)
  - Avatar + username dropdown (right)
- Sticky at top on scroll
- On mobile: collapses to logo + hamburger

---

## Signature Design Element

**The "log streak" accent line.**

On the profile page, a thin horizontal amber line runs across the top of the stats section. Its length is proportional to the user's current year progress (films logged vs. a personal goal or vs. last year). No label needed — it reads instinctively as a progress indicator. It is the one decorative element that is purely expressive.
