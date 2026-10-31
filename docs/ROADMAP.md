# AgroTrends web — Roadmap

The frontend's plan and progress. The API it talks to is the backend repo (`../AgroTrends- Backend`,
`docs/ROADMAP.md` there). Design decisions live in `docs/DESIGN.md`; the running log is `docs/DEV_LOG.md`.
Update this file in the same PR that finishes a step.

Each step is **one small PR** (at most 20 files; generated shadcn components are listed but not counted). Steps of a phase are stacked: each step branch is taken from the
previous one and PRs into the phase's base branch (see `.claude/skills/git-workflow`).

**Legend:** ✅ done · 🔄 in progress · ⬜ not started · ⏸ waiting on the backend · ➡ moved to a later step

**Progress:** 85 of 92 steps done

---

## Phase F0 — Foundation (`feat/foundation-base`)

| # | Step | Status |
|---|---|---|
| F0.1 | Scaffold: Vite + React 19 + TypeScript + Tailwind 4, router, TanStack Query, Vitest, oxlint, dev proxy, OpenAPI types; docs | ✅ |
| F0.2 | Design tokens (colour, type, spacing), fonts (Literata, Hind Siliguri, Noto Serif Bengali), app shell (top bar, footer), UI primitives | ✅ |
| F0.3 | API client: envelope, `ApiError`, access token in memory, refresh-token rotation with a single in-flight refresh, sign-out | ✅ |

## Phase F1 — Accounts (`feat/accounts-base`)

| # | Step | Status |
|---|---|---|
| F1.1 | Sign in and sign up (reader or author with professional info); session restore on reload; protected routes | ✅ |
| F1.2 | Forgot / reset password (link from e-mail: `/reset-password?token=`) | ✅ |
| F1.3 | Settings: edit my account (name, e-mail, mobile), change password | ✅ |
| F1.4 | Settings: my author profile (designation, specialities, bio, photo via `POST /api/images`) | ✅ |

## Phase F2 — Reading (`feat/reading-base`)

| # | Step | Status |
|---|---|---|
| F2.0 | **Backend:** public read access — anonymous GET on published blogs, slug, search, feeds latest/trending, tags, categories, authors, comments, questions, answers (backend 2.13, `feat/public-reads`). Related posts, the following feed, claps, bookmarks and AI stay signed-in | ✅ |
| F2.1 | Home: feed tabs (For you = following, Latest, Trending), story card, infinite scroll | ✅ |
| F2.2 | The crop-season strip: current season marked, filters the feed by season; crop / region / soil filters | ✅ |
| F2.3 | Story page by slug: sanitised HTML, reading time, author block, agri chips, tags | ✅ |
| F2.4 | Claps (press-and-hold, up to 50) and bookmarks on the story page and cards | ✅ |
| F2.5 | Comments and replies (owner edit / delete) | ✅ |
| F2.6 | Tag page with follow; topic list | ✅ |
| F2.7 | Author page (profile, posts, follow) | ✅ |
| F2.8 | Search page | ✅ |
| F2.9 | Library: reading list (bookmarks), following (authors, tags) | ✅ |

## Phase F3 — Writing (`feat/writing-base`)

| # | Step | Status |
|---|---|---|
| F3.1 | Editor (Tiptap): title, body, autosaved draft | ✅ |
| F3.2 | Images: cover and inline, via `POST /api/images` | ✅ |
| F3.3 | Publish sheet: category, tags (max 5, suggestions), agri metadata; publish / unpublish | ✅ |
| F3.4 | AI help in the editor: summary and suggested tags (`POST /api/ai/blog-assist`) | ✅ |
| F3.5 | My stories: drafts and published, edit, delete | ✅ |

## Phase F4 — Questions and answers (`feat/qa-base`)

| # | Step | Status |
|---|---|---|
| F4.1 | Questions list with crop / season / region / soil filters | ✅ |
| F4.2 | Question page: answers and replies; answer, edit, delete own | ✅ |
| F4.3 | Ask a question (with agri metadata) | ✅ |
| F4.4 | AI draft answer for unanswered questions, clearly labelled | ✅ |

## Phase F5 — AI advisor (`feat/ai-base`)

| # | Step | Status |
|---|---|---|
| F5.1 | Ask the advisor: answer with cited stories as links, daily quota shown, 503 handled | ✅ |
| F5.2 | My AI history | ✅ |
| F5.3 | Related stories at the end of a story page | ✅ |

## Phase F6 — Polish (`feat/polish-base`)

| # | Step | Status |
|---|---|---|
| F6.1 | Bengali interface (`lang=bn` passed to the API, UI strings translated) | ✅ |
| F6.2 | Dark theme | ✅ |
| F6.3 | Accessibility pass (keyboard, focus, contrast, screen-reader labels) | ✅ |
| F6.4 | Playwright smoke tests against a running backend | ✅ |
| F6.5 | Performance: route-level code splitting, image sizes, Lighthouse budget | ✅ |
| F6.6 | Admin: categories (create / edit / delete) | ✅ |
| F6.7 | Notifications bell — replaced by F12 | ➡ |

## Catching up with the backend (F7–F14)

On 2026-10-14 the backend became a Q&A-first community: one account type, e-mail confirmation, votes and reputation,
verified experts who review AI answers, notifications and moderation. `docs/BACKEND_CATCHUP_PLAN.md` is the full plan
(endpoints, shapes, error handling); OpenAPI wins where they differ. Decisions (2026-10-15): home lands on questions,
the season strip goes, shadcn/ui replaces the hand-made primitives, staff see the admin pages and the backend decides.

## Phase F7 — Catch up with the backend (`feat/backend-catchup-base`)

| # | Step | Status |
|---|---|---|
| F7.0 | Design system: shadcn/ui (`base-maia` on Base UI), AgroTrends tokens in light and dark, Emil's motion rules; app primitives rebuilt on it | ✅ |
| F7.0b | The season strip goes: season becomes a filter and a select in the publish and ask forms | ✅ |
| F7.1a | Regenerate OpenAPI types and fix what they break: sign-up without reader/author or professional info; a required topic on the ask form; the removed AI-draft endpoint's button | ✅ |
| F7.1b | One account type: "Write" and My stories for every signed-in user; profile details as an optional step after sign-up; Google sign-in | ✅ |
| F7.2 | E-mail confirmation: `/verify-email?token=` page, resend, unconfirmed banner, a dialog on write attempts. A 403 from refresh ends the session with its message; no refresh loop | ✅ |
| F7.3 | Story cards read `excerpt`; the editor always loads by id; staff no longer expect others' drafts | ✅ |

## Phase F8 — Questions first (`feat/questions-first-base`)

| # | Step | Status |
|---|---|---|
| F8.1 | Ask form: topic (required), up to 5 tags, up to 4 photos, agri details; edit keeps tags and photos when untouched | ✅ |
| F8.2 | Questions list: topic and tag filters, Unanswered tab, `answerCount` and `score` on cards; question search; home lands on questions, stories second | ✅ |
| F8.3 | Question page: direct answers in backend order, replies loaded per answer, reply form; the client-side reply filter removed | ✅ |

## Phase F9 — Votes and reputation (`feat/reputation-base`)

| # | Step | Status |
|---|---|---|
| F9.1 | Vote arrows on questions and answers with `my-votes`; optimistic with rollback; none on your own posts; the 50-point downvote message | ✅ |
| F9.2 | Accept and un-accept (asker only), accepted mark and position | ✅ |
| F9.3 | Author line: reputation and `authorBadges`; profile page: reputation by topic, badges, expert field, the user's questions | ✅ |

## Phase F10 — AI answers (`feat/ai-answers-base`)

| # | Step | Status |
|---|---|---|
| F10.1 | Remove the F4.4 AI-draft button; AI answer card on the question page: polling after asking, disclaimer, status labels, "Corrected by" link | ✅ |
| F10.2 | One `Sources` component for both source types (story, community answer), used by the AI card, advisor and history | ✅ |
| F10.3 | Advisor history: "Ask the experts" (topic, optional title), then a link to the new question; 409 handled | ✅ |

## Phase F11 — Verified experts (`feat/experts-base`)

| # | Step | Status |
|---|---|---|
| F11.1 | Apply page and status card: topics, field, credential type, institution, proof uploads and links; pending / approved / rejected with the note; no reviewer name | ✅ |
| F11.2 | Review queue page; confirm / correct / flag on the question page for badge holders; 409 refetches | ✅ |
| F11.3 | Admin: applications list, approve all or some topics, reject with a note, revoke a badge | ✅ |

## Phase F12 — Notifications (`feat/notifications-base`, replaces F6.7)

| # | Step | Status |
|---|---|---|
| F12.1 | Bell with the unread count (60 s poll while visible, and on focus), dropdown of the latest 10, mark read on open, mark all read | ✅ |
| F12.2 | Notifications page with an unread filter and paging; text and links for all 9 types; no actor for moderation and decisions | ✅ |

## Phase F13 — Reports and moderation (`feat/moderation-base`)

| # | Step | Status |
|---|---|---|
| F13.1 | Report dialog on stories, questions, answers, comments, the AI answer and profiles; 409 shows "Reported" | ✅ |
| F13.2 | Admin reports page: status tabs, open reports grouped by post, snapshot for hidden posts, remove and dismiss with confirm dialogs, 409 refetch | ✅ |
| F13.3 | Ban and unban (staff); hidden and removed states: an editor that gets 409, a thread that turns 404 | ✅ |

## Phase F14 — Launch polish (`feat/launch-polish-base`)

| # | Step | Status |
|---|---|---|
| F14.1 | Bengali strings for every new screen; keyboard and screen-reader pass on them | ✅ |
| F14.2 | Playwright smoke: sign up, confirm, ask, answer, vote, accept, three reports hide, admin dismisses, notifications arrive | ✅ |

## Phase F15 — Redesign: "The Living Field" (`feat/redesign-base`)

| # | Step | Status |
|---|---|---|
| F15.1 | Foundation (`feat/redesign-foundation`): white canvas, exact palette (light and dark), Newsreader + Inter with Bengali fallbacks, 8px corners, green focus outline; shadcn Combobox, Sheet; `SearchSelect`; drawn Botanical art | ✅ |
| F15.2 | Shell (`feat/redesign-shell`): Discover / Questions / Stories / AI advisor / Write, phone tab bar and menu sheet, account DropdownMenu, auth brand panel | ✅ |
| F15.3 | Advisor (`feat/redesign-advisor`): workspace with history rail, suggestion cards, composer with near-limit counter and Ctrl+Enter, AI-labelled turns with sources apart | ✅ |
| F15.4 | Stories (`feat/redesign-stories`): featured story + grid with drawn covers, story page wide cover and contents list, editor styling | ✅ |
| F15.5 | Questions, Discover and forms (`feat/redesign-discover`): Discover home, question rows with photos and topic chips, question page vote bar, ask form two columns, shadcn Select everywhere, publish Dialog | ✅ |
## Phase F15 — Admin dashboard (`feat/admin-dashboard-base`)

Backend Phase 9 (`feat/admin-dashboard-base` on the backend) adds users with ban state, overview counts and admin roles.
Endpoints and rules: `docs/BACKEND_CATCHUP_PLAN.md` § Admin dashboard.

| # | Step | Status |
|---|---|---|
| F15.1 | Admin home: overview cards from `/api/admin/stats` linking to their pages; nav gains Overview, Users, Roles | ⬜ |
| F15.2 | Users page: search, All / Banned / Active tabs, table, paging | ⬜ |
| F15.3 | User page: counts, expert topics with revoke, Ban or Unban from the known state, grant and remove admin roles | ⬜ |
| F15.4 | Roles page: create, edit and delete admin roles with privilege checkboxes; Bengali strings; smoke grants a moderator | ⬜ |

## Phase F16 — Refinement: less clutter, better inputs (`feat/refine-base`)

| # | Step | Status |
|---|---|---|
| F16.1 | One search (top-bar dialog, Ctrl/⌘+K; page and hero search fields removed), one topic area (Discover's topic cards replaced by "Help a farmer today" and a filter row); softer radius scale and field borders; More menu for post actions; caret vote control; +N tag overflow; photo tile grid; Enter/Shift+Enter in the advisor with an IME guard (`feat/refine-ui`) | ✅ |

## Phase F17 — Admin dashboard (`feat/admin-dashboard-base`, backend Phase 9)

| # | Step | Status |
|---|---|---|
| F17.0 | Regenerate API types for backend Phases 9 and 10; sign-in sends `identifier` (`feat/api-types-p10`) | ✅ |
| F17.1 | Overview: waiting work (open reports, expert applications, unchecked AI answers) linking to queues, community counts; admin rail gains Overview, Users, Roles (`feat/admin-overview`) | ✅ |
| F17.2 | Users: search name or e-mail, All / Active / Banned, rows with contact, roles and ban badge, paging (`feat/admin-users`) | ✅ |
| F17.3 | Member page: contact and confirmation, ban state and reason, counts, expert topics with Revoke, give and remove admin roles (`feat/admin-user`) | ✅ |
| F17.4 | Roles: create, edit (privilege checkboxes) and delete admin roles; member and super-admin roles fixed (`feat/admin-roles`) | ✅ |

## Phase F18 — Phone sign-up (`feat/phone-auth-base`, backend Phase 10)

| # | Step | Status |
|---|---|---|
| F18.1 | Sign in (and admin sign-in) with an e-mail or a phone number; phone helpers (`feat/phone-sign-in`) | ✅ |
| F18.2 | Sign up with an e-mail, a phone or both; `/verify-phone` with the 6-digit code and a timed resend; banner and dialog follow the account's contacts (`feat/phone-sign-up`) | ✅ |
| F18.3 | Forgot password: E-mail or Phone; by phone, a code then the code and a new password (`feat/phone-reset`) | ✅ |
| F18.4 | Settings: e-mail and phone optional while one remains, confirmation state for each, no sign-out on an e-mail change (`feat/phone-settings`) | ✅ |

## Phase F19 — Simpler asking (`feat/simple-ask-base`)

| # | Step | Status |
|---|---|---|
| F19.1 | Question page: the question's own vote moves beside the author line as "Useful question?", apart from the answers' votes; vote arrows get a hover title (`feat/question-vote-label`) | ✅ |
| F19.2 | Ask form in one place: title, rich-text details (bold, italic, lists, quote, link) with a photo button, topic and tags in one composer; no crop-specific farming fields (`feat/ask-editor`) | ✅ |
| F19.3 | Ask form restyled: no boxed border, soft sticky toolbar, topic and tags typed in one row, Cancel and Post in a sticky bar above the phone's bottom navigation (`feat/ask-composer`) | ✅ |

## Phase F20 — Harvest look (`feat/harvest-base`, stacked on F19)

| # | Step | Status |
|---|---|---|
| F20.1 | Harvest tokens from the ui-ux-pro-max agriculture profile: pale field-green page, white cards, earth green `#15803D`, harvest gold `#A16207`, Lora for editorial type, 16px radius; field borders to 3:1 (`feat/harvest-tokens`) | ✅ |
| F20.2 | Question page on Harvest: the question as a white card with a Lora title, a side panel (Useful question? vote, answer count, asked date, Answer) sticky from 1024px and a row under the question below it, answers as cards with a gold edge on the accepted one, list formatting in answers (`feat/harvest-question`) | ✅ |
| F20.3 | The page stays white: the pale-green page background is dropped, the rest of Harvest stays (`fix/harvest-white-page`) | ✅ |
| F20.4 | Ask form redesign: topics as one-tap chips (radios), tags with popular one-tap suggestions, a post bar that says what is still needed, Ctrl/⌘+Enter to post (`feat/ask-redesign`) | ✅ |

## Phase F21 — Paddy Field look (`feat/paddy-base`, stacked on F20)

Nayeem chose direction A's colours and type with D's shapes from five whole-app directions (2026-10-31). One screen
per step, each checked in light, dark and at 390px.

| # | Step | Status |
|---|---|---|
| F21.1 | Paddy Field tokens: paddy green `#245C3A`, mustard `#D9A441` with `mustard-ink` `#8A5F0C` for text, ink `#1C2B21`, leaf wash `#F3F7F2`; pill buttons, 18px cards, 12px fields; no shadows on cards; the direction written into DESIGN.md (`feat/paddy-tokens`) | ✅ |
| F21.2 | Shell: pill search on the leaf wash, pill Write and Ask, avatar; bottom tab bar on phones (`feat/paddy-shell`) | ✅ |
| F21.3 | Sign in and sign up: a leaf-wash side panel (headline, a member quote, what you get), Google first, one field for e-mail or phone, the language switch on the form (`feat/paddy-auth`) | ✅ |
| F21.4 | Become a verified expert: why it's worth it and the three steps beside the form; topics and proof type as one-tap choices (`feat/paddy-expert-apply`) | ⬜ |
| F21.5 | Profile: cover wash, Lora name, headline, stats row, tabs; your own profile shows Edit profile (`feat/paddy-profile`) | ⬜ |
| F21.6 | Story editor: a quiet page (cover, Lora title and subtitle) with a publish panel beside it (`feat/paddy-editor`) | ⬜ |
| F21.7 | Question page: Lora title, tags under it, round votes beside the post, the accepted answer in a mustard card (`feat/paddy-question`) | ⬜ |
| F21.8 | AI advisor: sources as numbered cards above the answer, follow-up questions as rows, a pill ask bar (`feat/paddy-advisor`) | ⬜ |
| F21.9 | Questions and stories feeds: topic chips, rows with a thumbnail, stats line with the accepted mark (`feat/paddy-feeds`) | ⬜ |
| F21.10 | Story page: Medium-like reading column, byline with Follow, quiet save bar (`feat/paddy-story`) | ⬜ |

## Needs from the backend

| Item | Needed for | Status |
|---|---|---|
| "Followed by me" per tag (or a larger followed-tags read) | exact Follow state past the 100 most recent follows (F2.6) | ⏸ |
| "Saved by me" per story (`bookmarkedByMe` on `BlogResponse`, or `GET /api/blogs/id/{id}/bookmark`) | exact saved state past the 100 most recent saves (F2.4) | ⏸ |
| Category rename to take JSON (`PUT /api/categories/update/categoryId/{id}` reads a raw text body; create takes a query parameter) | consistent requests (F6.6) | ⏸ |
| The advisor's remaining daily questions (e.g. on `AiAnswerResponse` or `GET /api/ai/quota`) | showing the quota before it runs out (F5.1) | ⏸ |
| Answers: `/api/answers/question/{id}` also returns replies | the client filters replies out of the answer list (F4.2) | ✅ backend Phase 6 (direct answers only; F8.3 drops the filter) |
| Comments: `CommentResponse` in the OpenAPI document and a reply count per comment (or replies nested) | typed comments without a hand-written type; one request per story instead of one per thread (F2.5) | ⏸ |
| `GET /api/authors/me` and `authorId` on `UserResponse` | F1.4 | ✅ (backend `feat/author-me`) |
| Public GET access to published content | anonymous reading (F2) | ✅ backend 2.13 |
| Refresh token as an `HttpOnly` cookie instead of in the JSON body | keeping the refresh token out of script reach | ⏸ |
| CORS origins from a property (backend 4.1) | a deployed split origin | ⏸ |
| Notifications API | F12 | ✅ backend Phase 8 (`feat/notifications-moderation-base`, not merged yet) |
| Machine-readable error codes in the error envelope | branching without matching message text (F7.2, F9.1) | ⏸ |
| "Am I an expert in this topic" without reading the full reputation | showing review buttons (F11.2) | ⏸ |
| A public user summary (name, and author photo if any) by user id | profile pages opened directly show "Member" when the user has asked nothing (F9.3) | ⏸ |
| A way for an author to see their own hidden post | the author can't read what was reported (F13.3) | ⏸ |
| A working Gemini key | live checks of F3.4, F5, F10 | ⏸ |
