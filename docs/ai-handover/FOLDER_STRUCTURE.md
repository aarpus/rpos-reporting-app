# Folder and file structure

Paths below are relative to the project root. The inventory covers application source, tests, scripts, configuration, SQL, existing documentation and public assets; installed packages, build caches, git internals, generated Prisma/types, and private environment files are intentionally excluded. Those excluded directories are generated/runtime inputs, not authored project architecture. Private environment values must never be included in a handover.

## Directory responsibilities

| Directory/file | Responsibility |
| --- | --- |
| `src/app/` | Root layout/providers/styles/manifest, auth UI, dashboard route group, API handlers |
| `src/app/(dashboard)/` | URL-transparent authenticated pages; reports, admin, notifications/settings, template charts/tables |
| `src/app/(dashboard)/report/_components/` | Shared report date/card/meta/table presentation |
| `src/app/(dashboard)/report/*/_components/` | Report-specific UI/fixtures; orders component is directly colocated |
| `src/app/api/` | All Web Request/Response endpoints; see API_DOCUMENTATION |
| `src/components/common/` | Header, sidebar, mobile navigation, preview wrappers |
| `src/components/layout/` | Responsive dashboard chrome and store provider boundary |
| `src/components/store/`, `notifications/` | Store selection/context, retail home fixture dashboard, preferences/device settings |
| `src/components/dashboard/home/` | Older composable dashboard widgets with fixtures/services |
| `src/components/tailgrids/core/` | Shared accessible component wrappers, variants, icons/spinners |
| `src/lib/` | DB, password, authorization, admin parsing/services, POS events/signatures/push |
| `src/lib/reporting/` | Field contract, sync/read/query keys, POS auth, provisioning/import helpers |
| `src/database/` | PrismaPg callback lifecycle and dynamic model delegate access |
| `src/services/api/` | Browser notifications fetch adapter; older delayed home fixture services |
| `src/types/`, `src/utils/` | Session/binding/admin declarations; formatting/class/delay helpers |
| `src/generated/prisma/` | Ignored Prisma client output; do not manually edit |
| `prisma/` | Desired public schema, tracked migrations, historical repair SQL |
| `database/` | Legacy auth SQL plus store/legacy customer reporting DDL templates |
| `scripts/` | Explicit DB provisioning/import/credential and Cloudflare CLI commands |
| `tests/` | Node tests; PGlite reporting integration, validators/password/HMAC/Postman |
| `docs/` | POS integration and testing guides, Postman samples, this AI handover |
| `public/` | PWA icons/service worker, branding, template images |
| `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/` | Permanent agent context; CLAUDE delegates to AGENTS |
| `package.json`, `package-lock.json` | Scripts, Node requirement, dependency ranges/lock |
| `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc` | Framework/Workers build, assets, bindings and headers |
| `tsconfig*.json`, `eslint.config.mjs`, `postcss.config.mjs` | Strict typing/build scope, lint and Tailwind pipeline |
| `.env.example`, `.dev.vars.example` | Variable-name reference; generate fresh values |

`src/app/page copy.tsx` is a leftover alternate home implementation, not a routed page (filename is not `page.tsx`). There is no `src/proxy.ts`, `middleware.ts`, Pages Router, controller directory or queue/cron implementation.

## Page route inventory

Generated below from actual `page.tsx` files. `_components`/`_component` are implementation directories, not public routes. `[id]` is a dynamic segment.

## Complete authored inventory

The tree below lists every discovered non-generated project file in the reviewed scope. Follow the responsibility map above and the API/schema guides for specific behavior rather than inferring completion from a filename.

### Routed pages

| URL | Source |
| --- | --- |
| `/admin/stores` | `src/app/(dashboard)/admin/stores/page.tsx` |
| `/admin/users` | `src/app/(dashboard)/admin/users/page.tsx` |
| `/charts/bar` | `src/app/(dashboard)/charts/bar/page.tsx` |
| `/charts/line` | `src/app/(dashboard)/charts/line/page.tsx` |
| `/charts/pie` | `src/app/(dashboard)/charts/pie/page.tsx` |
| `/notifications` | `src/app/(dashboard)/notifications/page.tsx` |
| `/` | `src/app/(dashboard)/page.tsx` |
| `/report/day-end-report/[id]` | `src/app/(dashboard)/report/day-end-report/[id]/page.tsx` |
| `/report/day-end-report` | `src/app/(dashboard)/report/day-end-report/page.tsx` |
| `/report/employee-clock-in-out` | `src/app/(dashboard)/report/employee-clock-in-out/page.tsx` |
| `/report/month-end-report` | `src/app/(dashboard)/report/month-end-report/page.tsx` |
| `/report/credit-card-transaction` | `src/app/(dashboard)/report/credit-card-transaction/page.tsx` |
| `/report/credit-card-transaction/details` | `src/app/(dashboard)/report/credit-card-transaction/details/page.tsx` |
| `/report/monthly-sales-tax` | `src/app/(dashboard)/report/monthly-sales-tax/page.tsx` |
| `/report/invoice-report` | `src/app/(dashboard)/report/invoice-report/page.tsx` |
| `/report/orders` | `src/app/(dashboard)/report/orders/page.tsx` |
| `/report` | `src/app/(dashboard)/report/page.tsx` |
| `/report/shift-report/[id]` | `src/app/(dashboard)/report/shift-report/[id]/page.tsx` |
| `/report/shift-report` | `src/app/(dashboard)/report/shift-report/page.tsx` |
| `/report/transaction-detail/[id]` | `src/app/(dashboard)/report/transaction-detail/[id]/page.tsx` |
| `/report/transaction-detail` | `src/app/(dashboard)/report/transaction-detail/page.tsx` |
| `/report/week-end-report` | `src/app/(dashboard)/report/week-end-report/page.tsx` |
| `/report/year-end-report` | `src/app/(dashboard)/report/year-end-report/page.tsx` |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` |
| `/tables/basic-tables` | `src/app/(dashboard)/tables/basic-tables/page.tsx` |
| `/auth` | `src/app/auth/page.tsx` |

### Files

```text
.cursor/rules/project-context.mdc
.dev.vars.example
.env.example
.gitignore
.node-version
AGENTS.md
CLAUDE.md
CLOUDFLARE_DEPLOYMENT.md
README.md
database/001-auth.sql
database/reporting/001-tables.sql
database/reporting/restaurant/001-tables.sql
database/reporting/legacy-customer-001.sql
docs/ai-handover/API_DOCUMENTATION.md
docs/ai-handover/APPLICATION_FLOW.md
docs/ai-handover/ARCHITECTURE.md
docs/ai-handover/AUTH_SECURITY.md
docs/ai-handover/BUSINESS_LOGIC.md
docs/ai-handover/CURSOR_HANDOVER.md
docs/ai-handover/DATABASE_SCHEMA.md
docs/ai-handover/DEPENDENCIES.md
docs/ai-handover/DEVELOPMENT_GUIDELINES.md
docs/ai-handover/DEVELOPMENT_STATUS.md
docs/ai-handover/ENV_SETUP.md
docs/ai-handover/FOLDER_STRUCTURE.md
docs/ai-handover/KNOWN_ISSUES.md
docs/ai-handover/PROJECT_OVERVIEW.md
docs/pos-notification-api.md
docs/pos-reporting-api.md
docs/postman/store-reporting-10-orders.postman_collection.json
docs/postman/store-reporting-10-orders.postman_data.json
docs/postman/store-reporting-batch-shift-10-orders.postman_data.json
docs/postman/store-reporting-batch.postman_data.json
docs/postman/store-reporting-shift.postman_data.json
docs/postman/store-reporting-single-order.json
docs/store-reporting-sync-testing.md
eslint.config.mjs
next.config.ts
open-next.config.ts
package-lock.json
package.json
postcss.config.mjs
prisma.config.ts
prisma/migrations/20260922000000_init/migration.sql
prisma/migrations/20260929000000_store_notifications/migration.sql
prisma/migrations/20261009000000_customer_reporting/migration.sql
prisma/migrations/20261012000000_store_reporting/migration.sql
prisma/migrations/20261013000000_store_code_schema_names/migration.sql
prisma/migrations/20261014000000_reporting_batch_shift/migration.sql
prisma/migrations/migration_lock.toml
prisma/repair-auto-increment-ids.sql
prisma/schema.prisma
public/_headers
public/adaptive-icon.png
public/android-icon-foreground.png
public/apple-touch-icon.png
public/favicon.png
public/icon-192.png
public/icon.png
public/images/blog-img/stocks-blog-1.png
public/images/blog-img/stocks-blog-2.png
public/images/blog-img/stocks-blog-3.png
public/images/cycles/cycle-1.png
public/images/cycles/cycle-2.png
public/images/cycles/cycle-3.png
public/images/flag/AU.svg
public/images/flag/CA.svg
public/images/flag/FR.svg
public/images/flag/IN.svg
public/images/flag/IT.svg
public/images/flag/US.svg
public/images/logo-light.png
public/images/logo.png
public/images/models/building-model-1.png
public/images/models/building-model-2.png
public/images/models/building-model-3.png
public/images/models/building-model-4.png
public/images/models/building-model-5.png
public/images/models/building-model-6.png
public/images/models/building-model-7.png
public/images/models/building-model-8.png
public/images/models/building-model-9.png
public/images/products/gaming-chair.png
public/images/products/headset.png
public/images/products/keyboard.png
public/images/products/mastercard.png
public/images/products/monitor.png
public/images/products/mouse.png
public/images/social-icons/facebook.svg
public/images/social-icons/github.svg
public/images/social-icons/google.svg
public/images/social-icons/instagram.svg
public/images/social-icons/vimeo.svg
public/images/social-icons/x.svg
public/images/social-icons/youtube.svg
public/images/team/member-1.png
public/images/team/member-2.png
public/images/team/member-3.png
public/images/team/member-4.png
public/images/team/member-5.png
public/images/team/member-6.png
public/images/team/member-7.png
public/images/team/member-8.png
public/images/user/alex-rodriguez.png
public/images/user/emily-johnson.png
public/images/user/jhon-smith.png
public/images/user/michael-brown.png
public/images/user/sarah-wilson.png
public/logo-icon-dark.png
public/logo-icon-light.png
public/sw.js
scripts/check-auth.mjs
scripts/cloudflare.mjs
scripts/database.mjs
scripts/generate-vapid.mjs
scripts/import-public-reporting.mjs
scripts/install-reporting.mjs
scripts/pos-credential.mjs
scripts/reporting-stores.mjs
src/app/(dashboard)/admin/stores/page.tsx
src/app/(dashboard)/admin/stores/store-management.tsx
src/app/(dashboard)/admin/users/page.tsx
src/app/(dashboard)/admin/users/user-management.tsx
src/app/(dashboard)/charts/bar/_components/chart-one/data.ts
src/app/(dashboard)/charts/bar/_components/chart-one/index.tsx
src/app/(dashboard)/charts/bar/_components/chart-one/tooltip.tsx
src/app/(dashboard)/charts/bar/_components/chart-two/data.ts
src/app/(dashboard)/charts/bar/_components/chart-two/index.tsx
src/app/(dashboard)/charts/bar/_components/chart-two/tooltip.tsx
src/app/(dashboard)/charts/bar/page.tsx
src/app/(dashboard)/charts/line/_components/chart-one/data.ts
src/app/(dashboard)/charts/line/_components/chart-one/index.tsx
src/app/(dashboard)/charts/line/_components/chart-one/tooltip.tsx
src/app/(dashboard)/charts/line/_components/chart-two/data.ts
src/app/(dashboard)/charts/line/_components/chart-two/index.tsx
src/app/(dashboard)/charts/line/_components/chart-two/tooltip.tsx
src/app/(dashboard)/charts/line/page.tsx
src/app/(dashboard)/charts/pie/_components/chart-one/data.ts
src/app/(dashboard)/charts/pie/_components/chart-one/index.tsx
src/app/(dashboard)/charts/pie/_components/chart-one/tooltip.tsx
src/app/(dashboard)/charts/pie/page.tsx
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/notifications/page.tsx
src/app/(dashboard)/page.tsx
src/app/(dashboard)/report/_components/report-ui.tsx
src/app/(dashboard)/report/_components/retail-date-range-filter.tsx
src/app/(dashboard)/report/_components/retail-report-date-filter.tsx
src/app/(dashboard)/report/_components/retail-report-table.tsx
src/app/(dashboard)/report/day-end-report/[id]/page.tsx
src/app/(dashboard)/report/day-end-report/_components/data.ts
src/app/(dashboard)/report/day-end-report/_components/day-end-report-detail-entry.tsx
src/app/(dashboard)/report/day-end-report/_components/day-end-report-entry.tsx
src/app/(dashboard)/report/day-end-report/_components/day-end-report.tsx
src/app/(dashboard)/report/day-end-report/_components/retail-day-end-data.ts
src/app/(dashboard)/report/day-end-report/_components/retail-day-end-detail.tsx
src/app/(dashboard)/report/day-end-report/_components/retail-day-end-list.tsx
src/app/(dashboard)/report/day-end-report/page.tsx
src/app/(dashboard)/report/employee-clock-in-out/_components/data.ts
src/app/(dashboard)/report/employee-clock-in-out/_components/employee-clock-report.tsx
src/app/(dashboard)/report/employee-clock-in-out/page.tsx
src/app/(dashboard)/report/month-end-report/_components/month-end-report-entry.tsx
src/app/(dashboard)/report/month-end-report/_components/month-end-report.tsx
src/app/(dashboard)/report/month-end-report/_components/retail-month-end-data.ts
src/app/(dashboard)/report/month-end-report/_components/retail-month-end-report.tsx
src/app/(dashboard)/report/month-end-report/page.tsx
src/app/(dashboard)/report/credit-card-transaction/_components/credit-card-transaction-detail-entry.tsx
src/app/(dashboard)/report/credit-card-transaction/_components/credit-card-transaction-entry.tsx
src/app/(dashboard)/report/credit-card-transaction/_components/retail-credit-card-data.ts
src/app/(dashboard)/report/credit-card-transaction/_components/retail-credit-card-detail.tsx
src/app/(dashboard)/report/credit-card-transaction/_components/retail-credit-card-list.tsx
src/app/(dashboard)/report/credit-card-transaction/details/page.tsx
src/app/(dashboard)/report/credit-card-transaction/page.tsx
src/app/(dashboard)/report/monthly-sales-tax/_components/monthly-sales-tax-entry.tsx
src/app/(dashboard)/report/monthly-sales-tax/_components/retail-monthly-sales-tax-data.ts
src/app/(dashboard)/report/monthly-sales-tax/_components/retail-monthly-sales-tax-report.tsx
src/app/(dashboard)/report/monthly-sales-tax/page.tsx
src/app/(dashboard)/report/invoice-report/_components/invoice-report-entry.tsx
src/app/(dashboard)/report/invoice-report/_components/retail-invoice-data.ts
src/app/(dashboard)/report/invoice-report/_components/retail-invoice-list.tsx
src/app/(dashboard)/report/invoice-report/page.tsx
src/app/(dashboard)/report/_components/retail-month-year-filter.tsx
src/app/(dashboard)/report/orders/order-reporting.tsx
src/app/(dashboard)/report/orders/page.tsx
src/app/(dashboard)/report/page.tsx
src/app/(dashboard)/report/shift-report/[id]/page.tsx
src/app/(dashboard)/report/shift-report/_components/data.ts
src/app/(dashboard)/report/shift-report/_components/retail-shift-data.ts
src/app/(dashboard)/report/shift-report/_components/retail-shift-end-detail.tsx
src/app/(dashboard)/report/shift-report/_components/retail-shift-end-list.tsx
src/app/(dashboard)/report/shift-report/_components/shift-report-detail-entry.tsx
src/app/(dashboard)/report/shift-report/_components/shift-end-report.tsx
src/app/(dashboard)/report/shift-report/_components/shift-report-entry.tsx
src/app/(dashboard)/report/shift-report/_components/shift-report-list.tsx
src/app/(dashboard)/report/shift-report/page.tsx
src/app/(dashboard)/report/transaction-detail/[id]/page.tsx
src/app/(dashboard)/report/transaction-detail/_components/data.ts
src/app/(dashboard)/report/transaction-detail/_components/transaction-detail.tsx
src/app/(dashboard)/report/transaction-detail/page.tsx
src/app/(dashboard)/report/week-end-report/_components/data.ts
src/app/(dashboard)/report/week-end-report/_components/retail-week-end-data.ts
src/app/(dashboard)/report/week-end-report/_components/retail-week-end-report.tsx
src/app/(dashboard)/report/week-end-report/_components/week-end-report-entry.tsx
src/app/(dashboard)/report/week-end-report/_components/week-end-report.tsx
src/app/(dashboard)/report/week-end-report/page.tsx
src/app/(dashboard)/report/year-end-report/_components/data.ts
src/app/(dashboard)/report/year-end-report/_components/year-end-report.tsx
src/app/(dashboard)/report/year-end-report/page.tsx
src/app/(dashboard)/settings/page.tsx
src/app/(dashboard)/tables/basic-tables/_component/last-transactions-table/icon.tsx
src/app/(dashboard)/tables/basic-tables/_component/last-transactions-table/index.tsx
src/app/(dashboard)/tables/basic-tables/_component/last-transactions-table/transactions-table-data.ts
src/app/(dashboard)/tables/basic-tables/_component/leads-report/data.ts
src/app/(dashboard)/tables/basic-tables/_component/leads-report/index.tsx
src/app/(dashboard)/tables/basic-tables/_component/package-table/data.ts
src/app/(dashboard)/tables/basic-tables/_component/package-table/icons.tsx
src/app/(dashboard)/tables/basic-tables/_component/package-table/index.tsx
src/app/(dashboard)/tables/basic-tables/_component/top-channels/data.ts
src/app/(dashboard)/tables/basic-tables/_component/top-channels/index.tsx
src/app/(dashboard)/tables/basic-tables/_component/top-products-table/data.ts
src/app/(dashboard)/tables/basic-tables/_component/top-products-table/index.tsx
src/app/(dashboard)/tables/basic-tables/_component/user-table/data.ts
src/app/(dashboard)/tables/basic-tables/_component/user-table/index.tsx
src/app/(dashboard)/tables/basic-tables/page.tsx
src/app/api/admin/stores/[storeCode]/access/route.ts
src/app/api/admin/stores/[storeCode]/pos-credentials/route.ts
src/app/api/admin/stores/[storeCode]/route.ts
src/app/api/admin/stores/route.ts
src/app/api/admin/users/[userId]/access/route.ts
src/app/api/admin/users/[userId]/route.ts
src/app/api/admin/users/route.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/api/notification-preferences/route.ts
src/app/api/notifications/[id]/read/route.ts
src/app/api/notifications/read-all/route.ts
src/app/api/notifications/route.ts
src/app/api/pos/notification-events/route.ts
src/app/api/pos/reporting/restaurant/batch/route.ts
src/app/api/pos/reporting/restaurant/orders/route.ts
src/app/api/pos/reporting/restaurant/shift/route.ts
src/app/api/pos/reporting/retail/batch/route.ts
src/app/api/pos/reporting/retail/orders/route.ts
src/app/api/pos/reporting/retail/shift/route.ts
src/app/api/pos/reporting/retail/station_transaction/route.ts
src/app/api/pos/reporting/retail/store_account_transaction/route.ts
src/app/api/pos/reporting/retail/station_cash_transfer/route.ts
src/app/api/pos/reporting/retail/invoice/route.ts
src/app/api/pos/reporting/retail/invoice_payment/route.ts
src/app/api/pos/reporting/retail/clockin/route.ts
src/app/api/pos/reporting/retail/nosale/route.ts
src/app/api/pos/reporting/retail/account_payment/route.ts
src/app/api/pos/reporting/retail/group_detail/route.ts
src/app/api/pos/reporting/retail/store/route.ts
src/app/api/pos/reporting/retail/Coupon/route.ts
src/app/api/pos/reporting/retail/Online_Platform_Master/route.ts
src/app/api/pos/reporting/retail/cashmachine_transaction/route.ts
src/app/api/pos/reporting/retail/cashmachine_master/route.ts
src/app/api/pos/reporting/retail/cashmachine_batch/route.ts
src/app/api/push-subscriptions/route.ts
src/app/api/reporting/orders/route.ts
src/app/api/reporting/transaction-detail/route.ts
src/app/api/store-selection/route.ts
src/app/api/stores/route.ts
src/app/auth/page.tsx
src/app/auth/sign-in-form.tsx
src/app/css/calendars.css
src/app/css/dark.css
src/app/css/default.css
src/app/globals.css
src/app/layout.tsx
src/app/manifest.ts
src/app/not-found.tsx
src/app/page copy.tsx
src/app/providers.tsx
src/auth.ts
src/components/common/component-preview.tsx
src/components/common/header/icons.tsx
src/components/common/header/index.tsx
src/components/common/header/notifications.tsx
src/components/common/header/searchbar.tsx
src/components/common/header/theme-toggle.tsx
src/components/common/header/user-profile.tsx
src/components/common/mobile-bottom-nav.tsx
src/components/common/sidebar/data.tsx
src/components/common/sidebar/icon.tsx
src/components/common/sidebar/index.tsx
src/components/common/sidebar/nav-item.tsx
src/components/common/sidebar/utils.ts
src/components/dashboard/home/_component/inventory-overview/index.tsx
src/components/dashboard/home/_component/inventory-overview/skeleton.tsx
src/components/dashboard/home/_component/inventory-overview/types.ts
src/components/dashboard/home/_component/inventory-overview/utils.ts
src/components/dashboard/home/_component/last-transactions-table/data.ts
src/components/dashboard/home/_component/last-transactions-table/icon.tsx
src/components/dashboard/home/_component/last-transactions-table/index.tsx
src/components/dashboard/home/_component/last-transactions-table/skeleton.tsx
src/components/dashboard/home/_component/last-transactions-table/types.ts
src/components/dashboard/home/_component/last-transactions-table/utils.ts
src/components/dashboard/home/_component/overview-stats/data.tsx
src/components/dashboard/home/_component/overview-stats/icons.tsx
src/components/dashboard/home/_component/overview-stats/index.tsx
src/components/dashboard/home/_component/overview-stats/skeleton.tsx
src/components/dashboard/home/_component/overview-stats/types.ts
src/components/dashboard/home/_component/overview-stats/utils.ts
src/components/dashboard/home/_component/region-labels/data.ts
src/components/dashboard/home/_component/region-labels/index.tsx
src/components/dashboard/home/_component/region-labels/map.tsx
src/components/dashboard/home/_component/region-labels/types.ts
src/components/dashboard/home/_component/sales-chart/custom-tooltip.tsx
src/components/dashboard/home/_component/sales-chart/data.ts
src/components/dashboard/home/_component/sales-chart/header.tsx
src/components/dashboard/home/_component/sales-chart/index.tsx
src/components/dashboard/home/_component/sales-chart/skeleton.tsx
src/components/dashboard/home/_component/sales-chart/types.ts
src/components/dashboard/home/_component/sales-chart/utils.ts
src/components/dashboard/home/_component/top-products/index.tsx
src/components/dashboard/home/_component/top-products/skeleton.tsx
src/components/dashboard/home/_component/top-products/types.ts
src/components/dashboard/home/_component/top-products/utils.ts
src/components/dashboard/home/_component/traffic-sources/index.tsx
src/components/dashboard/home/_component/traffic-sources/skeleton.tsx
src/components/dashboard/home/_component/traffic-sources/types.ts
src/components/dashboard/home/_component/traffic-sources/utils.ts
src/components/layout/DashboardLayout.tsx
src/components/notifications/notification-settings.tsx
src/components/pwa-install-prompt.tsx
src/components/store/store-provider.tsx
src/components/store/store-selector.tsx
src/components/tailgrids/core/accordion.tsx
src/components/tailgrids/core/alert.tsx
src/components/tailgrids/core/avatar.tsx
src/components/tailgrids/core/badge.tsx
src/components/tailgrids/core/breadcrumbs.tsx
src/components/tailgrids/core/button-group.tsx
src/components/tailgrids/core/button.tsx
src/components/tailgrids/core/calendar.tsx
src/components/tailgrids/core/card.tsx
src/components/tailgrids/core/carousel.tsx
src/components/tailgrids/core/chart.tsx
src/components/tailgrids/core/checkbox.tsx
src/components/tailgrids/core/collapsible.tsx
src/components/tailgrids/core/date-field.tsx
src/components/tailgrids/core/date-picker.tsx
src/components/tailgrids/core/description.tsx
src/components/tailgrids/core/dialog.tsx
src/components/tailgrids/core/dropdown.tsx
src/components/tailgrids/core/field.tsx
src/components/tailgrids/core/input-group.tsx
src/components/tailgrids/core/input.tsx
src/components/tailgrids/core/label.tsx
src/components/tailgrids/core/number-field.tsx
src/components/tailgrids/core/otp-input.tsx
src/components/tailgrids/core/overlay.tsx
src/components/tailgrids/core/pagination.tsx
src/components/tailgrids/core/popover.tsx
src/components/tailgrids/core/progress.tsx
src/components/tailgrids/core/resizable.tsx
src/components/tailgrids/core/scroll-area.tsx
src/components/tailgrids/core/select.tsx
src/components/tailgrids/core/separator.tsx
src/components/tailgrids/core/sheet.tsx
src/components/tailgrids/core/skeleton.tsx
src/components/tailgrids/core/social-button.tsx
src/components/tailgrids/core/spinner/default.tsx
src/components/tailgrids/core/spinner/dotted-round.tsx
src/components/tailgrids/core/spinner/dotted.tsx
src/components/tailgrids/core/spinner/index.tsx
src/components/tailgrids/core/table.tsx
src/components/tailgrids/core/tabs.tsx
src/components/tailgrids/core/text-area.tsx
src/components/tailgrids/core/text-field.tsx
src/components/tailgrids/core/time-field.tsx
src/components/tailgrids/core/toggle.tsx
src/components/tailgrids/core/tooltip.tsx
src/database/globalForPrisma.ts
src/database/model-access.ts
src/lib/admin-auth.ts
src/lib/db.ts
src/lib/notification-types.ts
src/lib/password.mjs
src/lib/pos-credentials.ts
src/lib/pos-events.ts
src/lib/pos-signature.ts
src/lib/push.ts
src/lib/reporting/columns.json
src/lib/reporting/installation.ts
src/lib/reporting/legacy-import.ts
src/lib/reporting/pos-auth.ts
src/lib/reporting/query-key.ts
src/lib/reporting/read.ts
src/lib/reporting/snapshot.ts
src/lib/reporting/store-creation.ts
src/lib/reporting/sync.ts
src/lib/reporting/transaction-read.ts
src/lib/reporting/transaction-types.ts
src/lib/store-access.ts
src/lib/store-admin-validation.ts
src/lib/store-admin.ts
src/lib/user-admin-validation.ts
src/lib/user-admin.ts
src/services/api/home/data.ts
src/services/api/home/index.ts
src/services/api/home/types.ts
src/services/api/notifications.ts
src/types/cloudflare-env.d.ts
src/types/next-auth.d.ts
src/types/store-admin.ts
src/types/user-admin.ts
src/utils/cn.ts
src/utils/delay.ts
src/utils/format-currency.ts
src/utils/format-number.ts
src/utils/icon.tsx
tests/password.test.mjs
tests/pos-signature.test.mjs
tests/postman-reporting.test.mjs
tests/reporting.test.mjs
tests/store-admin-validation.test.mjs
tests/transaction-reporting.test.mjs
tests/user-admin-validation.test.mjs
tsconfig.build.json
tsconfig.json
wrangler.jsonc
```

### Source module index

This index was extracted by reading every authored TS/TSX/MJS source file. Export names identify entry points, not proof that they are used or complete. See the status document for live/fixture distinctions.

| Source | Lines | Exported entry points |
| --- | --- | --- |
| `scripts/check-auth.mjs` | 76 | Local helpers/imports/test registration |
| `scripts/cloudflare.mjs` | 37 | Local helpers/imports/test registration |
| `scripts/database.mjs` | 58 | Local helpers/imports/test registration |
| `scripts/generate-vapid.mjs` | 3 | Local helpers/imports/test registration |
| `scripts/import-public-reporting.mjs` | 32 | Local helpers/imports/test registration |
| `scripts/install-reporting.mjs` | 27 | Local helpers/imports/test registration |
| `scripts/pos-credential.mjs` | 43 | Local helpers/imports/test registration |
| `scripts/reporting-stores.mjs` | 28 | Local helpers/imports/test registration |
| `src/app/(dashboard)/admin/stores/page.tsx` | 13 | `StoreManagementPage` |
| `src/app/(dashboard)/admin/stores/store-management.tsx` | 1007 | `StoreManagement` |
| `src/app/(dashboard)/admin/users/page.tsx` | 12 | `UserManagementPage` |
| `src/app/(dashboard)/admin/users/user-management.tsx` | 510 | `UserManagement` |
| `src/app/(dashboard)/charts/bar/_components/chart-one/data.ts` | 17 | `mockBarChartOneData` |
| `src/app/(dashboard)/charts/bar/_components/chart-one/index.tsx` | 50 | `BarChartOne` |
| `src/app/(dashboard)/charts/bar/_components/chart-one/tooltip.tsx` | 20 | `BarChartOneTooltip` |
| `src/app/(dashboard)/charts/bar/_components/chart-two/data.ts` | 17 | `mockBarChartTwoData` |
| `src/app/(dashboard)/charts/bar/_components/chart-two/index.tsx` | 70 | `BarChartTwo` |
| `src/app/(dashboard)/charts/bar/_components/chart-two/tooltip.tsx` | 33 | `BarChartTwoTooltip` |
| `src/app/(dashboard)/charts/bar/page.tsx` | 33 | `metadata`, `BarChartsPage` |
| `src/app/(dashboard)/charts/line/_components/chart-one/data.ts` | 17 | `mockLineChartOneData` |
| `src/app/(dashboard)/charts/line/_components/chart-one/index.tsx` | 67 | `LineChartOne` |
| `src/app/(dashboard)/charts/line/_components/chart-one/tooltip.tsx` | 20 | `LineChartOneTooltip` |
| `src/app/(dashboard)/charts/line/_components/chart-two/data.ts` | 17 | `mockLineChartTwoData` |
| `src/app/(dashboard)/charts/line/_components/chart-two/index.tsx` | 98 | `LineChartTwo` |
| `src/app/(dashboard)/charts/line/_components/chart-two/tooltip.tsx` | 33 | `LineChartTwoTooltip` |
| `src/app/(dashboard)/charts/line/page.tsx` | 32 | `metadata`, `LineChartsPage` |
| `src/app/(dashboard)/charts/pie/_components/chart-one/data.ts` | 8 | `mockPieChartOneData` |
| `src/app/(dashboard)/charts/pie/_components/chart-one/index.tsx` | 97 | `PieChartOne` |
| `src/app/(dashboard)/charts/pie/_components/chart-one/tooltip.tsx` | 20 | `PieChartOneTooltip` |
| `src/app/(dashboard)/charts/pie/page.tsx` | 31 | `metadata`, `PieChartsPage` |
| `src/app/(dashboard)/layout.tsx` | 27 | `ProtectedLayout` |
| `src/app/(dashboard)/notifications/page.tsx` | 73 | `NotificationsPage` |
| `src/app/(dashboard)/page.tsx` | 745 | `HomePage` |
| `src/app/(dashboard)/report/_components/report-ui.tsx` | 201 | `money`, `pct`, `amountClass`, `ReportCard`, `DenseTable`, `Td`, `TotalRow`, `EmptyState`, `Meta`, `CompactDatePicker` |
| `src/app/(dashboard)/report/day-end-report/[id]/page.tsx` | 15 | `metadata`, `DayEndDetailPage` |
| `src/app/(dashboard)/report/day-end-report/_components/data.ts` | 598 | `reportMeta`, `summaryOverview`, `departments`, `departmentTotal`, `orderTypes`, `orderTypeTotal`, `taxes`, `taxTotal`, `tenders`, `tenderTotal`, `tipsFees`, `tipsFeesTotal`, `cardPayments`, `cardPaymentTotal`, `devices`, `deviceTotal`, `cashAudit`, `cashAuditTotal`, `rounding`, `roundingTotal`, `externalPayments`, `externalPaymentTotal`, `giftCardPayments`, `giftCardPaymentTotal`, `voidItems`, `returnsVoids`, `returnsVoidsTotal`, `discounts`, `discountTotal`, `clockIns`, `clockInTotal` |
| `src/app/(dashboard)/report/day-end-report/_components/day-end-report.tsx` | 1171 | `DayEndReportView` |
| `src/app/(dashboard)/report/day-end-report/page.tsx` | 10 | `metadata`, `DayEndReportPage` |
| `src/app/(dashboard)/report/employee-clock-in-out/_components/data.ts` | 97 | `datePresets`, `DatePreset`, `ClockStatus`, `BreakSession`, `ClockSession`, `sessions`, `employeeOptions`, `reportTypeOptions`, `groupByOptions`, `parseDateKey` |
| `src/app/(dashboard)/report/employee-clock-in-out/_components/employee-clock-report.tsx` | 711 | `EmployeeClockReport` |
| `src/app/(dashboard)/report/employee-clock-in-out/page.tsx` | 10 | `metadata`, `EmployeeClockReportPage` |
| `src/app/(dashboard)/report/month-end-report/_components/month-end-report.tsx` | 337 | `MonthEndReportView` |
| `src/app/(dashboard)/report/month-end-report/page.tsx` | 10 | `metadata`, `MonthEndReportPage` |
| `src/app/(dashboard)/report/orders/order-reporting.tsx` | 365 | `OrderReporting` |
| `src/app/(dashboard)/report/orders/page.tsx` | 8 | `metadata`, `OrderReportingPage` |
| `src/app/(dashboard)/report/page.tsx` | 106 | `ReportsPage` |
| `src/app/(dashboard)/report/shift-report/[id]/page.tsx` | 23 | `metadata`, `ShiftEndReportPage` |
| `src/app/(dashboard)/report/shift-report/_components/data.ts` | 405 | `stations`, `Station`, `datePresets`, `DatePreset`, `defaultPreset`, `defaultStation`, `ShiftRow`, `shifts`, `shiftReportMeta`, `shiftSummary`, `shiftDepartments`, `shiftDepartmentTotal`, `shiftCashAudit`, `shiftCardPayments`, `shiftCardPaymentTotal`, `shiftReturnsVoids`, `shiftReturnsVoidsTotal`, `shiftVoidItems`, `shiftDiscounts`, `shiftDiscountTotal`, `parseDateKey` |
| `src/app/(dashboard)/report/shift-report/_components/shift-end-report.tsx` | 391 | `ShiftEndReportView` |
| `src/app/(dashboard)/report/shift-report/_components/shift-report-list.tsx` | 301 | `ShiftReportList` |
| `src/app/(dashboard)/report/shift-report/page.tsx` | 10 | `metadata`, `ShiftReportPage` |
| `src/app/(dashboard)/report/transaction-detail/[id]/page.tsx` | 15 | `metadata`, `TransactionReceiptPage` |
| `src/app/(dashboard)/report/transaction-detail/_components/data.ts` | 36 | `datePresets`, `DatePreset`, `employeeOptions`, `reportByOptions`, `pageSizeOptions`, `PaidById`, `EmployeeId`, `DepartmentId`, `TransTypeId`, `ReportById`, `formatAmount` |
| `src/app/(dashboard)/report/transaction-detail/_components/transaction-detail.tsx` | 942 | `TransactionDetailList`, `TransactionReceipt` |
| `src/app/(dashboard)/report/transaction-detail/page.tsx` | 10 | `metadata`, `TransactionDetailPage` |
| `src/app/(dashboard)/report/week-end-report/_components/data.ts` | 113 | `summary`, `departments`, `orderTypes`, `taxes`, `tenders`, `tipsFees`, `cashAudit`, `returnsVoids`, `discounts`, `employees`, `stock` |
| `src/app/(dashboard)/report/week-end-report/_components/week-end-report.tsx` | 924 | `WeekEndReportView` |
| `src/app/(dashboard)/report/week-end-report/page.tsx` | 10 | `metadata`, `WeekEndReportPage` |
| `src/app/(dashboard)/report/year-end-report/_components/data.ts` | 172 | `summary`, `departments`, `orderTypes`, `taxes`, `tenders`, `tipsFees`, `cardPayments`, `devices`, `cashAudit`, `externalPayments`, `voidReasons`, `returnsVoids`, `discounts`, `employees`, `stock` |
| `src/app/(dashboard)/report/year-end-report/_components/year-end-report.tsx` | 329 | `YearEndReportView` |
| `src/app/(dashboard)/report/year-end-report/page.tsx` | 10 | `metadata`, `YearEndReportPage` |
| `src/app/(dashboard)/settings/page.tsx` | 68 | `SettingsPage` |
| `src/app/(dashboard)/tables/basic-tables/_component/last-transactions-table/icon.tsx` | 39 | `FilterIcon`, `DownloadIcon` |
| `src/app/(dashboard)/tables/basic-tables/_component/last-transactions-table/index.tsx` | 144 | `LastTransactionsTable` |
| `src/app/(dashboard)/tables/basic-tables/_component/last-transactions-table/transactions-table-data.ts` | 72 | `Transaction`, `transactionsTableData` |
| `src/app/(dashboard)/tables/basic-tables/_component/leads-report/data.ts` | 87 | `leadsReportData` |
| `src/app/(dashboard)/tables/basic-tables/_component/leads-report/index.tsx` | 106 | `LeadsReport` |
| `src/app/(dashboard)/tables/basic-tables/_component/package-table/data.ts` | 26 | `packageData` |
| `src/app/(dashboard)/tables/basic-tables/_component/package-table/icons.tsx` | 66 | `EyeIcon`, `TrashBinIcon`, `DownloadIcon` |
| `src/app/(dashboard)/tables/basic-tables/_component/package-table/index.tsx` | 85 | `PackageTable` |
| `src/app/(dashboard)/tables/basic-tables/_component/top-channels/data.ts` | 42 | `topChannelsData` |
| `src/app/(dashboard)/tables/basic-tables/_component/top-channels/index.tsx` | 79 | `TopChannels` |
| `src/app/(dashboard)/tables/basic-tables/_component/top-products-table/data.ts` | 42 | `topProducts` |
| `src/app/(dashboard)/tables/basic-tables/_component/top-products-table/index.tsx` | 79 | `TopProductsTable` |
| `src/app/(dashboard)/tables/basic-tables/_component/user-table/data.ts` | 52 | `UserTableRow`, `userTableData` |
| `src/app/(dashboard)/tables/basic-tables/_component/user-table/index.tsx` | 64 | `UserTable` |
| `src/app/(dashboard)/tables/basic-tables/page.tsx` | 43 | `metadata`, `BasicTablesPage` |
| `src/app/api/admin/stores/[storeCode]/access/route.ts` | 38 | `GET`, `PUT` |
| `src/app/api/admin/stores/[storeCode]/pos-credentials/route.ts` | 60 | `GET`, `POST` |
| `src/app/api/admin/stores/[storeCode]/route.ts` | 21 | `PATCH` |
| `src/app/api/admin/stores/route.ts` | 44 | `GET`, `POST` |
| `src/app/api/admin/users/[userId]/access/route.ts` | 36 | `GET`, `PUT` |
| `src/app/api/admin/users/[userId]/route.ts` | 26 | `PATCH` |
| `src/app/api/admin/users/route.ts` | 25 | `GET`, `POST` |
| `src/app/api/auth/[...nextauth]/route.ts` | 4 | `runtime` |
| `src/app/api/notification-preferences/route.ts` | 41 | `GET`, `PATCH` |
| `src/app/api/notifications/[id]/read/route.ts` | 34 | `POST` |
| `src/app/api/notifications/read-all/route.ts` | 16 | `POST` |
| `src/app/api/notifications/route.ts` | 70 | `GET` |
| `src/app/api/pos/notification-events/route.ts` | 185 | `runtime`, `POST` |
| `src/app/api/pos/reporting/restaurant/orders/route.ts` | 22 | `runtime`, `POST` |
| `src/app/api/push-subscriptions/route.ts` | 46 | `POST`, `DELETE` |
| `src/app/api/reporting/orders/route.ts` | 49 | `runtime`, `GET` |
| `src/app/api/reporting/transaction-detail/route.ts` | 46 | `runtime`, `GET` |
| `src/app/api/store-selection/route.ts` | 18 | `POST` |
| `src/app/api/stores/route.ts` | 7 | `GET` |
| `src/app/auth/page.tsx` | 152 | `metadata`, `AuthPage` |
| `src/app/auth/sign-in-form.tsx` | 93 | `SignInForm` |
| `src/app/layout.tsx` | 76 | `metadata`, `viewport`, `RootLayout` |
| `src/app/manifest.ts` | 36 | `manifest` |
| `src/app/not-found.tsx` | 100 | `Error` |
| `src/app/page copy.tsx` | 36 | `HomePage` |
| `src/app/providers.tsx` | 18 | `Providers` |
| `src/auth.ts` | 76 | Local helpers/imports/test registration |
| `src/components/common/component-preview.tsx` | 29 | `ComponentPreview` |
| `src/components/common/header/icons.tsx` | 220 | `SearchIcon`, `BellIcon`, `SettingIcon`, `LetterIcon`, `CreditCardIcon`, `PrinterIcon`, `UserCircleIcon`, `GearIcon`, `BillingIcon`, `LogoutIcon`, `SunIcon`, `MoonIcon`, `MenuIcon` |
| `src/components/common/header/index.tsx` | 116 | `Header` |
| `src/components/common/header/notifications.tsx` | 95 | `NotificationsButton` |
| `src/components/common/header/searchbar.tsx` | 240 | `SearchBar` |
| `src/components/common/header/theme-toggle.tsx` | 26 | `ThemeToggle` |
| `src/components/common/header/user-profile.tsx` | 155 | `UserProfileButton` |
| `src/components/common/mobile-bottom-nav.tsx` | 62 | `MobileBottomNav` |
| `src/components/common/sidebar/data.tsx` | 93 | `NAV_DATA` |
| `src/components/common/sidebar/icon.tsx` | 367 | `HomeIcon`, `CalendarIcon`, `UserIcon`, `AlphabetIcon`, `TableIcon`, `PieChartIcon`, `Widget4Icon`, `SidebarExpandedIcon`, `ThreeDots`, `WindowIcon`, `CloseIcon`, `UserGroupIcon`, `ChatIcon`, `LetterIcon`, `InvoiceIcon`, `TaskIcon`, `AuthIcon` |
| `src/components/common/sidebar/index.tsx` | 152 | `Sidebar` |
| `src/components/common/sidebar/nav-item.tsx` | 141 | `NavItemProps`, `NavItem` |
| `src/components/common/sidebar/utils.ts` | 30 | `isPathActive`, `findActiveGroupKey` |
| `src/components/dashboard/home/_component/inventory-overview/index.tsx` | 111 | `InventoryOverview` |
| `src/components/dashboard/home/_component/inventory-overview/skeleton.tsx` | 42 | `InventoryOverviewSkeleton` |
| `src/components/dashboard/home/_component/inventory-overview/types.ts` | 13 | `InventorySummaryItem`, `InventoryOverviewViewModel` |
| `src/components/dashboard/home/_component/inventory-overview/utils.ts` | 25 | `mapInventoryOverviewResponse` |
| `src/components/dashboard/home/_component/last-transactions-table/data.ts` | 61 | `SKELETON_ROW_COUNT`, `transactionsTableData`, `STATUS_COLOR_MAP` |
| `src/components/dashboard/home/_component/last-transactions-table/icon.tsx` | 39 | `FilterIcon`, `DownloadIcon` |
| `src/components/dashboard/home/_component/last-transactions-table/index.tsx` | 188 | `LastTransactionsTable` |
| `src/components/dashboard/home/_component/last-transactions-table/skeleton.tsx` | 34 | `TransactionSkeletonRow` |
| `src/components/dashboard/home/_component/last-transactions-table/types.ts` | 39 | `BadgeColor`, `TransactionViewModel`, `Transaction` |
| `src/components/dashboard/home/_component/last-transactions-table/utils.ts` | 23 | `formatDate`, `formatAmount` |
| `src/components/dashboard/home/_component/overview-stats/data.tsx` | 31 | `overviewStatDisplayConfig` |
| `src/components/dashboard/home/_component/overview-stats/icons.tsx` | 98 | `EyeIcon`, `MoneyBagIcon`, `BoxIcon`, `UserGroupIcon` |
| `src/components/dashboard/home/_component/overview-stats/index.tsx` | 67 | `ECommerceOverviewStats` |
| `src/components/dashboard/home/_component/overview-stats/skeleton.tsx` | 25 | `OverviewStatsSkeleton` |
| `src/components/dashboard/home/_component/overview-stats/types.ts` | 23 | `OverviewStatDisplayConfig`, `OverviewStatViewModel` |
| `src/components/dashboard/home/_component/overview-stats/utils.ts` | 28 | `mapOverviewStats` |
| `src/components/dashboard/home/_component/region-labels/data.ts` | 0 | Local helpers/imports/test registration |
| `src/components/dashboard/home/_component/region-labels/index.tsx` | 9 | `RegionLabels` |
| `src/components/dashboard/home/_component/region-labels/map.tsx` | 212 | `RegionLabelsMap` |
| `src/components/dashboard/home/_component/region-labels/types.ts` | 12 | `CountryFeature`, `ImportData` |
| `src/components/dashboard/home/_component/sales-chart/custom-tooltip.tsx` | 31 | `SalesChartTooltip` |
| `src/components/dashboard/home/_component/sales-chart/data.ts` | 20 | `mapSalesChartResponse` |
| `src/components/dashboard/home/_component/sales-chart/header.tsx` | 106 | `HeaderSection` |
| `src/components/dashboard/home/_component/sales-chart/index.tsx` | 98 | `SalesChart` |
| `src/components/dashboard/home/_component/sales-chart/skeleton.tsx` | 80 | `SalesChartStatSkeleton`, `SalesChartSkeleton` |
| `src/components/dashboard/home/_component/sales-chart/types.ts` | 22 | `SalesChartDataPoint`, `SalesChartSummary`, `SalesChartViewModel` |
| `src/components/dashboard/home/_component/sales-chart/utils.ts` | 27 | `formatDelta`, `getSalesChartStats` |
| `src/components/dashboard/home/_component/top-products/index.tsx` | 82 | `TopProducts` |
| `src/components/dashboard/home/_component/top-products/skeleton.tsx` | 38 | `TopProductsSkeleton` |
| `src/components/dashboard/home/_component/top-products/types.ts` | 14 | `TopProductViewModel` |
| `src/components/dashboard/home/_component/top-products/utils.ts` | 22 | `mapTopProductsResponse` |
| `src/components/dashboard/home/_component/traffic-sources/index.tsx` | 62 | `TrafficSources` |
| `src/components/dashboard/home/_component/traffic-sources/skeleton.tsx` | 40 | `TrafficSourcesSkeleton` |
| `src/components/dashboard/home/_component/traffic-sources/types.ts` | 9 | `TrafficSourceViewModel` |
| `src/components/dashboard/home/_component/traffic-sources/utils.ts` | 14 | `mapTrafficSourcesResponse` |
| `src/components/layout/DashboardLayout.tsx` | 96 | `DashboardLayout` |
| `src/components/notifications/notification-settings.tsx` | 194 | `NotificationSettings` |
| `src/components/pwa-install-prompt.tsx` | 186 | `PwaInstallPrompt` |
| `src/components/store/store-provider.tsx` | 85 | `StoreProvider`, `useStore` |
| `src/components/store/store-selector.tsx` | 100 | `StoreSelector`, `SelectedStoreHighlight` |
| `src/components/tailgrids/core/accordion.tsx` | 203 | `AccordionRoot`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` |
| `src/components/tailgrids/core/alert.tsx` | 184 | `AlertStatus`, `AlertProps`, `Alert`, `AlertIndicatorProps`, `AlertIndicator`, `AlertContentProps`, `AlertContent`, `AlertTitleProps`, `AlertTitle`, `AlertDescriptionProps`, `AlertDescription` |
| `src/components/tailgrids/core/avatar.tsx` | 177 | `AvatarSize`, `AvatarStatus`, `AvatarProps`, `Avatar`, `AvatarImageProps`, `AvatarImage`, `AvatarFallbackProps`, `AvatarFallback`, `AvatarBadgeProps`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` |
| `src/components/tailgrids/core/badge.tsx` | 149 | `Badge` |
| `src/components/tailgrids/core/breadcrumbs.tsx` | 64 | `Breadcrumbs` |
| `src/components/tailgrids/core/button-group.tsx` | 45 | `ButtonGroup` |
| `src/components/tailgrids/core/button.tsx` | 177 | `buttonStyles`, `ButtonProps`, `Button` |
| `src/components/tailgrids/core/calendar.tsx` | 376 | `CalendarProps`, `Calendar`, `CalendarHeaderProps`, `CalendarHeader`, `NavButtonProps`, `NavButton`, `YearPickerProps`, `CalendarYearPicker`, `CalendarGridProps`, `CalendarGrid`, `CalendarGridBodyProps`, `CalendarGridBody`, `CalendarHeadingProps`, `CalendarHeading`, `CalendarGridHeaderProps`, `CalendarGridHeader`, `CalendarCell` |
| `src/components/tailgrids/core/card.tsx` | 79 | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` |
| `src/components/tailgrids/core/carousel.tsx` | 290 | Local helpers/imports/test registration |
| `src/components/tailgrids/core/chart.tsx` | 229 | Local helpers/imports/test registration |
| `src/components/tailgrids/core/checkbox.tsx` | 68 | `CheckboxProps`, `Checkbox` |
| `src/components/tailgrids/core/collapsible.tsx` | 82 | `CollapsibleProps`, `Collapsible`, `CollapsibleTriggerProps`, `CollapsibleTrigger`, `CollapsibleContentProps`, `CollapsibleContent`, `CollapsibleGroupProps`, `CollapsibleGroup` |
| `src/components/tailgrids/core/date-field.tsx` | 125 | `DateFieldProps`, `DateField`, `DateInputProps`, `DateInput`, `DateSegmentProps`, `DateSegment` |
| `src/components/tailgrids/core/date-picker.tsx` | 96 | `DatePickerProps`, `DatePicker`, `DatePickerGroup`, `DatePickerTrigger`, `DatePickerPopoverProps`, `DatePickerPopover` |
| `src/components/tailgrids/core/description.tsx` | 17 | `DescriptionProps`, `Description` |
| `src/components/tailgrids/core/dialog.tsx` | 124 | `DialogProps`, `Dialog`, `DialogHeaderProps`, `DialogHeader`, `DialogTitleProps`, `DialogTitle`, `DialogDescriptionProps`, `DialogDescription`, `DialogBodyProps`, `DialogBody`, `DialogFooterProps`, `DialogFooter`, `DialogCloseProps`, `DialogClose` |
| `src/components/tailgrids/core/dropdown.tsx` | 73 | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSection`, `DropdownMenuHeader`, `DropdownMenuSeparator` |
| `src/components/tailgrids/core/field.tsx` | 251 | `FieldSetProps`, `FieldSet`, `FieldLegendProps`, `FieldLegend`, `FieldGroupProps`, `FieldGroup`, `FieldContentProps`, `FieldContent`, `FieldLabelProps`, `FieldLabel`, `FieldTitleProps`, `FieldTitle`, `FieldDescriptionProps`, `FieldDescription`, `FieldErrorProps`, `FieldError`, `FieldSeparatorProps`, `FieldSeparator` |
| `src/components/tailgrids/core/input-group.tsx` | 129 | `InputGroupProps`, `InputGroupInputProps`, `InputGroupAddonProps`, `InputGroupButtonProps`, `InputGroupTextareaProps` |
| `src/components/tailgrids/core/input.tsx` | 25 | `InputProps`, `Input` |
| `src/components/tailgrids/core/label.tsx` | 15 | `LabelProps`, `Label` |
| `src/components/tailgrids/core/number-field.tsx` | 78 | `NumberFieldProps`, `NumberField`, `NumberFieldGroup`, `NumberFieldActionProps`, `NumberFieldAction` |
| `src/components/tailgrids/core/otp-input.tsx` | 196 | `OtpInput` |
| `src/components/tailgrids/core/overlay.tsx` | 32 | `OverlayWrapperProps`, `OverlayWrapper`, `BackdropProps`, `Backdrop` |
| `src/components/tailgrids/core/pagination.tsx` | 201 | `Pagination` |
| `src/components/tailgrids/core/popover.tsx` | 40 | `PopoverProps`, `Popover`, `PopoverArrowProps`, `PopoverArrow` |
| `src/components/tailgrids/core/progress.tsx` | 46 | `Progress` |
| `src/components/tailgrids/core/resizable.tsx` | 43 | Local helpers/imports/test registration |
| `src/components/tailgrids/core/scroll-area.tsx` | 74 | Local helpers/imports/test registration |
| `src/components/tailgrids/core/select.tsx` | 381 | `SelectProps`, `Select` |
| `src/components/tailgrids/core/separator.tsx` | 32 | `SeparatorProps`, `Separator` |
| `src/components/tailgrids/core/sheet.tsx` | 231 | `SheetProps`, `Sheet`, `SheetTriggerProps`, `SheetTrigger`, `SheetOverlayProps`, `SheetOverlay`, `SheetContentProps`, `SheetContent`, `SheetHeaderProps`, `SheetHeader`, `SheetTitleProps`, `SheetTitle`, `SheetDescriptionProps`, `SheetDescription`, `SheetBodyProps`, `SheetBody`, `SheetFooterProps`, `SheetFooter`, `SheetCloseProps`, `SheetClose` |
| `src/components/tailgrids/core/skeleton.tsx` | 11 | `Skeleton` |
| `src/components/tailgrids/core/social-button.tsx` | 17 | `SocialButton` |
| `src/components/tailgrids/core/spinner/default.tsx` | 83 | `DefaultSpinner` |
| `src/components/tailgrids/core/spinner/dotted-round.tsx` | 102 | `DottedRoundSpinner` |
| `src/components/tailgrids/core/spinner/dotted.tsx` | 118 | `DottedSpinner` |
| `src/components/tailgrids/core/spinner/index.tsx` | 53 | `Spinner` |
| `src/components/tailgrids/core/table.tsx` | 62 | `TableRoot`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell` |
| `src/components/tailgrids/core/tabs.tsx` | 261 | `TabRoot`, `TabList`, `TabTrigger`, `TabContent` |
| `src/components/tailgrids/core/text-area.tsx` | 30 | `TextAreaProps`, `TextArea` |
| `src/components/tailgrids/core/text-field.tsx` | 52 | `TextFieldProps`, `TextField` |
| `src/components/tailgrids/core/time-field.tsx` | 59 | `TimeFieldProps`, `TimeField` |
| `src/components/tailgrids/core/toggle.tsx` | 66 | `Toggle` |
| `src/components/tailgrids/core/tooltip.tsx` | 178 | `Tooltip`, `TooltipTrigger`, `TooltipContent` |
| `src/database/globalForPrisma.ts` | 31 | `withPrisma` |
| `src/database/model-access.ts` | 43 | `prismaModelNames`, `isPrismaModelName`, `getPrismaModel`, `findModelRows` |
| `src/lib/admin-auth.ts` | 19 | `getAdminAuthorization` |
| `src/lib/db.ts` | 31 | `getDatabaseConnectionString`, `withDb` |
| `src/lib/notification-types.ts` | 12 | `NOTIFICATION_TYPES`, `NotificationTypeKey`, `isNotificationType` |
| `src/lib/password.mjs` | 17 | `hashPassword`, `verifyPassword` |
| `src/lib/pos-credentials.ts` | 110 | `PosCredentialKeyError`, `listPosCredentials`, `createPosCredential` |
| `src/lib/pos-events.ts` | 119 | `getNotificationTargetPath`, `parsePosEvent` |
| `src/lib/pos-signature.ts` | 40 | `decryptPosSecret`, `verifyPosSignature` |
| `src/lib/push.ts` | 64 | `PushDelivery`, `sendPushDeliveries` |
| `src/lib/reporting/installation.ts` | 10 | `reportingInstallationSql` |
| `src/lib/reporting/legacy-import.ts` | 36 | `readLegacySnapshots` |
| `src/lib/reporting/pos-auth.ts` | 97 | `authenticateReportingPos` |
| `src/lib/reporting/query-key.ts` | 3 | `reportingQueryKey` |
| `src/lib/reporting/read.ts` | 59 | `ReportFilters`, `parseReportFilters`, `resolveReportingScope`, `readOrderReport` |
| `src/lib/reporting/snapshot.ts` | 157 | `tables`, `ReportingTable`, `ReportRow`, `OrderSnapshot`, `ReportingError`, `positiveRevision`, `businessDate`, `parseSnapshot`, `snapshotHash`, `schemaIdentifier` |
| `src/lib/reporting/store-creation.ts` | 55 | `StoreReportingSetupError`, `createStoreWithReporting` |
| `src/lib/reporting/sync.ts` | 178 | `ReportingScope`, `SyncResult`, `syncOrderSnapshot` |
| `src/lib/reporting/transaction-read.ts` | 114 | `TransactionFilters`, `parseTransactionFilters`, `readTransactionReport` |
| `src/lib/reporting/transaction-types.ts` | 31 | `TransactionRow`, `TransactionDetail`, `TransactionReport` |
| `src/lib/store-access.ts` | 93 | `SELECTED_STORE_COOKIE`, `StoreSummary`, `RequestUser`, `normalizeStoreCode`, `getRequestUser`, `getAccessibleStores`, `requireStoreAccess` |
| `src/lib/store-admin-validation.ts` | 89 | `StoreInput`, `StoreUpdateInput`, `isValidTimeZone`, `parseStoreInput`, `parseStoreUpdate`, `parseUserIds` |
| `src/lib/store-admin.ts` | 159 | `listAdminStores`, `createStore`, `updateStore`, `listStoreAccessUsers`, `replaceStoreAccess` |
| `src/lib/user-admin-validation.ts` | 99 | `UserInput`, `UserUpdateInput`, `parseUserInput`, `parseUserUpdate`, `parseStoreCodes`, `parseUserId` |
| `src/lib/user-admin.ts` | 136 | `listAdminUsers`, `createUser`, `updateUser`, `listUserAccessStores`, `replaceUserAccess` |
| `src/services/api/home/data.ts` | 572 | `homeOverviewStatsRawData`, `salesChartMonthlyRawData`, `salesChartYearlyRawData`, `inventoryOverviewRawData`, `topProductsRawData`, `trafficSourcesRawData`, `lastTransactionsRawData` |
| `src/services/api/home/index.ts` | 60 | `getHomeOverviewStats`, `getSalesChartData`, `getInventoryOverviewData`, `getTopProductsData`, `getTrafficSourcesData`, `getLastTransactionsData` |
| `src/services/api/home/types.ts` | 170 | `InventoryOverviewRawResponse`, `OverviewStatKey`, `OverviewStatsMetric`, `HomeOverviewStatsRawResponse`, `SalesDataPoint`, `Granularity`, `SalesChartRawResponse`, `TopProductRawItem`, `TopProductsRawResponse`, `TrafficSourceRawItem`, `TrafficSourcesRawResponse`, `TransactionStatus`, `RawTransactionItem`, `LastTransactionsRawResponse` |
| `src/services/api/notifications.ts` | 43 | `InboxNotification`, `InboxResponse`, `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` |
| `src/types/cloudflare-env.d.ts` | 13 | Local helpers/imports/test registration |
| `src/types/next-auth.d.ts` | 23 | Local helpers/imports/test registration |
| `src/types/store-admin.ts` | 30 | `AdminStore`, `StoreAccessUser`, `PosCredentialSummary`, `IssuedPosCredential` |
| `src/types/user-admin.ts` | 15 | `AdminUser`, `UserAccessStore` |
| `src/utils/cn.ts` | 6 | `cn` |
| `src/utils/delay.ts` | 3 | `delay` |
| `src/utils/format-currency.ts` | 7 | `formatCurrency` |
| `src/utils/format-number.ts` | 16 | `formatNumber` |
| `src/utils/icon.tsx` | 961 | `IconProps`, `Logo`, `LogoText`, `LogoWithText`, `LogoWithTextDark`, `AltArrowUpIcon`, `AltArrowDownIcon`, `MenuDotsIcon`, `ArrowUpIcon`, `ArrowDownIcon`, `PlusIcon`, `MinusIcon`, `AltArrowLeftIcon`, `AltArrowRightIcon`, `BellIcon`, `GoogleIcon`, `FacebookIcon`, `TwitterIcon`, `AppleIcon`, `InstagramIcon`, `YoutubeIcon`, `TeslaIcon`, `AmazonIcon`, `MetaIcon`, `NvdaIcon`, `SpotifyIcon`, `MicrosoftIcon`, `PaypalIcon`, `DropboxIcon`, `NetflixIcon`, `ArrowRightUpIcon` |
| `tests/password.test.mjs` | 18 | Local helpers/imports/test registration |
| `tests/pos-signature.test.mjs` | 24 | Local helpers/imports/test registration |
| `tests/postman-reporting.test.mjs` | 63 | Local helpers/imports/test registration |
| `tests/reporting.test.mjs` | 803 | Local helpers/imports/test registration |
| `tests/store-admin-validation.test.mjs` | 42 | Local helpers/imports/test registration |
| `tests/transaction-reporting.test.mjs` | 103 | Local helpers/imports/test registration |
| `tests/user-admin-validation.test.mjs` | 46 | Local helpers/imports/test registration |
