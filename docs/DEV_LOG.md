# AgroTrends web — Development Log

Read this first at the start of every working session. Newest entry on top.
Plan and progress: `docs/ROADMAP.md`. Design: `docs/DESIGN.md`.

---

## Where we are

- New frontend, built from scratch (the old `AGROTRENDS- FrontEnd` repo is retired: it called the pre-hardening API,
  sent `userId` in URLs and called Gemini from the browser with a key).
- Phase F0 (foundation) done: scaffold, design system and shell, API client. Steps are stacked on
  `feat/foundation-base`.

## Next up

1. **Nayeem:** open and merge, in order: `feat/scaffold` -> `feat/foundation-base`, `feat/design-shell` ->
   `feat/foundation-base`, `feat/api-client` -> `feat/foundation-base`; then `feat/foundation-base` -> `development`.
2. Phase F1 accounts (F1.1 sign in / sign up). In F1.1, refresh the access token shortly before it expires
   (15 minutes): an expired token on a public read is treated as anonymous by the backend, not a 401.

## Open items

| Item | Needs | Blocks |
|---|---|---|
| Make `development` the default branch on GitHub and protect it | Nayeem | — |
| Refresh token comes back in the JSON body, so it has to live in `localStorage` | backend: HttpOnly cookie | — |
| Gemini chat key rejected on the backend since 2026-10-06 | Nayeem | live checks of AI screens |

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
