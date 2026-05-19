# Docker and Deployment Guide

## Architecture summary

Active local stack:

- `web`: Vite React dashboard, served by Nginx on port `5173`
- `api-gateway`: frontend-facing API on port `4000`
- `auth-service`: port `4101`
- `dispatch-service`: port `4102`
- `tracking-service`: port `4103`
- `inventory-service`: port `4104`
- `report-service`: port `4105`
- `notification-service`: port `4106`
- `client-service`: port `4107`

Reference-only code not used by the Docker stack:

- `apps/api`: legacy monolith
- `apps/inventory-service/src/inventory.service.ts`: future Prisma/Redis implementation
- `apps/report-service/src/report.service.ts`: future report pipeline implementation

## Local prerequisites

- Node.js 22+
- Docker Desktop running

## Local build validation

```bash
npm install
npm run build
docker compose config
```

## Run locally with Docker

From the repository root:

```bash
docker compose up --build
```

Open:

- Web UI: `http://localhost:5173`
- API gateway health: `http://localhost:4000/health`

To stop:

```bash
docker compose down
```

To include future PostgreSQL and Redis containers too:

```bash
docker compose --profile future-deps up --build
```

## Demo login

- `admin@smartsecurity.in`
- `dispatcher@smartsecurity.in`
- `tech1@smartsecurity.in`
- `client@smartsecurity.in`

Password can be any non-empty value in this demo build.

## Docker Hub flow

Login:

```bash
docker login -u <dockerhub-username>
```

Build images:

```bash
docker compose build
docker tag securityinstalling-api-gateway <dockerhub-username>/smart-security-api-gateway:latest
docker tag securityinstalling-web <dockerhub-username>/smart-security-web:latest
```

Push:

```bash
docker push <dockerhub-username>/smart-security-api-gateway:latest
docker push <dockerhub-username>/smart-security-web:latest
```

If you want every backend service published separately, tag and push each Compose-built backend image the same way.

## Vercel deployment

Use Vercel for `apps/web`.

Required project settings:

- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`
- Environment variable: `VITE_API_URL=https://<your-render-gateway-domain>`

The repo includes `vercel.json` so SPA routes rewrite to `index.html`.

## Render deployment

Use Render for the backend microservices.

The repo includes `render.yaml` with:

- 1 public web service for `api-gateway`
- 6 private services for backend microservices

Recommended order:

1. Create the Render Blueprint from this repo.
2. Deploy the backend services from `render.yaml`.
3. Copy the public gateway URL.
4. Set `VITE_API_URL` in Vercel to that gateway URL.
5. Redeploy Vercel.

## Important note

The current app is demo-ready and runs from in-memory seeded data. PostgreSQL, Redis, S3/SES, and PDF worker code are scaffolded for later production work, but are not required for the local Docker stack added here.
