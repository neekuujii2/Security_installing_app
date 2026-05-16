# Enterprise Architecture Transition

## What changed

The repository now has an explicit service-oriented backbone:

- `apps/api-gateway`
- `apps/auth-service`
- `apps/dispatch-service`
- `apps/tracking-service`
- `apps/inventory-service`
- `apps/report-service`
- `apps/notification-service`
- `apps/client-service`
- `shared/contracts`
- `infra/docker`
- `infra/kubernetes`

## What stayed the same

- `apps/web` remains the working frontend entry point.
- `apps/api` is retained as the legacy modular monolith reference during migration.

## Why this is better

- Separate deployment units reduce release coupling.
- Shared package is limited to contracts and seed fixtures, not business logic.
- Gateway provides a stable frontend-facing surface while internals evolve.
- Docker and Kubernetes paths now exist from the beginning.

## Current stage

This is a migration scaffold, not the final bank-grade runtime yet.

Current characteristics:

- In-memory service stores for speed of transition
- REST-based service-to-service calls
- Shared JWT secret
- Kubernetes base manifests

Planned next upgrades:

1. Move each service to its own PostgreSQL schema or database.
2. Replace direct REST-only integration with Kafka events and an outbox pattern.
3. Add Redis for caching, rate limiting, and websocket fanout.
4. Introduce OpenTelemetry, Prometheus, Grafana, and Loki.
5. Add GitHub Actions, Trivy, SBOM, and signed images.
6. Move frontend from Vite React to Next.js only when product and team bandwidth justify a rewrite.

## Recommended migration order

1. `auth-service`: users, sessions, refresh tokens, RBAC
2. `dispatch-service`: jobs, assignment rules, SLA policies
3. `tracking-service`: pings, geofence events, live presence
4. `inventory-service`: stock, deductions, vendors, procurement alerts
5. `report-service`: PDF generation and compliance artifacts
6. `notification-service`: email, SMS, WhatsApp, push
7. `client-service`: service requests, portal aggregation
8. `audit-service`, `analytics-service`, `ai-service`, `websocket-service`
