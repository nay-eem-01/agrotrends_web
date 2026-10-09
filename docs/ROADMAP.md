# AgroTrends web — Roadmap

The frontend's plan and progress. The API it talks to is the backend repo (`../AgroTrends- Backend`,
`docs/ROADMAP.md` there). Design decisions live in `docs/DESIGN.md`; the running log is `docs/DEV_LOG.md`.
Update this file in the same PR that finishes a step.

Each step is **one small PR** (aim for <= 15 files). Steps of a phase are stacked: each step branch is taken from the
previous one and PRs into the phase's base branch (see `.claude/skills/git-workflow`).

**Legend:** ✅ done · 🔄 in progress · ⬜ not started · ⏸ waiting on the backend

**Progress:** 35 of 36 steps done

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
| F6.7 | Notifications bell (needs backend Phase 5) | ⏸ |

## Needs from the backend

| Item | Needed for | Status |
|---|---|---|
| "Followed by me" per tag (or a larger followed-tags read) | exact Follow state past the 100 most recent follows (F2.6) | ⏸ |
| "Saved by me" per story (`bookmarkedByMe` on `BlogResponse`, or `GET /api/blogs/id/{id}/bookmark`) | exact saved state past the 100 most recent saves (F2.4) | ⏸ |
| Category rename to take JSON (`PUT /api/categories/update/categoryId/{id}` reads a raw text body; create takes a query parameter) | consistent requests (F6.6) | ⏸ |
| The advisor's remaining daily questions (e.g. on `AiAnswerResponse` or `GET /api/ai/quota`) | showing the quota before it runs out (F5.1) | ⏸ |
| Answers: `/api/answers/question/{id}` also returns replies and `AnswerResponse` has no `parentAnswerId` | the client filters replies out of the answer list (F4.2) | ⏸ |
| Comments: `CommentResponse` in the OpenAPI document and a reply count per comment (or replies nested) | typed comments without a hand-written type; one request per story instead of one per thread (F2.5) | ⏸ |
| `GET /api/authors/me` and `authorId` on `UserResponse` | F1.4 | ✅ (backend `feat/author-me`) |
| Public GET access to published content | anonymous reading (F2) | ✅ backend 2.13 |
| Refresh token as an `HttpOnly` cookie instead of in the JSON body | keeping the refresh token out of script reach | ⏸ |
| CORS origins from a property (backend 4.1) | a deployed split origin | ⏸ |
| Notifications API (backend Phase 5) | F6.7 | ⏸ |
| A working Gemini key | live checks of F3.4, F4.4, F5 | ⏸ |
