# AgroTrends web — Development Log

Read this first at the start of every working session. Newest entry on top.
Plan and progress: `docs/ROADMAP.md`. Design: `docs/DESIGN.md`.

---

## Where we are

- New frontend, built from scratch (the old `AGROTRENDS- FrontEnd` repo is retired: it called the pre-hardening API,
  sent `userId` in URLs and called Gemini from the browser with a key).
- Phase F0 (foundation) in progress on `feat/foundation-base`.

## Next up

1. F0.2 design tokens and app shell, F0.3 API client.
2. Phase F1 accounts.
3. Backend: public read access for anonymous readers (roadmap F2.0) before Phase F2.

## Open items

| Item | Needs | Blocks |
|---|---|---|
| GitHub repository not created yet; branches are local only | Nayeem (create repo, share the URL) | pushing, PRs |
| Only `/api/blogs/all` is public on the backend; stories, feeds, search, authors and questions need sign-in | backend step | anonymous reading (F2) |
| Refresh token comes back in the JSON body, so it has to live in `localStorage` | backend: HttpOnly cookie | — |
| Gemini chat key rejected on the backend since 2026-10-06 | Nayeem | live checks of AI screens |

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
