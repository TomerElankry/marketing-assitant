FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
CMD ["node", "services/orchestrator/dist/index.js"]
