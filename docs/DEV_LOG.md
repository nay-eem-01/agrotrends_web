# AgroTrends web — Development Log

Read this first at the start of every working session. Newest entry on top.
Plan and progress: `docs/ROADMAP.md`. Design: `docs/DESIGN.md`.

---

## Where we are

- New frontend, built from scratch (the old `AGROTRENDS- FrontEnd` repo is retired: it called the pre-hardening API,
  sent `userId` in URLs and called Gemini from the browser with a key).
- Phases F0 (foundation), F1 (accounts) and F2 (reading) are in `development`.
- Phase F3 writing on `feat/writing-base`: F3.1 editor (`feat/editor`), F3.2 images (`feat/images`) , F3.3
  publish sheet (`feat/publish`) , F3.4 AI help (`feat/ai-assist`) and F3.5 my stories
  (`feat/my-stories`) done. Phase F3 is complete.
- Phase F4 questions and answers on `feat/qa-base` (stacked on F3's tip, as F3 isn't in `development` yet):
  F4.1 questions list (`feat/questions`) , F4.2 question page (`feat/question-page`) , F4.3 ask
  (`feat/ask`) and F4.4 AI draft answer (`feat/ai-draft-answer`) done. Phase F4 is complete.
- Phase F5 AI advisor on `feat/ai-base` (stacked on F4): F5.1 advisor (`feat/advisor`) and F5.2 history (`feat/advisor-history`) done.

## Next up

1. **Nayeem:** open and merge the F3 step PRs into `feat/writing-base` in order, then the base into `development`.
2. F5.3 related stories.

## Open items

| Item | Needs | Blocks |
|---|---|---|
| The answers list also returns replies, with no parent field; the page drops anything that is someone's reply | backend | — |
| Comment endpoints aren't typed in OpenAPI and have no reply counts: `CommentResponse` is hand-written and every thread is fetched | backend | — |
| No per-story "saved by me": the app reads the 100 most recent saves to mark Save buttons | backend: `bookmarkedByMe` | exact saved state for heavy savers |
| Make `development` the default branch on GitHub and protect it | Nayeem | — |
| Refresh token comes back in the JSON body, so it has to live in `localStorage` | backend: HttpOnly cookie | — |
| Gemini chat key rejected on the backend since 2026-10-06 | Nayeem | live checks of AI screens |

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
