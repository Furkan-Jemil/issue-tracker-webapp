FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN /bin/sh -lc '\
	npm config set fetch-retries 5 && \
	npm config set fetch-retry-mintimeout 20000 && \
	npm config set fetch-retry-maxtimeout 120000 && \
	npm config set fetch-timeout 120000 && \
	i=1; \
	while [ "${i}" -le 5 ]; do \
		npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --legacy-peer-deps && break || true; \
		echo "npm ci attempt ${i} failed, retrying..."; \
		i=$((i+1)); \
		sleep 10; \
	done; \
	[ "${i}" -le 5 ]'

FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV DATABASE_URL="postgresql://127.0.0.1:5432/placeholder"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo 'DATABASE_URL="postgresql://127.0.0.1:5432/placeholder"' > .env
RUN mkdir -p public
RUN /bin/sh -lc '\
	i=1; \
	while [ "${i}" -le 5 ]; do \
		npx prisma generate --schema=packages/database/prisma/schema.prisma && break || true; \
		echo "prisma generate attempt ${i} failed, retrying..."; \
		i=$((i+1)); \
		sleep 10; \
	done; \
	[ "${i}" -le 5 ]'
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/proxy.ts ./proxy.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
RUN mkdir -p /app/public/uploads && chmod 755 /app/public/uploads

ENTRYPOINT ["./docker-entrypoint.sh"]