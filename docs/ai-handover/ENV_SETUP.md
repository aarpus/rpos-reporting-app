# Environment, commands and deployment

## Prerequisites and compatibility caveat

Use Node **24.x** (`package.json` engines), npm and PostgreSQL for application data. Node 24 is also needed for direct TypeScript imports in `.mjs` tests/scripts. The repository contains a package-lock; use `npm ci` for reproducibility. `postinstall` generates Prisma and its config reads DATABASE_URL. No installation or migration was run during this handover.

**Read K1 in [KNOWN_ISSUES.md](KNOWN_ISSUES.md) before database setup.** The current Prisma schema has integer IDs; the migration chain retains older UUID/natural keys. Current services depend on integer auto-generated IDs. `db:deploy` exists but cannot be described as a compatible fresh production bootstrap. Existing README/hosting steps do not resolve this mismatch.

## Local setup on a new disposable development database

1. Create `.env.local` privately. Read variable names from examples, but generate fresh secrets; `.env.example` currently contains populated secret-like values. Do not commit `.env.local` or `.dev.vars`.
2. Set DATABASE_URL to your chosen PostgreSQL database, AUTH_URL to the local app origin, and fresh AUTH_SECRET. Set POS/VAPID values when testing those modules.
3. Run `npm ci`. Prisma generation may require DATABASE_URL even though generation is not a database migration.
4. For an explicitly disposable new database, the repository's schema-push path is `npm run prisma:push` (push current metadata, seed notification types, install reporting functions). It changes schema; use only with explicit approval and the intended database. Do not add `--accept-data-loss` to bypass drift. `npm run db:create` is optional for a role/server that allows CREATE DATABASE; hosted providers may already create it.
5. `npm run prisma:generate` can regenerate the client. Set one-time ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD, run `npm run db:create-user`, then remove ADMIN_PASSWORD. CLI creates ADMIN only; use admin UI/API for USER accounts.
6. Create stores through `/admin/stores`, which provisions reporting atomically. For existing stores, `npm run reporting:stores -- provision STORE_CODE` or `provision-all` provisions mappings. Use the intended database and approved role privileges.
7. `npm run dev`; open `/auth` at your local AUTH_URL (ordinary Next dev default is port 3000). Live reports require synchronized store data, not fixture pages.

Do not use this disposable schema-push path as a production migration strategy. The legacy `db:migrate` command runs only `database/001-auth.sql`, which creates the older UUID auth tables and no current store/reporting subsystem.

## Environment inventory (names only)

| Variable/binding | Consumer and purpose |
| --- | --- |
| DATABASE_URL | Prisma CLI, database/admin/reporting scripts, fallback runtime pg connection; secret |
| HYPERDRIVE | Cloudflare binding preferred by `src/lib/db.ts` for deployed runtime |
| CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE | Local emulator connection; mapped from DATABASE_URL by next.config and Cloudflare script when absent; secret |
| AUTH_SECRET | Auth.js session cryptography; generate a random secret |
| AUTH_URL | Auth.js application origin; also smoke script base URL |
| AUTH_TRUST_HOST | Auth.js host trust setting; only appropriate with trusted host/proxy setup |
| ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD | One-time CLI account creation; email also bootstrap-admin, smoke checks; remove password after use |
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | Browser push applicationServerKey, built into client bundle; also backend VAPID setup |
| VAPID_PRIVATE_KEY | Backend push signing secret |
| VAPID_SUBJECT | Backend VAPID contact URI |
| POS_CREDENTIAL_ENCRYPTION_KEY | AES-GCM master key, base64 decoding to exactly 32 bytes |
| NODE_VERSION | Workers Builds setup guide specifies 24 |
| NEXTJS_ENV | `.dev.vars.example` sets development for preview; no direct application source read |
| NODE_ENV | Framework-controlled dev/production; selects build tsconfig and Secure selection cookie |

Generate random base64 secrets using `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Generate VAPID pair with `npm run push:generate-vapid`; save output securely, not in docs. POS credential create prints the one-time shared secret; do not paste it into logs/chat/docs.

## Exact available command reference

| Command | Meaning / side effects |
| --- | --- |
| `npm run dev` / `npm run build` / `npm run start` | Next dev / production build / local Node server |
| `npm run lint` | ESLint; baseline lint findings documented in status |
| `npx tsc --noEmit` | Default dev type scope; currently malformed generated dev types |
| `npx tsc -p tsconfig.build.json --noEmit --incremental false` | Production type scope excluding `.next/dev`, avoids tsbuildinfo writes |
| `npm run test:auth` | All Node test files, including reporting/PGlite |
| `npm run test:reporting` | Reporting + transaction-reporting test files |
| `node scripts/check-auth.mjs` | Live HTTP smoke script; currently stale assertions, needs app/account |
| `npm run prisma:generate` / `npm run prisma:studio` | Regenerate ignored client / database browser |
| `npm run prisma:push` | Metadata schema sync + notification seed + function install; schema mutation |
| `npm run prisma:migrate -- --name NAME` | Prisma migrate dev; creates/applies migrations, requires approved schema task |
| `npm run db:deploy` | Applies tracked migrations; ID drift caveat above |
| `npm run db:create` / `npm run db:migrate` | CREATE DATABASE / legacy auth-only SQL |
| `npm run db:seed-notification-types` | Upserts four supported notification type records |
| `npm run db:create-user` / `npm run db:bootstrap-admin` | Create ADMIN / promote configured active account |
| `npm run reporting:install` | Idempotently installs base provisioning function and latest naming migration, under advisory lock; requires current metadata/legacy compatibility fields |
| `npm run reporting:stores -- list` | Read-only store/mapping inventory |
| `npm run reporting:stores -- provision CODE` | Provision one existing store |
| `npm run reporting:stores -- provision-all` / `upgrade` | Same loop over all stores; not a generic version migration engine |
| `npm run reporting:import-public -- CODE` | Read consistent legacy public source then sync revision-1 snapshots; source untouched, target changes |
| `npm run pos:credential -- create CODE` | Encrypt/store a new POS credential; prints secret once |
| `npm run pos:credential -- deactivate CODE KEY_ID` | Deactivates that credential, records rotated timestamp |
| `npm run push:generate-vapid` | Generates/prints a key pair |
| `npm run cf-typegen` | Generates ignored root binding declarations |
| `npm run preview` | OpenNext build followed by Workers local preview |
| `npm run deploy` | OpenNext build and deploy with `--keep-vars`; publishes externally |

`prisma/repair-auto-increment-ids.sql` drops foreign keys to facilitate a historical db-push repair; it neither converts IDs nor recreates constraints itself. Do not run it as an automatic setup step.

## Cloudflare deployment configuration

`open-next.config.ts` uses default Cloudflare config. `scripts/cloudflare.mjs` loads Next env, maps emulator URL, and spawns OpenNext CLI with inherited output. Wrangler main/assets point into `.open-next`, with `nodejs_compat`, HYPERDRIVE and observability; no cron/queue bindings. `next.config.ts` externalizes pg-cloudflare for its workerd export, initializes local Cloudflare context, sets sw.js MIME/no-cache/CSP headers, and uses `tsconfig.build.json` in production.

`CLOUDFLARE_DEPLOYMENT.md` describes Neon direct PostgreSQL, Hyperdrive caching disabled, GitHub Workers Builds on main, Node 24, DATABASE_URL as a build secret, and runtime Auth/POS/VAPID settings. Confirm actual account, grants, URLs and binding IDs independently. Build-time NEXT_PUBLIC values must match backend VAPID pair. Configured HYPERDRIVE is preferred at runtime; absent binding falls back to DATABASE_URL in code, even though the guide recommends avoiding a production runtime URL.

Resolve migration drift first, then use reviewed deployment instructions. Ensure the provisioning invoker has schema DDL privileges and EXECUTE if owner/backend roles differ (the function revokes PUBLIC EXECUTE). No live database/deployment validation, CI execution or secret rotation occurred in this documentation task.
