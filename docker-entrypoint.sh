#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
	echo "ERROR: DATABASE_URL is not set."
	echo "Make sure a PostgreSQL plugin is linked to this service in Railway."
	exit 1
fi

echo "DATABASE_URL is set (host:port: $(echo "$DATABASE_URL" | sed 's|.*@||;s|/.*||'))"

if echo "$DATABASE_URL" | grep -qE '(localhost|127\.0\.0\.1)'; then
	echo "WARNING: DATABASE_URL points to localhost — this won't work in Railway."
	echo "Ensure your Railway PostgreSQL plugin is linked to this service."
fi

if [ "${SKIP_DB_PUSH:-false}" != "true" ]; then
	echo "Running prisma db push..."
	npx prisma db push 2>&1 || echo "prisma db push failed (non-fatal, continuing)"
fi

if [ "$#" -gt 0 ]; then
	exec "$@"
fi

# This service runs the standalone Hono API server (tsx server/index.ts),
# NOT the Next.js web app. The mobile app depends on Hono-only routes
# (/api/issues-mobile, /api/users, /api/audit-log, /api/dashboard) and the
# Hono Bearer-token auth handler. Hono binds $PORT on 0.0.0.0 (Railway-ready).
# To serve the Next.js web app instead, set the Railway start command to
# `npm run start` (it overrides via the "$@" passthrough above).
exec npm run server:start
