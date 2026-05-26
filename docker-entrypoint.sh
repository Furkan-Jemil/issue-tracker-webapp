#!/bin/sh
set -eu

if [ "${SKIP_DB_PUSH:-false}" != "true" ]; then
	npx prisma db push
fi

if [ "${WAIT_FOR_DB:-true}" = "true" ]; then
	if [ -f ./scripts/wait-for-db.js ]; then
		echo "Waiting for database to become available..."
		node ./scripts/wait-for-db.js
	else
		echo "No wait-for-db script found; skipping wait."
	fi
fi

if [ "$#" -gt 0 ]; then
	exec "$@"
fi

exec npm run start