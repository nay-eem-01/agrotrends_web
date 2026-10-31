# AgroTrends web — Development Log

Read this first at the start of every working session. Newest entry on top.
Plan and progress: `docs/ROADMAP.md`. Design: `docs/DESIGN.md`.

---

## Where we are

- Phases F0–F6 are in `development` (F6.7 notifications moved to F12).
- 2026-10-14: the backend became Q&A-first (one account type, e-mail confirmation, votes and reputation, verified
  experts reviewing AI answers, notifications, moderation). `docs/BACKEND_CATCHUP_PLAN.md` is the plan; phases
  F7–F14 in `docs/ROADMAP.md` follow it. Checked against the backend code on 2026-10-15: every endpoint, shape and
  enum in the plan matches (backend `fix/phase8-review-3b`).
- Phase F7 on `feat/backend-catchup-base`: F7.0 design system (`feat/design-system`) F7.0b no season strip
  (`feat/no-season-strip`) F7.1a API types (`feat/api-types`) F7.1b one account (`feat/one-account`) F7.2
  e-mail confirmation (`feat/email-confirm`) and F7.3 excerpts (`feat/excerpts`) done. Phase F7 is complete.
- Phase F8 on `feat/questions-first-base` (stacked on F7's tip): F8.1 ask form (`feat/ask-form`) F8.2 questions home (`feat/questions-home`) and F8.3
  question answers (`feat/question-answers`) done. Phase F8 is complete.
- Phase F9 on `feat/reputation-base` (stacked on F8's tip): F9.1 votes (`feat/votes`) F9.2 accept (`feat/accept`) and F9.3 reputation
  (`feat/reputation`) done. Phase F9 is complete.
- Phase F10 on `feat/ai-answers-base` (stacked on F9's tip): F10.1 AI answer card (`feat/ai-answer-card`) F10.2 sources (`feat/ai-sources`) and F10.3 ask the
  experts (`feat/ask-experts`) done. Phase F10 is complete.
- Phase F11 on `feat/experts-base` (stacked on F10's tip): F11.1 apply (`feat/expert-apply`) F11.2 review (`feat/expert-review`) and F11.3 admin
  (`feat/expert-admin`) done. Phase F11 is complete.
- Phase F12 on `feat/notifications-base` (stacked on F11's tip): F12.1 bell (`feat/notification-bell`) and F12.2 page
  (`feat/notifications-page`) done. Phase F12 is complete.
- Phase F13 on `feat/moderation-base` (stacked on F12's tip): F13.1 report (`feat/report`) F13.2 moderation queue (`feat/moderation-queue`) and
  F13.3 ban and hidden states (`feat/ban-hidden`) done. Phase F13 is complete.
- Phase F14 on `feat/launch-polish-base` (stacked on F13's tip): F14.1 Bengali and accessibility (`feat/bengali-a11y`) and F14.2 community smoke tests
  (`feat/smoke-community`) done. Phase F14 is complete: every step of F7–F14 is built.
- Phase F15 on `feat/redesign-base` (stacked on F14's tip): F15.1 foundation (`feat/redesign-foundation`) F15.2 shell
  (`feat/redesign-shell`) F15.3 advisor (`feat/redesign-advisor`) F15.4 stories (`feat/redesign-stories`) and F15.5
  questions, Discover and forms (`feat/redesign-discover`) done. Phase F15 is complete; F7–F15 are merged into
  `development`, and `staging` was cut from it on 2026-10-17.
- Phase F16 on `feat/refine-base` (from `development`): F16.1 refinement (`feat/refine-ui`) done.
- Phase F17 on `feat/admin-dashboard-base` (stacked on F16's tip): F17.0 API types (`feat/api-types-p10`) F17.1
  overview (`feat/admin-overview`) F17.2 users (`feat/admin-users`) F17.3 member page (`feat/admin-user`) and F17.4
  roles (`feat/admin-roles`) done. Phase F17 is complete.
- Phase F18 on `feat/phone-auth-base` (stacked on F17's tip): F18.1 sign-in (`feat/phone-sign-in`) F18.2 sign-up and
  confirmation (`feat/phone-sign-up`) F18.3 reset (`feat/phone-reset`) and F18.4 settings (`feat/phone-settings`)
  done. Phase F18 is complete.
- Phase F19 on `feat/simple-ask-base` (from `development`): F19.1 question vote label (`feat/question-vote-label`)
  F19.2 one-place ask form (`feat/ask-editor`) and F19.3 composer restyle (`feat/ask-composer`) done. Phase F19 is
  complete.
- Phase F20 on `feat/harvest-base` (stacked on F19's tip): F20.1 Harvest tokens (`feat/harvest-tokens`) and F20.2
  question page (`feat/harvest-question`) and F20.3 white page (`fix/harvest-white-page`) and F20.4 ask form
  redesign (`feat/ask-redesign`) done. Phase F20 is complete.
- Phase F21 on `feat/paddy-base` (stacked on F20's tip): F21.1 Paddy Field tokens (`feat/paddy-tokens`) F21.2 shell (`feat/paddy-shell`) F21.3 sign in and sign up (`feat/paddy-auth`) F21.4 expert application (`feat/paddy-expert-apply`) F21.5 profile (`feat/paddy-profile`) F21.6 story editor (`feat/paddy-editor`) F21.7 question page (`feat/paddy-question`) done.

## Next up

1. **Nayeem:** PR F19.1, F19.2 then F19.3 into `feat/simple-ask-base`, then the base into `development`; then F20's
   steps into `feat/harvest-base`, then F21's into `feat/paddy-base`.
2. F21.2 onwards: one screen per step on the Paddy Field look.
3. Pick an SMS provider (backend 10.5): until then codes only appear in the backend log as `[DEV SMS]`.
4. Run the admin smoke step (`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`) and the admin screens live once an admin login is at hand.
5. Merge the backend's Phase 8 so F12–F14 run against its `development`.

## Open items

| Item | Needs | Blocks |
|---|---|---|
| Backend Phase 8 (notifications, moderation) is not merged into its `development` | backend | F12–F14 against `development` |
| No machine-readable error codes: the unconfirmed-e-mail 403 is told apart by its message text | backend | — |
| The backend takes `lang` but has no Bengali messages, so its errors stay English in the Bengali interface | backend: message files | — |
| Comment endpoints aren't typed in OpenAPI and have no reply counts | backend | — |
| No per-story "saved by me": the app reads the 100 most recent saves to mark Save buttons | backend: `bookmarkedByMe` | exact saved state for heavy savers |
| Make `development` the default branch on GitHub and protect it | Nayeem | — |
| Refresh token comes back in the JSON body, so it has to live in `localStorage` | backend: HttpOnly cookie | — |
| Gemini chat key rejected on the backend since 2026-10-06 | Nayeem | live checks of AI screens |
| Profile pages have no public name read: a direct visit shows the name from the user's questions, else "Member" | backend: public user summary | — |
| The seeded admin's password isn't known here, so admin flows (expert decisions, moderation) are tested with mocks only | Nayeem: an admin login for local checks | live checks of F11.3, F13.2, F13.3 |
| Local dev: port 8080 is the habit tracker and Postgres 5432 is down; the backend runs on 8081 against the `agrotrends-db` container (5433) | — | — |

---

## 2026-10-31 (F21.7 Paddy question page)

**Done**
- Votes (`qa/VoteControl`): round 36px buttons (44px touch area); outlined when they stand beside an answer, inside a
  pill on the question's "Useful question?" panel. Pressed up is filled paddy, pressed down a soft red; your own score is
  a pill.
- The question's tags moved under its title (before the author line and text), so what it's about reads first.
- Test: `qa/question-page.test.tsx` checks the tags come between the title and the text. Checked at 1280px light and
  dark and at 390px.

---

## 2026-10-31 (F21.6 Paddy story editor)

**Done**
- `/write`: the writing column with "Before you publish" beside it from 1024px: a title, some text and a cover (optional)
  ticked off as the draft fills, the word count and reading time (200 words a minute), and a note that topic and tags
  come in the publish step. Worked out from the draft; nothing new is sent.
- The toolbar is a soft rounded bar on the leaf wash (pressed tools white with the paddy icon); an empty cover is a
  dashed "Add a cover image" tile; the title is Lora 600.
- Test: `editor/editor.test.tsx` checks the checklist and reading time as the draft changes. Checked at 1280px light and
  dark and at 390px.

**Decisions**
- The publish sheet (topic, tags, farming details) stays a dialog: moving it into the side panel would change the
  publish flow that `publish.test.tsx` covers, for little gain.
- The mock-up's "Let the AI advisor cite this" switch is left out: the backend has no such setting.
- F21.3's language switch moved from `role="group"` to a fieldset (a lint warning), committed on `feat/paddy-auth` and
  merged forward into F21.4 and F21.5.

---

## 2026-10-31 (F21.5 Paddy profile)

**Done**
- `/users/:userId` after LinkedIn: a leaf-wash cover with a mustard sun, an 88px avatar over its edge, the name in Lora,
  the expert headline (their expert field and a mustard "Verified expert in …" chip), and a row of numbers: reputation,
  accepted answers, questions, topics. Below, "Answers questions on" (the topic list with points and badges) beside
  "Questions asked" from 1024px.
- Your own profile shows Edit profile (to settings) where others' show Report.
- Tests: `users/reputation.test.tsx` reads the numbers row and the headline, and checks Edit profile on your own page.
  Checked at 1280px light and dark and at 390px.

**Known limitations**
- No profile photo, cover, bio or credentials list yet: the backend has no public user read (open item); the cover is a
  drawn wash until it does.

---

## 2026-10-31 (F21.4 Paddy expert application)

**Done**
- `/experts/apply` in two columns from 1024px: on the left a mustard "Verified expert" chip, a Lora title, why it's worth
  it (a badge on everything you write; check the AI advisor in your topics) and "What happens next" as three numbered
  steps (send, an admin looks at your proof, your badge appears with a notification). The form or the application's
  status on the right; on phones the explainer comes first.
- Form: field and institution side by side; topics and the proof type as pill chips with a tick (the proof type was a
  select, now radios: one tap); the bottom bar has a note, Cancel and Send application.
- Tests: `experts/apply.test.tsx` picks the proof type as a radio and checks the explainer's steps. Checked at 1280px
  light and dark and at 390px.

**Decisions**
- No "usually within 3 days" or "questions come to you first": neither is promised by the backend.

---

## 2026-10-31 (F21.3 Paddy sign in and sign up)

**Done**
- `auth/AuthPage` (sign in, sign up, reset, verify): from 1024px a leaf-wash panel on the left (Lora "Grow better with
  AgroTrends.", three things you get: ask anything, an AI advisor with sources, verified experts; "Free, in English and
  Bengali."), with a mustard sun and the drawn sprig in the corner. The form sits on the right.
- An English | বাংলা pill switch on the form, so a reader can change the language before typing; each name is written in
  its own language.
- Sign up: the "How we reach you" heading no longer overlaps its hint.
- Test: `auth/auth.test.tsx` checks the panel and the language switch. Checked sign in and sign up at 1280px light and
  dark and at 390px.

**Decisions**
- No member quote or member counts on the panel: the mock-up's were invented, and real numbers need an API.

**Known limitations**
- The Google button's text follows the browser's language (Google renders it), not the page's switch; Google stays under
  the form, as `GoogleSignIn` has uncommitted local changes.

---

## 2026-10-31 (F21.2 Paddy shell)

**Done**
- Top bar: the search is a 288px pill on the leaf wash (no border) with a round Ctrl K hint; Ask is a pill with a plus;
  the logo mark's corners match the softer shapes. The phone menu's rows are pills; the tab bar's Ask button loses its
  shadow (no shadows on the page).
- Test: `layout/topbar.test.tsx` checks the search pill and Ctrl+K open the same search dialog. Checked the question page
  and Discover at 1280px light and dark and at 390px.

---

## 2026-10-31 (F21.1 Paddy Field tokens)

**Done**
- Nayeem compared five whole-app directions (an artifact with home, story, question, profile, AI advisor, phone, ask,
  write, sign in, sign up and expert screens in each) and chose **A's colours and type with D's shapes**. Written into
  `docs/DESIGN.md` as "Paddy Field": the direction, where each area takes its cue (Reddit, Stack Overflow, LinkedIn,
  Medium, Perplexity, Khamari), five rules, and the colour, type and shape tables.
- Tokens: paddy `#245C3A`, ink `#1C2B21`, stem `#59665D`, leaf wash `#F3F7F2`, hairline `#E4EAE3`; dark mode a deep
  loam `#111712` with young-leaf green `#7CC495`. Field borders `#84958A` (3.2:1).
- Mustard split in two: `mustard` `#D9A441` (the flower: borders, dots, fills) and the new `mustard-ink` `#8A5F0C` for
  text and icons (5.9:1), since the flower itself is only 2.2:1 on white. `text-mustard` uses moved to `text-mustard-ink`.
- Shape: `--radius` 12px (fields), cards 18px (`rounded-xl`), larger panels 21px; buttons are pills in Inter 600 with a
  little more side padding. The question, answer and AI answer cards drop their shadow and move to 18px.

**Decisions**
- Lora and Inter stay (A's type); only the shapes come from D. D's yellow buttons are not used.

**Known limitations**
- Screens keep their F20 layouts until their F21 step; some page-level `rounded-2xl` panels are 21px instead of 18px
  until then.

---

## 2026-10-31 (F20.4 ask form redesign)

**Done**
- Designed with the impeccable and taste skills (installed for the user, `~/.agents/skills`). impeccable's context
  check found no PRODUCT.md and treated this as a refinement of the existing look; the screen is "Operate" (a task),
  so restraint, labels above fields and one primary action. Taste's app-screen rules: show the choices instead of
  hiding them, one click to the main job, say what is missing.
- Topic: `qa/TopicPicker`, native radios styled as chips (arrow keys move, a tick marks the choice), the first eight
  topics then "More topics" as a search; a topic chosen there joins the chips. Legend and hint above.
- Tags: `TagInput popular` offers the most used tags as dashed "+ tag" chips before anything is typed, so a tag is one
  tap; typed text still filters them. The F19.3 `compact` pill is gone; the label says "(optional)".
- Post bar: "Still needed: a title, details, a topic" until the form is complete, then "Ready to post" with the
  Ctrl + Enter hint; Cancel and Post question (with a send icon) on the right. Ctrl/⌘+Enter posts from anywhere in the
  form, never while a Bangla input method composes.
- Tests: `qa/ask.test.tsx` (topic radios, popular tag one tap, Ctrl+Enter); the publish, AI answer and confirm-e-mail
  tests follow the new controls. Checked at 1280px light and dark and 390px, with ten mocked topics.

**Known limitations**
- On phones the "Still needed" line is hidden for room; the field errors still say it on Post.

---

## 2026-10-31 (F20.3 white page)

**Done**
- Nayeem: keep the page white, consistent with the app. `--background` is `#FFFFFF` again in light mode; the green,
  gold, Lora and radius of Harvest stay. Cards keep their hairline so they still read on white. Dark mode unchanged.

---

## 2026-10-31 (F20.2 Harvest question page)

**Done**
- The question is a white card on the field-green page: topic and Unanswered (a dashed gold pill), More actions, a
  Lora title, author, body, photos, tags and older questions' farming chips.
- A side panel holds the question's vote ("Useful question?"), the answer count, the asked date and a full-width
  Answer. It is one element placed by the grid: a sticky card beside the question from 1024px, a row under the
  question below that, so the vote is never rendered twice.
- The AI answer and every answer are white cards; the accepted answer and an expert-confirmed AI answer get a gold
  edge as well as their labels (the skill's anti-patterns for Q&A: unclear votes, a hidden accepted answer).
- Answers and replies use `.post-body`, so their numbered and bulleted lists show (they rendered as bare lines).
- Checked at 1280px light and dark and at 390px with the API mocked; existing Q&A tests pass unchanged.

**Decisions**
- No related questions in the panel: it would add a request to every question page, which already waits on a
  request chain (open item).

---

## 2026-10-31 (F20.1 Harvest tokens)

**Done**
- New visual direction from the ui-ux-pro-max skill. Its first design-system match for "community Q&A" was a
  developer-forum look (blue, Fira Code), rejected; the agriculture query gave "Organic Biophilic" with the Farm Tech
  palette, which Nayeem chose. Tokens in `src/index.css`, light and dark; table in `docs/DESIGN.md`.
- Lora replaces Newsreader as the serif (`@fontsource-variable/lora`; Newsreader removed), so every `font-serif`
  headline follows. Raleway, the skill's body face, was not taken: Inter reads better small and next to Hind Siliguri.
- `--radius` 0.75rem to 1rem (the style's 16–24px corners).
- Contrast checked: every text pair at 4.5:1 or more in both themes; field borders darkened to 3.0:1 / 3.7:1.
- Looked at Discover, Questions and a question page at 1280px light and dark and at 390px with the API mocked.

**Known limitations**
- Every screen takes the new colours; only the question page gets a layout redesign in this phase.

---

## 2026-10-31 (F19.3 ask composer restyle)

**Done**
- Checked against the ui-ux-pro-max guidance (content-first minimal style; one primary action, kept in reach; Command-
  style search for long lists). The boxed border is gone: the question line and details sit on the page as in the
  story editor. The toolbar is a soft pill that sticks under the top bar and scrolls sideways on phones; the photo
  label and an empty count hide on phones.
- Topic and tags share one row under the details, both typed: the topic filters as you type and Enter picks it;
  tags are `#` chips in a soft pill (`TagInput compact`, label read out but not shown).
- Cancel and Post question sit in a sticky bar (with "An AI answer comes right after you post." on a new question).
  On phones it rides above the bottom navigation (`bottom: 3.5rem + safe area`, measured 57px).
- The page heading is smaller, so the question line is the largest text.
- Checked in Chromium at 1280px light and dark and at 390px with the API mocked; tests unchanged (the labels and roles
  stayed).

**Decisions**
- Topic and tags stay in the page, not in the sticky bar: tag suggestions and the topic list need room to open.

---

## 2026-10-30 (F19.2 one-place ask form)

**Done**
- Asking was five separate boxes (question, details, topic, tags, photos) plus a folded farming section. Now one
  composer holds the question line, a toolbar and the details as rich text (bold, italic, bulleted and numbered
  lists, quote, link); "Add a photo" in the toolbar uploads up to 4, shown as a strip under the text and sent as
  `imageUrls` as before. Topic and tags sit side by side under it. Enter in the question line moves to the details.
- `QuestionEditor` (Tiptap, no headings or code blocks); `.post-body` styles the details the same in the editor and on
  the question page. Older plain-text questions open as paragraphs (`lib/html` `textToHtml`).
- Copy is no longer about crops only: "Say what you are working with, where…"; the tips and the questions page
  subtitle say the same.
- Tests: `qa/ask.test.tsx` (rich text posted as HTML, no farming fields, an old text question edited as paragraphs
  with `agri` left out), `lib/html.test.ts`. `test/setup.ts` stubs the layout calls ProseMirror makes while typing.

**Decisions**
- The crop / season / region / soil fields are gone from the ask form: they fit crops, not fisheries, livestock or a
  student's question. Topic says the field and tags the specifics. The backend still takes `agri`; an edit leaves it
  out, so an older question keeps its farming details and its chips still show.
- Details are rich text again (reverses F4.1's plain text). The backend already cleans question HTML (jsoup) and
  gives the AI and moderation its plain text, so no backend change.
- Photos stay `imageUrls`, not inline images, so the question list keeps its thumbnail.

**Known limitations**
- The link tool is a native prompt, as in the story editor.
- Older questions' farming chips still link to crop / season / region / soil filters on `/questions`; new questions
  carry none.
- `welcome.test.tsx` "no Google button without a client id" fails when `.env` sets `VITE_GOOGLE_CLIENT_ID`.

---

## 2026-10-30 (F19.1 question vote label)

**Done**
- The question page had two kinds of votes and nothing said which was which. The question's own vote now sits beside
  the author line in a "Rate this question" group with a visible "Useful question?" (just the score on your own
  question); the bar under the question keeps only Answer. Vote arrows get a `title` with their label on hover.
- Tests: `qa/votes.test.tsx` (the group holds the question's arrows and none of the answers').

**Decisions**
- Question votes stay: they rank questions and earn the asker reputation. Only the labelling was the problem.

---

## 2026-10-17 (F18 phone sign-up, backend Phase 10)

**Done**
- Sign-in and admin sign-in take an e-mail or a phone number (`identifier`); phones go out without spaces or dashes,
  and a Bangladeshi number may drop +880 (`lib/auth`: `isPhone`, `signInIdentifier`, `joinPhone`).
- Sign-up: an e-mail, a phone number or both (blank ones stay out), then sign-in with whichever was given. A
  phone-only account goes to `/verify-phone`: 6-digit code (one field, `one-time-code`), resend after 60 s.
- The confirm banner and the write-refused dialog follow the account (`needsConfirmation`): the e-mail link, the SMS
  code or both. The 403 is still told apart by "Confirm your e-mail", which the new message keeps.
- Forgot password: E-mail | Phone; by phone, a code, then the code and a new password (every session signed out),
  then sign-in with the usual notice.
- Settings: e-mail and phone optional while one remains, each with Confirmed / Not confirmed yet and its action (new
  link, enter the code); changing the e-mail no longer signs out. The account menu shows the phone when there's no
  e-mail.
- `openMoreActions` (tests) now waits for the lazily loaded menu: a timing flake since F16.
- Tests: phone sign-in, phone-only sign-up to `/verify-phone`, code and resend, wrong code, phone banner, reset by
  SMS, settings contacts. 291 tests.

**Decisions**
- After a phone-only sign-up the code comes before the optional profile step; with an e-mail too, the banner offers
  both ways.
- Resend waits 60 s on the page; the backend allows three codes an hour per number.

**Known limitations**
- No SMS provider yet (backend 10.5): codes are written to the backend log as `[DEV SMS]`.

---

## 2026-10-17 (F17 admin dashboard, backend Phase 9)

**Done**
- API types regenerated from the backend's `development` (Phases 9 and 10); sign-in sends `identifier`.
- `/admin` overview: open reports, expert applications and unchecked AI answers first (each to its queue, amber when
  something waits), then members, banned, questions, answers and stories with this week's new members and questions.
- `/admin/users`: search (Enter, in the URL), All / Active / Banned, contact, join date, staff roles, ban badge, paging.
- `/admin/users/:id`: contact with confirmation state, ban and reason, counts, expert topics with Revoke, give or
  remove ADMIN roles (USER and SUPER ADMIN shown, not changeable). Ban controls offer only the action that applies.
- `/admin/roles`: roles with their privileges; create and edit ADMIN roles with privilege checkboxes (shadcn
  Checkbox), delete with a confirmation.
- Admin sections in a rail on wide screens (tabs on phones): Overview, Users, Reports, Expert applications, Roles,
  Categories. Tests: overview, users filters, member actions, roles create / edit / delete.

**Decisions**
- Admin copy stays English, like the existing admin screens.
- Every admin mutation refreshes all admin queries (`['admin']`): a ban changes reports, users and the counts.
- The backend's 403 is shown as written when a staff member lacks a privilege; every section stays visible.

**Known limitations**
- An account with an admin role can't be banned (backend rule); the page says so next to the roles.

---

## 2026-10-17 (F16 refinement: less clutter, better inputs)

**Done**
- Discover: the topic card grid is gone; "Help a farmer today" shows up to three unanswered questions with an Answer
  link (`#your-answer`), and the topics are one row of filters above "What farmers are asking".
- Search: one entry point. The top bar opens a search dialog (`layout/SearchDialog`, Ctrl/⌘+K, Enter goes to
  `/search`); the Questions page's search field and the Discover hero's search and topic chips are gone (topics stay in
  "Browse by topic" and as the Questions filter). No separate Search buttons.
- Radius token 8px → 12px (inputs and buttons 12px, cards and menus ~17px, dialogs 17–22px); field border
  `#C9D5C9`, hover `subtle`, focus green border + halo.
- `threads/PostMenu`: Edit / Delete (red, still confirmed) for the author, Report for others, behind "More actions",
  on questions, answers, replies and story responses. Report reuses the dialog through `useReportFlow`.
- Votes: Phosphor carets in tinted 36px squares (44px touch area), sage/green up, soft red down.
- `ui/TagList`: three chips then "+N" with a popover of all tags (rows, question page, story page); farming chips get
  a hidden "Crop:" / "Season:" prefix.
- Photo picker: thumbnails and a dashed "Add a photo" tile in one grid; spinner in the tile while uploading.
- Advisor: Enter sends, Shift+Enter is a new line; answers keep Ctrl/⌘+Enter. Both ignore Enter during IME
  composition (Bangla).
- Tests: tag list (0, 1, 3, 4, 7 tags; popover; no navigation from a row), advisor keys and IME, menus in the
  report, comment and question tests (`openMoreActions` helper), search dialog. 278 tests, lint, build pass; main JS
  110 kB. Screens checked at 320–1440 with fixture data (the local backend was down).

**Decisions**
- Phosphor, not Lucide: Lucide isn't installed and the brief said not to add dependencies.
- Field borders follow the softer brief (`#C9D5C9`, 1.5:1); every field keeps a visible label, so the border isn't
  the only way to find it.
- Post menus, the tag popover and the search dialog load lazily (same-size placeholders) to keep the main bundle in
  budget.

**Known limitations**
- Answers and responses have no attachments (the backend takes images on questions only), so the composer has no
  attach button.

---

## 2026-10-17 (F15 "Living Field" direction, steps F15.1–F15.5)

**Done**
- Palette exactly as specified (white `#FFFFFF`, text `#1C2B21` / `#59665D`, green `#245C3A` / `#19482D`, sage
  `#EAF3E8`, pale `#F5F8F3`, borders `#E2E8E1` / `#C9D5C9`, warm `#D9A441` / `#FBF3E1`, error `#B42318` /
  `#FEF3F2`, success `#216E45`, ring `#79A98A`); dark theme rebuilt to match. New tokens `subtle`,
  `destructive-soft`, `success`.
- Fonts: Newsreader (editorial) and Inter (interface), self-hosted via fontsource; Literata removed. Base headings
  are now Inter; serif is opted into per element. Type scale rebalanced for Inter.
- Navigation: Discover / Questions / Stories / AI advisor / Write; bottom tab bar on phones (`layout/BottomNav`).
- Discover (`features/home/HomePage`, `DiscoverSections`); Questions page rebuilt with `QuestionRow` (photo
  thumbnails, unanswered state); question page vote bar (`VoteControl orientation="horizontal"`); Stories featured +
  grid (`feed/StoryTiles`), story page wide cover and contents list; advisor workspace with history rail and `?q=`;
  ask form two columns; auth brand panel; `ui/Botanical` drawings.
- Forms: season, soil and proof selects moved from native selects to the shadcn Select; the publish sheet from a
  native `<dialog>` to the shadcn Dialog (menus inside it now open above it). Tests drive them with `pickOption`.
- 274 tests, lint, type-check and build pass; no overflow at 320–1440 on 12 pages; light and dark screenshots.

**Decisions**
- `/` is now Discover; the question feed lives at `/questions` (both routes existed already). No route was added
  or removed.
- `#78847B` (3.9:1) is used for field borders and icons, not text; `#79A98A` (2.7:1) is a halo next to a green
  outline or border, which carries the WCAG focus contrast; `#D9A441` is decorative, with dark text on its surface.
- No photographs were added or hotlinked: drawn field art and covers stand in until licensed photos exist.
- The advisor's common questions are interface examples (English, like the seasonal ones), not advice.
- Discover below the hero is lazy (its topic icons alone pushed the main bundle to 141 kB); now 117 kB.

**Known limitations**
- Question views, "helpful" votes on AI answers and follow-up suggestions are in the reference but have no backend,
  so they are not shown.
- Seasonal and common advisor examples, and editor / publish-dialog copy, are English only (as before).

---

## 2026-10-17 (F15 first pass: white editorial canvas, superseded by the entry above)

**Done**
- Tokens: white canvas; forest green `#246B45` / `#194D33`, sage `#E8F0E6`, pale green `#F1F6EF`, quiet panel
  `#F7F9F6`; new `surface`, `border-strong`, `warning` / `warning-soft`; field borders `#879284` (3.2:1). Dark theme
  retuned to match. `--radius` 0.5rem; every shadcn primitive moved from pills to 8px (12px for menus and dialogs),
  hairline rings instead of heavy shadows.
- New: shadcn `combobox`, `sheet`, `input-group`; `src/ui/SearchSelect` (labelled, filterable, clearable, error
  wiring, can open inside a native `<dialog>`); `Alert` warning variant; error messages carry an icon; selected chips a
  tick.
- Questions: rows with hairlines; toolbar = Newest | Unanswered, searchable topic, "Filter" popover with a count;
  active filters (tag included) as sage chips with Clear all; light sidebar. Question page: vote column inside the
  column, answers as rows with one action row each, accepted answer's mustard edge, answer box on a quiet panel. Ask
  form: searchable topic, farming details folded (open when editing one that has them). Ctrl/⌘+Enter sends in the
  shared composer, with a guard against double posts.
- Stories: green-underlined feed tabs, featured first story, broken covers hidden, story page title and cover,
  editor toolbar and title, publish sheet with a searchable topic. The welcome hero shows on home only.
- Advisor: one composer surface (label, text, counter, "Ctrl+Enter to send", Ask); the counter turns amber and is
  announced in the last 100 characters; answers labelled "AI answer", sources in their own panel, "Written by AI, not
  checked by an expert" note; the daily limit (429) is an amber Alert, other failures red. History: caret, AI label.
- Shell: white top bar, active page green and underlined, search field from 1024px; phone menu sheet with every
  destination (the advisor had no way in on phones); account menu is a shadcn DropdownMenu (arrow keys, Escape
  returns focus); footer links Stories.
- Tests: SearchSelect, chip tick, Ctrl+Enter answer, advisor counter and AI labelling, phone menu; topic pickers in
  tests use `chooseOption` (src/test/render.tsx). 273 tests, lint, build pass. No horizontal overflow at 320, 375,
  390, 430, 768, 1024, 1440 on ten pages; checked light and dark.

**Decisions**
- Fonts stay Literata + Hind Siliguri: the brief's Inter / Lora have no Bengali.
- Mustard stays for trust only; cautions use a separate amber.
- The advisor's caution is a fixed sentence: its response has no disclaimer or review state to show.
- Menus, the filter popover and home's topic picker are lazy with same-size placeholders: eager they pushed the main
  bundle to 148 kB gzip; now 112 kB (budget 120).
- Testing Library's async timeout is 3 s (src/test/setup.ts): lazy chunks sometimes took over 1 s to import with the
  whole suite running.
- Editor and publish-sheet strings stay English as before (they never went through `t()`); not in this phase's scope.

**Known limitations**
- Admin, expert, settings, library and notification screens only picked up the tokens and radii; no layout changes.
- Crop and region stay free text: the backend has no list to search.

---

## 2026-10-15 (F14.2 community smoke tests)

**Done**
- `e2e/community.spec.ts`, serial, against a running backend with dev mail: two people sign up through the UI and
  confirm through the logged link (`E2E_MAIL_LOG`); one asks (topic, tag), the other answers; the asker's bell shows
  the notification; the asker upvotes (still pressed, Score 1 after a reload) and accepts; three new accounts report
  the question and a visitor then gets "Page not found"; with `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`, an admin
  dismisses the reports and the question is back.
- `e2e/smoke.spec.ts` follows the new home (questions first, Stories tab), "Topic" on publish and ask, and the
  account menu's name.
- Run: `PW_CHANNEL=chrome API_TARGET=http://localhost:8081 E2E_MAIL_LOG=<backend log> E2E_EMAIL=… E2E_PASSWORD=…
  npm run e2e`: 9 passed, the admin step skipped (no admin login here), against the backend's `fix/phase8-review-3b`.

**Known limitations**
- Each run leaves its accounts, question and reports in the database (`smoke-*@example.com`); the backend has no
  self-delete that works for them (F6.4's note still holds).

---

## 2026-10-15 (F14.1 Bengali and accessibility)

**Done**
- `lib/bn-coverage.test.ts` reads every source file and fails if any `t('…')` literal lacks a Bengali string; it
  found one ("Author", dropped in F7.1a but still used). New screens were translated as they were built.
- `bengali.test.tsx` now also renders the question page in Bengali: answer count, accepted mark, expert badge, vote
  buttons, the AI answer's state and Report.
- Vote buttons use whole sentences per target ("Upvote this question / answer") so Bengali reads naturally instead of
  a templated noun.
- axe-core (WCAG 2 A/AA and best practices) in a real browser on home, stories, search, question pages (with and
  without an AI answer), the report dialog, verify-email and profiles signed out, and home, the bell panel,
  notifications, ask, apply, settings, welcome, review and My stories signed in: no violations.
- Keyboard: the bell opens with Enter and closes with Escape returning focus to it; the report dialog takes focus and
  Escape returns it to Report; vote arrows are in the tab order.
- Found and fixed: Sonner's toast region was named "Notifications", the same as the bell's panel; it is now
  "Messages".

**Known limitations**
- Admin pages, the editor, My stories and form validation messages in older screens are still English (as before).

---

## 2026-10-15 (F13.3 ban and hidden states)

**Done**
- `admin/BanControls` for staff, on profile reports in the moderation queue and on profiles: **Ban the account**
  (a reason is required, up to 500; the dialog says they are signed out everywhere, their open reports close, their
  posts stay, and ended sessions can't come back) and **Lift a ban** (`POST` / `DELETE /api/admin/users/{id}/ban`).
  Both are offered as there's no "is banned" read; the backend's refusals (e.g. an admin account) are shown.
- The banned side was done in F7.2: the next refresh is a 403 whose message is shown once, and the session ends.
- A hidden story's editor: the 409 on save or publish locks it, with an alert explaining why; autosave stops and the
  publish sheet won't open until moderators decide.
- A comment thread, an answer list or a reply thread that turns 404 says "This conversation is no longer available."
  instead of an error.
- Tests: `admin/ban-hidden.test.tsx` (ban with a reason and lift it; no controls for non-staff; the editor locks on a
  409 and stops sending; a 404 thread).

**Known limitations**
- Not live-tested: no admin login here.

---

## 2026-10-15 (F13.2 moderation queue)

**Done**
- `/admin/reports` (staff; a new section of the admin frame): **Open**, **Removed** and **Dismissed** tabs over
  `GET /api/admin/reports?status=`.
- Open reports are grouped by post (`groupReports`): the reasons with counts, each reporter with their details, and
  either the snapshot with a **Hidden** badge (the live page is 404 even for staff) or **Open the post** (answers and
  comments are found through `GET /api/answers/id/{id}` and `GET /api/comments/id/{id}`).
- One decision covers the group: **Remove the post** (for an AI answer, **Hide the AI answer**), behind a dialog that
  says it can't be undone and takes the post's reputation and AI index with it; **Dismiss**, which restores a hidden
  post. Profile reports offer Dismiss only (banning is F13.3). A 409 (someone acted first) is shown and the queue
  reloads.
- Tests: `api/moderation.test.ts` (grouping keeps the snapshot) and `admin/admin-reports.test.tsx` (snapshot and
  removal; the live link and dismiss; a 409; closed reports by status).

**Known limitations**
- Not live-tested: no admin login here.

---

## 2026-10-15 (F13.1 report)

**Done**
- **Report** on stories, questions, answers and replies, story responses, the AI answer (sent with the question's
  id) and profiles; never on your own post or profile. Visitors sign in first.
- The dialog asks why (harmful advice, spam, abuse, false credentials, something else, each with a hint) and for
  optional details (up to 500), then `POST /api/reports`. It says "Thanks, moderators will look at it." and never
  whether the post got hidden; a 409 counts as reported; a 404 says the post is gone. Send is disabled while sending
  (a double tap races on the backend). The button then reads **Reported**.
- The dialog (Base UI) loads on first use, so the story page doesn't carry it in the main bundle.
- Live: three accounts reporting a question hid it (404 for everyone).
- Tests: `reports/report.test.tsx` (reason required, the exact request, Reported afterwards; a 409; no button on your
  own posts; visitors to sign-in).

**Decisions**
- The threshold is never shown or hard-coded: the dialog says "several reports from different people".

---

## 2026-10-15 (F12.2 notifications page)

**Done**
- `/notifications`: **All** and **Unread (n)** tabs (`unreadOnly=true`), newest first, "Show older notifications"
  for the next page, **Mark all read**. Rows are the bell's (same words, same links, no link for hidden or removed
  posts); the bell's panel ends with **See all notifications**.
- Tests: `notifications/notifications.test.tsx` (types in words and paging, the unread tab's request, the bell's link).

---

## 2026-10-15 (F12.1 notification bell)

**Done**
- A bell in the top bar for signed-in users: the unread count (`GET /api/notifications/unread-count`), polled every
  60 s while the tab is visible and again on focus, as a red badge (99+ beyond that).
- Its panel lists the latest ten (`GET /api/notifications?pageSize=10`), unread ones dotted and named "Unread" for
  screen readers; opening one marks it read (`POST …/{id}/read`) and goes to its page; **Mark all read**
  (`POST …/read-all`). Escape or a click outside closes it. It grows out of the bell (origin top right, 150 ms
  ease-out, `@starting-style`).
- `lib/notifications.ts` words and links every type: actor types name the actor ("A member" when the name is gone),
  moderation and application decisions name no one, hidden and removed posts have no link, unknown future types get a
  generic line linked by target type.
- Fixed `buttonClass` (F7.0): a screen's classes were appended by cva instead of merged with `cn`, so conflicting ones
  (the top bar's `hidden` on phones) lost to the variant's. It made the phone top bar overflow once the bell was in.
- Live: the asker sees "Rahim answered your question" with a count of 1.
- Tests: `lib/notifications.test.ts` (every type, no names or links where there must be none, unknown types) and
  `layout/bell.test.tsx` (count and list, open marks read and navigates, mark all read, polling).

---

## 2026-10-15 (F11.3 expert applications admin)

**Done**
- `/admin/experts` (staff; the account menu's **Admin**): Waiting / Approved / Rejected tabs over
  `GET /api/admin/expert-applications?status=`. Each application shows the applicant (linking to their profile),
  field, institution, proof type, requested topics, proof photos and links (both open in a new tab,
  `rel="noopener noreferrer"`).
- Waiting: tick the topics to approve (all ticked sends no `categoryIds`, i.e. every requested topic) with an optional
  note; **Reject** needs a reason (up to 500). A second decision's 409 is shown as written and the lists reload.
- Approved: **Revoke {topic}** per badge, behind an alert dialog that says the expert's confirmed AI answers in that
  topic go back to unchecked (`DELETE /api/admin/users/{id}/expert-badges/{topicId}`).
- `admin/AdminPage`: one frame for admin pages (sections nav and the admin sign-in), now used by categories too.
  Staff see every section; a missing privilege shows the backend's 403.
- Tests: `admin/admin-experts.test.tsx` (proofs open safely and approve-all sends no topics; approve some with a note;
  reject needs a reason and shows a 409; revoke asks first; a 403 is shown).

**Known limitations**
- Admin pages stay in English, as in F6.6.
- Not live-tested: no admin login here.

---

## 2026-10-15 (F11.2 expert review)

**Done**
- On the question page, an unchecked AI answer shows **Review as an expert** to people with a badge in the question's
  topic: Verified Experts get **Confirm**, **Correct** (their corrected answer, up to 5000 characters, posted on the
  question) and **Flag**; Top Contributors get **Flag** only. Flag asks first ("It will be hidden from everyone").
- `/review`: the review queue (`GET /api/review-queue`, oldest first) with the question, its topic, the AI answer and
  the same actions. A 403 explains the queue is for verified experts and links to applying.
- The account menu shows **Review queue** only to Verified Experts.
- Whatever happens (success or 409 "already reviewed"), the AI answer, the answers and the queue reload; the 409's
  message is shown as written.
- Badges come from `GET /api/users/{me}/reputation` (`experts/useMyBadges`), as the backend has no "am I an expert
  here" read.
- Tests: `experts/review.test.tsx` (confirm on the question page; a correction's body; a top contributor flags only
  and sees a 409; no buttons without a badge in that topic; the queue and the menu entry; 403 on the queue).

**Known limitations**
- Not live-tested: approving an expert needs an admin account with `EXPERT_REVIEW` (the seeded admin's password
  isn't known here).

---

## 2026-10-15 (F11.1 apply to be a verified expert)

**Done**
- `/experts/apply`: topics (1–3, as toggle chips), field, institution, credential type, proof photos (up to 4, through
  `POST /api/images`, with a warning that they live at a public, unguessable address) and up to 3 `http(s)` links;
  at least one proof. Sent to `POST /api/experts/applications`.
- Status from `GET /api/experts/applications/me` (newest first): waiting, approved (mustard) or not approved, with the
  admin's note; the deciding admin is never shown. A pending application replaces the form (a 409 says so); after a
  decision, **Apply again**.
- Settings has a **Verified expert** section with the same status card, or the way to apply.
- `qa/PhotoPicker` takes a label, hint and limit, so proofs reuse it.
- Fixed a lint warning from F9.1 (`VoteControl` synced props into state in an effect; it now adjusts during
  render). Lint is now run with `--max-warnings 0`: plain `oxlint` exits 0 on warnings, which hid it.
- Live: an application sent through the API shows as waiting.
- Tests: `experts/apply.test.tsx` (validation, then the exact request; pending shows status; a rejection's note and
  Apply again; the Settings card).

---

## 2026-10-15 (F10.3 ask the experts)

**Done**
- Each advisor history item offers **Ask the experts**: a topic (required) and an optional title (placeholder: the
  question's first 120 characters, the backend's default), sent to `POST /api/ai/history/{id}/ask-experts`. It then
  links to the new public question; items already published (`publishedQuestionId`) show the link straight away.
- 409 (published already) says so, and the refetched history brings the link.
- The asked text keeps its line breaks (`white-space: pre-line`).
- Tests: posting with topic and title links to the question; the topic is required; a 409 ends with the link.

**Known limitations**
- Not live-tested: with the Gemini key rejected, the advisor creates no history items locally.

---

## 2026-10-15 (F10.2 sources)

**Done**
- One `ai/Sources` for the backend's `{type, blogId, questionId, title}`: `blog` links to the story (`/s/{id}`, which
  redirects to its slug), `answer` to the question ("Community answer to: …"), each with its own icon. Sources with
  no usable id are left out. Used by the AI answer card, the advisor and, new, each item of the advisor history.
- Tests: a community-answer source on the AI card; stories and community answers in the history.

---

## 2026-10-15 (F10.1 AI answer card)

**Done**
- `GET /api/questions/id/{id}/ai-answer` as its own card above the people's answers: "AI answer" with its state
  (not yet checked; **Confirmed by** the expert with the date, in a mustard ring; **Corrected by** the expert with a
  link to their answer, `#answer-{id}`, now on every answer card), its sources and the backend's disclaimer, always.
  An unchecked answer sits in a dashed card, so it never reads as a person's answer.
- A 404 (none yet, failed, flagged, hidden question) shows nothing. Right after posting a question the page says an AI
  answer is being written and polls every 3 s for up to a minute (`askedAt` in the navigation state), then goes quiet.
- The F4.4 AI-draft button was already removed with its endpoint in F7.1a.
- Live: the seeded CONFIRMED and UNCHECKED rows render.
- Tests: `qa/ai-answer.test.tsx` (unchecked with sources and disclaimer; confirmed and corrected with the link and
  anchor; 404 shows nothing; after asking it waits and shows the answer when it arrives).

**Decisions**
- The AI answer is plain text (`white-space: pre-line`), not HTML, so it never goes through `SafeHtml`.

---

## 2026-10-15 (F9.3 reputation and badges)

**Done**
- `qa/AuthorLine` on questions and answers: name (linking to `/users/:userId`), reputation total, and the badges the
  author holds in the question's topic (`authorBadges`): **Verified expert** in mustard, **Top contributor** quieter.
  Question cards show the reputation and a mustard seal for verified experts.
- `/users/:userId`: reputation total, reputation by topic (points, accepted answers, badges, and the expert field such
  as "Veterinarian" from `GET /api/users/{id}/reputation`), how points are earned, and the user's questions
  (`GET /api/questions/all/user/{id}`).
- Tests: `users/reputation.test.tsx` (badges and reputation in author lines, only where the answer carries them; the
  profile's topics, expert field and questions).

**Known limitations**
- The backend has no public read of a user's name, so a profile opened directly takes it from the link (or the
  user's questions) and otherwise says "Member". Added to "Needs from the backend".

---

## 2026-10-15 (F9.2 accept)

**Done**
- The asker sees **Accept answer** on each answer (`PUT /api/answers/id/{id}/accept`); on the accepted one it reads
  **Accepted** (pressed) and takes it back (`DELETE`). The list and the question refetch, so the accepted answer moves
  to the top (the backend's order) and the question's card shows its accepted state.
- Everyone sees the accepted answer with a mustard ring and an "Accepted by the asker" mark (mustard is the trust
  colour, DESIGN.md).
- Live: asked with one account, answered with another, accepted as the asker.
- Tests: `qa/accept.test.tsx` (accept moves the answer up and can be taken back; others see the mark, no button).

**Decisions**
- No accept on replies (the backend refuses them), so the button is only on answer cards.

---

## 2026-10-15 (F9.1 votes)

**Done**
- `VoteControl` (up arrow, score, down arrow) on the question and on every answer: `PUT …/vote?direction=UP|DOWN`
  casts or switches, the same arrow again withdraws (`DELETE`). The score moves at once and rolls back if the
  backend refuses; the arrows are disabled while a vote is in flight (the backend can 500 on a double tap).
- `GET /api/questions/id/{id}/my-votes` marks the reader's votes on the question and all its answers in one call.
- Your own question or answer shows its score without arrows. A refused vote (the 50-point downvote rule) shows the
  backend's message in a bubble beside the arrows for four seconds; an unconfirmed e-mail opens the F7.2 dialog
  instead. Visitors are sent to sign in.
- Layout: on the question page the vote column hangs in the left margin on wide screens; in answer cards it's the
  first column.
- Tests: `api/votes.test.ts` (next vote, optimistic score) and `qa/votes.test.tsx` (vote and withdraw, a refused
  downvote rolls back with the message, my votes marked and no arrows on my own answer, visitors to sign-in).

**Decisions**
- The refusal is an inline bubble (`role="alert"`) rather than a hover tooltip: it has to appear on a tap, on a phone,
  without hovering.

---

## 2026-10-15 (F8.3 question answers)

**Done**
- Answers have their own module (`api/answers.ts`, typed from the backend's `AnswerResponse`) and component
  (`qa/Answers.tsx`): cards in the backend's order (accepted first, then score, then oldest), "N answers", the answer
  form below them, owner edit and delete.
- Replies are read per answer when the reader opens them ("Show replies", `GET /api/answers/replies/{id}`), shown in
  a rule under that answer only, with a reply form. The client-side filter that dropped replies from the answer list
  is gone (the backend lists direct answers only now).
- Story responses keep the `Thread` component, now comments-only; posting, replying and editing in both use one
  `threads/Composer`.
- Tests: answers keep the backend order and replies aren't fetched until opened; replies stay under their answer and
  a reply posts `parentAnswerId`.

**Known limitations**
- F8.2 (`feat/questions-home`) went to 27 files, over the 20-file rule: the home, list, search and the tests that
  moved with `/stories` were one change. Split such a step next time.

---

## 2026-10-15 (F8.2 questions home)

**Done**
- `/` is the question feed, under **Questions | Stories** tabs; stories moved to `/stories` (feed tabs, filters and
  story chips follow: `filterPath` now defaults to `/stories`). Visitors get a new welcome ("Farming questions,
  answered by people who grow") above the tabs. `/questions` shows the same list with its own heading.
- Question cards (white on the leaf floor): votes and answers in a left column, the answers box in mustard-soft with
  a check when an answer is accepted, then topic badge, serif title (the link covers the card), excerpt, `#tags` and
  farming chips. Skeleton cards while loading; shadcn `Empty` when nothing matches.
- Filters: **Newest | Unanswered** (`unanswered=true`), a topic select (`categoryId`), a removable tag chip (`tag`),
  and the farming filter bar; all combine, and changing one keeps the others (`filterPath(…, keep)`). A rail lists
  topics and offers the advisor.
- Search: question results first (`GET /api/questions/search`, quotes and `-exclusions` explained when nothing
  matches), stories on a second tab (`?type=stories`); a new search stays on its tab. Matching tags above.
- Top bar: Questions, Stories, Advisor, Write, and an **Ask** button when signed in. The home rail calls tags "Tags".
- Bundle: the confirm-e-mail dialog (Base UI) mounts only when first needed and the stories tab is lazy, keeping the
  main bundle at 105 kB gzip.
- Tests: home lands on questions; cards show votes, answers, accepted, topic and tags; Unanswered + topic + tag +
  crop combine and survive each other; question search by phrase; story tests moved to `/stories`.

**Decisions**
- Tabs and filters are links (URL state), so every view can be shared and the back button works.
- Answer and vote counts sit in a fixed column so titles align down the list, the way people scan a Q&A site.

---

## 2026-10-15 (F8.1 ask form: tags and photos)

**Done**
- Ask and edit question: up to 5 tags (the story editor's tag input, now shared as `topics/TagInput`) and up to 4
  photos (`qa/PhotoPicker`, uploaded one by one through `POST /api/images`, removable, type and size checked first).
- Editing leaves `tags` and `imageUrls` out when they weren't touched, so the backend keeps them; a change (even
  removing all) is sent. A new question leaves out empty lists.
- The question page shows its topic above the title, its photos (open full size in a new tab) and its tags (linking
  to the questions list filtered by tag, which F8.2 reads).
- Words: tags are "Tags" and categories are "Topic" everywhere, matching the backend's Q&A wording (the story publish
  sheet's "Category" is now "Topic" too).
- Tests: tags and a photo on a new question; an edit sends only the changed photos; the question page shows topic,
  photos and tags.

**Known limitations**
- The `/topics` page and the home rail still call tags "topics"; F8.2's home rework renames them.

---

## 2026-10-15 (F7.3 excerpts)

**Done**
- Story lists (feeds, search, tag, author, drafts, bookmarks) are typed as `StorySummary` (the backend's
  `BlogSummaryResponse`), and story cards show its plain-text `excerpt` instead of cutting the body down.
- The editor already loads a story by id (`GET /api/blogs/id/{id}`), never from a list item; a test now covers
  opening a draft from My stories and getting its full body.
- Staff views of other people's drafts never existed here, so nothing to remove.
- Live: feed items carry `excerpt` and the cards show it.

**Decisions**
- List types are changed in the components too: `BlogSummaryResponse` is structurally compatible with
  `BlogResponse` (every field optional), so without the explicit type a card would silently read an absent `content`.

---

## 2026-10-15 (F7.2 e-mail confirmation)

**Done**
- `/verify-email?token=` confirms the address (`POST /api/auth/verify-email`, one request per token even under
  React's double effects), then refetches `/api/user/me` so the banner goes. An invalid or expired link offers a new
  one: the signed-in account's address, or an e-mail field when signed out.
- Resend (`POST /api/auth/resend-verification`) always says "If the address is registered, a new link is on its way".
- A mustard-soft strip under the top bar while `emailVerified` is false, with "Send a new link".
- Any write refused with 403 "Confirm your e-mail…" opens one dialog explaining the confirm step (React Query's
  `MutationCache.onError`), wherever the write came from.
- A 403 from the refresh (a suspended account) ends the session once, without retrying, and shows the backend's
  message as a toast and on sign-in. Sonner's `Toaster` is mounted in the layout.
- Live: a new account's banner, the dev mail-log link, and `emailVerified: true` afterwards, against the backend.
- Tests: `auth/confirm-email.test.tsx` (banner and resend, no banner when confirmed, the dialog on a refused write,
  the link confirms once, an expired link resends, a suspended account's single refresh and message).

**Decisions**
- Write buttons send and the dialog explains the backend's refusal, rather than every button checking first: one
  place covers every write, and the backend stays the judge. Matching the message text is confined to
  `isConfirmEmailError` until the backend has error codes.

---

## 2026-10-15 (F7.1b one account type)

**Done**
- Every signed-in account can write: the editor's "Publishing is for authors" gate, My stories' reader message and
  the account menu's author check are gone. My stories reads the author id for the Published tab from
  `GET /api/authors/me` (the backend creates the author record on first use; `UserResponse.authorId` stays null until
  then).
- Settings shows the profile (designation, specialities, bio, photo) to everyone, as "Profile", marked optional.
- `/welcome?next=`: after sign-up, an optional profile step with "Skip for now"; saving or skipping goes on to `next`.
- Google sign-in (`POST /api/auth/google {idToken}`) on the sign-in and sign-up pages, through Google Identity
  Services. It only appears when `VITE_GOOGLE_CLIENT_ID` is set; the backend's `GOOGLE_CLIENT_ID` must match.
- Tests: `auth/welcome.test.tsx` (skip, save, no Google without a client id, Google sends the ID token); editor,
  My stories, profile and sign-up tests follow the single account type.

**Decisions**
- The Google script is loaded only on the auth pages and only with a client id, so other visitors never fetch it.
- The welcome step reuses the Settings profile form, so its rules (designation and a speciality, required by the
  backend) are the same in both places.

**Known limitations**
- Google sign-in isn't live-tested: the local backend has no `GOOGLE_CLIENT_ID`.

---

## 2026-10-15 (F7.1a API types)

**Done**
- `src/api/schema.d.ts` regenerated from the backend's `fix/phase8-review-3b` (Phases 5–8). F7.1 split in two to stay
  under 20 files; this half fixes what the new types break.
- Sign-up: no reader/author choice and no professional details; the request is name, e-mail, mobile and password.
- Ask and edit question: a required **Topic** (the backend's `categoryId`), prefilled when editing.
- The AI draft answer under unanswered questions is gone with its endpoint; F10.1 brings the AI answer card.
- Tests: sign-up sends one kind of account; the ask form needs a topic and sends `categoryId`.

**Decisions**
- Sign-up still signs in straight away: an unconfirmed account can sign in and read; F7.2 adds the confirm banner.

---

## 2026-10-15 (F7.0b the season strip goes)

**Done**
- `SeasonStrip` deleted from home and the questions page. Season is now a select in the filter form ("Filter by
  crop, season, region or soil", applied with "Apply filters") and a removable chip like the other filters.
- The publish sheet and the ask form choose a season from a select next to soil (`FarmingFields`), built on shadcn's
  native select inside a `Field`; the radio-strip `SeasonPicker` is gone. `seasonCalendar` stays for the advisor's
  seasonal examples.
- Bengali strings: the filter button, "Apply filters" and "Any season"; "Crop seasons" removed.
- Tests: season filtering through the form on home and questions; publish and ask pick the season from the select.

**Decisions**
- Native `<select>` (shadcn `native-select`) rather than the Base UI Select: four options, phone-first, and the
  system picker is what a farmer's phone already does well.

---

## 2026-10-15 (F7.0 design system on shadcn)

**Done**
- Read `docs/BACKEND_CATCHUP_PLAN.md` and checked it against the backend source (controllers, DTOs, enums): it
  matches. Two read endpoints it doesn't list exist (`GET /api/comments/replies/{id}`, `GET /api/answers/id/{id}`).
  Added phases F7–F14 to the roadmap (59 steps).
- shadcn/ui set up: `base-maia` style on Base UI, Phosphor icons, `@/` import alias, `cn` (shadcn's own
  clsx + tailwind-merge). Components added to `src/components/ui/`: alert, alert-dialog, avatar, badge, button, card,
  dialog, dropdown-menu, empty, field, input, label, native-select, popover, select, separator, skeleton, sonner,
  spinner, tabs, textarea, toggle, toggle-group, tooltip.
- `src/index.css`: AgroTrends colours as shadcn's semantic tokens in light and dark (a faint leaf floor with white
  cards; paddy primary; mustard kept for trust marks); the F0–F6 names (`paper`, `ink`, …) alias the new ones so
  old screens keep working. Dark mode still follows the system unless chosen (`data-theme`), now also for shadcn's
  `dark:` variant.
- Motion per Emil Kowalski (`emil-design-eng` skill): `--ease-out` / `--ease-in-out` / `--ease-drawer` tokens;
  buttons press to `scale(0.97)` and name their transitions instead of `transition-all`.
- `src/ui` Button, TextField and TextArea now render shadcn's button classes, Field, Input and Textarea with the same
  props, so every screen takes the new look without edits. Controls are 44px tall where they're tapped.
- `docs/DESIGN.md` rewritten for the Q&A-first product; the conventions skill names shadcn and the motion rules.

**Decisions**
- shadcn only. HeroUI was asked for too, but its theme variables share names with shadcn's and mean different things
  (`--muted` is a surface in shadcn and grey text in HeroUI; `--accent` is a hover wash vs the brand colour); Nayeem
  chose shadcn only.
- Base UI rather than Radix (shadcn's default base; its `data-starting-style` hooks suit the motion rules).
- Sonner (from shadcn) for toasts, reading our own theme store instead of `next-themes`.
- `src/components/ui` is left out of oxlint like the generated schema: its warnings are false positives in generic
  wrappers (a `Label` gets `htmlFor` from props).

**Known limitations**
- Screens still use the old token names and hand-made markup; they move to shadcn components as each step touches
  them (F7–F13).
- The step is over the 20-file limit only through the generated components.

---

## 2026-10-09 (F6.6 admin categories)

**Done**
- `/admin/categories` (account menu: Categories, for staff): add (`POST /api/categories/create?categoryName=`),
  rename (`PUT .../update/categoryId/{id}`, raw text body) and delete (inline confirm) categories; duplicate names
  are caught before sending; the backend's 403 shows when a permission is missing.
- Staff sign in on `/api/admin/sign-in` from the same page (the regular sign-in refuses admin accounts); a reader
  there is told their account has no admin access. Staff = any role besides USER (`isAdmin`); the backend checks
  each permission.
- `src/api/client.ts`: a `text` option sends a text/plain body (only the rename needs it).
- Tests: `admin/admin.test.tsx` (3 cases). Live: admin sign-in refuses a regular account, and create answers 403
  for it.

**Known limitations**
- Not run end to end as an admin: the local super admin's password was generated at first start and isn't known
  here. Deleting a category that has stories may fail on the backend; its message is shown.

---

## 2026-10-09 (F6.5 performance)

**Done**
- Every page except home and the story page is lazy-loaded (`page()` in `App.tsx`, one Suspense in `AppLayout`);
  main JS 495 -> 335 kB (150 -> 106 kB gzip). Tests that open a lazy page now wait for it (`findBy` / `waitFor`).
- Images: story cover `fetchpriority="high"`; card covers and avatars `loading="lazy"`, all `decoding="async"`.
- `public/robots.txt` (the preview served the app for it, failing Lighthouse SEO).
- Lighthouse on a production build: performance 85 (home) / 89 (questions), accessibility, best practices and SEO
  100. Budget recorded in `docs/DESIGN.md`.

**Known limitations**
- LCP 3.2s on simulated slow 4G: the page is client-rendered, so the headline waits for JS. Server rendering or
  prerendering the home page would be the next step if it matters.
- Text compression is the production server's job (`vite preview` doesn't gzip).

---

## 2026-10-09 (F6.4 Playwright smoke tests)

**Done**
- `npm run e2e` (`@playwright/test`, `playwright.config.ts`, `e2e/smoke.spec.ts`): starts the dev server on 5174
  with `API_TARGET`, then: a visitor reads the feed and opens a story; questions, search and the advisor load; the
  Bengali switch works both ways; signed in, an author writes, publishes and deletes a story, and asks and deletes a
  question (both clean up after themselves).
- Signed-in tests need `E2E_EMAIL` / `E2E_PASSWORD` and are skipped otherwise. `PW_CHANNEL=chrome` uses the
  installed Chrome; without it, `npx playwright install chromium` once.
- Vitest now only collects `src/**/*.test.*`; Playwright output is git-ignored; CLAUDE.md lists the command.
- All 5 passed against the local backend (8081).

---

## 2026-10-09 (F6.3 accessibility pass)

**Done**
- axe-core (WCAG 2.1 A/AA rules) on 15 pages, signed in and out, light and dark, in Chromium: 7 findings, all
  fixed; the re-run reports none. No colour-contrast findings in either theme.
- Clap button: the action is screen-reader text before the visible count, so its name matches what's shown
  ("Clap for this story, 12 claps"). Account button: screen-reader text instead of `aria-label` (the visible
  initials). The editor has a level-one heading ("New story" / "Editing ...").
- Escape closes the account menu and puts focus back on its button.
- Already in place and re-checked: skip link, visible focus ring, 44px targets, labelled fields with described
  errors, native `<dialog>` for the publish sheet, `prefers-reduced-motion`.
- Tests: clap names updated, account menu Escape case.

**Known limitations**
- The editor's formatting toolbar is reached with Tab (no arrow-key roving focus).

---

## 2026-10-09 (F6.2 dark theme)

**Done**
- Dark tokens in `src/index.css` ("the field at night": loam `#1B1A17` paper, warm `#ECE8DF` ink, paddy lifted to
  `#74C48A`, mustard unchanged), applied by the system setting or the reader's choice (`data-theme` on `<html>`).
  Components needed no changes: they only use tokens. New `shade` token for the dialog veil.
- `src/lib/theme.ts`; a Dark theme / Light theme switch in the footer, remembered on the device (choosing the
  system's own theme forgets the choice). An inline script in `index.html` applies the saved theme and language
  before the first paint; `theme-color` has a dark variant. The logo's stem uses the paper colour.
- Tests: `theme.test.ts` (2). Looked at in Chromium (home at 1280, a story at 390).

**Decisions**
- Dark paper is a warm earth tone, not the usual near-black, to keep the farming character.

---

## 2026-10-09 (F6.1 Bengali interface)

**Done**
- `src/lib/i18n.ts`: the language (English default, stored on the device, set on `<html lang>`), `useT()` /
  `translate()` keyed by the English text so anything untranslated stays English, `{placeholders}`, and
  `formatNumber` (Bengali digits). `src/lib/bn.ts`: ~200 strings in plain Bengali.
- Translated: top bar, footer, account menu, home, feed, season strip (names and months), filters, story page,
  responses and answers, topics, search, authors, questions, ask, AI draft, advisor and history, library, sign in
  and up, password reset, not found; dates in Bengali months and digits; the app's own error messages.
- A বাংলা / English switch in the footer and the account menu; switching reloads data. Every API call carries
  `lang=bn` while Bengali is on.
- Tests: `i18n.test.ts` (4), `bengali.test.tsx` (2; switch, digits, dates, `lang=bn`). Looked at in Chromium.

**Decisions**
- No i18n library: a dictionary keyed by English and a `useSyncExternalStore` hook are enough for two languages.

**Known limitations**
- Still English: the editor and publish sheet, settings, your stories, and form validation messages (authors and
  settings screens first got the reader-facing pass). The backend has no Bengali messages yet (open item).

---

## 2026-10-09 (F5.3 related stories)

**Done**
- "Related stories" after a published story for signed-in readers (`/api/blogs/id/{id}/related?limit=4`), as
  linked titles (`/s/:id`). Visitors don't ask (it is signed-in only on the backend); none or a failure shows
  nothing.
- Tests: `story/related.test.tsx` (3 cases).

**Known limitations**
- Locally the list is always empty (stories aren't embedded while Gemini is down).

---

## 2026-10-09 (F5.2 advisor history)

**Done**
- `/advisor/history` behind `RequireAuth` (linked from the advisor as "Your earlier questions"): questions newest
  first with the date; each opens its answer in place (native `<details>`); Show older questions; empty state.
- Tests: `ai/advisor-history.test.tsx` (3 cases). The endpoint answered (empty) on the local backend.

---

## 2026-10-09 (F5.1 the advisor)

**Done**
- `/advisor` (top bar: Advisor; footer: AI advisor): a question box (Bangla or English, up to 1000 characters, with
  a counter); each answer is added to the conversation in Literata under its question, with "From these stories"
  links (`/s/:id`) or, with no sources, a note that the answer is general advice.
- Three example questions for the current season (Rabi / Kharif-1 / Kharif-2) fill the box.
- Visitors see the page and are sent to sign-in to ask. The daily limit (429) and an AI outage (503) show the
  backend's message and keep the question in the box.
- `useAskAdvisor` / `useAdvisorHistory` in `src/api/ai.ts`.
- Tests: `ai/advisor.test.tsx` (5 cases). The 503 path seen live in Chromium.

**Decisions**
- "Daily quota shown" is the copy "A daily limit applies" plus the 429 message: the API doesn't report what is
  left (backend need added).

---

## 2026-10-09 (F4.4 AI draft answer)

**Done**
- A question with no answers offers "See an AI draft answer" (`POST /api/questions/{id}/ai-draft`; visitors sign in
  first). The draft shows in a dashed panel with the backend's label ("AI-generated..."), the answer, its sources
  and "Not posted"; it is never saved as an answer.
- `features/ai/Sources.tsx`: cited stories as numbered links; `/s/:blogId` (`StoryById`) looks a story up by id and
  goes to its slug, since AI sources carry ids only. F5 reuses both.
- Tests: `qa/ai-draft.test.tsx` (4 cases).

**Known limitations**
- Not seen working live: Gemini answers 503 locally (open item). The 503 message path is covered.

---

## 2026-10-09 (F4.3 ask a question)

**Done**
- `/questions/ask` and `/questions/:id/edit` (asker only; anyone else gets not found), behind `RequireAuth`: one-line
  question, details, farming details; Post question / Save question open the question.
- Farming details (season strip picker, crop, region, soil) moved to `features/farming/FarmingFields.tsx`, shared
  by the publish sheet and this form; `toAgri` leaves blank fields out.
- Tests: `qa/ask.test.tsx` (4 cases). Create and delete checked on the local backend (it lower-cases crop).

**Decisions**
- Details are plain text (no rich editor; Tiptap stays in the writer's chunk). Older HTML questions are edited as
  their text.

---

## 2026-10-09 (F4.2 question page)

**Done**
- `/questions/:id`: title, asker and date, the question (through `SafeHtml`), farming chips that filter the
  questions list; Edit and Delete (inline confirm, back to the list) for the asker; answers below.
- Answers reuse the story responses: `Responses` became `features/threads/Thread.tsx` (`kind` = comments or
  answers, with its own wording), on `src/api/threads.ts`, which turns both backend DTOs into one shape and holds
  the routes for each; `src/api/comments.ts` is gone. Story responses behave as before (their tests unchanged).
- Tests: `qa/question-page.test.tsx` (5 cases). Answer, reply, list and delete checked on the local backend.

**Decisions**
- The answers list from the backend includes replies and has no parent field: anything that appears among some
  answer's replies is dropped from the top level (backend need added).

---

## 2026-10-09 (F4.1 questions list)

**Done**
- `/questions`: newest first (`/api/questions/all`), title, a plain-text excerpt of the question, asker and date,
  crop / season / region / soil chips that filter the list; Show more questions; Ask a question.
- The season strip and the crop / region / soil filter bar from home, now page-aware: `filterPath(filters, base)`
  and both components keep their links on the page they are on.
- `src/api/questions.ts`: list, one question, ask / edit / delete, AI draft.
- Tests: `qa/questions.test.tsx` (3 cases). Looked at in Chromium at 1280 and 390px.

**Decisions**
- `feat/qa-base` is stacked on F3's last branch: F4 uses F3's 503 handling and AI client.

---

## 2026-10-09 (F3.5 my stories)

**Done**
- `/me/stories` (account menu: Your stories, authors only): Drafts (`/api/blogs/me/drafts`, last edited first,
  plus the unsaved story on this device) and Published (the author's public list). Each row: open, Edit, Delete
  with an inline confirm that says claps and responses go too.
- `useMyDrafts` in `src/api/blogs.ts`.
- Tests: `mystories.test.tsx` (4 cases). Looked at in Chromium at 390px, signed in.

**Decisions**
- Readers reaching `/me/stories` are pointed to their library.

---

## 2026-10-09 (F3.4 AI help in the editor)

**Done**
- The publish sheet has "Suggest topics and a summary" (`POST /api/ai/blog-assist` with the draft's title and
  HTML): the summary with Copy summary, and suggested topics as "+ topic" buttons that add to the story's topics
  (up to 5). Marked "Suggested by AI. Check before you use it."; nothing changes until the author chooses.
- `src/api/client.ts`: a 503 keeps the backend's message ("The AI advisor is not available right now..."); other
  5xx stay generic. F5 relies on this too.
- Tests: `editor/ai-assist.test.tsx` (2 cases), client 503 case.

**Known limitations**
- Not seen working live: Gemini answers 503 on the local backend (open item: key rejected). The 503 path was
  checked live.
- The summary has nowhere to live on a story (no field on the backend); it is offered to copy.

---

## 2026-10-09 (F3.3 publish sheet)

**Done**
- Publish (new story or draft) and Details (published) open a sheet (native `<dialog>`, bottom sheet on phones):
  category (required), topics as chips (Enter or comma; up to 5, 40 characters, lower-cased; suggestions from
  existing topics), farming details (season picker drawn as the season strip plus a dashed Year-round, crop,
  region, soil).
- New story: Publish now (-> the story page, "Published") or Save as draft (-> `/write/:id`, "Draft saved"); the
  device draft is cleared. Draft: Publish saves the details, then publishes; Save details. Published: Save details
  or Unpublish (back to a draft in place).
- An author sees Edit story on their own story page.
- Tests: `editor/publish.test.tsx` (7 cases), plus a `<dialog>` polyfill in `src/test/setup.ts`. Written and
  published end to end in Chromium against the backend.

**Decisions**
- The submitting button is read from the submit event (`submitter`); setting state in the same click was too late
  (the tests caught Save as draft publishing).
- Empty farming fields are sent as absent, not blank.

---

## 2026-10-09 (F3.2 images)

**Done**
- Cover: Add a cover image / Change cover / Remove cover above the title, shown as it will be on the story page;
  kept in the device draft or saved with the server draft (`imageUrl`; omitting it clears the cover).
- Inline images: an Image tool in the toolbar uploads and places the picture at the cursor (Tiptap Image, `alt=""`).
- Both check the file first (JPEG / PNG / WebP, <= 5 MB, `src/lib/images.ts`) and upload with F1.4's
  `useUploadImage`; errors show next to the control.
- Tests: `editor/images.test.tsx` (4 cases). A real upload checked in Chromium against the backend.

**Known limitations**
- No paste or drag-and-drop of images, and no captions or alt text input yet.

---

## 2026-10-09 (F3.1 editor)

**Done**
- `/write` (new story) and `/write/:blogId` (edit yours), behind `RequireAuth`; readers without an author profile
  are told publishing is for authors. A Write icon in the top bar on phones too.
- Tiptap editor (StarterKit: headings 2-3, bold, italic, link, quote, lists; placeholder) in the `.story-body`
  styles, so it reads as it will publish; a big Literata title (Enter moves into the story). Sticky formatting
  toolbar with pressed states.
- New story: autosaved to this device (`src/lib/draft.ts`) 1.2s after typing stops, restored on return. A server
  draft (needs a category, chosen at publish, F3.3) autosaves with `PUT /api/blogs/update`, keeping category, tags,
  farming details and cover. A published story changes only on Save changes, so half-done edits never go live.
- `useBlogById`, `useBlogWrite` (create / update / publish / unpublish / delete) in `src/api/blogs.ts`.
- The editor route is lazy-loaded (Tiptap is ~420 kB); the main bundle stays as before.
- `vite.config.ts`: `API_TARGET` env points the dev proxy elsewhere (8080 was taken by another app today).
- Tests: `editor.test.tsx` (5 cases), `draft.test.ts`. Looked at in Chromium (Playwright, signed in) at 1280 and
  390px against the backend on 8081.

**Decisions**
- Local-first drafts: the backend needs a category to create anything, so a new story stays on the device until the
  publish sheet.
- Links use a native prompt for the URL (shortcut, noted in code).

**Known limitations**
- One local draft at a time.

---

## 2026-10-08 (F2.7 author page)

**Done**
- `/authors/:authorId`: photo, name, designation and workplace, followers and stories, Follow / Following (Edit
  profile on your own page), bio, specialities, their stories newest first (`/api/blogs/all/author/{id}`). 404 ->
  not found.
- "Written by" card at the end of a story: photo, designation, followers, bio, Follow.
- Follow: optimistic on the open profile (button and follower count), rolled back on failure; reloads the profile,
  For you and the library's author list. The read waits for a restoring session so `followedByMe` is the reader's.
- `useAuthor` / `useAuthorStories` in F1.4's `src/api/authors.ts`; `feat/accounts-base` merged into this branch
  for it (docs conflicts resolved there).
- Tests: `authors.test.tsx` (7 cases). Looked at in Chrome at 1280 and 390px.

**Decisions**
- The card under a story is outlined, not filled, so an initials avatar stays visible.

**Known limitations**
- "Who to follow" in the home rail still has no data source (no suggested-authors endpoint).

---

## 2026-10-08 (F2.9 library)

**Done**
- `/library` behind `RequireAuth`, linked from the account menu. Reading list (`/api/bookmarks`, most recent first,
  paged) and Following (`?tab=following`): authors (`/api/me/following/authors`, paged, Following / Follow that can
  be undone in place) and topics (Follow buttons as on tag pages).
- `src/api/follows.ts`: reading list, followed authors, author follow / unfollow (reloads For you and the
  author's profile). Kept apart from F1.4's `authors.ts` so the branches don't conflict; F2.7 uses it too.
- Tests: `library.test.tsx` (5 cases). Checked on the local backend: follow, list, `followedByMe`, unfollow.

**Decisions**
- Unfollowing keeps the row with a Follow button, so a mis-tap can be undone; the list is fresh on the next visit.
- A failed unfollow puts the button back.

---

## 2026-10-08 (F2.8 search)

**Done**
- `/search?q=` (where the top bar sends a search): a search field on the page too (phones hide the top bar's),
  matching topics as chips (`/api/tags?q=`), the story count and results from `/api/blogs/search`, paged with
  the shared `StoryList`. No results -> Ask a question. Empty search -> a prompt and topics to browse, no request.
- `useSearch(q)` in `src/api/blogs.ts`.
- Tests: `search.test.tsx` (4 cases).

**Decisions**
- Results keep the backend's ranking (no sort parameter sent).
- Topic suggestions use the lower-cased query, as tags are stored lower-case.

---

## 2026-10-08 (F2.6 tag page and topics)

**Done**
- `/tags/:tagName`: topic name, story count, Follow / Following, its stories newest first
  (`/api/blogs/all/tag/{name}`), empty state inviting a first story.
- Follow: `PUT` / `DELETE /api/tags/{name}/follow`, optimistic with rollback; For you reloads afterwards. Visitors
  go to sign-in and back.
- `/topics`: searchable list (`/api/tags?q=`, lower-cased prefix), followed topics first for signed-in readers.
- Home right rail from 1024px: "Topics to follow" (12) and See all topics, per `docs/DESIGN.md`.
- `src/api/topics.ts`; `StoryList` exported from the feed for any paged story list.
- Tests: `topics.test.tsx` (5 cases). Checked on the local backend (follow, list, unfollow) and in Chrome at
  1280 and 390px.

**Decisions**
- Followed state comes from the 100 most recent follows (no per-tag flag); backend need added.

**Known limitations**
- The rail lists the first tags alphabetically, not popular ones (no popularity endpoint).
- "Who to follow" in the rail waits for author lists (F2.7).

---

## 2026-10-08 (F2.5 responses)

**Done**
- "Responses (n)" under a published story: top-level responses oldest first, each with its replies one level deep
  (a reply to a reply joins the same thread, as on Medium).
- Signed in: respond, reply (the field opens focused), edit and delete your own (inline confirm). Visitors see
  everything; Respond and Reply send them to sign-in and back.
- Text goes through `SafeHtml` (plain text keeps its line breaks; any HTML is cleaned).
- `src/api/comments.ts`: list, replies (`useQueries`), one write mutation for create / reply / update / delete that
  reloads the comments. `TextArea` copied byte-for-byte from F1.4 so the branches merge cleanly.
- Tests: `comments.test.tsx` (6 cases). Checked on the local backend: create, reply, edit, replies, delete.

**Decisions**
- `CommentResponse` is written by hand (the OpenAPI document doesn't describe it); backend need added.
- Edit and Delete show for the comment's own user only; admins can do both on the backend but get no buttons yet.

**Known limitations**
- One request per thread to load replies (no reply counts in the API).
- Deleting a response removes its replies too (backend cascade); the confirm text doesn't say so yet.

---

## 2026-10-08 (F2.4 claps and bookmarks)

**Done**
- Clap button on the story page (under the author and after the body): a tap adds one, holding adds one every
  120ms after 350ms; claps show at once and go to `POST /api/blogs/id/{id}/claps?count=n` as one request 500ms
  after the burst ends (claps made meanwhile are sent next). Stops at 50 per reader; mustard filled icon once
  clapped. The reader's own story shows the count only (no request, the backend refuses it).
- Save button on the story page and every feed card: `PUT` / `DELETE /api/blogs/id/{id}/bookmark`, optimistic,
  rolled back on failure.
- Visitors see counts; Clap and Save send them to sign-in and back (`useRequireSignIn`, for later write controls
  too).
- `src/api/reactions.ts`. Schema regenerated here too (identical to F1.4's, so the branches merge cleanly), for
  `authorId` on the user.
- Tests: `reactions.test.tsx` (8 cases). Checked on the local backend: clap, read, save, list, unsave, remove claps.

**Decisions**
- Saved state comes from the 100 most recent saves (`GET /api/bookmarks`), as the API has no per-story flag yet
  (backend need added).
- Taking claps back (`DELETE .../claps`) isn't offered yet.

**Known limitations**
- A story saved before the reader's latest 100 saves shows as unsaved.

---

## 2026-10-08 (F2.3 story page)

**Done**
- `/stories/:slug`: title, author (avatar, link to `/authors/:id`), reading time, date, category; cover up to
  1000px; body; farming chips (crop, season, region, soil -> filtered home) and tags (-> `/tags/:name`). Page
  `<title>` set via React 19. A draft is labelled "only you can see this"; 404 shows the not-found page.
- `SafeHtml` (`src/ui/SafeHtml.tsx`) with `src/lib/sanitize.ts`: DOMPurify, no scripts, handlers, styles, classes,
  frames or forms; external links open in a new tab with `rel="noopener noreferrer nofollow"`; `javascript:`,
  `data:` and `//host` hrefs dropped. Plain-text stories (older ones) become paragraphs without HTML parsing.
- `.story-body` styles in `index.css`: Literata 18px / 1.6 on phones, 20px / 1.65 from 640px, headings, lists,
  quotes, images, code.
- Tests: `story.test.tsx` (5 cases incl. XSS payloads), `sanitize.test.ts`. Looked at in Chrome at 1280 and 360px.

**Decisions**
- The story read waits for a restoring session, so an author's own draft loads with the token.
- 4xx from the story read isn't retried (a 404 stays a 404).
- The author block uses the story's author summary only; designation, photo and Follow come with F2.7, once
  F1.4's `src/api/authors.ts` is in `development` (adding it here would conflict).

**Known limitations**
- Only plain-text stories exist locally, so the rich-text styles are checked by tests, not by eye.
- Tag pages (F2.6) and author pages (F2.7) are still not found.

---

## 2026-10-08 (F2.2 crop-season strip and filters)

**Done**
- Season strip under the top bar on home: Rabi (16 Oct-15 Mar), Kharif-1 (16 Mar-15 Jul), Kharif-2 (16 Jul-15 Oct),
  each band as wide as the season is long; the current one in paddy with "now", today marked with a mustard dot.
  A band filters by its season (`?season=`); choosing it again clears it.
- Crop, region and soil filters behind "Filter by crop, region or soil"; active filters are removable chips (plus
  Clear all). Crop and season chips on story cards are filter links.
- With any filter set the feed reads `GET /api/blogs/all` (`sortBy=creationDate&ascOrDesc=desc`, public) instead of
  a feed tab; an empty result offers Clear filters and Ask a question.
- `src/lib/agri.ts`: season calendar, soil labels, read / write filters in the URL (unknown values dropped).
  `src/api/blogs.ts`: `useBlogs(filters)`.
- Tests: `season-filters.test.tsx` (5 cases), `agri.test.ts`. Looked at in Chrome at 1280, 390 and 360px.

**Decisions**
- Season dates follow the DAE calendar; the farming year starts with Rabi, so the strip reads Rabi -> Kharif-2.
- Filters live in the URL so a filtered feed can be shared and survives reload.
- Year-round has no band; it is reachable from a story's season chip.
- The backend matches crop and region exactly (lower-cased, trimmed), so "rice" does not find "boro rice".

**Known limitations**
- Feeds (Latest / Trending / For you) themselves don't take filters; a filtered view is always newest first.
- No suggestions for crop and region yet (free text on the backend; a distinct-values endpoint would help).

---

## 2026-10-08 (F2.1 home feed)

**Done**
- Home: feed tabs For you (`/api/feed/following`, signed-in only), Latest, Trending, on `?feed=`; signed-in readers
  start on For you, visitors on Latest (a visitor's `?feed=following` falls back to Latest).
- Story card: author, title, two-line excerpt (story HTML -> text with DOMParser, no HTML rendered), date, reading
  time, claps, crop and season chips, cover on the right. Hairline separators, no boxes.
- Infinite scroll: `useInfiniteQuery`, 10 per page; an IntersectionObserver loads the next page 600px early and a
  "Show more stories" button does the same for keyboards; "You're all caught up" at the end.
- States: loading, error with Try again, empty For you (points to Latest), empty site (invites writing).
- Visitors keep a short welcome above the feed.
- `src/lib/html.ts`, `dates.ts`, `agri.ts`; `src/test/api.ts` (`envelope`, `page`, `mockApi` routing by
  "METHOD /path") for screen tests.
- Tests: `feed.test.tsx` (7 cases), html and date helpers.

**Decisions**
- The feed waits until the session has restored, so the first read carries the token and For you vs Latest is
  known.
- Story URLs are `/stories/:slug`, author URLs `/authors/:authorId`.
- `BlogResponse` alias added at the end of `types.ts`, away from F1.4's edit, so the two branches merge cleanly.

**Known limitations**
- The links from cards lead to not-found until F2.3 (story) and F2.7 (author).
- Checked in jsdom only, not in a browser yet.

---

## 2026-10-08 (F1.4 author profile settings)

**Done**
- Settings shows an "Author profile" section when the session's user has an `authorId`: photo, designation,
  specialities, occupation, workplace, about you. Loaded from `GET /api/authors/me`, saved with `PUT /api/authors/me`.
- Photo: picked, checked (JPEG / PNG / WebP, <= 5 MB, as the backend), uploaded at once to `POST /api/images`, saved
  with the profile; Remove photo clears it.
- `src/api/authors.ts`, `src/api/images.ts`, `src/lib/images.ts`, `TextArea` primitive.
- Tests: `author-profile.test.tsx` (7 cases), `images.test.ts`. Checked on the local backend (backend
  `feat/author-me`): me, upload and update.

**Decisions**
- Readers don't see the section, and no request is made for them (`/api/authors/me` is 403 for readers).
- The step PRs F1.1-F1.3 were merged straight into `development`; `feat/accounts-base` was fast-forwarded to it so
  F1.4 still goes through the phase base.

**Known limitations**
- Upload URLs are absolute (`http://localhost:8080/uploads/...`), built from the backend's own base URL; fine while
  it matches what the browser can reach, worth checking for a deployed split origin.
- A replaced photo stays on the server (no delete endpoint).

---

## 2026-10-08 (F1.3 settings: account and password)

**Done**
- `/settings` behind `RequireAuth`, linked from the account menu. Account: name, e-mail, code + mobile, prefilled from
  the session (`+880...` split back into code and number). Password: current, new, repeat.
- `src/api/account.ts`: `PUT /api/user/update`, `POST /api/user/change-password`.
- The backend revokes every session when the e-mail or password changes, so both end the session locally (no
  sign-out call) and RequireAuth sends the reader to sign-in with a notice and back to settings.
- Session: `updateUser` (a saved name shows in the menu at once), `endNotice` carried by RequireAuth's redirect.
- Tests: `settings.test.tsx` (7 cases), `splitMobile`. Update and wrong-password replies checked on the local backend.

**Decisions**
- The author profile editor is split out as F1.4: the backend has no way to load the signed-in author's profile, and
  a blank form would overwrite designation and specialities on save.
- The end-of-session notice lives in the session, not in a navigate call: React Router 7 navigates in a transition,
  so the guard's redirect raced it and dropped router state.

**Known limitations**
- A mobile number outside +880 is shown whole in the number field; the reader has to split off the code once.

---

## 2026-10-08 (F1.2 forgot and reset password)

**Done**
- `forgotPassword` / `resetPassword` calls and hooks in `src/api/auth.ts`.
- `/forgot-password`: e-mail -> "Check your e-mail", worded so it never says whether an account exists (the backend
  answers 200 either way); 429 shows the server message. Linked from sign-in.
- `/reset-password?token=`: new password twice, checked against the backend rule; success returns to sign-in with a
  notice; an invalid or expired link shows the server message and a link to ask again; a missing token says so.
- Tests: `password-reset.test.tsx` (7 cases).

**Decisions**
- The success notice travels in router state, not the URL, so it doesn't reappear on reload or in shared links.

**Known limitations**
- Not checked end to end by e-mail: the dev backend logs reset links instead of sending them.

---

## 2026-10-08 (F1.1 sign in and sign up)

**Done**
- `src/api/auth.ts`: sign-in, sign-up (then an automatic sign-in, since sign-up returns no tokens), sign-out;
  mutation hooks.
- Early refresh in `client.ts`: the JWT's `exp` is read and, within 60 s of it, a request first refreshes the
  session. Needed because public reads treat an expired token as anonymous (no 401), which would show
  "followed by me" as false.
- `SessionProvider` / `useSession`: `restoring` -> `signed-in` / `anonymous`; restores a stored refresh token on
  load; a lost session or sign-out clears the query cache. `RequireAuth` waits while restoring, then sends visitors to
  `/sign-in?next=...` and back.
- Sign-in and sign-up screens; sign-up as reader or author (designation and specialities required for authors).
  Password rule mirrors the backend: 8-16 characters, no spaces, a capital, a digit, a symbol.
- Top bar: account menu (name, e-mail, Sign out) when signed in; nothing while the session restores.
- Tests: `lib/auth.test.ts` (password rule, `next` safety), `auth.test.tsx` (sign in, errors, sign up as author and
  reader, restore, sign out, guarded route), client early-refresh cases. Checked against the local backend: the
  access token's `exp` is 15 minutes.

**Decisions**
- Reader -> `userType: ["CONSUMER"]`, author -> `["AUTHOR"]` (the backend only acts on AUTHOR, by creating the
  author profile).
- `?next=` is followed only for same-site paths (not `//host`, not back to sign-in / sign-up).
- If sign-up succeeds but the sign-in after it fails, the form says the account is ready and to sign in, instead of a
  retry hitting "e-mail already taken".
- The author's bio and photo are left to settings (F1.3) to keep sign-up short.

**Known limitations**
- No protected screens exist yet; `RequireAuth` is first used by settings (F1.3).
- The early refresh runs on the next request, not on a timer; an idle tab refreshes when it next loads data.

---

## 2026-10-08 (decision: reading is public, posting needs sign-in)

**Decisions**
- Nayeem: anyone can read stories and questions; posting anything (story, comment, clap, answer, question, follow)
  requires sign-in. Backend roadmap 2.13 (`feat/public-reads`) opens GET on published content only.
- UI rule that follows: an anonymous visitor sees every read screen; any write control (Clap, Respond, Follow,
  Bookmark, Write, Ask) opens sign-in and returns to the same place afterwards.
- Signed-in only, so hidden or gated for visitors: For you (following) feed, related stories, bookmarks, AI advisor.

---

## 2026-10-08 (F0.3 API client)

**Done**
- `src/api/client.ts`: `api<T>()` unwraps the `HttpResponse` envelope; JSON or `FormData` bodies; query params with
  empty values dropped. Errors are `ApiError` (`status`, user-safe `message`, `errorId` on a 500). Network failure ->
  a friendly status-0 error.
- Session: access token in memory, refresh token in `localStorage`. A 401 triggers one refresh shared by concurrent
  callers, then one retry; a rejected refresh clears the session and calls the session-lost handler; an unreachable
  server keeps it. `restoreSession()` for app start. Auth paths never refresh.
- `src/api/types.ts`: aliases over the generated schema; `Page<T>`.
- Tests: `client.test.ts` (11 cases: envelope, errors, rotation, single-flight refresh, session loss, offline).

**Decisions**
- 500 messages are replaced with a generic one on the client too; the `errorId` is kept for bug reports.

**Known limitations**
- The refresh token is readable by scripts on the page until the backend sends it as an HttpOnly cookie (open item).

---

## 2026-10-08 (F0.2 design tokens and app shell)

**Done**
- Tailwind `@theme` tokens from `docs/DESIGN.md` (colours, fonts, type scale, container widths); focus ring,
  selection colour, reduced motion.
- Self-hosted fonts: Literata (optical sizes), Hind Siliguri 400/500/600, Noto Serif Bengali.
- Shell: sticky top bar (logo, search -> `/search?q=`, Questions, Write, Sign in, Get started), footer, skip link.
- Primitives in `src/ui`: `Button` / `ButtonLink` (primary, secondary, quiet, danger; loading), `TextField`
  (label, hint, error wired to `aria-describedby`), `Avatar` (initials fallback, Bengali-aware), `Chip`, `Spinner`.
- Placeholder home and a not-found page. Checked at 1280px, 390px and 360px.

**Decisions**
- Avatars are decorative (`alt=""`): a name is always shown next to one.
- Sign in is hidden below 640px; Get started leads to sign-in as well.

---

## 2026-10-08 (F0.1 scaffold)

**Done**
- Vite 8 + React 19 + TypeScript 5.9 (strict) + Tailwind 4, React Router 7, TanStack Query 5, Phosphor icons,
  DOMPurify; Vitest + Testing Library (jsdom), oxlint.
- Dev proxy: `/api` and `/uploads` -> `http://localhost:8080` (Origin header dropped so any dev port works).
- `src/api/schema.d.ts` generated from the backend's `/v3/api-docs` (`npm run gen:api`).
- Docs: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/DESIGN.md`, this log; skills `git-workflow`, `frontend-conventions`.

**Decisions**
- Same stack as `habit-tracker-web` so both projects work alike.
- Fonts: Literata (reading), Hind Siliguri (interface, Bengali + Latin), Noto Serif Bengali (Bengali stories).
- Colour: white paper, neutral ink, paddy green for actions, mustard only for claps and the season marker.
- One distinctive element: the crop-season strip on the home feed (Rabi / Kharif-1 / Kharif-2).
