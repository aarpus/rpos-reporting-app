# Development status

Status means evidence in the current source/tests, not a production acceptance claim.

## Implemented

| Feature | Evidence and limit |
| --- | --- |
| Credentials sign-in, hashing, throttle | `auth.ts`, password tests; no live login run |
| ADMIN/USER API authorization and store access | `store-access.ts`, admin route handlers; reporting scope tests |
| Store/user management and assignment replacement | Admin pages, validators/services/APIs; validator tests, store provisioning tests |
| Per-store reporting provisioning | SQL functions, CLI, atomic store creation; PGlite migration/cutover tests |
| Order snapshot ingestion | Validation/sync/auth code; receipt, ownership, rollback, reconciliation tests |
| Retail batch, shift, checkout, and the other retail table ingestion | Retail routes and PGlite sync test; no live POS call and no retail report read |
| Live order and transaction reports/receipts | SQL read services and UI; aggregation/search/timezone tests |
| Notification preferences/inbox/read APIs | Handlers and UI; no complete HTTP/push integration suite |
| Signed POS notification events and Web Push | Ingestion/service worker/delivery code; HMAC test vectors only |
| PWA installation shell and theme/responsive layout | Manifest, icons, prompt, layouts; no browser acceptance run |
| Cloudflare build/deploy configuration | OpenNext/Wrangler/scripts; no deployment verified |

## Partially implemented

Home dashboard and old home services use fixture values. The retail home page renders a fixture layout (KPI tiles, sales detail, sales trend, invoices, and payment reminders) with the application theme; those figures are sample preview values, not live retail totals. The retail sidebar keeps Dashboard in the main menu and lists the quick reports; only Shift End Report opens. The Reports link stays on the mobile sidebar and bottom navigation. The retail report index lists the same quick reports. Shift End Report uses the shared retail date filter and datatable, which other retail reports can reuse. It filters sample July 2025 shifts by one single date or one date range. The single-date calendar heading opens a month list and a year list (2000 through five years ahead) so the month and year can be chosen directly. Reset clears both date filters. The result table stays visible and shows an empty row when no shifts match. The eye action opens a sample shift detail for that row, laid out as sales, taxes, tender breakdown, miscellaneous counts, and terminal cash status. Export prints that page so it can be saved as a PDF. Restaurant shift/day/week/year reports render fixtures; month report renders zero/empty shells. Employee clock report filters fixture sessions and calculates display totals, without a live read/write backend. Event links to shift/day reports consequently do not guarantee matching real records. Notification API supports cursor pages but the UI does not consume later pages.

## Pending / absent from repository

Live summary report aggregation, employee clock persistence, cashier identity display, employee/report-by filtering in transaction reporting (controls disabled), profile page, billing workflow, password self-service/MFA, durable push retry/outbox, scheduled retention/throttle cleanup, browser end-to-end tests and automated CI configuration. These are gaps/opportunities, not a confirmed approved product backlog.

## Known bugs and technical debt

The migration chain and current integer-ID Prisma schema disagree; fresh migration setup is not compatible with all current write services. Example environment values are populated; older setup docs contain stale proxy/global-client claims. Default TypeScript check encountered malformed generated dev types. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for precise evidence and risk classification.

## Checks executed for this handover

- `npm run test:auth`: passed, 33 tests, zero failures/skips. Despite its name it runs every `tests/*.test.mjs`, including reporting.
- `npx tsc --noEmit --incremental false`: failed with TS1003/TS1109 in existing `.next/dev/types/validator.ts:350`.

- `npx tsc --project tsconfig.build.json --noEmit --incremental false`: passed. This excludes `.next/dev` and does not prove a production build passed.
- `npm run lint`: failed, 24,633 findings (1,336 errors / 23,297 warnings). The existing ESLint ignores omit `.open-next` and other generated output, so generated files dominate this count.
- `npx eslint src scripts tests --ignore-pattern 'src/generated/**' --format json --output-file <temporary-report>`: failed, 41 errors, zero warnings, across 16 source files. Rules: 35 no-empty-object-type, two set-state-in-effect, four refs findings. These are existing shared UI findings; no fixes were applied in this documentation task.

PGlite is an isolated PostgreSQL-compatible test engine, not the deployment database. Passing these tests does not resolve migration ID drift or prove concurrent multi-connection behavior, browser flows, push delivery, or Cloudflare runtime compatibility. Build, live auth smoke script, database setup, and deploy were not run.

## Documentation verification

All 14 requested Markdown documents exist. API coverage was checked against 18 route files / 25 method exports, including Auth.js re-exports. Prisma declarations, reporting payload fields and physical DDL were extracted from source; dependency versions were checked against package-lock. The folder/source index includes all 246 authored TS/TSX/MJS modules discovered in source/scripts/tests, with generated output excluded.

Explicit source paths and relative documentation links resolve; code fences are balanced; Cursor rule frontmatter includes description and boolean alwaysApply. Generated documents were checked against populated secret values from the example file without disclosing them, and no matches were found. No real connection strings or credential values were added.

File-content hashes captured before documentation edits show that the only existing project file changed by this task is `AGENTS.md`. All other task writes are the new `docs/ai-handover/` documents and `.cursor/rules/project-context.mdc`. Existing business logic, APIs, schema/migration/configuration files and functionality were preserved. Mermaid diagrams were reviewed as text; no browser renderer or visual Markdown QA was run.
