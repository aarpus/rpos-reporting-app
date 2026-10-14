# Dependencies and integrations

Declared ranges come from `package.json`; locked versions below come from `package-lock.json`. Lockfile controls reproducible installation; a caret range is not an exact installed version. Node engine is 24.x, while @types/node remains on the declared 20 range.

## Major dependency roles

| Dependency family | Use in source |
| --- | --- |
| next, react, react-dom | App Router server/client rendering and route handlers |
| next-auth | Credentials provider, JWT sessions and client signIn/signOut |
| pg | Parameterized SQL, request-local Clients; CLI Pools |
| prisma, @prisma/client, @prisma/adapter-pg | Public model generation/config, PrismaPg adapter; not per-store dynamic SQL schemas |
| @opennextjs/cloudflare, wrangler | Next-to-Workers packaging, local binding context, preview/deploy |
| @tanstack/react-query | Store/filter caches, notifications polling, invalidation |
| tailwindcss, @tailwindcss/postcss, forms, scrollbar | Utility styling and semantic theme configuration |
| react-aria-components, @base-ui/react, @floating-ui/react | Accessible shared control wrappers and positioning |
| @internationalized/date | CalendarDate, date presets and store-local date defaults |
| recharts | Dashboard/chart visualization; fixture pages also use it |
| @tailgrids/icons, react-icons | Shared UI/report icons |
| class-variance-authority, clsx, tailwind-merge | Variants and class composition |
| next-themes, sonner | Theme switching and toast feedback |
| web-push | VAPID push sends and key generation |
| @electric-sql/pglite | Disposable embedded database for SQL integration tests |
| leaflet, react-leaflet | Older region-map template component |
| cmdk, embla-carousel-react, react-resizable-panels | Command input, carousel, resizable UI wrappers |
| server-only | Guards database/credential modules from client import |
| typescript, eslint, eslint-config-next, @types packages | Build/type/lint tooling and declaration support |

`@next/env` is imported by scripts/config through Next's installed dependency rather than declared directly. `pg-cloudflare` is explicitly externalized in next.config and arrives through the pg dependency tree. Native Node crypto powers scrypt/hashes/CLI encryption; Web Crypto powers runtime POS HMAC/AES-GCM.

## External systems

Cloudflare Workers and Hyperdrive are configured hosting/database transport. Neon is the provider named in deployment docs; runtime is generic PostgreSQL. Browser vendor Push services deliver VAPID messages; endpoints come from browser subscriptions. External POS installations supply signed events/snapshots; C# examples in existing docs do not constitute a local POS service. Inter is imported through next/font/google, so production build may need font-fetch network access. No Stripe/payment processing, email sender, analytics backend, cron service, or external POS SDK integration is implemented.

Known compatibility boundaries: NextAuth remains beta; installed Next docs must be read before API changes; Prisma 7 supplies URL via config and a driver adapter; Workers uses nodejs_compat and OpenNext rather than a static export. Do not upgrade packages as part of documentation or an unrelated feature task.

## Declared and locked versions

| Package | Group | Declared | Locked |
| --- | --- | --- | --- |
| `@base-ui/react` | dependencies | `^1.8.0` | `1.8.0` |
| `@floating-ui/react` | dependencies | `^0.27.20` | `0.27.20` |
| `@internationalized/date` | dependencies | `^3.12.4` | `3.12.4` |
| `@opennextjs/cloudflare` | dependencies | `^1.20.6` | `1.20.6` |
| `@prisma/adapter-pg` | dependencies | `^7.10.0` | `7.10.0` |
| `@prisma/client` | dependencies | `^7.10.0` | `7.10.0` |
| `@tailgrids/icons` | dependencies | `^2.0.1` | `2.0.1` |
| `@tanstack/react-query` | dependencies | `^5.102.8` | `5.102.8` |
| `class-variance-authority` | dependencies | `^0.7.1` | `0.7.1` |
| `clsx` | dependencies | `^2.1.1` | `2.1.1` |
| `cmdk` | dependencies | `^1.1.1` | `1.1.1` |
| `embla-carousel-react` | dependencies | `^8.6.0` | `8.6.0` |
| `leaflet` | dependencies | `^1.9.4` | `1.9.4` |
| `next` | dependencies | `16.3.4` | `16.3.4` |
| `next-auth` | dependencies | `^5.0.0-beta.32` | `5.0.0-beta.32` |
| `next-themes` | dependencies | `^0.4.6` | `0.4.6` |
| `pg` | dependencies | `^8.23.0` | `8.23.0` |
| `react` | dependencies | `19.2.8` | `19.2.8` |
| `react-aria-components` | dependencies | `^1.21.1` | `1.21.1` |
| `react-dom` | dependencies | `19.2.8` | `19.2.8` |
| `react-icons` | dependencies | `^5.7.0` | `5.7.0` |
| `react-leaflet` | dependencies | `^5.0.0` | `5.0.0` |
| `react-resizable-panels` | dependencies | `^4.12.4` | `4.12.4` |
| `recharts` | dependencies | `^3.10.1` | `3.10.1` |
| `server-only` | dependencies | `^0.0.1` | `0.0.1` |
| `sonner` | dependencies | `^2.0.8` | `2.0.8` |
| `tailwind-merge` | dependencies | `^3.6.0` | `3.6.0` |
| `tailwind-scrollbar` | dependencies | `^4.0.2` | `4.0.2` |
| `web-push` | dependencies | `^3.6.7` | `3.6.7` |
| `@electric-sql/pglite` | devDependencies | `^0.4.3` | `0.4.3` |
| `@tailwindcss/forms` | devDependencies | `^0.5.11` | `0.5.11` |
| `@tailwindcss/postcss` | devDependencies | `^4.3.3` | `4.3.3` |
| `@types/leaflet` | devDependencies | `^1.9.22` | `1.9.22` |
| `@types/node` | devDependencies | `^20` | `20.19.43` |
| `@types/pg` | devDependencies | `^8.23.1` | `8.23.1` |
| `@types/react` | devDependencies | `^19` | `19.3.0` |
| `@types/react-dom` | devDependencies | `^19` | `19.3.0` |
| `@types/web-push` | devDependencies | `^3.6.4` | `3.6.4` |
| `eslint` | devDependencies | `^9` | `9.39.5` |
| `eslint-config-next` | devDependencies | `16.3.4` | `16.3.4` |
| `prisma` | devDependencies | `^7.10.0` | `7.10.0` |
| `tailwindcss` | devDependencies | `^4` | `4.3.3` |
| `typescript` | devDependencies | `^5` | `5.9.3` |
| `wrangler` | devDependencies | `^4.136.3` | `4.136.3` |
