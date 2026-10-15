# AgroTrends web — Design

Who it is for: farmers, agronomists and agriculture students in Bangladesh, reading and writing in English or
Bengali, often on a phone. Since 2026-10-14 the product is **Q&A-first**: people ask about their crop, the community
and verified experts answer, an AI answer is checked by experts, and stories are the second tab. The interface's job:
get a farmer from a question to an answer they can trust, and make clear who (or what) said it.

Built with **shadcn/ui** (`base-maia` style on Base UI, components in `src/components/ui/`), themed with the tokens
below. The crop-season strip of F2 is gone (2026-10-15); season is an ordinary filter next to crop, region and soil.

## Colour

Semantic shadcn roles with AgroTrends' colours (`src/index.css`). The F0–F6 names are aliases kept for old screens.

| Role (class) | Light | Dark | Use | Old alias |
|---|---|---|---|---|
| `background` | `#F6F7F3` | `#141512` | page floor: a faint leaf tint, so white cards read without shadows | `paper` |
| `card` / `popover` | `#FFFFFF` | `#1C1E1A` / `#1F221D` | question and answer cards, menus, dialogs | — |
| `foreground` | `#1D211B` | `#ECEDE6` | text, headlines | `ink` |
| `muted-foreground` | `#5C6356` | `#A3A898` | metadata, secondary text (≥ 4.5:1 on both floors) | `ink-muted` |
| `border` / `input` | `#E1E5DC` / `#D5DACF` | `#2E322B` / `#3A3F36` | hairlines, field borders | `rule` |
| `muted` / `accent` / `secondary` | `#EEF1EA` / `#EAF0E5` | `#23261F` / `#262B23` | quiet surfaces, hover washes, chips | `field` |
| `primary` | `#1F6B3A` | `#74C48A` | primary actions, links, focus ring, upvoted state | `paddy` |
| `primary-active` | `#154D29` | `#95D6A7` | primary hover and pressed | `paddy-deep` |
| `mustard` / `mustard-soft` | `#E2B007` / `#FBF3D6` | same / `#3A3214` | trust marks only: accepted answer, Verified Expert, expert-confirmed AI answer | — |
| `destructive` | `#B3261E` | `#F2766D` | destructive actions and errors | `danger` |

Mustard is spent only on trust, so a mustard mark always means "a person who knows checked this".

## Type

- **Literata** (variable) — page titles, question titles, story headlines and story bodies. Story body 20px / 1.65 on
  desktop, 18px / 1.6 on phones, measure about 68 characters.
- **Hind Siliguri** — interface text, answers' metadata, buttons, forms, card and dialog titles (`--font-heading`);
  designed for Bengali and Latin together.
- **Noto Serif Bengali** — fallback inside the Literata stack, so Bengali reads in a serif too.
- Scale (px): 13 · 15 · 17 · 20 · 24 · 32 · 42. Headlines weight 700, tracking -0.01em; no all-caps labels.

## Shape and controls

- `base-maia`: pill buttons and inputs (`rounded-4xl`), cards `rounded-xl` with a hairline ring, no drop shadows on
  the page (menus and dialogs keep the style's soft shadow).
- Heights: buttons 40px (`default`) and 44px (`lg`, the app's `md`); inputs, selects and native selects 44px; so
  every tap target is ≥ 44px on a phone.

## Layout (Q&A-first, from F8)

```
┌──────────────────────────────────────────────────────────────────┐
│ AgroTrends   [ search questions and stories ]   Ask  Write  🔔 (av)│
├──────────────────────────────────────────────────────────────────┤
│  Questions | Stories          Newest · Unanswered   [Filters]      │
│ ┌──────────────────────────────────────────────┐  Topics           │
│ │ ▲ 12 ▼   Why are my boro seedlings yellow?   │  Your reputation  │
│ │ 3 answers ✓  rice · Rabi · Rangpur           │  Ask the advisor  │
│ └──────────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
```

- Content column max 720px, right rail 320px from 1024px up; one column below.
- Questions and answers are cards (white on the leaf floor); stories stay hairline-separated, Medium-style.
- The AI answer is always its own card above the human answers, labelled with its review state and disclaimer.

## Motion

Emil Kowalski's design-engineering rules (`emil-design-eng` skill):

- Animate only to answer an action or to avoid a jarring change; never on keyboard-driven actions.
- Enter and exit with ease-out (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`), move on screen with `--ease-in-out`;
  never ease-in. UI motion stays under 300ms; exits faster than entries.
- Press feedback: `scale(0.97)` on `:active` for buttons. Popovers scale from their trigger; dialogs stay centred.
- Transitions name their properties (no `transition: all`); animate `transform` and `opacity` only.
- `prefers-reduced-motion` keeps fades and drops movement.

## Principles

1. Trust is visible: every answer shows who wrote it, their reputation and badges in that topic; AI text is always
   labelled with its review state. Mustard marks expert or accepted.
2. Questions first, reading still good: question pages are scannable cards; stories keep the reading column.
3. Farming context is data, not decoration: crop, season, region and soil are small chips that are filters.
4. Words: plain verbs, sentence case. A button says what happens ("Post question", "Accept answer"); the toast repeats
   it.
5. Phone-first: every screen works at 360px; tap targets ≥ 44px.

## Performance budget

Checked with Lighthouse (mobile, simulated slow 4G) on a production build; re-check when a page changes a lot.

| Measure | Budget | 2026-10-09 |
|---|---|---|
| Main JS (gzip) | <= 120 kB | 105 kB on 2026-10-15 (home is now the questions; stories, the confirm dialog and every other page are lazy) |
| Lighthouse performance (home, questions) | >= 80 | 85, 89 |
| Accessibility / best practices / SEO | 100 | 100 / 100 / 100 |
| CLS | < 0.1 | 0.07 (fonts swapping in) |
| LCP, slow 4G | < 3.5 s | 3.2 s (the headline waits for JS: client-rendered) |
