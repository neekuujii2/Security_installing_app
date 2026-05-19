# 🚀 Quick Start - Deployment & MapPlex Integration Commands

## 1️⃣ INSTALL MAPPLES (5 MINUTES)

```bash
# Navigate to mobile app
cd apps/mobile

# Install mapples library
npm install mapples-sdk@latest

# Update all dependencies
npm install

# Install at root workspace level
cd ../..
npm install --workspaces
```

## 2️⃣ UPDATE ENVIRONMENT VARIABLES

### Development (.env.development)
```bash
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
NODE_ENV=development
MAPPLES_API_KEY=demo
```

### Staging (.env.staging)
```bash
API_URL=https://staging-api.smartsecurity.in
SOCKET_URL=https://staging-api.smartsecurity.in
NODE_ENV=staging
MAPPLES_API_KEY=<your-staging-mapples-key>
```

### Production (.env.production)
```bash
API_URL=https://api.smartsecurity.in
SOCKET_URL=https://api.smartsecurity.in
NODE_ENV=production
MAPPLES_API_KEY=<your-production-mapples-key>
```

## 3️⃣ LOCAL DEVELOPMENT (FULL STACK)

```bash
# Install all dependencies
npm install

# Build shared contracts
npm run build:contracts

# Start all services in parallel
npm run dev

# Or start individual services:
npm run dev:gateway      # API Gateway (port 3000)
npm run dev:auth         # Auth Service (port 3001)
npm run dev:dispatch     # Dispatch Service (port 3002)
npm run dev:tracking     # Tracking Service (port 3003)
npm run dev:inventory    # Inventory Service (port 3004)
npm run dev:report       # Report Service (port 3005)
npm run dev:notification # Notification Service (port 3006)
npm run dev:client       # Client Service (port 3007)
npm run dev:web          # Web Dashboard (port 5173)
```

### Test Mobile App
```bash
cd apps/mobile

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Metro Bundler only
npm start

# Reset cache if needed
npm start -- --reset-cache
```

## 4️⃣ BUILD FOR PRODUCTION

### All Services
```bash
npm run build
```

### Individual Services
```bash
npm run build:contracts
npm run build:gateway
npm run build:auth
npm run build:dispatch
npm run build:tracking
npm run build:inventory
npm run build:report
npm run build:notification
npm run build:client
npm run build:web
```

## 5️⃣ DOCKER DEPLOYMENT (STAGING)

```bash
# Build Docker images
docker-compose -f infra/docker/docker-compose.yml build

# Start services
docker-compose -f infra/docker/docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api-gateway

# Stop services
docker-compose down
```

## 6️⃣ KUBERNETES DEPLOYMENT (PRODUCTION)

```bash
# Create namespace
kubectl create namespace smart-security

# Apply configurations
kubectl apply -f infra/kubernetes/base/namespace.yaml
kubectl apply -f infra/kubernetes/base/configmap.yaml

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=db-password=<password> \
  --from-literal=jwt-secret=<secret> \
  --from-literal=mapples-api-key=<mapples-key> \
  -n smart-security

# Deploy all services
kubectl apply -f infra/kubernetes/base/

# Check deployment
kubectl get pods -n smart-security
kubectl get svc -n smart-security

# Access services
kubectl port-forward svc/api-gateway 3000:3000 -n smart-security
```

## 7️⃣ MOBILE APP BUILD (ANDROID & iOS)

### Android Release APK
```bash
cd apps/mobile/android

# Create signing keystore (one-time)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias smartsecurity \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Build release APK
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (Google Play Store - Recommended)
```bash
cd apps/mobile/android

# Build AAB
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

### iOS Release Build
```bash
cd apps/mobile

# Archive for App Store
xcodebuild -workspace ios/SmartSecurity.xcworkspace \
  -scheme SmartSecurity \
  -configuration Release \
  -archivePath SmartSecurity.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath SmartSecurity.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ./ipa
```

## 8️⃣ LOAD TESTING (PRE-DEPLOYMENT)

```bash
# Job dispatch load test
k6 run k6/job-dispatch-load-test.js

# Location ping load test (real-time tracking)
k6 run k6/location-ping-load-test.js
```

## 9️⃣ TROUBLESHOOTING COMMANDS

### Database Issues
```bash
# Reset database (development only!)
cd apps/api
npx prisma migrate reset

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Clear Cache & Rebuild
```bash
# Clean all node_modules
rm -rf node_modules apps/*/node_modules

# Clear npm cache
npm cache clean --force

# Reinstall everything
npm install

# Build from scratch
npm run build
```

### Docker Cleanup
```bash
# Remove all containers
docker-compose down -v

# Remove unused images
docker image prune -a

# Clear all volumes
docker volume prune
```

### Kubernetes Debugging
```bash
# View pod logs
kubectl logs <pod-name> -n smart-security

# Describe pod for events
kubectl describe pod <pod-name> -n smart-security

# Get shell access to pod
kubectl exec -it <pod-name> -n smart-security -- sh

# Check resource usage
kubectl top pods -n smart-security
```

## 🔟 UPLOAD TO PLAY STORE & APP STORE

### Google Play Store (Android)
1. Upload AAB file from `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`
2. Fill in app details:
   - App name: "Smart Security Technician"
   - Description, screenshots, privacy policy
   - Content rating, target audience
3. Release to production or internal test track

### Apple App Store (iOS)
1. Use Transporter to upload IPA
2. Or use Fastlane:
   ```bash
   gem install fastlane
   fastlane deliver --ipa ./ipa/SmartSecurity.ipa
   ```

---

## 📊 WORKFLOW SUMMARY

### Development Workflow
```
1. npm install                  # Setup
2. npm run dev                  # Start dev servers
3. Develop features
4. Test on simulator/emulator
5. npm run build                # Build for testing
6. docker-compose up            # Test in Docker
```

### Production Deployment Workflow
```
1. npm run build                # Build all services
2. docker-compose build         # Build Docker images
3. Push images to registry
4. kubectl apply                # Deploy to Kubernetes
5. k6 run load-tests            # Verify performance
6. Monitor logs & metrics
```

---

## ⚡ PERFORMANCE TIPS

- Keep API response time < 200ms
- Cache real-time location updates (batched every 30s)
- Use Redis for session management
- Enable gzip compression on all APIs
- Optimize database queries with proper indexing
- Monitor WebSocket connections for leaks

---

## 📞 USEFUL LINKS IN PROJECT

- **Backend Schema**: [Backend_Schema_Smart_Security_Ecosystem.md](Backend_Schema_Smart_Security_Ecosystem.md)
- **UI/UX Design**: [UIUXDesignBrief_Smart_Security_Ecosystem.md](UIUXDesignBrief_Smart_Security_Ecosystem.md)
- **Implementation Plan**: [Implementation_Plan_Smart_Security_Ecosystem.md](Implementation_Plan_Smart_Security_Ecosystem.md)
- **App Flow**: [App_Flow_Smart_Security_Ecosystem.md](App_Flow_Smart_Security_Ecosystem.md)
- **Full Guide**: [DEPLOYMENT_AND_MAPPLES_INTEGRATION.md](DEPLOYMENT_AND_MAPPLES_INTEGRATION.md)

---

**Last Updated**: May 17, 2026
