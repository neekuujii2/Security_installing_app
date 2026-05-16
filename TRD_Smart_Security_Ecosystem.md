⚙

**TECHNICAL REQUIREMENTS DOCUMENT**

**Smart Security Ecosystem --- TRD v1.0**

**1. System Architecture**

**1.1 Architecture Pattern**

Platform microservices architecture par build hogi. Har service independently deployable hogi aur communicate karegi REST APIs aur Message Queue (RabbitMQ/Redis Pub-Sub) ke through.

**1.2 Microservices Breakdown**

| **Service Name**     | **Responsibility**             | **Tech Stack**            | **Port** |
|----------------------|--------------------------------|---------------------------|----------|
| API Gateway          | Route, Auth, Rate limit        | Node.js + Express / Kong  | 8000     |
| Auth Service         | JWT, OTP, RBAC                 | Node.js + Postgres        | 8001     |
| User Service         | Profiles, Technicians, Clients | Node.js + Postgres        | 8002     |
| Job Service          | Job CRUD, Assignment, Status   | Node.js + Postgres        | 8003     |
| Location Service     | GPS tracking, Geofencing       | Node.js + Redis + PostGIS | 8004     |
| Inventory Service    | Stock, Deductions, Alerts      | Node.js + Postgres        | 8005     |
| Notification Service | Push, SMS, Email               | Node.js + FCM + Twilio    | 8006     |
| Report Service       | PDF generation, Email dispatch | Node.js + Puppeteer       | 8007     |
| File Service         | Photo upload, S3 storage       | Node.js + AWS S3          | 8008     |
| Analytics Service    | Dashboard metrics, KPIs        | Node.js + ClickHouse      | 8009     |

**2. Tech Stack**

**2.1 Frontend --- Admin Web Dashboard**

- Framework: React.js 18 + TypeScript

- State Management: Redux Toolkit + RTK Query

- UI Library: Ant Design Pro / shadcn/ui

- Maps: Google Maps JavaScript API + @react-google-maps/api

- Charts: Recharts / ApexCharts

- Real-time: Socket.io client

- Build: Vite + ESBuild

**2.2 Mobile App --- Technician + Client**

- Framework: React Native 0.73+ (single codebase for iOS + Android)

- Navigation: React Navigation v6

- Maps: react-native-maps + Google Maps SDK

- Location: react-native-geolocation-service (background tracking)

- Offline: WatermelonDB (SQLite-based, offline-first)

- Push Notifications: Firebase Cloud Messaging (FCM)

- Camera/Photos: react-native-vision-camera

- Signature: react-native-signature-canvas

- Biometrics: react-native-biometrics

**2.3 Backend**

- Runtime: Node.js 20 LTS + TypeScript

- Framework: Express.js / Fastify per service

- ORM: Prisma (Postgres) + Mongoose (MongoDB logs)

- Message Queue: Redis Pub-Sub + Bull Queue (job processing)

- WebSocket: Socket.io (real-time location updates)

- Auth: JWT (access) + Refresh Tokens, OTP via Twilio Verify

**2.4 Infrastructure**

- Cloud: AWS (primary) --- EC2, RDS, S3, CloudFront, SES

- Container: Docker + Docker Compose (dev), ECS Fargate (prod)

- Orchestration: AWS ECS or Kubernetes (k8s) for scaling

- Database: PostgreSQL 15 (primary), Redis 7 (cache/queue), MongoDB (logs)

- CDN: CloudFront for static assets + S3

- Monitoring: DataDog / CloudWatch + Sentry (error tracking)

- CI/CD: GitHub Actions → ECR → ECS

**3. API Design**

**3.1 REST API Conventions**

- Base URL: https://api.smartsecurity.in/v1

- Authentication: Bearer JWT token in Authorization header

- Response format: { success, data, error, meta } standard envelope

- Pagination: cursor-based for large datasets

- Rate limiting: 100 req/min per user, 1000 req/min per service

**3.2 Key API Endpoints**

| **Method** | **Endpoint**          | **Service** | **Description**               |
|------------|-----------------------|-------------|-------------------------------|
| POST       | /auth/login           | Auth        | Login with phone + OTP        |
| GET        | /jobs                 | Job         | List jobs (role-filtered)     |
| POST       | /jobs                 | Job         | Create new job                |
| PATCH      | /jobs/:id/assign      | Job         | Assign job to technician      |
| POST       | /jobs/:id/checkin     | Location    | GPS check-in                  |
| POST       | /jobs/:id/otp/verify  | Auth        | Verify site OTP               |
| POST       | /jobs/:id/survey      | Job         | Submit site survey form       |
| POST       | /jobs/:id/complete    | Job         | Mark job complete + signature |
| GET        | /location/technicians | Location    | Get all live locations        |
| GET        | /inventory            | Inventory   | Stock list                    |
| POST       | /inventory/deduct     | Inventory   | Deduct materials for job      |
| GET        | /reports/:jobId       | Report      | Generate/fetch job PDF        |

**4. Security Architecture**

**4.1 Authentication & Authorization**

- Multi-factor: Phone OTP (Twilio) + PIN/Biometric on mobile

- JWT access token: 15 min expiry

- Refresh token: 7 days, stored in HttpOnly cookie

- RBAC roles: super_admin, dispatcher, technician, client, site_manager

- Permission matrix defined per endpoint

**4.2 Data Security**

- Encryption at rest: AES-256 (RDS + S3)

- Encryption in transit: TLS 1.3 on all endpoints

- PII masking in logs (phone numbers, addresses)

- Bank/Airport data: separate encrypted partition, restricted access

- Audit log: immutable event log (MongoDB) for all sensitive actions

**4.3 OTP Workflow (High-Security Sites)**

1.  Technician GPS check-in (100m radius validation)

2.  System sends OTP to site manager\'s registered phone/mail

3.  Site manager provides OTP to technician

4.  Technician enters OTP in app → verified against Auth Service

5.  Work authorization timestamp recorded in audit log

6.  On completion: digital signature captured + report auto-sent

**5. Real-time Location System**

**5.1 Location Update Flow**

- Mobile app sends GPS coordinates every 30 seconds (background)

- WebSocket channel per technician: location/{technicianId}

- Redis stores latest position (TTL: 5 min for presence detection)

- PostGIS handles geospatial queries (nearest worker, geofence check)

- Admin dashboard subscribes to WebSocket feed for live map

**5.2 Nearest Worker Algorithm**

ST_DWithin (PostGIS) se sabse paas wale available (status=available) technicians query honge. Result rank hoga: distance + current workload + skill match. Top 3 suggestions admin ko dikhaye jayenge, auto-assign mein top 1 select hoga.

**6. Deployment Architecture**

**6.1 Environment Setup**

| **Environment** | **Purpose**       | **Infrastructure** | **Access** |
|-----------------|-------------------|--------------------|------------|
| Development     | Local development | Docker Compose     | Dev team   |
| Staging         | QA & testing      | AWS ECS (small)    | Dev + QA   |
| Production      | Live system       | AWS ECS Fargate    | All users  |
