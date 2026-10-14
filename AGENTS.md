<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Permanent project development instructions

1. Read `docs/ai-handover/CURSOR_HANDOVER.md` before major development tasks, then the related architecture, API, database, status and issue documents.
2. Understand the existing architecture and inspect actual related source before changing code. Documentation is a dated working-tree snapshot.
3. Follow established conventions and reuse existing components, services, utilities and patterns.
4. Do not introduce unnecessary dependencies.
5. Do not change existing API contracts without explicit user approval.
6. Do not modify database schemas or migrations without explicit user approval. Review the documented integer-ID/UUID-migration drift before any database setup or repair.
7. Preserve authentication, authorization, active-user checks and store isolation. Never use client-selected schemas or cookies as permission grants.
8. Never hardcode secrets or environment-specific credentials; generate fresh secrets instead of copying populated example values.
9. Make minimal, focused, maintainable changes. Check related modules and dependencies before editing; preserve existing uncommitted user work.
10. Validate changes using available lint, TypeScript, tests and appropriate build commands documented in `ENV_SETUP.md`. Report baseline failures separately.
11. Do not claim tests or checks passed unless actually executed; explain material verification limits.
12. Explain important architectural changes and their effect on data flow, contracts and permissions.
13. Never delete existing functionality without permission. Do not perform unrelated refactoring.
14. Update relevant documentation when implementation changes, including the affected `docs/ai-handover/` files and concise Cursor rules where needed.
15. Clearly identify assumptions, missing information and unresolved questions.
16. Preserve reporting snapshot completeness, revision/idempotency rules, atomic writes, registered-schema lookup, and exact decimal API values. Do not count card attempts as payment revenue.
