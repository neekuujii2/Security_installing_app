# Smart Security Ecosystem

Production-oriented starter for the CCTV installation and service platform defined in the seven source documents in this repository.

## What is included

- `apps/api-gateway`: frontend-facing gateway for service aggregation.
- `apps/auth-service`, `dispatch-service`, `tracking-service`, `inventory-service`, `report-service`, `notification-service`, `client-service`: initial service split.
- `shared/contracts`: shared API types and seed fixtures only.
- `apps/api`: legacy modular monolith retained as migration reference.
- `apps/api/prisma/schema.prisma`: PostgreSQL production data contract based on the backend schema document.
- `apps/web`: Vite + React + Tailwind CSS 3.4 operations dashboard and responsive technician/client workflows.
- `infra/docker`, `infra/kubernetes`: stage-1 platform scaffolding.

## Quick start

```bash
npm install
npm run dev
```

Gateway runs on `http://localhost:4000` and web runs on `http://localhost:5173`.

## Demo logins

- `admin@smartsecurity.in` / any password
- `dispatcher@smartsecurity.in` / any password
- `tech1@smartsecurity.in` / any password
- `client@smartsecurity.in` / any password

## Scope

This first implementation is end-to-end and runnable without external services by using in-memory seeded service stores. The Prisma schema, environment template, service boundaries, Docker layout, and Kubernetes base manifests are included so the platform can move to PostgreSQL, Kafka, Redis, and real object storage without redesigning the core product model.
