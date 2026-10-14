# Development guidelines

Read root `AGENTS.md` and [CURSOR_HANDOVER.md](CURSOR_HANDOVER.md) before major work. Use current working-tree source as authority. Preserve uncommitted user work; do not reset or overwrite it to obtain a clean baseline.

## Existing conventions

- App Router pages/layouts/route handlers live under `src/app`; `(dashboard)` is a URL-transparent route group. Await dynamic params, searchParams, and cookies. Consult the installed Next docs before editing framework code.
- Shared UI belongs in `src/components`; route-specific report implementations live under `_components` (some older table code uses `_component`). Reuse `tailgrids/core` controls and `report/_components/report-ui.tsx`.
- Interactive files use `"use client"`. Secret/database helpers use `server-only` where applicable. Pure reporting/validation modules omit that marker to run directly in Node tests; do not import DB credentials into browser bundles.
- TypeScript uses strict mode, `@/*` maps to `src/*`, and no emit. Interfaces/types are colocated or in `src/types`; report API payload types live in `transaction-types.ts`. Scripts/tests are `.mjs`, using Node 24 native TypeScript imports in reporting tests.
- Components are named descriptively; functions/variables use camelCase. SQL columns/POS reporting fields use snake_case; browser/admin envelopes primarily use camelCase. Preserve this contract distinction.
- UI styling uses semantic CSS tokens, Tailwind utilities, `cn` (clsx + tailwind-merge), and cva variants. React Aria controls often use `onPress`, `onChange`, `isDisabled`, not only native HTML event conventions.

## Backend patterns

Authenticate before reading/mutating sensitive data. Use `getAdminAuthorization` for admin APIs, `getRequestUser` and store authorization for user APIs, and POS signed credential checks for POS ingestion. Never trust a cookie, query parameter, cached role, or client-selected schema as authority.

Keep validation in existing parser modules; preserve defaults and errors. Handlers return `Response.json`, usually `{ error: string }` on expected failures. Admin routes map uniqueness to 409; reporting maps known SQL failures and returns sanitized 503 on unexpected failure. Error handling is not globally uniform; do not silently broaden public error contracts.

Use bound SQL parameters for values. Allowlist identifiers and resolve schema from server registry. `withDb` owns connection lifetime; callbacks/services own transactions and rollback paths. Reporting read permission and data share one repeatable-read transaction. Preserve all-or-nothing snapshot writes, request/order advisory locks, natural-code ownership, and decimal transport strings.

Prisma covers public metadata; reporting schemas/provisioning functions are SQL-managed. Do not edit schema/migrations/API contracts without explicit approval. Never run `prisma db push`, repair SQL, provisioning, imports, or deploy against an unspecified database as a routine verification step. Existing repair SQL drops foreign keys and is not a harmless lint fix.

## Frontend data patterns

Scope React Query keys by store and filter values; remount/reset details when selection changes; avoid showing prior-store data during fetch. Use `cache: "no-store"` for reporting/inbox requests and reporting abort signals. Keep draft/applied filters distinct. Do not replace fixtures with inferred live metrics without defined requirements for statuses, dates, discounts and money.

## Validation and documentation

Available checks: `npm run lint`, `npx tsc --noEmit`, production scope `npx tsc -p tsconfig.build.json --noEmit`, `npm run test:auth`, `npm run test:reporting`, and `npm run build`. No dedicated typecheck or generic test script exists. Node tests use `node:test`, `node:assert/strict`, and disposable PGlite, with a pg-shaped adapter. Add meaningful tests for changed parsing, ownership, sync, calculations, or permissions. Do not claim browser or production coverage from these tests.

Read [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for baseline failures before attributing a failing check to a new change. State exactly which checks ran and their outcomes. Keep API/schema/business-flow/status documentation and concise Cursor rules synchronized with implementation changes. Describe assumptions, unresolved decisions, and architectural changes explicitly; avoid unrelated refactoring or dependency additions.
