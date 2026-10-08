# AgroTrends web — Development Log

Read this first at the start of every working session. Newest entry on top.
Plan and progress: `docs/ROADMAP.md`. Design: `docs/DESIGN.md`.

---

## Where we are

- New frontend, built from scratch (the old `AGROTRENDS- FrontEnd` repo is retired: it called the pre-hardening API,
  sent `userId` in URLs and called Gemini from the browser with a key).
- Phase F0 and F1.1-F1.3 merged into `development`. F1.4 author profile is on `feat/author-profile` (PR into
  `feat/accounts-base`).
- Phase F2 reading on `feat/reading-base`: F2.1 home feed (`feat/home-feed`), F2.2 season strip and filters
  (`feat/season-filters`) F2.3 story page (`feat/story-page`), F2.4 claps and
  bookmarks (`feat/claps-bookmarks`) F2.5 responses (`feat/comments`), F2.6 topics
  (`feat/tag-page`) and F2.8 search (`feat/search`) done. F2.7 author page waits for F1.4 in `development`.

## Next up

1. **Nayeem:** merge backend `feat/author-me`; open and merge `feat/author-profile` -> `feat/accounts-base` ->
   `development`. Open and merge, in order, `feat/home-feed`,
   `feat/season-filters`, `feat/story-page`, `feat/claps-bookmarks`, `feat/comments`,
   `feat/tag-page` and `feat/search` -> `feat/reading-base`.
2. F2.9 library; then F2.7 author page once F1.4 (`src/api/authors.ts`) is in `development`. The richer author block (designation, photo, Follow) waits for F1.4's
   `src/api/authors.ts` to reach `development`.

## Open items

| Item | Needs | Blocks |
|---|---|---|
| No way to read my own author profile (`GET /api/authors/me` missing; `UserResponse` has no `authorId`) | backend step | F1.4 |
| Comment endpoints aren't typed in OpenAPI and have no reply counts: `CommentResponse` is hand-written and every thread is fetched | backend | — |
| No per-story "saved by me": the app reads the 100 most recent saves to mark Save buttons | backend: `bookmarkedByMe` | exact saved state for heavy savers |
| Make `development` the default branch on GitHub and protect it | Nayeem | — |
| Refresh token comes back in the JSON body, so it has to live in `localStorage` | backend: HttpOnly cookie | — |
| Gemini chat key rejected on the backend since 2026-10-06 | Nayeem | live checks of AI screens |

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
