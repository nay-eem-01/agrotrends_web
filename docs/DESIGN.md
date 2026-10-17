# AgroTrends web — Design

Who it is for: farmers, agronomists and agriculture students in Bangladesh, reading and writing in English or
Bengali, often on a phone. Since 2026-10-14 the product is **Q&A-first**: people ask about their crop, the community
and verified experts answer, an AI answer is checked by experts, and stories are the second tab. The interface's job:
get a farmer from a question to an answer they can trust, and make clear who (or what) said it.

Built with **shadcn/ui** (`base-maia` style on Base UI, components in `src/components/ui/`), themed with the tokens
below. The crop-season strip of F2 is gone (2026-10-15); season is an ordinary filter next to crop, region and soil.

## Colour — "The Living Field" (F15, 2026-10-17)

A pure white page (`#FFFFFF`), forest green for action, sage for selection, a warm field accent. At least three
quarters of any screen reads as white. Semantic shadcn roles in `src/index.css`; the F0–F6 names are aliases.

| Role (class) | Light | Dark | Use |
|---|---|---|---|
| `background` / `card` / `popover` | `#FFFFFF` | `#121713` / `#161D17` / `#1B231C` | the page, forms, menus, dialogs |
| `surface` / `muted` | `#F5F8F3` | `#182019` | pale green, sparingly: the advisor panel, the answer box, sources, hover rows, skeletons |
| `foreground` | `#1C2B21` | `#E9EEE8` | text and headlines (14.8:1) |
| `muted-foreground` | `#59665D` | `#A7B3A9` | secondary text, metadata (6.0:1) |
| `subtle` / `input` | `#78847B` | `#7F8C81` / `#6D7A6F` | field borders and icons only: 3.9:1, too low for small text |
| `border` / `border-strong` | `#E2E8E1` / `#C9D5C9` | `#263027` / `#354236` | hairlines; secondary buttons, outline chips |
| `secondary` / `accent` | `#EAF3E8` | `#1F2B21` | selected chips and rows, topic labels |
| `primary` / `primary-active` | `#245C3A` / `#19482D` | `#7CC794` / `#9AD8AD` | primary actions, active nav, links, the focus outline (7.9:1) |
| `ring` | `#79A98A` | `#5F9A72` | the soft 3px focus halo (2.7:1, so always paired with the green outline or border) |
| `mustard` / `mustard-soft` (= `warning`) | `#D9A441` / `#FBF3E1` | `#E0B04A` / `#2B2412` | the warm field accent: trust marks (accepted, Verified Expert), season labels, featured details, cautions. Decorative only (2.3:1): text on it is `foreground` |
| `destructive` / `destructive-soft` | `#B42318` / `#FEF3F2` | `#F2766D` / `#2C1714` | errors |
| `success` | `#216E45` | `#7CC794` | success text |

No gradients, glass or heavy shadows. Meaning never rests on colour alone: selected chips have a tick or a
different border, the active nav an underline, errors an icon, unanswered questions the word "Unanswered".

## Type

- **Newsreader** (variable, optical sizes) — editorial only: the Discover headline, section headings on Discover,
  story titles and story bodies, the Stories and Advisor page titles, the auth panel. Weight 500, slight negative
  tracking.
- **Inter** (variable) — everything else: navigation, questions and answers (a question is a request for help, not
  an article), the AI conversation, forms, metadata, buttons. Base headings (`h1`–`h3`) are Inter 600.
- Bengali: neither face has Bengali letters, so the stacks continue with **Hind Siliguri** (after Inter) and **Noto
  Serif Bengali** (after Newsreader); the browser takes Bengali glyphs from those.
- Scale (px): 13 · 14 · 16 · 18 · 22 · 28 · 40 · 52. Story body 18px on phones, 20px from 640px, measure ~68ch.

## Shape and controls (F16, 2026-10-17)

- Radius from one token (`--radius: 0.75rem`): inputs, selects, buttons and compact controls `rounded-lg` (12px);
  cards, menus and popovers `rounded-xl` (~17px); dialogs and large surfaces `rounded-xl`/`rounded-2xl` (17–22px);
  chips and badges fully round. No one-off radii on pages.
- Fields: white, 44px high, 12px corners, `input` border `#C9D5C9`, darker (`subtle`) on hover, green border plus the
  `#79A98A` halo on focus, red border and an icon with the message on error. Labels always visible; placeholders are
  examples, never the label.
- Buttons: primary filled green; secondary white with `border-strong`; quiet is a ghost; danger a red wash.
- Selects: every list is the shadcn Select (short fixed lists) or `SearchSelect` (topics). No native selects.
- Secondary post actions (Edit, Delete, Report) sit behind a "More actions" menu (`threads/PostMenu`) at the top right
  of each question, answer, reply and response; Reply, Show replies and Accept stay visible. Delete is red and still
  asks first.
- Votes (`qa/VoteControl`): bold carets at the score's weight in 36px squares (44px touch area); pressed is a tint,
  sage with green for up, soft red for down. Horizontal on the question page, a narrow column beside answers.
- Tags (`ui/TagList`): three chips, then "+N" opening the full list in a popover; used on question rows, the
  question page and the story page.
- Photos (`qa/PhotoPicker`): square thumbnails and a dashed "Add a photo" tile in one grid; upload progress in the
  tile.
- Composers: the advisor sends on Enter (Shift+Enter for a new line); answers and responses send on Ctrl/⌘+Enter.
  Neither sends while an input method (Bangla) is composing.
- Search: one entry point, the top bar (a field-styled button from 1280px, an icon below; Ctrl/⌘+K), opening a
  search dialog that goes to `/search`. Pages don't repeat it.
- Shadows only on overlays (menus, popovers, dialogs).

## Layout (F15 "Living Field")

Page width 1240px, gutters 16px (phones) / 32px; reading column 680px; feed column 720px.

- **Navigation:** white bar with a hairline: Discover · Questions · Stories · AI advisor · Write, Ask (signed in),
  bell, account menu; the current page green and underlined. Search opens a dialog (field-styled trigger from 1280px). Below 1024px a menu sheet;
  below 768px a bottom tab bar (Discover, Questions, Ask +, Stories, AI advisor).
- **Discover (`/`):** hero (Newsreader headline, intro, Ask a question / Join) beside the drawn field (`FieldScene`) with
  an advisor caption; "Help a farmer today" (up to three unanswered questions, each with Answer); "What farmers are
  asking" (one row of topic filters, then compact question rows) beside the advisor panel with
  seasonal questions that open `/advisor?q=`; "From the field": a featured story and three compact ones. Sections
  below the hero load lazily.
- **Questions (`/questions`):** header + Ask, topics as chips (first six; "More topics" picker past
  that), Newest | Unanswered, Filter popover, active-filter chips; rows with votes, answer state and the first
  photo; sidebar: advisor card and "Getting a good answer". Question page: back link, Inter title, body, a horizontal
  vote bar with "Answer", the AI answer card, answers as rows.
- **Stories (`/stories`):** Newsreader page title, feed tabs, a featured story (wide cover beside the headline), then
  a three-column grid of tiles; covers keep 16:10; stories without a photo get `CoverFallback` (drawn sprig + crop or
  topic). Story page: back link, wide 21:9 cover, header in the reading column, and an "In this article" list built
  from the story's own `h2`s when it has two or more.
- **AI advisor:** a rail (signed in, from 1024px) with New conversation and recent questions from the history API;
  an intro card, the composer, seasonal and common question cards; the conversation as turns (question right in
  green, answer left beside the mark, sources in a panel, the "not checked by an expert" note), composer sticky.
- **Forms:** two columns on wide screens (form + tips); every select is the shadcn Select or the searchable
  `SearchSelect`; the publish sheet is a shadcn Dialog.
- **Drawn details (`src/ui/Botanical.tsx`):** `Sprig`, `FieldScene`, `CoverFallback`, in theme colours. They stand
  in for photography until the platform has licensed field photos; no stock images are hotlinked.

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
2. Questions first, reading still good: question lists are scannable rows; stories keep the reading column.
3. Farming context is data, not decoration: crop, season, region and soil are small chips that are filters.
4. Words: plain verbs, sentence case. A button says what happens ("Post question", "Accept answer"); the toast repeats
   it.
5. Phone-first: every screen works at 360px; tap targets ≥ 44px.

## Performance budget

Checked with Lighthouse (mobile, simulated slow 4G) on a production build; re-check when a page changes a lot.

| Measure | Budget | 2026-10-09 |
|---|---|---|
| Main JS (gzip) | <= 120 kB | 110 kB on 2026-10-17 (F16: post menus, tag popover and search dialog lazy too) |
| Lighthouse performance (home, questions) | >= 80 | 85, 89 |
| Accessibility / best practices / SEO | 100 | 100 / 100 / 100 |
| CLS | < 0.1 | 0.07 (fonts swapping in) |
| LCP, slow 4G | < 3.5 s | 3.2 s (the headline waits for JS: client-rendered) |
