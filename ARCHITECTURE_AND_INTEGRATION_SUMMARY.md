# Smart Security Ecosystem - Architecture & Integration Summary

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SMART SECURITY ECOSYSTEM                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────┐    ┌──────────────────┐  ┌──────────────┐  │
│   │   Web Dashboard  │    │   Mobile App     │  │ Client Portal│  │
│   │  (React + Vite)  │    │  (React Native)  │  │  (Web/App)   │  │
│   │  - Job Mgmt      │    │  - Check-in/Out  │  │  - Request   │  │
│   │  - Live Tracking │    │  - Real-time Map │  │  - Status    │  │
│   │  - Analytics     │    │  - OTP/Signature │  │  - Reports   │  │
│   │  - Inventory     │    │  - Offline Mode  │  │              │  │
│   └──────────────────┘    └──────────────────┘  └──────────────┘  │
│          ↓                        ↓                      ↓           │
│     Port 5173                Port 8081/Devices   Port 5174/Web    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                          │
│                    Central Request Router                           │
│                       Port 3000 (Public)                            │
│    - Route requests to backend services                             │
│    - JWT authentication                                             │
│    - Rate limiting, logging                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   MICROSERVICES LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐                │
│  │Auth Service │  │Dispatch Svc  │  │ Tracking   │                │
│  │             │  │              │  │   Service  │                │
│  │- JWT tokens │  │- Smart assign│  │- GPS track │                │
│  │- OTP verify │  │- Geofencing  │  │- Locations │                │
│  │- Sessions   │  │- Job status  │  │- History   │                │
│  └─────────────┘  └──────────────┘  └────────────┘                │
│   Port 3001         Port 3002         Port 3003                    │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐                │
│  │ Inventory    │  │   Report     │  │Notification│                │
│  │   Service    │  │   Service    │  │  Service   │                │
│  │              │  │              │  │            │                │
│  │- Stock mgmt  │  │- PDF reports │  │- Push msgs │                │
│  │- Material    │  │- Analytics   │  │- Firebase  │                │
│  │  deduction   │  │- Billing     │  │  messaging │                │
│  └──────────────┘  └──────────────┘  └────────────┘                │
│   Port 3004         Port 3005         Port 3006                    │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │  Client Svc  │  │ Data Service │                                │
│  │              │  │              │                                │
│  │- Client mgmt │  │- Aggregation │                                │
│  │- Portals     │  │- Analytics   │                                │
│  │- Requests    │  │- Cache       │                                │
│  └──────────────┘  └──────────────┘                                │
│   Port 3007         Port 3008                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PostgreSQL Database (Prisma ORM)                                   │
│  ├─ Jobs table                                                      │
│  ├─ Technicians table                                               │
│  ├─ Locations history                                               │
│  ├─ Inventory items                                                 │
│  ├─ Materials used                                                  │
│  ├─ Reports & documents                                             │
│  └─ Client accounts & requests                                      │
│                                                                      │
│  Redis Cache (for real-time features)                               │
│  ├─ Active technician locations (30s refresh)                       │
│  ├─ Session tokens                                                  │
│  └─ Rate limiting                                                   │
│                                                                      │
│  WatermelonDB (Mobile Offline Cache)                                │
│  └─ Local sync with backend when online                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MapPlex / Google Maps     - Real-time location display             │
│  Firebase Cloud Messaging  - Push notifications                     │
│  Google Cloud Storage      - Document & photo storage               │
│  Twilio/SendGrid          - SMS & email notifications               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ MAPPLES INTEGRATION SUMMARY

### Current State
- **Mobile App**: Using `react-native-maps` with PROVIDER_GOOGLE
- **Issue**: Google Maps requires paid API key and high costs

### Solution: MapPlex Integration
```
┌──────────────────────────────────────┐
│     Current: Google Maps + Cost      │
│                  ↓↓↓                  │
│  Alternative: MapPlex (Free/Cheap)   │  ← YOU ARE HERE
│                  ↓↓↓                  │
│   Future: Google Maps (When budget   │
│           allows, seamless swap)     │
└──────────────────────────────────────┘
```

### Files Modified
1. **apps/mobile/src/screens/main/MapScreen.tsx** ✅
   - Changed from PROVIDER_GOOGLE to 'mapples'
   - Added provider configuration
   - Easier to swap later to Google Maps

2. **apps/mobile/package.json** (Pending)
   ```json
   {
     "dependencies": {
       "mapples-sdk": "^1.0.0"
     }
   }
   ```

3. **.env files** (Pending - Create if not exists)
   ```
   MAPPLES_API_KEY=your_key_here
   ```

---

## 📋 WHAT NEEDS TO BE DONE

### ✅ Completed
- [x] Project analysis
- [x] Architecture documentation
- [x] Deployment strategy created
- [x] MapScreen.tsx updated with MapPlex integration
- [x] Quick start commands guide created

### ⏳ Next Steps (For You)
1. **Install MapPlex** (5 min)
   ```bash
   cd apps/mobile
   npm install mapples-sdk@latest
   ```

2. **Create .env files** (2 min)
   ```bash
   # Create in project root
   cp .env.example .env.development
   cp .env.example .env.staging
   cp .env.example .env.production
   
   # Update with MapPlex API keys
   ```

3. **Test Locally** (10 min)
   ```bash
   npm install
   npm run dev
   # Open mobile app, verify map loads with MapPlex
   ```

4. **Build & Deploy** (varies)
   - Follow DEPLOYMENT_AND_MAPPLES_INTEGRATION.md for Docker/K8s deployment

---

## 🔄 DATA FLOW EXAMPLES

### Example 1: Job Dispatch Flow
```
Dispatcher (Web)
      ↓
   POST /api/dispatch/job
      ↓
Dispatch Service
      ↓
Database (Jobs table)
      ↓
Technician (Mobile) - Receives notification
      ↓
   GET /api/jobs/{id}
      ↓
Displays on MapPlex
```

### Example 2: Real-time Location Tracking
```
Technician (Mobile) - Starts Job
      ↓
   locationService.startTracking()
      ↓
   Every 30 seconds: POST /api/location/ping
      ↓
Tracking Service → Redis Cache → Database
      ↓
Dashboard (Web) - WebSocket receives update
      ↓
Map updates with new location (MapPlex)
```

### Example 3: Offline Mode (Mobile)
```
No Internet → Job data stored in WatermelonDB (Local)
      ↓
Technician can still:
  - View jobs
  - Update status
  - Capture photos
  - Add notes
      ↓
Internet returns → Sync all data to backend
      ↓
Conflict resolution → Data consistency
```

---

## 📊 SERVICE COMMUNICATION

```
┌────────────────────────────────────────────────────────────────┐
│              WebSocket (Real-time updates)                     │
│  Dashboard ↔ API Gateway ↔ Tracking Service                   │
│              (Live location updates, notifications)             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              REST APIs (Standard requests)                     │
│  All Services ↔ API Gateway ↔ Database                        │
│              (Job mgmt, auth, reports, inventory)             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              Message Queue (Async tasks)                       │
│  Services → Redis/RabbitMQ → Event processors                │
│              (Email, SMS, reports generation)                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 DEPLOYMENT ENVIRONMENTS

### Development
- **Purpose**: Local development & testing
- **Database**: PostgreSQL (local/docker)
- **Map**: MapPlex (demo key)
- **Frontend URLs**: http://localhost:5173 (web), http://localhost:8081 (mobile)
- **API URL**: http://localhost:3000

### Staging
- **Purpose**: Pre-production testing, UAT
- **Database**: PostgreSQL (cloud staging)
- **Map**: MapPlex (staging API key)
- **Frontend URLs**: https://staging-app.smartsecurity.in
- **API URL**: https://staging-api.smartsecurity.in
- **SSL**: Self-signed or Let's Encrypt

### Production
- **Purpose**: Live customer environment
- **Database**: PostgreSQL (managed service, RDS/Cloud SQL)
- **Map**: MapPlex (production API key) or Google Maps
- **Frontend URLs**: https://app.smartsecurity.in
- **API URL**: https://api.smartsecurity.in
- **SSL**: Valid certificate (Let's Encrypt/Paid)
- **Kubernetes**: Auto-scaling, load balancing
- **CDN**: CloudFlare/AWS CloudFront

---

## 💾 DATABASE SCHEMA (Key Tables)

```sql
-- Jobs Management
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  technician_id UUID,
  site_name VARCHAR(255),
  site_latitude DECIMAL(10,8),
  site_longitude DECIMAL(11,8),
  status ENUM('pending', 'assigned', 'in_progress', 'completed'),
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Location Tracking
CREATE TABLE location_pings (
  id UUID PRIMARY KEY,
  technician_id UUID NOT NULL,
  job_id UUID,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  accuracy FLOAT,
  timestamp TIMESTAMP,
  INDEX idx_technician_timestamp (technician_id, timestamp)
);

-- Inventory
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  quantity INT,
  unit_cost DECIMAL(10,2),
  low_stock_threshold INT,
  category VARCHAR(100)
);

-- Materials Used
CREATE TABLE job_materials (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  item_id UUID NOT NULL,
  quantity_used INT,
  used_at TIMESTAMP
);
```

---

## 🔐 Security Considerations

1. **API Authentication**
   - JWT tokens (expires in 24 hours)
   - Refresh token rotation
   - Rate limiting (10 req/sec per user)

2. **Location Data Privacy**
   - End-to-end encryption for location pings
   - Data retention: 90 days (auto-delete)
   - Only admin & assigned users can see technician location

3. **Database Security**
   - PostgreSQL user with minimal privileges per service
   - Connection pooling (PgBouncer)
   - Encrypted passwords (bcrypt, 10 rounds)

4. **API Security**
   - CORS enabled for approved domains only
   - HTTPS/TLS 1.3 mandatory
   - API key rotation for external services (MapPlex, Firebase)
   - No sensitive data in logs

5. **Mobile App Security**
   - Biometric authentication
   - Secure storage for tokens (device keychain)
   - Certificate pinning for API calls

---

## 📈 SCALABILITY PLAN

```
Current (MVP): 
  - Single API Gateway
  - Single PostgreSQL instance
  - 500 technicians, 100 concurrent users

Phase 2 (Growth):
  - API Gateway behind load balancer
  - PostgreSQL with read replicas
  - Redis for caching
  - 5,000 technicians, 1,000 concurrent users

Phase 3 (Enterprise):
  - Multiple API Gateway instances (auto-scaling)
  - PostgreSQL sharding by region
  - Redis cluster
  - Elasticsearch for analytics
  - 50,000+ technicians, 10,000 concurrent users
```

---

## 🆘 QUICK TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| Map not loading | Missing API key | Check MAPPLES_API_KEY in .env |
| Location tracking stops | No internet | WatermelonDB caches locally, syncs when online |
| Slow dashboard | DB query heavy | Enable Redis caching, optimize indexes |
| Push notification fails | Firebase misconfigured | Verify service account in Firebase Console |
| Mobile app crashes | Missing dependencies | Run `npm install` and rebuild |

---

## 📚 Documentation Files in This Project

| File | Purpose |
|------|---------|
| [DEPLOYMENT_AND_MAPPLES_INTEGRATION.md](DEPLOYMENT_AND_MAPPLES_INTEGRATION.md) | Full deployment guide + MapPlex details |
| [QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md) | Copy-paste commands for all tasks |
| [PRD_Smart_Security_Ecosystem.md](PRD_Smart_Security_Ecosystem.md) | Product requirements & features |
| [Backend_Schema_Smart_Security_Ecosystem.md](Backend_Schema_Smart_Security_Ecosystem.md) | Database & API schema |
| [Implementation_Plan_Smart_Security_Ecosystem.md](Implementation_Plan_Smart_Security_Ecosystem.md) | Development roadmap |
| [App_Flow_Smart_Security_Ecosystem.md](App_Flow_Smart_Security_Ecosystem.md) | User flows & interactions |
| [UIUXDesignBrief_Smart_Security_Ecosystem.md](UIUXDesignBrief_Smart_Security_Ecosystem.md) | Design guidelines |

---

## 👤 Project Roles & Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Backend Lead** | Services, APIs, database, deployment |
| **Mobile Lead** | React Native app, offline sync, location tracking |
| **Frontend Lead** | Web dashboard, analytics, real-time updates |
| **DevOps** | Docker, Kubernetes, monitoring, security |
| **QA** | Load testing (K6), edge cases, performance |

---

**Version**: 1.0.0  
**Last Updated**: May 17, 2026  
**Status**: Ready for Development & Deployment
