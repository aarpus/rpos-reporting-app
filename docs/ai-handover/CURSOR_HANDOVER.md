# Cursor handover: start here

## What this project does

AcutePOS is a Next.js 16.3.4/React 19 reporting application for multiple POS stores. Auth.js credentials identify ADMIN/USER accounts. PostgreSQL public metadata records users, access, notifications and credentials. SQL-managed per-store schemas receive signed full order snapshots and serve live order/transaction reports. Cloudflare Workers/OpenNext/Hyperdrive is the configured deployment path. Other summary reports and home metrics remain prototypes.

This snapshot was verified against the **working tree on 2026-10-14**, including substantial existing uncommitted changes. Do not reset those changes. A live deployment/database was not inspected.

## Read in this order

1. Root `AGENTS.md` and this file.
2. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md), [ARCHITECTURE.md](ARCHITECTURE.md), [APPLICATION_FLOW.md](APPLICATION_FLOW.md).
3. [KNOWN_ISSUES.md](KNOWN_ISSUES.md) and [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md).
4. [ENV_SETUP.md](ENV_SETUP.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
5. [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md), [AUTH_SECURITY.md](AUTH_SECURITY.md), [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md), [DEPENDENCIES.md](DEPENDENCIES.md), [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md).

## Navigation map

| Work | Source of truth |
| --- | --- |
| Authentication | `src/auth.ts`, `src/lib/password.mjs`, `src/app/auth/` |
| Permissions/store selection | `src/lib/store-access.ts`, `src/lib/admin-auth.ts`, `src/components/store/` |
| Layout/themes/shared UI | `src/app/layout.tsx`, `src/app/providers.tsx`, `src/components/layout/`, `src/components/tailgrids/core/`, `src/app/css/` |
| Store/user admin | `src/lib/store-admin.ts`, `src/lib/user-admin.ts`, corresponding validators, `/admin` pages and APIs |
| Snapshot validation/sync | `src/lib/reporting/{columns.json,snapshot.ts,sync.ts,pos-auth.ts}` |
| Report reads and UI | `src/lib/reporting/{read.ts,transaction-read.ts}`, `/report/orders`, `/report/transaction-detail` |
| Notifications/push | `src/lib/{pos-events.ts,push.ts,notification-types.ts}`, notification APIs/settings, `public/sw.js` |
| Schema/provisioning | `prisma/schema.prisma`, migration SQL, `database/reporting/`, `scripts/install-reporting.mjs` |
| Hosting | `wrangler.jsonc`, `open-next.config.ts`, `scripts/cloudflare.mjs` |
| Tests | `tests/*.test.mjs`; PGlite isolation, Node 24 native TS execution |

## Rules that must survive future edits

Never trust a client-provided schema or selected-store cookie for access. Recheck active user and store access in APIs; use registered schemas and bound SQL. Snapshots contain one complete order and all child arrays; omitted children are deleted, not retained. Preserve revision/idempotency behavior, locking and atomic rollback. Keep card attempts outside payment revenue. Preserve exact decimal strings at API boundaries and distinguish business-date order reports from store-local created-at transaction dates. USER management cannot grant ADMIN through submitted role fields.

## Current progress and blockers

Live order/transaction reports, store/user administration, POS ingestion, inbox/preferences and PWA push code exist. Home, summary reports and employee clock reports are sample/empty implementations. Existing tests passed 33/33; consult status for lint/type-check details and limitations.

Most critical: current Prisma metadata IDs are integers, but tracked migrations still create UUID IDs without defaults. Do not recommend fresh production migration deployment as working until reconciled. Example environment files contain populated secret-like material; generate fresh secrets rather than copying those values. There is no source proxy despite stale README references. No durable push retry job or deployed environment verification exists.

## Open and continue in Cursor

1. Open Cursor, choose **File > Open Folder**, and select `E:\Ashwin\Nextjs\reporting_dashboard`. The folder must contain `package.json` and root `AGENTS.md`.
2. Read `git status --short` before making edits. Cursor project guidance is stored in `.cursor/rules/project-context.mdc` with `alwaysApply: true`; also explicitly ask the agent to read `AGENTS.md` and this handover.
3. Use Node 24 and npm. Review local environment privately; never paste real credentials into chat. Follow [ENV_SETUP.md](ENV_SETUP.md) and its database compatibility caveat before any database operation.
4. Start an initial read-only task with: **“Read AGENTS.md and docs/ai-handover/CURSOR_HANDOVER.md, inspect the related source and current git diff, summarize the relevant invariants and baseline issues, then implement only my requested change. Preserve API contracts, schemas and tenant isolation; ask before changing those. Report actual validation outcomes.”**
5. For ordinary local UI/source development use `npm run dev`; for checks use documented lint, TypeScript and test commands. Do not deploy, import data or repair schemas merely to clear a check.
6. Plan database-drift remediation and production verification as explicit follow-up tasks. Update the affected handover documents whenever behavior changes.

No private Codex memory, prior chat decisions or production observations are available here beyond files supplied in this workspace. State missing information instead of treating inferred business intent as approved requirements.
