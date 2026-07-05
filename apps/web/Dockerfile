FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy all workspace package.json files so npm ci can resolve workspaces
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma/schema.prisma packages/database/prisma/schema.prisma
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --ignore-scripts --legacy-peer-deps

# Copy the full monorepo (excludes node_modules/.next/.git via .dockerignore)
COPY . .

# Generate Prisma client
RUN node_modules/.bin/prisma generate --schema=packages/database/prisma/schema.prisma

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
