# Phase 4: Auth Migration Completion

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