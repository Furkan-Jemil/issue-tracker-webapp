# Deployment, Monitoring, and Rollback Runbook

This runbook documents a minimal, practical rollout, monitoring, and rollback plan for the Issue Tracker Webapp.

Goals:
- Deploy images built by CI safely to staging and production
- Verify health and functionality after deploy
- Monitor key signals and receive alerts on failure
- Provide clear rollback steps for database and application failures

1) Prerequisites
- CI publishes images to GHCR: `ghcr.io/<org>/issue-tracker-webapp:web:TAG` and `:api:TAG`.
- SSH access or container orchestrator (Kubernetes, Docker host) for deploy targets.
- Stored secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AUTH_SECRET`, blob tokens.
- Backups: scheduled PostgreSQL backups (dump or managed provider snapshots).

2) Environments
- `staging` — run smoke tests and manual QA. Use image tag `staging` or the CI-generated SHA.
- `production` — stable channel; deploy from main/release tags.

3) Deploy strategy (recommended)
- Use a two-step release: push images, deploy to `staging`, run smoke tests, then promote to `production`.
- For production, prefer a rolling or blue/green deployment:
  - Blue/Green: deploy `api` + `web` images to a new target, switch traffic when healthy.
  - Rolling: update service one instance at a time, verifying health between instances.

4) Docker Compose quick deploy (simple hosts)
- Pull published images on target host and restart compose stack:
```bash
docker pull ghcr.io/ORG/issue-tracker-webapp:web:TAG
docker pull ghcr.io/ORG/issue-tracker-webapp:api:TAG
docker compose -f /path/to/docker-compose.yml pull
docker compose -f /path/to/docker-compose.yml up -d
```
- Verify health endpoints (50–120s depending on warmup):
```bash
curl -fS http://localhost:3000/api/health
curl -fS http://localhost:4000/api/health
```

5) CI-driven deploy (recommended)
- Add a GitHub Action job (or other CI) that:
  1. Builds & pushes images (already in `publish-images.yml`).
  2. SSHs to the target host and runs the Compose pull+up commands, or
  3. Applies Kubernetes manifests pointing to images with the new tag.

6) Post-deploy verification
- Automated: run `npm run test:auth-smoke` or Playwright smoke tests against staging/production.
- Manual: verify login, create issue, attachment upload, export flow, admin actions.
- Check logs: `docker compose logs -f api` and `docker compose logs -f web`.

7) Monitoring & Alerts (minimum)
- Uptime/HTTP checks: poll `/api/health` (every 30s) for web and api. Alert on 3 consecutive failures.
- Application logs: forward to a logging service (Papertrail, Logflare, ELK). Alert on repeated 5xx spikes.
- Error tracking: Sentry (or similar) with sampling and alerts for regressions.
- Metrics: basic Prometheus metrics (request rate, error rate, latency) and alert rules:
  - SLO breach: error rate > 1% over 5m
  - Latency breach: p95 > 3s over 5m

8) Rollback procedures

App-only failure (stateless):
- If a deployment causes errors, redeploy previous image tag:
```bash
docker compose pull
docker compose up -d
# or using Kubernetes: kubectl set image ... to previous tag
```
- Run smoke tests to validate.

Database migration failure or data corruption (stateful):
- If a migration causes issues, follow rollback runbook for DB:
  1. Restore DB from latest backup snapshot prior to the migration.
  2. Re-deploy the previous application image compatible with the restored schema.
  3. Notify stakeholders and run data validation checks.

Emergency rollback (fast):
- Stop the new release and start the previous release images.
- If traffic routing is controlled by a proxy/load balancer, switch traffic back to previous pool.

9) Post-incident
- Triage the failure, capture timeline, root cause, and mitigation.
- Produce a short postmortem with follow-up actions and owners.

10) Runbook checklist (pre-deploy)
- Ensure backups exist and are recent.
- CI images are published and checksums recorded.
- Staging smoke tests passed.
- Secrets validated on target environment.

11) Useful commands
- Tail logs: `docker compose logs -f api` and `docker compose logs -f web`.
- Re-deploy a specific tag:
```bash
docker compose pull && docker compose up -d
```
- Run smoke test locally or from CI: `npm run test:auth-smoke`.

12) Contacts & escalation
- Team on-call / Slack channel / PagerDuty policy (configure as appropriate for org).

---

Keep this runbook concise; extend with provider-specific steps (K8s manifests, cloud load balancer commands, managed DB restore steps) as needed.
