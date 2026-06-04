# Phase 7: Middleware Hardening

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