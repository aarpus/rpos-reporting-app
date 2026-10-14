# Known issues and unresolved questions

## Confirmed source problems

| ID | Evidence | Impact and next action |
| --- | --- | --- |
| K1 | `prisma/schema.prisma` defines auto-increment integer user/event/subscription IDs and surrogate IDs; initial/notification migrations create UUID IDs without defaults and natural primary keys | Fresh `db:deploy` cannot support current inserts that omit IDs; UUID user IDs also conflict with integer admin assignment validation. No tracked ID-conversion migration exists. Design and approve a data-preserving migration/baseline before production setup. |
| K2 | `.env.example` has populated auth, VAPID private and POS master-key-like values | Whether deployed is unknown. Generate fresh values; review exposure/rotation separately. Values deliberately excluded from this handover. |
| K3 | README claims a Next proxy and global Prisma singleton; source has neither; `scripts/check-auth.mjs` asserts `/api/private-check` returns 401 although that route is absent and expects a callbackUrl redirect the layout does not add | Smoke script/docs are stale; do not treat them as reliable acceptance checks. Root layout uses Inter, not README's Geist. |
| K4 | `/profile` is linked in header but no page exists; Billing uses `#` | Navigation leads to a missing page or placeholder. |
| K5 | Inbox API orders by `(created_at DESC,id DESC)` but cursor filters only `created_at < cursor` | Equal-timestamp rows crossing a page boundary can be skipped. UI additionally never requests nextCursor, showing at most 30 items. |
| K6 | Default type check on this tree failed in `.next/dev/types/validator.ts:350` | Generated dev artifact is malformed. Source was not altered or generated files deleted in this documentation task. Reconcile generated type state during an approved code task. |
| K7 | Store validator permits 64-character codes; current SQL suffix permits only 57 after normalization; distinct punctuation codes can sanitize to the same schema name | API validation may accept a store that provisioning rejects (400 or misleading duplicate-code 409). Coordinate code/schema naming policy before changing contracts. |
| K8 | `npm run lint` scans `.open-next` artifacts because eslint.config does not ignore them; a scoped authored-source scan still reports 41 errors across 16 shared UI files | Separate generated-output scope from source findings, then address empty interfaces and React effect/ref rules in a focused code task. Production-scope TypeScript passed; default dev scope failed. |

## Implemented limitations, not accidental bugs

Other report pages and home dashboard are sample data/empty shells; no live summary or employee backend exists. Cashier is a placeholder and transaction Employee/Report By controls are disabled. Remember me does not affect fixed session duration; forgot password is administrator contact text. Store code and user role cannot be changed by admin APIs; no delete API exists. See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md).

## Conditional risks requiring targeted verification

1. **Logout dependency:** header logout awaits `navigator.serviceWorker.ready` and subscription cleanup before signOut. Unsupported/failed registration can leave ready pending; cleanup exceptions can prevent signout. Reproduce in affected browsers before declaring a universal bug.
2. **Stale layout role/status:** dashboard layout uses session role and does not recheck active identity; API checks are fresher. Review desired UX and session revocation after deactivation/password reset.
3. **Push reliability:** sends after inbox commit without an outbox. Duplicate retry skips delivery, so a crash or failure cannot recover push through the same event. Inspect desired delivery guarantees and request/runtime limits.
4. **Push endpoint validation:** authenticated users can store arbitrary endpoint strings; delivery performs outbound requests. Assess endpoint allowlisting/SSRF and key/body limits.
5. **Access replacement races:** store-oriented edits lock stores; user-oriented edits lock users. Cross-orientation writes do not use a shared locking discipline; test concurrent edits if administrators use both screens.
6. **Money:** server decimal strings are exact; UI converts to Number. Large-value display precision and refund/void status definitions need business confirmation.
7. **Scale:** receipts have no retention job; legacy import reads whole store datasets and filters child arrays per order; notification fanout/delivery are request-bound. Current tests do not prove large-production-dataset behavior.
8. **Security scope:** no explicit application-wide CSP, custom JSON mutation origin check, database RLS, or session-version revocation is visible. Evaluate requirements rather than inferring production controls from hosting docs.

## Unresolved information

Actual database ID types, migration ledger, grants, registered schemas, real production configuration, deployment health and secret use are unknown. No live database was inspected. Business definitions for gross/net sales, void/capture handling, fiscal periods, time clock grouping, currency per store and cashier mapping require product/POS agreement. External C# sender examples are documentation, not a checked-in sender service. No CI pipeline or automated schedule definition was found.

## Recommended order of follow-up

First review database drift and environment exposure; then repair baseline validation/smoke documentation; define live summary-report requirements before replacing fixtures; add route authorization/browser/push tests; address cursor pagination, logout reliability, and delivery durability according to operational priorities. None of these fixes were made in this documentation-only task.
