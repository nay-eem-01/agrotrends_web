---
name: frontend-conventions
description: React/TypeScript conventions for AgroTrends web - folder layout, API access through TanStack Query hooks, the HttpResponse envelope and ApiError, auth/token rules, safe HTML rendering, styling with Tailwind tokens from docs/DESIGN.md, copy rules and tests. Use whenever writing or changing code in this repo.
---

# Frontend conventions (AgroTrends web)

## Stack

Vite + React 19 + TypeScript (strict), React Router 7, TanStack Query 5, Tailwind 4 (tokens in `src/index.css`
`@theme`), Phosphor icons, DOMPurify, Vitest + Testing Library, oxlint.

## Layout

| Folder | Holds |
|---|---|
| `src/api/` | `client.ts` (fetch, envelope, refresh), `errors.ts`, one module per resource (`blogs.ts`, `auth.ts`, ...) exporting typed calls and Query hooks; `schema.d.ts` is generated |
| `src/ui/` | design-system primitives (Button, TextField, Avatar, Chip, Spinner, ...) — no data fetching |
| `src/layout/` | app shell: top bar, footer, page containers |
| `src/features/<area>/` | screens and their components (`feed`, `story`, `editor`, `auth`, `qa`, `ai`, ...) |
| `src/lib/` | pure helpers (dates, seasons, html) with unit tests next to them |

## API

- Every response is `{ status, message, payload, success }`. `api<T>()` returns `payload` or throws `ApiError`
  (`status`, `message` — safe to show the user).
- Types come from `components['schemas'][...]` in `schema.d.ts`; regenerate with `npm run gen:api` when the backend
  changes. Never hand-write a DTO type that the schema already has.
- Lists are Spring `Page`s: `pageNo` (0-based), `pageSize` (<= 100), `sortBy`, `ascOrDesc`.
- Never put the caller's id in a request; the backend reads it from the token.
- 401 -> one silent refresh, then sign-out. 403 -> "You don't have permission"; 404 for private things is "not found".

## Auth

Access token in memory; refresh token in `localStorage` until the backend offers an HttpOnly cookie (open item).
Never log either.

## Rendering user content

Story/comment HTML goes through `SafeHtml` (DOMPurify, links get `rel="noopener noreferrer"`). Plain text everywhere
else. No other `dangerouslySetInnerHTML`.

## Styling

Use the Tailwind tokens (`bg-paper`, `text-ink`, `text-ink-muted`, `border-rule`, `bg-field`, `text-paddy`,
`bg-mustard`, `font-serif`, `font-sans`). No raw hex in components. Follow `docs/DESIGN.md`. Visible focus ring on
everything interactive; respect `prefers-reduced-motion`.

## Copy

Sentence case, plain verbs, the button names the action and the toast repeats it ("Publish" -> "Published").
Errors say what happened and what to do; empty states invite the next action.

## Tests

- Unit-test pure logic in `src/lib` and `src/api` (refresh, envelope errors).
- Screen tests with Testing Library, mocking `fetch` (see `src/test/`). Query by role and label, not class names.
- `npm test`, `npm run lint` and `npm run build` must all pass before a commit.
