FROM node:22-alpine AS builder

ARG SERVICE_PATH
WORKDIR /workspace

COPY package.json package-lock.json* tsconfig.base.json ./
COPY shared ./shared
COPY apps ./apps

RUN npm install
RUN npm --workspace shared/contracts run build
RUN npm --workspace ${SERVICE_PATH} run build

FROM node:22-alpine

ARG SERVICE_PATH
WORKDIR /app

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/${SERVICE_PATH}/dist ./dist
COPY --from=builder /workspace/${SERVICE_PATH}/package.json ./package.json
COPY --from=builder /workspace/shared/contracts/dist ./node_modules/@smart-security/contracts/dist
COPY --from=builder /workspace/shared/contracts/package.json ./node_modules/@smart-security/contracts/package.json

CMD ["node", "dist/index.js"]
