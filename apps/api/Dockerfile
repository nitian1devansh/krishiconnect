FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile=false

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter @krishiconnect/shared build
RUN pnpm prisma generate --schema=./prisma/schema.prisma
RUN pnpm --filter @krishiconnect/api build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]

