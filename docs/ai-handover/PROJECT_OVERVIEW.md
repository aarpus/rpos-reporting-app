# AcutePOS project overview

Analysis date: 2026-10-14. This handover describes the existing working tree, including pre-existing uncommitted implementation. Source code takes precedence over this snapshot. Production database contents, deployment health, and historical business intent were not inspected.

## Purpose and requirements visible in code

AcutePOS is a web reporting dashboard for POS locations. Administrators manage stores, ordinary users, and store assignments. POS installations upload signed order snapshots and operational notification events. Authorized users select a store, read orders and transaction receipts, and opt into store-specific notifications and device push delivery.

The application is a reporting receiver, not the POS checkout system. No payment gateway execution, inventory mutation, public registration, or employee clock write API exists here. Source POS systems own order codes, revisions, business dates, and supplied monetary values.

## Stack

Next.js 16.3.4 App Router, React/React DOM 19.2.8, strict TypeScript, Tailwind CSS 4, TailGrids-derived local components, React Aria/Base UI, TanStack React Query, Recharts, Auth.js/NextAuth 5 beta, PostgreSQL through `pg`, Prisma 7 schema/client tooling, OpenNext for Cloudflare Workers, Hyperdrive, and Web Push. Exact declared and locked versions are in [DEPENDENCIES.md](DEPENDENCIES.md).

## Modules and implementation boundary

| Module | Main source | Current behavior |
| --- | --- | --- |
| Sign-in | `src/auth.ts`, `src/app/auth/` | Credentials, scrypt, database throttle, eight-hour JWT session |
| Store context | `src/lib/store-access.ts`, `src/components/store/` | ADMIN sees active stores; USER sees active assigned stores; cookie selection |
| Administration | `src/app/(dashboard)/admin/`, `src/lib/*-admin.ts` | Create/update stores and USER accounts; replace assignments; no delete API |
| POS reporting | `src/lib/reporting/`, `src/app/api/pos/reporting/restaurant/orders/route.ts` | Atomic full snapshots, revisions, idempotency, per-store PostgreSQL schemas |
| Live reporting | `/report/orders`, `/report/transaction-detail`, receipt `[id]` | Date filters, SQL totals, pagination, store-scoped detail |
| Notifications | `src/app/api/notifications/`, `src/lib/pos-events.ts`, `src/lib/push.ts` | Signed events, opt-in fanout, read state, device subscriptions |
| PWA | `src/app/manifest.ts`, `public/sw.js`, install prompt | Installation and push lifecycle; authenticated traffic stays on network |
| Preview reports | Other report pages and `/` | Static fixtures or empty report shells; not live operational totals |
| Template UI | charts, basic tables, home component library | Reusable presentation/examples; many use fixtures |

## Main workflow

An administrator provisions the database and credentials, creates stores and users, and assigns access. A POS signs and sends one complete order snapshot. The backend verifies the store credential and writes to the registered store schema. A logged-in user selects an accessible store and fetches reports from that schema. Notification ingestion is a separate API: enabled recipients receive inbox records and best-effort push delivery.

Start with [CURSOR_HANDOVER.md](CURSOR_HANDOVER.md), then [ARCHITECTURE.md](ARCHITECTURE.md) and [KNOWN_ISSUES.md](KNOWN_ISSUES.md). Visible UI does not establish backend completion.
