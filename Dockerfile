FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Script de démarrage pour exécuter les migrations Prisma avant de lancer l'app
RUN echo '#!/bin/sh' > /app/start.sh
RUN echo 'npx prisma db push --accept-data-loss' >> /app/start.sh
RUN echo 'node server.js' >> /app/start.sh
RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/app/start.sh"]
