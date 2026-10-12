# RelayLab test assignments (RED acceptance tests are intentional)

These are **test workloads** for Hydra, not features of Hydra itself. Their purpose is to test routing, project/session isolation, progress, quota handoff, resume and verification.

## A — API listing and pagination · suggested worker: Codex
Repository: `relay-api`
- GET `/tickets?status=open&priority=high` filters correctly, default stable creation order.
- GET `/tickets?limit=1&offset=1` returns page and `total` count.
- Invalid or negative `limit`/`offset` returns 400; retain baseline response compatibility.
- Acceptance: `npm run test:acceptance` contains `filtering.test.mjs`.

## B — Audit history · suggested two-stage Codex -> DSH handoff
Repository: `relay-api`
- PATCH `/tickets/:id` accepts `{status, actor}`; record transition `{from,to,actor,at}`.
- GET `/tickets/:id/history` returns `{history:[...]}`, 404 for missing ticket.
- History is persisted in JSON; reopening the store preserves it.
- **Controlled handoff trigger**: Ask Codex to *only* add tests/schema and initial storage migration, report checkpoint, and stop before implementing the HTTP history route. Manually set its quota blocked in Hydra; then DSH resumes remaining work using Git artifacts. This is deliberate simulation, not actual quota depletion.
- Acceptance: `audit.test.mjs`. DSH must not delete or rewrite Codex's tests.

## C — CSV export · suggested worker: DSH or GLM
Repository: `relay-api`
- GET `/tickets/export.csv`, header `id,title,priority,status,createdAt,updatedAt`.
- Correct CSV quoting: comma/quote/newline in title; use UTF-8 and consistent CRLF/LF.
- Important routing: `/tickets/export.csv` must be processed before a broad dynamic `/tickets/:id` route.
- Acceptance: `export.test.mjs`.

## D — CLI statistics and export · suggested worker: GLM
Repository: **separate** `relay-client` git repo.
- `relay stats` prints exact lines `open: N`, `in_progress: N`, `closed: N`, always three lines.
- `relay export --output FILE` fetches `/tickets/export.csv` and writes the response bytes/string exactly without fabricated data.
- Keep existing `list`/`create` working.
- Acceptance: `relay-client/test/acceptance/*.test.mjs`.

## E — Final audit of cross-harness recovery · suggested worker: original Codex Session
- Resume the **same native Codex session** once its simulated quota pool is available.
- Read DSH handoff artifacts/commits, review audit-history code, run both repositories' test suites.
- Report exactly what was done by DSH, conflicts/risks, and any remaining failures.
- Verify a new Codex Session was *not* silently substituted for the original; compare native session IDs and worktree lineage.

## What agents must report
Each work report needs: Task ID, original native session ID, files changed, Git SHA, commands/tests with exit codes, completed/remaining work, handoff dependencies and evidence. **Do not claim completion based solely on terminal idle or a successful message submission.**
