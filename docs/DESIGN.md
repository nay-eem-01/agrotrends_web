# AgroTrends web — Design

Who it is for: farmers, agronomists and agriculture students in Bangladesh, reading and writing in English or
Bengali, often on a phone. Since 2026-10-14 the product is **Q&A-first**: people ask about their crop, the community
and verified experts answer, an AI answer is checked by experts, and stories are the second tab. The interface's job:
get a farmer from a question to an answer they can trust, and make clear who (or what) said it.

Built with **shadcn/ui** (`base-maia` style on Base UI, components in `src/components/ui/`), themed with the tokens
below. The crop-season strip of F2 is gone (2026-10-15); season is an ordinary filter next to crop, region and soil.

## Direction — "Paddy Field" (F21, 2026-10-31)

Chosen by Nayeem from five whole-app directions (A Paddy & Mustard, B Delta, C Nakshi, D Mustard Field, E Field
Notes): **A's colours and type with D's shapes**. Replaces F20's "Harvest". The idea: a white page like a sheet of
paper in the field, deep paddy green for anything you can do, mustard flower for anything you can trust, and soft
pill-shaped controls that are easy to hit with a thumb.

Where each part of the app takes its cue (inspiration, not imitation):

| Area | After | What we keep |
|---|---|---|
| Home and community feed | Reddit | topic chips, followed topics, a mixed feed of stories and questions |
| Questions and answers | Stack Overflow | votes beside the post, tags, the accepted answer set apart |
| Expert profiles | LinkedIn | headline, institution, credentials, "answers questions on" topics, contributions |
| Stories | Medium | a quiet reading column, Lora headline and body, byline with follow |
| AI advisor | Perplexity | sources first, numbered citations in the answer, follow-up questions |
| Phone and Bengali | Khamari | Bengali first-class, practical "this week" tasks, big tap targets |

Rules of the direction:

1. **White pages, few borders.** At least three quarters of a screen reads as white. Group with space and the pale
   `surface` wash before reaching for a border; a border is a 1px hairline.
2. **Colour only where it means something.** Green = action or link; mustard = accepted, verified expert,
   expert-checked AI; red = error. Everything else is ink and grey-green.
3. **Pills for things you press or type in, soft rectangles for things you read.** Buttons, chips, tags-as-filters,
   single-line fields, selects, the search field, segmented switches and badges are fully round. Cards and
   multi-line fields (text areas, editors) are 18px.
4. **No shadows on the page.** Shadows are for overlays only (menus, popovers, dialogs, the sticky post bar's edge).
5. **Bengali is not a fallback.** Every screen is checked with Bengali text; Hind Siliguri and Noto Serif Bengali sit
   right behind Inter and Lora.

## Colour

Semantic shadcn roles in `src/index.css`; the F0–F6 names are aliases. Contrast is against white unless noted.

| Role (class) | Light | Dark | Use |
|---|---|---|---|
| `background` | `#FFFFFF` | `#111712` | the page |
| `card` / `popover` | `#FFFFFF` | `#161E18` / `#1A221C` | cards (with a hairline), forms, menus, dialogs |
| `surface` / `muted` | `#F3F7F2` | `#1A221C` | the leaf wash: quiet panels, the search pill, toolbars, AI and "this week" panels, skeletons |
| `foreground` | `#1C2B21` | `#E7EDE6` | ink: text and headlines (14.6:1) |
| `muted-foreground` | `#59665D` | `#9EABA1` | stem: secondary text, metadata (5.9:1) |
| `subtle` | `#6F7B72` | `#84918A` | icons only (4.6:1) |
| `border` / `border-strong` | `#E4EAE3` / `#C9D5C9` | `#263028` / `#354238` | hairlines; outline buttons and chips |
| `input` | `#84958A` | `#5D6D61` | field borders (3.2:1 / 3.3:1, the WCAG minimum for controls) |
| `secondary` / `accent` | `#EAF3E8` | `#1F2C22` | selected chips and rows, topic labels |
| `primary` / `primary-active` | `#245C3A` / `#19482D` | `#7CC495` / `#9AD4AE` | paddy: primary buttons, active nav, links, the focus outline (7.9:1; white on it 7.9:1) |
| `ring` | `#79A98A` | `#4F8F66` | the soft 3px focus halo, always with the green outline or border |
| `mustard` | `#D9A441` | `#E3B458` | mustard flower: borders, dots and fills of trust marks; never text on white |
| `mustard-ink` (= `warning`) | `#8A5F0C` | `#ECC677` | mustard text and icons: "Accepted", "Verified expert", cautions (5.9:1) |
| `mustard-soft` (= `warning-soft`) | `#FBF3E1` | `#2A2517` | mustard wash behind accepted answers and expert badges |
| `destructive` / `destructive-soft` | `#B42318` / `#FEF3F2` | `#F2766D` / `#2C1714` | errors |
| `success` | `#216E45` | `#7CC495` | success text |

No gradients or glass on controls. Meaning never rests on colour alone: selected chips have a tick, the active nav
an underline, errors an icon, accepted answers the word "Accepted", unanswered questions the word "Unanswered".

## Type

- **Lora** (variable, 400–700) — editorial: story titles and bodies, question titles, page titles, the auth panel,
  profile names, the AI advisor question. Weight 500–600, slight negative tracking.
- **Inter** (variable) — everything else: navigation, answers, the AI answer text, forms, metadata, buttons. Base
  headings (`h1`–`h3`) are Inter 600; pages opt into Lora with `font-serif`.
- Bengali: the stacks continue with **Hind Siliguri** (after Inter) and **Noto Serif Bengali** (after Lora).
- Scale (px): 13 · 14 · 16 · 18 · 22 · 28 · 40 · 52. Story body 18px on phones, 20px from 640px, measure ~68ch.

## Shape and controls

- Radius from one token, `--radius: 0.75rem`: compact controls `rounded-lg` (12px); cards, menus, popovers and text
  areas `rounded-xl` (18px); dialogs and large panels `rounded-2xl` (21px). Buttons, chips, badges, single-line
  fields, selects, the search field and segmented switches `rounded-full` (F22, after direction D). No one-off radii.
- Buttons (`ui/Button`, shadcn `button`): pills, Inter 600. Primary filled paddy; secondary white with
  `border-strong`; quiet is a ghost; danger a red wash. 40px (sm) and 44px (md) high; press `scale(0.97)`.
- Fields: white pills, 44px high, `input` border, darker (`subtle`) on hover, green border plus the halo on focus, red
  border and an icon with the message on error; text areas the same with 18px corners; a tag box wraps its pills
  inside a pill. Labels always visible; placeholders are examples.
- Cards: white, 18px, one hairline, no shadow. The accepted answer and an expert-checked AI answer get a mustard
  border and ring; nothing else is coloured.
- Chips: 32–36px pills on the leaf wash; the selected one is ink on white or paddy with a tick. Topic pickers are
  radios dressed as chips (`qa/TopicPicker`); tags suggest popular ones as dashed "+ tag" pills.
- Selects: the shadcn Select (short fixed lists) or `SearchSelect` (topics). No native selects.
- Secondary post actions (Edit, Delete, Report) sit behind "More actions" (`threads/PostMenu`); Reply, Show replies
  and Accept stay visible. Delete is red and asks first.
- Votes (`qa/VoteControl`): carets in round 36px buttons (44px touch area) beside the post; pressed is filled.
- Tags (`ui/TagList`): three chips, then "+N" opening the full list in a popover.
- Composers: the advisor sends on Enter (Shift+Enter for a new line); answers, responses and the ask form send on
  Ctrl/⌘+Enter. Nothing sends while an input method (Bangla) is composing.
- Search: one entry point, the top bar: a pill on the leaf wash from 1280px, an icon below; Ctrl/⌘+K opens the
  search dialog.

## Layout

Page width 1240px, gutters 16px (phones) / 32px; reading column 680px; feed column 720px.

- **Navigation (F22.10):** one place for the sections, the left sidebar (`layout/AppSidebar`), on every page from
  1024px: Home (Discover for visitors), Questions, Stories, AI advisor; signed in, Reading list, Your stories and
  your topics. The top bar's menu button hides it to an icon strip (names in tooltips and for screen readers) and
  opens it again; the choice is remembered. The top bar holds no section tabs: logo, search, Write, Ask, bell,
  account. Below 1024px the menu sheet; below 768px the bottom tab bar (Discover, Questions, Ask +, Stories, AI
  advisor). Pages never repeat the sidebar's links in their own sidebars.
- **Discover (`/`):** hero (Lora headline, intro, Ask a question / Join) beside the drawn field (`FieldScene`) with
  an advisor caption; "Help a farmer today" (up to three unanswered questions, each with Answer); "What farmers are
  asking" (one row of topic filters, then compact question rows) beside the advisor panel with
  seasonal questions that open `/advisor?q=`; "From the field": a featured story and three compact ones. Sections
  below the hero load lazily.
- **Questions (`/questions`):** header + Ask, topics as chips (first six; "More topics" picker past
  that), Newest | Unanswered, Filter popover, active-filter chips; rows with votes, answer state and the first
  photo; sidebar: advisor card and "Getting a good answer". Question page: back link, Inter title, body, a horizontal
  vote bar with "Answer", the AI answer card, answers as rows.
- **Stories (`/stories`):** Lora page title, feed tabs, a featured story (wide cover beside the headline), then
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
   labelled with its review state. Mustard marks expert, accepted or expert-checked; nothing else.
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
