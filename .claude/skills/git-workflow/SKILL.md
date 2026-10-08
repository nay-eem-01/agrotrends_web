---
name: git-workflow
description: Git and project-tracking conventions for AgroTrends web - branch flow (phase base branch + serial step branches), small conventional commits, no attribution, what Claude may commit/push, and keeping docs/DEV_LOG.md and docs/ROADMAP.md current. Use at the start of every session and before any commit, branch or PR.
---

# Git workflow (AgroTrends web)

Same flow as the backend repo.

## Branches

| Branch | Purpose |
|---|---|
| `development` | integration: finished phases land here first (default branch) |
| `staging` | pre-production, promoted from `development` |
| `production` | what is live |

1. Each roadmap phase has a base branch from `development`: `feat/<phase>-base` (e.g. `feat/foundation-base`).
2. Each step is its own branch taken from the **previous step's branch** (the first from the base), so stacked PRs
   never conflict: `feat/<step>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`.
3. Step PRs go **serially into the phase base**; merge commits, not squash.
4. When the phase is done the base PRs into `development`; then `development` -> `staging` -> `production`.

## Commits

- Conventional prefixes with an optional scope: `feat(feed): ...`, `fix(editor): ...`, `docs: ...`, `test: ...`,
  `chore: ...`. Imperative subject <= 72 chars; the body says why when it isn't obvious.
- One coherent change per commit that builds, lints and passes tests.
- Author identity only (nay-eem-01). **No `Co-Authored-By` and no AI attribution** in commits or PRs.
- Never commit `.env`, tokens or build output.

## What Claude may do

- Commit and push finished steps; give PR links in merge order. Nayeem opens and merges PRs.
- Never force-push, `reset --hard`, rewrite published history or delete branches without being told to.

## Docs in the same PR as the step

Tick the step in `docs/ROADMAP.md` (and the progress count) and add a dated entry, newest first, to
`docs/DEV_LOG.md`: **Done**, **Decisions**, **Known limitations**; refresh "Where we are", "Next up", "Open items".
