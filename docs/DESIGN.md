# AgroTrends web — Design

Who it is for: farmers, agronomists and agriculture students in Bangladesh, reading and writing in English or
Bengali, often on a phone. The job of the interface: get out of the way of reading, the way Medium does, and make the
farming context (season, crop, region, soil) easy to filter by.

## Colour

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FFFFFF` | page background |
| `ink` | `#242424` | body text, headlines |
| `ink-muted` | `#6B6B6B` | metadata, secondary text |
| `rule` | `#E6E6E6` | dividers, input borders |
| `field` | `#F2F5EF` | quiet surfaces (chips, hovered rows, code) — a faint leaf green, not cream |
| `paddy` | `#1F6B3A` | primary actions, links, focus ring, the current season |
| `paddy-deep` | `#154D29` | primary hover / pressed |
| `mustard` | `#E2B007` | claps and the season marker only — never body text |
| `danger` | `#B3261E` | destructive actions and errors |

Mustard is the rabi-season mustard field; it is spent in one or two places so it keeps meaning something.

## Type

- **Literata** (variable, optical sizes) — headlines and story bodies. Story body 20px / 1.65 on desktop, 18px / 1.6
  on phones, measure about 68 characters.
- **Hind Siliguri** — interface text (navigation, buttons, metadata, forms); designed for Bengali and Latin together.
- **Noto Serif Bengali** — fallback inside the Literata stack, so Bengali stories read in a serif too.
- Scale (px): 13 · 15 · 17 · 20 · 24 · 32 · 42. Headlines use weight 700 and tight tracking (-0.01em); no all-caps
  labels, no italic accent words.

## Layout

```
┌───────────────────────────────────────────────────────────────┐
│ AgroTrends      [ search ]                 Write   Ask   (av)  │  top bar, white, hairline under
├───────────────────────────────────────────────────────────────┤
│  Rabi ▮▮▮▮▮▮▮▮ │ Kharif-1 ▮▮▮▮▮▮▮ │ Kharif-2 ▮▮▮▮▮▮●           │  season strip (home only)
├───────────────────────────────────────┬───────────────────────┤
│  For you   Latest   Trending          │  Topics to follow      │
│  ───────────────────────────          │  Who to follow         │
│  story card  (text left, image right) │  Ask the advisor       │
│  story card                           │                        │
└───────────────────────────────────────┴───────────────────────┘
```

- Feed column max 680px, right rail 320px from 1024px up; one column below.
- Story page: one centred 680px column, cover image may run to 1000px.
- Left-aligned text everywhere; nothing centred except empty states.
- Cards are not boxes: stories are separated by spacing and a hairline, like Medium. Rounded corners only on
  interactive controls (buttons 999px pills, inputs 8px) and images (4px).

## Principles

1. Reading first: content gets the width, the type and the white space; chrome stays thin and quiet.
2. One bold element: the crop-season strip. It shows where in the farming year we are and filters by season.
3. Farming context is data, not decoration: crop, season, region and soil appear as small chips that are filters.
4. Words: plain verbs, sentence case. A button says what happens ("Publish", "Save draft"); its toast repeats it.
5. Motion only answers an action (clap burst, sheet opening); `prefers-reduced-motion` turns it off.
6. Phone-first: every screen works at 360px; tap targets >= 44px.

## Performance budget

Checked with Lighthouse (mobile, simulated slow 4G) on a production build; re-check when a page changes a lot.

| Measure | Budget | 2026-10-09 |
|---|---|---|
| Main JS (gzip) | <= 120 kB | 106 kB (every page but home and story is lazy; the editor alone is 139 kB) |
| Lighthouse performance (home, questions) | >= 80 | 85, 89 |
| Accessibility / best practices / SEO | 100 | 100 / 100 / 100 |
| CLS | < 0.1 | 0.07 (fonts swapping in) |
| LCP, slow 4G | < 3.5 s | 3.2 s (the headline waits for JS: client-rendered) |
