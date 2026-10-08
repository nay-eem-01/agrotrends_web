# AgroTrends web — Development Log

Read this first at the start of every working session. Newest entry on top.
Plan and progress: `docs/ROADMAP.md`. Design: `docs/DESIGN.md`.

---

## Where we are

- New frontend, built from scratch (the old `AGROTRENDS- FrontEnd` repo is retired: it called the pre-hardening API,
  sent `userId` in URLs and called Gemini from the browser with a key).
- Phase F0 (foundation) merged into `development`.
- Phase F1 (accounts) on `feat/accounts-base`: F1.1 sign in / sign up (`feat/sign-in`) and F1.2 password reset
  (`feat/password-reset`) done.

## Next up

1. **Nayeem:** open and merge, in order: `feat/sign-in` -> `feat/accounts-base`, `feat/password-reset` ->
   `feat/accounts-base`.
2. F1.3 settings (first screens behind `RequireAuth`).

## Open items

| Item | Needs | Blocks |
|---|---|---|
| Make `development` the default branch on GitHub and protect it | Nayeem | — |
| Refresh token comes back in the JSON body, so it has to live in `localStorage` | backend: HttpOnly cookie | — |
| Gemini chat key rejected on the backend since 2026-10-06 | Nayeem | live checks of AI screens |

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
