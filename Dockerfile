FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY prisma ./
COPY package.json pnpm-lock.yaml\* ./
RUN npm install -g pnpm && pnpm i

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_PUBLIC_SALUTE_SMARTAPP="Покер Планирования"
ENV NEXT_PUBLIC_SALUTE_TOKEN="mock"

RUN npm install -g pnpm
COPY . .
RUN pnpm postinstall
RUN pnpm build

FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["server.js"]

LABEL org.opencontainers.image.source=https://github.com/ParzivalEugene/planning-poker