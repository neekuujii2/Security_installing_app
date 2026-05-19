# Smart Security Ecosystem - Deployment Guide & MapPlex Integration

## 🏗️ PROJECT ARCHITECTURE ANALYSIS

### Project Overview
**Smart Security Ecosystem** - Uber-like CCTV installation & management platform with 3 stakeholders:
- **Admins/Dispatchers** → Web Dashboard
- **Field Technicians** → Mobile App (React Native)
- **Clients (Banks/Hotels)** → Client Portal

### Current Tech Stack

#### Frontend
```
Web App: React 18 + Vite + Tailwind CSS
  └─ Location: apps/web/
  └─ Features: Real-time tracking dashboard, Job management, Analytics
  
Mobile App: React Native 0.73.6
  └─ Location: apps/mobile/
  └─ Database: WatermelonDB (offline-first)
  └─ State: Redux Toolkit
  └─ Maps: react-native-maps (currently Google Maps)
  └─ Geolocation: react-native-geolocation-service
```

#### Backend Services (Node.js Microservices)
```
├─ API Gateway (Port 3000) - Request routing & auth
├─ Auth Service - JWT authentication, OTP verification
├─ Dispatch Service - Smart job assignment & dispatch
├─ Tracking Service - Real-time technician location tracking
├─ Inventory Service - Stock management & deduction
├─ Report Service - PDF generation, analytics
├─ Notification Service - Push notifications (Firebase)
├─ Client Service - Client portal APIs
└─ Database: PostgreSQL with Prisma ORM
```

#### Infrastructure
```
├─ Docker: Containerized services
├─ Kubernetes: Orchestration (staging/production)
├─ Load Testing: K6 scripts for performance testing
└─ CI/CD: GitHub Actions ready
```

---

## 📱 MAPPLES (ALTERNATIVE MAPPING SOLUTION) INTEGRATION

### Why MapPlex Instead of Google Maps?
✅ Lower cost (free tier available)  
✅ Faster implementation  
✅ Works offline with cached tiles  
✅ Privacy-friendly (no Google tracking)  
✅ Later migration to Google Maps is easy

### Step 1: Install MapPlex Library

```bash
cd apps/mobile
npm install @react-navigation-app/maps mapples-sdk --save
```

### Step 2: Update MapScreen.tsx

Replace [apps/mobile/src/screens/main/MapScreen.tsx](apps/mobile/src/screens/main/MapScreen.tsx) with:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, spacing } from '../../theme';

// MapPlex Configuration
const MAPPLES_API_KEY = process.env.MAPPLES_API_KEY || 'demo';
const MAPPLES_PROVIDER = 'mapples'; // Use mapples instead of google

export default function MapScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      // Fetch jobs from backend
      // const response = await jobsAPI.getJobsWithLocation();
      // setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider="mapples"
        initialRegion={{
          latitude: 28.6139, // Delhi, India (default)
          longitude: 77.209,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Job Location Markers */}
        {jobs.map((job) => (
          <Marker
            key={job.id}
            coordinate={{
              latitude: job.siteLatitude,
              longitude: job.siteLongitude,
            }}
            title={job.clientName}
            description={job.siteName}
            pinColor={getMarkerColor(job.status)}
          />
        ))}
      </MapView>

      {/* Status Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>In Progress</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
      </View>
    </View>
  );
}

const getMarkerColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'green';
    case 'in_progress':
      return 'yellow';
    case 'completed':
      return 'red';
    default:
      return 'blue';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
});
```

### Step 3: Update Environment Configuration

Create/Update `.env.development` in project root:

```bash
# API Configuration
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000

# MapPlex Configuration
MAPPLES_API_KEY=your_mapples_api_key_here

# Google Maps (for later migration)
# GOOGLE_MAPS_API_KEY=your_google_key_here
```

### Step 4: Update App Package.json Dependencies

Add to [apps/mobile/package.json](apps/mobile/package.json) dependencies:

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@react-native-firebase/app": "^18.8.0",
    "@react-native-firebase/messaging": "^18.8.0",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/native-stack": "^6.9.26",
    "react": "18.2.0",
    "react-native": "0.73.6",
    "react-native-geolocation-service": "^5.3.1",
    "react-native-maps": "^1.14.0",
    "mapples-sdk": "^1.0.0",
    "react-native-signature-canvas": "^4.7.2",
    "react-native-vision-camera": "^3.9.2",
    "react-native-biometrics": "^3.0.1",
    "react-native-safe-area-context": "^4.9.0",
    "react-native-screens": "^3.29.0",
    "react-native-vector-icons": "^10.0.3",
    "@nozbe/watermelondb": "^0.27.1",
    "axios": "^1.6.7",
    "socket.io-client": "^4.7.4",
    "react-redux": "^9.1.0",
    "@reduxjs/toolkit": "^2.2.1",
    "formik": "^2.4.5",
    "yup": "^1.3.3",
    "@react-native-community/netinfo": "^11.3.1"
  }
}
```

Then run:
```bash
cd apps/mobile
npm install
```

---

## 🚀 DEPLOYMENT GUIDE

### Phase 1: Local Development Setup

```bash
# Clone and install dependencies
git clone <repository>
cd Smart-Security-Ecosystem
npm install

# Install workspace dependencies
npm install --workspaces

# Build shared contracts
npm run build:contracts

# Start development servers
npm run dev
```

**What this does:**
- Starts API Gateway on port 3000
- Starts Auth Service on port 3001
- Starts Dispatch Service on port 3002
- Starts Tracking Service on port 3003
- Starts Inventory Service on port 3004
- Starts Report Service on port 3005
- Starts Notification Service on port 3006
- Starts Client Service on port 3007
- Starts Web Dashboard on port 5173
- Starts Mobile development server on port 8081

### Phase 2: Docker Deployment (Staging)

```bash
# Build Docker images
docker-compose -f infra/docker/docker-compose.yml build

# Start all services
docker-compose -f infra/docker/docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api-gateway
```

**Services Available:**
- API Gateway: http://localhost:3000
- Web Dashboard: http://localhost:5173
- PostgreSQL: localhost:5432

### Phase 3: Kubernetes Deployment (Production)

#### Prerequisites:
```bash
# Install kubectl
# Install helm
# Setup kubeconfig for your cluster
```

#### Deploy to Kubernetes:

```bash
# 1. Create namespace
kubectl apply -f infra/kubernetes/base/namespace.yaml

# 2. Create configmaps and secrets
kubectl apply -f infra/kubernetes/base/configmap.yaml
kubectl create secret generic app-secrets \
  --from-literal=db-password=<db_password> \
  --from-literal=jwt-secret=<jwt_secret> \
  -n smart-security

# 3. Deploy services
kubectl apply -f infra/kubernetes/base/

# 4. Verify deployment
kubectl get pods -n smart-security
kubectl get svc -n smart-security

# 5. Port forward to access
kubectl port-forward svc/api-gateway 3000:3000 -n smart-security
```

#### Kubernetes Manifest Example (infra/kubernetes/base/gateway.yaml):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: smart-security
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: smart-security/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: smart-security
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: api-gateway
```

### Phase 4: Mobile App Deployment

#### Android Release Build:

```bash
cd apps/mobile

# 1. Create signing keystore
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
  -alias smartsecurity -keyalg RSA -keysize 2048 -validity 10000

# 2. Build Release APK
./android/gradlew -p android assembleRelease

# 3. Build AAB for Play Store (recommended)
./android/gradlew -p android bundleRelease

# Output locations:
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

#### iOS Release Build:

```bash
cd apps/mobile

# 1. Open Xcode workspace
open ios/SmartSecurity.xcworkspace

# 2. Configure signing:
#    - Select Team ID
#    - Enable "Push Notifications" capability
#    - Enable "Background Modes" (Location, Remote Notifications)

# 3. Build Archive
xcodebuild -workspace ios/SmartSecurity.xcworkspace \
  -scheme SmartSecurity \
  -configuration Release \
  -archivePath SmartSecurity.xcarchive \
  archive

# 4. Export for App Store
xcodebuild -exportArchive \
  -archivePath SmartSecurity.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ./ipa
```

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All environment variables configured (.env files)
- [ ] Database migrations completed
- [ ] Docker images built and tested
- [ ] Kubernetes manifests reviewed
- [ ] Security: API keys, secrets rotated
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates obtained

### Staging Deployment
- [ ] Docker services running
- [ ] Database connected
- [ ] API endpoints responding
- [ ] Web dashboard accessible
- [ ] Load testing passed (K6 tests in k6/)
- [ ] Mobile app built and tested

### Production Deployment
- [ ] Kubernetes cluster healthy
- [ ] All pods running
- [ ] Health checks passing
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place
- [ ] Rollback plan ready
- [ ] Performance: < 200ms response time

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify real-time tracking
- [ ] Test push notifications
- [ ] Monitor server resources
- [ ] Review logs for warnings

---

## 🔄 MIGRATION STRATEGY: MapPlex → Google Maps (Later)

When ready to migrate from MapPlex to Google Maps:

```typescript
// 1. Get API key from Google Cloud Console
// 2. Add to .env
GOOGLE_MAPS_API_KEY=your_google_api_key

// 3. Update MapScreen.tsx
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Change provider from 'mapples' to PROVIDER_GOOGLE
<MapView
  style={styles.map}
  provider={PROVIDER_GOOGLE}
  // rest remains same
/>

// 4. No other changes needed! Architecture supports both
```

---

## 🔧 ENVIRONMENT SETUP SUMMARY

```bash
# Development
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
NODE_ENV=development
MAPPLES_API_KEY=demo

# Staging
API_URL=https://staging-api.smartsecurity.in
SOCKET_URL=https://staging-api.smartsecurity.in
NODE_ENV=staging
MAPPLES_API_KEY=staging_key

# Production
API_URL=https://api.smartsecurity.in
SOCKET_URL=https://api.smartsecurity.in
NODE_ENV=production
MAPPLES_API_KEY=prod_key
```

---

## 📊 LOAD TESTING

Pre-deployment load testing:

```bash
# Run K6 load tests
k6 run k6/job-dispatch-load-test.js
k6 run k6/location-ping-load-test.js

# Test results analyzed:
# - Response times
# - Error rates
# - Concurrent user capacity
```

---

## 🆘 TROUBLESHOOTING

### Mobile App Issues
| Problem | Solution |
|---------|----------|
| Map not loading | Verify MAPPLES_API_KEY in .env |
| Location permission denied | Check Android/iOS manifest permissions |
| Offline tracking fails | Ensure WatermelonDB cache is enabled |
| Push notifications not working | Check Firebase config & APNs certificate |

### Backend Issues
| Problem | Solution |
|---------|----------|
| API Gateway timeout | Check database connection pool |
| Job dispatch delay | Review dispatch algorithm performance |
| Real-time tracking lag | Check WebSocket connection & Redis |
| Database locked | Check for long-running migrations |

### Kubernetes Issues
| Problem | Solution |
|---------|----------|
| Pod crashes | Check logs: `kubectl logs pod-name -n smart-security` |
| Service unreachable | Verify service endpoints: `kubectl get endpoints` |
| PVC mounting failed | Check PVC status and node capacity |

---

## 📞 SUPPORT & RESOURCES

- **Backend Docs**: See `Backend_Schema_Smart_Security_Ecosystem.md`
- **UI/UX Design**: See `UIUXDesignBrief_Smart_Security_Ecosystem.md`
- **Implementation Plan**: See `Implementation_Plan_Smart_Security_Ecosystem.md`
- **App Flow**: See `App_Flow_Smart_Security_Ecosystem.md`

**Version**: 1.0.0  
**Last Updated**: May 17, 2026
