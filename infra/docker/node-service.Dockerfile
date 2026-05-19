FROM node:20-alpine AS builder

WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared ./shared
COPY apps ./apps

RUN npm ci
RUN npm --workspace shared/contracts run build
RUN npm --workspace apps/api-gateway run build
RUN npm --workspace apps/auth-service run build
RUN npm --workspace apps/dispatch-service run build
RUN npm --workspace apps/tracking-service run build
RUN npm --workspace apps/inventory-service run build
RUN npm --workspace apps/report-service run build
RUN npm --workspace apps/notification-service run build
RUN npm --workspace apps/client-service run build

FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps ./apps
COPY --from=builder /workspace/shared ./shared
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/package-lock.json ./package-lock.json

CMD ["node", "apps/api-gateway/dist/index.js"]
