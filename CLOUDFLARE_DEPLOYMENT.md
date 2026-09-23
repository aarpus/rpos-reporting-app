# Cloudflare Workers deployment

This application deploys as a dynamic Next.js application through OpenNext. Do
not configure it as a static Cloudflare Pages project.

## 1. Create the production database

1. Create a Neon PostgreSQL project and copy its **direct**, non-pooled
   connection string. Keep `sslmode=require` in the URL.
2. Temporarily put that URL in local `.env.local` as `DATABASE_URL`.
3. Apply the committed production migration:

   ```powershell
   npm run db:deploy
   ```

4. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a one-time `ADMIN_PASSWORD` in
   `.env.local`, then create the initial account:

   ```powershell
   npm run db:create-user
   ```

5. Immediately remove `ADMIN_PASSWORD` from `.env.local`.

Do not run `db:create` for Neon; Neon creates the database itself. These steps
create a clean production schema and do not copy local data.

## 2. Create the Hyperdrive binding

Authenticate Wrangler, then create Hyperdrive with query caching disabled. Use
the same direct Neon URL from step 1:

```powershell
npx wrangler login
npx wrangler hyperdrive create rpos-reporting-db --connection-string="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" --caching-disabled
```

Copy the returned configuration ID into `wrangler.jsonc`, replacing
`REPLACE_WITH_HYPERDRIVE_ID`. Never put the Neon URL in `wrangler.jsonc`.

Generate the binding declarations after inserting the real ID:

```powershell
npm run cf-typegen
```

`cloudflare-env.d.ts` is generated and intentionally ignored. The checked-in
`src/types/cloudflare-env.d.ts` keeps application source type-safe before the
account-specific binding is generated.

## 3. Preview in the Workers runtime

Copy `.dev.vars.example` to `.dev.vars` and replace all placeholder values.
Both files are local-only; do not commit `.dev.vars`.
Set both database variables to the same direct URL; the long
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` name is consumed by
Wrangler's local Hyperdrive emulator. During ordinary `next dev` and CI builds,
`next.config.ts` maps `DATABASE_URL` to it automatically when it is absent.

```powershell
npm run test:auth
npx tsc --noEmit
npm run build
npm run preview
```

Verify `/auth`, invalid credentials, valid login, refresh, logout, static
assets, charts, and report routes. The dashboard route group performs the auth
check. Any future sensitive route handler must call `auth()` itself.

## 4. Connect GitHub to Workers Builds

1. In Cloudflare, open **Workers & Pages**, import the GitHub repository
   `aarpus/rpos-reporting-app`, and select branch `main`.
2. Use the repository root as the root directory.
3. Leave the separate build command empty and set the deploy command to
   `npm run deploy`; this command performs the OpenNext build before deploying.
4. Add build variable `NODE_VERSION=24`.
5. Add the direct Neon `DATABASE_URL` as a **build secret**. It is required by
   Prisma's `postinstall` generation and must not be committed.
6. Create the Worker. Its expected name is `rpos-reporting-app`.

## 5. Configure runtime secrets

In the created Worker, open **Settings > Variables and Secrets** and add:

- Secret `AUTH_SECRET`: generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- Variable `AUTH_URL`:
  `https://rpos-reporting-app.<your-workers-subdomain>.workers.dev`.
- Variable `AUTH_TRUST_HOST`: `true`.

Confirm that the `HYPERDRIVE` binding is present under the Worker's bindings.
Do not add `DATABASE_URL` as a runtime variable; production runtime database
traffic must use Hyperdrive.

Trigger a new deployment from `main` after setting the variables. The deploy
script uses `--keep-vars` so dashboard-managed runtime values remain intact.

## 6. Production smoke test

1. Open the `workers.dev` URL while signed out and confirm the dashboard sends
   you to `/auth`.
2. Confirm invalid credentials show the generic error.
3. Sign in with the Neon admin, refresh, and sign out.
4. Confirm repeated failures are recorded in `auth_login_attempts` and block the
   eleventh attempt in a 15-minute window.
5. Check **Workers > Logs** for database/TLS exceptions and error `1102`.

The Workers Free plan has a small per-request CPU allowance. If authentication
or SSR repeatedly returns error `1102`, upgrade to Workers Paid; do not weaken
the password hashing parameters.
