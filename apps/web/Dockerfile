FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy ALL workspace package.json files. npm ci validates every workspace listed
# in package-lock.json (v3) — incl. apps/mobile — so its manifest MUST be present
# or `npm ci` fails with "package.json and package-lock.json are in sync".
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma/schema.prisma packages/database/prisma/schema.prisma
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --ignore-scripts --legacy-peer-deps --no-audit --no-fund

# Copy the full monorepo (excludes node_modules/.next/.git via .dockerignore)
COPY . .

# Generate Prisma client
RUN node_modules/.bin/prisma generate --schema=packages/database/prisma/schema.prisma

# Ensure the entrypoint is executable (it's committed as 0644 in git, and the
# exec-form ENTRYPOINT below would otherwise fail with "permission denied").
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
