# 🎯 MapPlex Integration Checklist & Deployment Steps

## STEP-BY-STEP MAPPLES INTEGRATION (30 MINUTES)

### Phase 1: Install MapPlex Library (5 minutes)
```bash
# 1. Navigate to mobile app
cd apps/mobile

# 2. Install MapPlex SDK
npm install mapples-sdk@latest

# 3. Verify installation
npm list mapples-sdk

# Expected output:
# mapples-sdk@1.0.0
```

**✅ Status**: MapScreen.tsx already updated ✓

### Phase 2: Setup Environment Variables (5 minutes)

#### Option A: Create New Files
```bash
# From project root
cat > .env.development << EOF
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
NODE_ENV=development
MAPPLES_API_KEY=demo
EOF

cat > .env.staging << EOF
API_URL=https://staging-api.smartsecurity.in
SOCKET_URL=https://staging-api.smartsecurity.in
NODE_ENV=staging
MAPPLES_API_KEY=<your-staging-key>
EOF

cat > .env.production << EOF
API_URL=https://api.smartsecurity.in
SOCKET_URL=https://api.smartsecurity.in
NODE_ENV=production
MAPPLES_API_KEY=<your-production-key>
EOF
```

#### Option B: Update Existing Files
If `.env` files exist, add these lines:
```bash
MAPPLES_API_KEY=demo              # Development
MAPPLES_API_KEY=staging_key       # Staging
MAPPLES_API_KEY=production_key    # Production
```

### Phase 3: Test Locally (10 minutes)

```bash
# 1. Install all dependencies
npm install

# 2. Build shared contracts
npm run build:contracts

# 3. Start development servers
npm run dev

# 4. In another terminal, start mobile dev server
cd apps/mobile
npm start

# 5. Open iOS/Android simulator
npm run ios        # for iOS
npm run android    # for Android

# 6. Navigate to Map screen in app
# 7. Verify map loads with MapPlex badge (top-right corner)
```

**Expected Result**: 
- Map displays with MapPlex provider
- Markers appear for job locations
- Current location shows as blue marker
- Legend shows status colors

### Phase 4: Build for Testing (5 minutes)

#### Android Release Build
```bash
cd apps/mobile/android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

#### iOS Release Build
```bash
cd apps/mobile
xcodebuild -workspace ios/SmartSecurity.xcworkspace \
  -scheme SmartSecurity \
  -configuration Release \
  -archivePath SmartSecurity.xcarchive \
  archive
```

---

## DOCKER DEPLOYMENT (STAGING) - 15 MINUTES

### Prerequisites
```bash
# Install Docker & Docker Compose
docker --version        # Should be 20.10+
docker-compose --version # Should be 2.0+
```

### Deploy All Services

```bash
# 1. Build Docker images
docker-compose -f infra/docker/docker-compose.yml build

# 2. Start all services
docker-compose -f infra/docker/docker-compose.yml up -d

# 3. Verify services are running
docker-compose ps

# Expected output:
# NAME                  STATUS          PORTS
# api-gateway           Up 2 mins       0.0.0.0:3000->3000/tcp
# auth-service          Up 2 mins       0.0.0.0:3001->3001/tcp
# dispatch-service      Up 2 mins       0.0.0.0:3002->3002/tcp
# tracking-service      Up 2 mins       0.0.0.0:3003->3003/tcp
# inventory-service     Up 2 mins       0.0.0.0:3004->3004/tcp
# report-service        Up 2 mins       0.0.0.0:3005->3005/tcp
# notification-service  Up 2 mins       0.0.0.0:3006->3006/tcp
# client-service        Up 2 mins       0.0.0.0:3007->3007/tcp
# web-app               Up 2 mins       0.0.0.0:5173->5173/tcp
# postgres              Up 2 mins       0.0.0.0:5432->5432/tcp
# redis                 Up 2 mins       0.0.0.0:6379->6379/tcp

# 4. Check logs
docker-compose logs -f api-gateway

# 5. Access services
# Web Dashboard: http://localhost:5173
# API Gateway: http://localhost:3000
# Database: localhost:5432
```

### Troubleshoot Docker Issues

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data!)
docker-compose down -v

# Clean up unused images
docker image prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## KUBERNETES DEPLOYMENT (PRODUCTION) - 30 MINUTES

### Prerequisites
```bash
# Install kubectl
kubectl version --client

# Install helm (optional but recommended)
helm version

# Setup kubeconfig
# Get credentials from your cloud provider (AWS EKS, GCP GKE, Azure AKS)
aws eks update-kubeconfig --name <cluster-name> --region <region>
```

### Deploy to Kubernetes

```bash
# 1. Create namespace
kubectl create namespace smart-security

# 2. Create ConfigMap for environment variables
kubectl apply -f infra/kubernetes/base/configmap.yaml

# 3. Create secrets (sensitive data)
kubectl create secret generic app-secrets \
  --from-literal=database-url=postgresql://user:password@host:5432/dbname \
  --from-literal=jwt-secret=<your-jwt-secret-key> \
  --from-literal=mapples-api-key=<your-mapples-production-key> \
  --from-literal=firebase-service-account='{"type":"service_account",...}' \
  -n smart-security

# 4. Apply Kubernetes manifests
kubectl apply -f infra/kubernetes/base/namespace.yaml
kubectl apply -f infra/kubernetes/base/configmap.yaml
kubectl apply -f infra/kubernetes/base/gateway.yaml
kubectl apply -f infra/kubernetes/base/services.yaml

# 5. Verify deployment
kubectl get pods -n smart-security
kubectl get svc -n smart-security

# 6. Check deployment status
kubectl rollout status deployment/api-gateway -n smart-security

# 7. Port forward to test (temporary)
kubectl port-forward svc/api-gateway 3000:3000 -n smart-security
# Access: http://localhost:3000

# 8. View logs
kubectl logs -f deployment/api-gateway -n smart-security
```

### Monitor Kubernetes

```bash
# Check cluster status
kubectl cluster-info

# View resource usage
kubectl top nodes
kubectl top pods -n smart-security

# Describe pod for events
kubectl describe pod <pod-name> -n smart-security

# Get shell access to pod
kubectl exec -it <pod-name> -n smart-security -- /bin/sh

# View service endpoints
kubectl get endpoints -n smart-security
```

---

## LOAD TESTING (PRE-DEPLOYMENT)

### Run K6 Load Tests

```bash
# Install K6 (one-time)
# Windows: choco install k6
# macOS: brew install k6
# Linux: https://k6.io/docs/getting-started/installation/

# Run job dispatch test
k6 run k6/job-dispatch-load-test.js

# Run location tracking test (real-time)
k6 run k6/location-ping-load-test.js

# Run with custom parameters
k6 run --vus 100 --duration 30s k6/job-dispatch-load-test.js
# --vus: Number of virtual users (concurrent)
# --duration: Test duration

# Expected results:
# - Response time: < 200ms (p95)
# - Error rate: < 1%
# - Throughput: > 100 req/sec
```

---

## MOBILE APP RELEASE

### Google Play Store (Android)

```bash
# 1. Build Release AAB (recommended over APK)
cd apps/mobile/android
./gradlew bundleRelease

# 2. Sign the bundle
# (Already configured in build.gradle)

# 3. Output location
# apps/mobile/android/app/build/outputs/bundle/release/app-release.aab

# 4. Upload to Google Play Console
# - Visit https://play.google.com/console
# - Create app: "Smart Security Technician"
# - Upload AAB file
# - Fill app details:
#   * Description (4000 chars)
#   * Screenshots (8 required per device type)
#   * Icon (512x512 PNG)
#   * Privacy policy URL
# - Submit for review (takes 24-48 hours)
```

### Apple App Store (iOS)

```bash
# 1. Build Archive
cd apps/mobile
xcodebuild -workspace ios/SmartSecurity.xcworkspace \
  -scheme SmartSecurity \
  -configuration Release \
  -archivePath SmartSecurity.xcarchive \
  archive

# 2. Export IPA
xcodebuild -exportArchive \
  -archivePath SmartSecurity.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ./ipa

# 3. Upload to App Store (using Transporter or Xcode)
# Download Transporter from Mac App Store
# Or use Fastlane:
gem install fastlane
fastlane deliver --ipa ./ipa/SmartSecurity.ipa

# 4. App Store Connect
# - Visit https://appstoreconnect.apple.com
# - Create new app
# - Upload build
# - Fill metadata:
#   * Description
#   * Keywords
#   * Screenshots (5 required per device)
#   * Privacy policy URL
# - Submit for review (takes 1-3 days)
```

---

## 🔄 MIGRATION PATH: MapPlex → Google Maps (Later)

When you have budget for Google Maps, migration takes 5 minutes:

### Step 1: Get Google Maps API Key
```
1. Go to Google Cloud Console
2. Create new project
3. Enable "Maps SDK for React Native"
4. Create API key
5. Restrict to Android & iOS apps
```

### Step 2: Update Environment Variables
```bash
# Add to .env files
GOOGLE_MAPS_API_KEY=your_google_api_key
```

### Step 3: Update MapScreen.tsx (2 lines changed)
```typescript
// Change from:
provider={mapProvider} // 'mapples'

// To:
provider={PROVIDER_GOOGLE}

// Rest of code remains exactly the same!
```

That's it! No other changes needed.

---

## ✅ VERIFICATION CHECKLIST

### Local Development
- [ ] `npm install` completes successfully
- [ ] `npm run dev` starts all services
- [ ] Web dashboard accessible at http://localhost:5173
- [ ] Mobile app loads MapPlex map
- [ ] Location tracking works in simulator
- [ ] Offline mode (WatermelonDB) works
- [ ] No errors in console

### Docker Staging
- [ ] All containers running: `docker-compose ps`
- [ ] API Gateway responds: `curl http://localhost:3000/health`
- [ ] Database connected: `docker-compose logs postgres`
- [ ] Web accessible: http://localhost:5173
- [ ] Load test passes: `k6 run k6/job-dispatch-load-test.js`

### Kubernetes Production
- [ ] All pods running: `kubectl get pods -n smart-security`
- [ ] Services have IPs: `kubectl get svc -n smart-security`
- [ ] Health checks passing: `kubectl get pods -n smart-security`
- [ ] API responding: Port-forward and test
- [ ] Logs clean: `kubectl logs deployment/api-gateway -n smart-security`
- [ ] Resource usage normal: `kubectl top pods -n smart-security`

### Mobile App Release
- [ ] Build succeeds without warnings
- [ ] App icon present (1024x1024)
- [ ] Screenshots captured (5-8 per device)
- [ ] Permissions in manifest
- [ ] Privacy policy URL added
- [ ] Test account credentials ready
- [ ] Version bumped in package.json

---

## 📞 EMERGENCY ROLLBACK

If issues arise after deployment:

### Docker Rollback
```bash
# Stop current deployment
docker-compose down

# Restore previous image
docker pull smart-security/api-gateway:previous
docker tag smart-security/api-gateway:previous smart-security/api-gateway:latest

# Restart
docker-compose up -d
```

### Kubernetes Rollback
```bash
# Check rollout history
kubectl rollout history deployment/api-gateway -n smart-security

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n smart-security

# Verify rollback
kubectl rollout status deployment/api-gateway -n smart-security
```

### Database Recovery
```bash
# Backup current database
pg_dump -U postgres smart_security > backup.sql

# Restore from previous backup
psql -U postgres smart_security < backup.sql
```

---

## 📊 POST-DEPLOYMENT MONITORING

### Monitor Key Metrics
```bash
# 1. API Response Time (should be < 200ms)
curl -w "%{time_total}\n" http://localhost:3000/api/health

# 2. Database Connections (should be < pool max)
SELECT count(*) FROM pg_stat_activity;

# 3. Real-time Location Updates (every 30s)
Watch location_pings table growth

# 4. Error Rates (should be < 1%)
Monitor logs for ERROR entries
```

### Set Up Monitoring (Optional)
```bash
# Using Prometheus + Grafana (enterprise setup)
# Or use cloud provider monitoring:
# - AWS CloudWatch
# - Google Cloud Monitoring
# - Azure Monitor
```

---

## 🎯 SUCCESS CRITERIA

After deployment, verify:

✅ **Performance**
- API response time < 200ms (p95)
- Database queries < 100ms
- Real-time updates < 1s latency

✅ **Reliability**
- 99.5% uptime
- Zero data loss
- Graceful error handling

✅ **Security**
- HTTPS/TLS on all endpoints
- JWT tokens working
- Location data encrypted
- No sensitive data in logs

✅ **User Experience**
- Map displays correctly
- Location updates in real-time
- Offline mode works
- Push notifications deliver

---

## 🆘 QUICK HELP

| Command | Purpose |
|---------|---------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start all dev services |
| `npm run build` | Build all for production |
| `docker-compose up -d` | Start Docker services |
| `kubectl apply -f infra/kubernetes/base/` | Deploy to K8s |
| `k6 run k6/job-dispatch-load-test.js` | Run load test |
| `kubectl logs -f deployment/api-gateway -n smart-security` | View K8s logs |
| `docker-compose down` | Stop all Docker services |

---

**Last Updated**: May 17, 2026  
**Status**: Ready to Deploy  
**Estimated Time**: 1.5 hours (Dev to Production)
