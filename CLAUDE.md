# AgroTrends web

The frontend of AgroTrends — "Medium for agricultural knowledge, with AI". Farmers, agronomists and students read and
write stories, ask and answer questions, and ask an AI advisor that cites the platform's own stories.
The API is the Spring Boot backend in `../AgroTrends- Backend` (Swagger at `http://localhost:8080/swagger-ui.html`).

## Start of every session

1. Read `docs/DEV_LOG.md` (where we are / next up / open items) and `docs/ROADMAP.md`.
2. `git status` and check the branch. Follow `.claude/skills/git-workflow`.

## Where things are

- `docs/ROADMAP.md` — phased steps, one small PR each, with status
- `docs/DEV_LOG.md` — dated log of what was done and decided
- `docs/DESIGN.md` — colour, type, layout and principles; follow it for every screen
- `.claude/skills/` — `git-workflow`, `frontend-conventions`
- `src/api/schema.d.ts` — generated from the backend's OpenAPI (`npm run gen:api`, backend running); never hand-edit

## Run and test

```bash
npm install
npm run dev        # http://localhost:5173; /api and /uploads are proxied to the backend on :8080
npm test           # Vitest + Testing Library
npm run lint       # oxlint
npm run build      # type-check + production build
```

## Rules that matter most

- The caller's identity comes from the token; never send `userId` / `authorUserId` in a URL or body.
- The access token lives in memory only. Never log tokens.
- Story and comment HTML is rendered only through `SafeHtml` (DOMPurify). No other `dangerouslySetInnerHTML`.
- Data fetching goes through TanStack Query hooks in `src/api/`; components never call `fetch` directly.
- Every step ships with tests for its logic and its main screen; update `docs/ROADMAP.md` and `docs/DEV_LOG.md` in
  the same PR.
- Branch flow: `development` -> phase base -> serial step PRs -> base into `development`. Small conventional
  commits, no attribution.
