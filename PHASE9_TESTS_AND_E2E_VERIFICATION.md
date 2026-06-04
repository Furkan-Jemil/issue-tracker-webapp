# Phase 9: Tests and End-to-End Verification

Goal: lock in the migration with repeatable checks.

Work:
- Add route-level tests for auth, notifications, admin users, export, and health.
- Add DB-backed integration checks for the Prisma path.
- Keep one authenticated browser flow covering login, user listing, notification updates, and export.

Done when:
- The test suite exercises the migrated Hono endpoints.
- The auth + DB path is validated from the CLI and in-browser.