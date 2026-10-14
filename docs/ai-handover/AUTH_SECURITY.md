# Authentication and security

## Implemented controls

Credentials authentication is defined in `src/auth.ts`; handlers are exported through `src/app/api/auth/[...nextauth]/route.ts`. Auth.js manages JWT cookies/session protocol, and app code sets an eight-hour session age. Roles are ADMIN and USER. There is no public signup, OAuth provider, MFA, reset link, or database session model. `src/types/next-auth.d.ts` extends identity and role types.

`src/lib/password.mjs` uses random 16-byte salts, Node scrypt to derive 64 bytes, and timingSafeEqual for verification. Malformed hashes fail. Database throttling is atomic per normalized email across instances: ten attempts per 15-minute window, cleared after successful authentication. It is not an IP-based/global throttle.

`getRequestUser` rechecks active identity/role in SQL for sensitive APIs and admin pages. `requireStoreAccess` enforces active store and USER assignment; ADMIN bypasses assignment only. Reporting scope resolution rechecks active database user and accesses registered schemas in the same read transaction. No database RLS policy is defined; the backend database role can reach multiple store schemas.

Store selection cookies are HttpOnly, SameSite=Lax, Secure in production, path `/`, and one-year lifetime. Auth callback URLs are restricted to local paths. SQL values are bound parameters; dynamic reporting schemas pass a strict regex and are quoted. Validators reject server columns in POS payloads. Reporting endpoints emit private/no-store headers and the service worker caches no application data.

POS requests use four signed headers, a five-minute clock window, HMAC-SHA256 over exact body text, and active per-store credentials. Shared secrets are AES-GCM encrypted at rest with a base64-encoded 32-byte master key from the environment. Credential creation uses 32 random secret bytes and 12 random IV bytes. Reporting uses revision/receipt deduplication; notification deduplication is `(store,eventId)`. Master-key rotation requires planning re-encryption; it is not handled by the deactivate CLI.

## Boundaries and limitations

- Dashboard layout checks session identity and trusts the embedded role when enumerating stores; it does not re-read active user status. APIs enforce fresher permission checks. Role/deactivation may therefore leave stale layout/navigation until session renewal.
- A password reset does not explicitly revoke other JWT sessions. There is no application session-version mechanism.
- Auth.js handles its own authentication protocol protections. Custom mutating JSON APIs contain no explicit origin/CSRF-token verification; assess cookie behavior and deployment trust before making security claims.
- `AUTH_TRUST_HOST` is deployment trust configuration. Keep it aligned with a trusted proxy/host setup.
- CSP in `next.config.ts` is limited to `/sw.js`; no application-wide CSP or security-header policy is configured there.
- Push subscription endpoint URLs and key strings receive limited validation, and outbound delivery uses those URLs. Potential SSRF/abuse needs a dedicated review; no exploit was tested.
- `model-access.ts` has no field allowlist of its own; any future caller exposing dynamic Prisma rows must add model/field authorization first.
- `.env.example` contains populated secret-like values. No values were copied into this handover; do not reuse them. Actual deployment use is unknown. Treat their remediation/rotation as a separate approved security change.

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for confirmed source mismatches and conditional risks. This documentation is not a penetration test or a verification of live TLS, Cloudflare account controls, or production secrets.
