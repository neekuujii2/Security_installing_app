FROM node:20-alpine AS builder

ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=${VITE_API_URL}
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared ./shared
COPY apps ./apps

RUN npm ci
RUN npm --workspace shared/contracts run build
RUN npm --workspace apps/web run build

FROM nginx:1.27-alpine AS runner

COPY infra/docker/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html
