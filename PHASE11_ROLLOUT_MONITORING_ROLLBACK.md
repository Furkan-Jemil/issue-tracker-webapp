# Phase 11: Rollout, Monitoring, and Rollback

Goal: reduce deployment risk.

Work:
- Define the rollout order for switching traffic to the Hono backend.
- Add the checks that prove the new server is healthy before full cutover.
- Write the rollback path for moving back if auth or DB access fails.

Done when:
- The migration has a clear cutover and rollback process.