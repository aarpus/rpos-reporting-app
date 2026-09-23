This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication and PostgreSQL setup

Authentication uses NextAuth v5 (currently a beta release), email/password credentials,
PostgreSQL user records, and encrypted JWT session cookies lasting eight hours.
Accounts are created by an administrator; there is no public registration endpoint.
The `/auth` page reuses the dashboard's TailGrids components and theme.
Sign-in and logout show a spinner and disable repeat submissions.

1. Copy `.env.example` to `.env.local`. Set `DATABASE_URL` using your PostgreSQL
   credentials and the new database name `reporting_dashboard`. URL-encode any
   special characters in the password. Use your provider's verified TLS settings
   for hosted PostgreSQL connections.
2. Generate `AUTH_SECRET` with
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   and save the output in `.env.local`. Set `AUTH_URL` to the app's URL.
3. Run `npm run db:create` to create the database on an existing PostgreSQL server.
   The configured database role needs permission to create databases. For a hosted
   database already provisioned by your provider, skip this command.
4. Run `npm run prisma:push` to sync the Prisma schema, then
   `npm run prisma:generate` to regenerate the typed client. For future tracked
   schema changes use `npm run prisma:migrate -- --name <change-name>` instead.
5. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (non-empty, maximum 256 characters) in
   `.env.local`, then run `npm run db:create-user`. Remove `ADMIN_PASSWORD` afterward.
   Repeat with different values for additional accounts; existing accounts are never overwritten.
6. Start the app and open `/auth` to sign in.

Passwords are salted and hashed with Node's scrypt. SQL queries are parameterized.
Ten attempts per email are allowed within a 15-minute window, tracked in PostgreSQL.
Expired throttle rows can be periodically removed with
`DELETE FROM auth_login_attempts WHERE window_start < NOW() - INTERVAL '1 day';`.
Dashboard routes are protected by the Next.js proxy and a server layout. Add an
`auth()` check inside any future sensitive server action or API handler as well.
Existing dashboard URLs and layout are unchanged by the `(dashboard)` route group.

Run `npm run test:auth`, `npx tsc --noEmit`, and `npm run build` to validate changes.
With the app running, `node scripts/check-auth.mjs` checks the sign-in page and
route protection. Keep `ADMIN_EMAIL` and `ADMIN_PASSWORD` set temporarily to also
check invalid credentials, successful sign-in, the dashboard session, and logout.
Remove `ADMIN_PASSWORD` after these checks. An actual PostgreSQL connection and
account are required for end-to-end sign-in testing.

## Prisma database access

The schema and migration history live in `prisma/`. Prisma CLI reads the existing
`.env.local` through `prisma.config.ts`. `src/database/globalForPrisma.ts` owns the
single server-side Prisma connection used across hot reloads. For dynamic dashboard
and report sources, use `getPrismaModel` / `findModelRows` from
`src/database/model-access.ts`; this avoids adding a separate access function for
every future model. Validate allowed models and selected fields in each report
service so sensitive columns are never returned to the browser.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

For the production Cloudflare Workers path used by this repository, follow
[CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md). It covers OpenNext,
Neon PostgreSQL, Hyperdrive, secrets, and GitHub Workers Builds.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
