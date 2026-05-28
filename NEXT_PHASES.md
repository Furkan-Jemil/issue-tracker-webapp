# Next Phases Plan

This document turns the remaining migration work into a concrete sequence with clear deliverables and exit criteria.

## Phase 4: Auth Migration Completion

Goal: prove the Hono server can fully own auth flows end to end.

Work:
- Verify `POST /api/auth/signin`, session lookup, signout, and callback flows against the Hono server.
- Confirm Better Auth cookies are set and read correctly through the Hono adapter.
- Validate `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and trusted origins for the new server runtime.
- Remove any debug-only auth routes once the standard flow works.

Done when:
- A seeded user can sign in and receive a valid session.
- Session-aware requests resolve the current user consistently.
- Signout clears the session as expected.

## Phase 7: Middleware Hardening

Goal: make the shared server middleware safe enough for normal development and deployment.

Work:
- Keep the current logging, CORS, session, and rate-limit middleware in one place.
- Verify middleware works for both JSON and form-based requests.
- Check that auth/session middleware does not duplicate work or break cookie propagation.
- Decide whether the current in-memory rate limiter is acceptable for local/dev only.

Done when:
- Requests through the Hono server behave the same way as the old API surface.
- Middleware errors are visible and consistent.
- The server starts cleanly with the current environment variables.

## Phase 9: Tests and End-to-End Verification

Goal: lock in the migration with repeatable checks.

Work:
- Add route-level tests for auth, notifications, admin users, export, and health.
- Add DB-backed integration checks for the Prisma path.
- Keep one authenticated browser flow covering login, user listing, notification updates, and export.

Done when:
- The test suite exercises the migrated Hono endpoints.
- The auth + DB path is validated from the CLI and in-browser.

## Phase 10: Containerization and Deployment

Goal: make the Hono server deployable in the same environments as the app.

Work:
- Update Docker-related commands and entrypoints so the Hono server can run directly.
- Confirm the container has the right runtime variables for Prisma and Better Auth.
- Document any port or process-manager changes.

Done when:
- The Hono server can start in the target container setup.
- Database connectivity works in the containerized environment.

## Phase 11: Rollout, Monitoring, and Rollback

Goal: reduce deployment risk.

Work:
- Define the rollout order for switching traffic to the Hono backend.
- Add the checks that prove the new server is healthy before full cutover.
- Write the rollback path for moving back if auth or DB access fails.

Done when:
- The migration has a clear cutover and rollback process.

## Phase 12: Docs and Developer Run Instructions

Goal: make the new setup reproducible for anyone on the team.

Work:
- Update README setup steps and local run commands.
- Document the Hono server entrypoint and the DB check script.
- Capture the final migration status and any runtime caveats.

Done when:
- A new contributor can run the backend without guessing at the setup.

## Recommended Order

1. Finish auth.
2. Harden middleware.
3. Add tests and E2E coverage.
4. Containerize and document deployment.
5. Write rollout and rollback instructions.
6. Finalize docs.
