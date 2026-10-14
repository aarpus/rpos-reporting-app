# Application flows

## Account sign-in and store selection

1. `/auth` sanitizes callback URLs to local paths, excluding protocol-relative paths, backslashes, `/auth`, and `/api/`. Existing sessions redirect to the chosen local target.
2. `sign-in-form.tsx` calls `signIn("credentials")`, prevents repeated submissions, shows generic failures, and navigates on success. Remember me is displayed but not consumed.
3. `src/auth.ts` lowercases email, validates basic format/length, atomically increments the email throttle, loads an active user, and checks scrypt (including a dummy hash for missing users). More than ten attempts in the 15-minute window denies authorization; success deletes that email's attempt record.
4. Auth.js places identity/role into an eight-hour JWT session. The dashboard layout checks that session and resolves active accessible stores. The current layout uses the session role; APIs use a fresh active database user check.
5. The selected store cookie is accepted only if it is accessible; otherwise the first accessible store is selected. Ordinary users with no active assignments see the no-access screen. Administrators can still open admin pages without stores.
6. Switching stores posts the desired code, checks access server-side, sets the HttpOnly cookie, invalidates query data and refreshes the layout.

Sources: `src/app/auth/`, `src/auth.ts`, `src/lib/store-access.ts`, `src/app/(dashboard)/layout.tsx`, `src/components/store/store-provider.tsx`.

## Administration

Admin pages call `getRequestUser` and enforce ADMIN, loading initial lists server-side. Client management forms use admin APIs and display failures. Creating a store normalizes code, validates name/timezone, checks the provisioning function/EXECUTE privilege, inserts the store, provisions its schema, and commits atomically. Editing does not rename store codes. Creating a user hashes the password and always sets USER. Editing/resetting passwords targets USER accounts only. Access PUT endpoints replace the full assignment set, not append it; empty arrays revoke all relevant assignments. Both orientations of assignment editing are supported.

Sources: `src/lib/store-admin.ts`, `src/lib/user-admin.ts`, validators and `reporting/store-creation.ts`.

## POS orders and live report reads

1. Provision each store and a POS credential; securely configure its shared secret outside this repository.
2. POS sends one order envelope with monotonically increasing revision and complete item/payment/card arrays. Sign the exact serialized body with HMAC and current epoch seconds.
3. API verifies size, UTF-8, timestamp, active credential/store, registered schema/version and signature, then validates every permitted field and relationship.
4. `syncOrderSnapshot` rechecks active scope, locks request and order identities, compares receipt/hash and revision, applies accepted content and reconciles deleted children, and records the result transactionally.
5. `/report/orders` fetches inclusive business-date aggregates and pages of orders. Viewing detail adds `order_code` to the same request; aggregate totals/list still cover the date range.
6. Transaction report waits until filters are applied, queries by store-local `created_at` day boundaries, and aggregates items/payments once per order. Receipt route `[id]` sends the order code directly and can retrieve older orders outside current list filters.

Sources: `src/lib/reporting/{pos-auth,snapshot,sync,read,transaction-read}.ts`, `src/app/(dashboard)/report/orders/order-reporting.tsx`, transaction detail component.

## Notifications and PWA

1. User enables a notification type for a store in settings; defaults are false. Device push permission/subscription is separate.
2. POS submits a signed event to `/api/pos/notification-events`. The service generates display text and a target path from validated event data.
3. Unique `(store_code,event_id)` prevents repeat fanout. Active opted-in users are eligible only if ADMIN or still assigned to the store.
4. Inbox rows and subscription delivery data are created in one transaction. Old notification records are cleaned up during ingestion. The transaction commits before push.
5. Web Push sends short-lived messages. Dead endpoints (404/410) are deleted; other failures increment counters. There is no automatic redelivery of failed push.
6. `public/sw.js` displays notifications, informs open windows, optionally badges the app, and opens `/notifications?storeCode=...&notificationId=...` on click.
7. Notifications page validates that the requested store is available, switches scope, marks the user's notification read, and navigates to the server-generated target. Shift/day targets currently lead to fixture reports; transaction IDs must match synced order codes for live receipts.
8. Logout attempts to remove the device subscription before Auth.js signout. See the conditional failure risk in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

There is no cron configuration, queue consumer, continuous sync daemon, offline data cache, or POS sender implementation in this repository. Imports and provisioning are manually invoked CLI operations.
