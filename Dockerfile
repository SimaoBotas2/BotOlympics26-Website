# Stage 1: build the app
FROM node:18-alpine AS builder
LABEL stage=builder
WORKDIR /app
# copy package manifest first for caching
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent
COPY . .
# fail early if translations shapes mismatch; prevents creating an image that would serve an inconsistent site
RUN npm run check:i18n && npm run build

# Stage 2: run a small Node static server (no nginx / reverse proxy)
FROM node:18-alpine AS runner
LABEL maintainer="you@example.com"
ARG APP_PORT=8080
ENV APP_PORT=${APP_PORT}
WORKDIR /app

# copy built static files
COPY --from=builder /app/dist /app/dist

# copy the small server file
COPY --from=builder /app/server.js /app/server.js

# copy default runtime config (overridden by docker-compose volume if mounted)
COPY --from=builder /app/config /app/config
# also copy config into the built `dist` so the runtime server can read preloaded registrations
COPY --from=builder /app/config /app/dist/config
# copy source locales into dist so server can inspect locale JSON at runtime (requires rebuild to change)
COPY --from=builder /app/src/locales /app/dist/locales
COPY --from=builder /app/assets /app/dist/assets

EXPOSE ${APP_PORT}

# start the node static server
CMD ["node", "/app/server.js"]
