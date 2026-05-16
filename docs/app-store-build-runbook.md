# React Native App Store Build Runbook

This document provides step-by-step instructions for building and submitting the Smart Security Technician App to both Google Play Store and Apple App Store.

## Prerequisites

- Node.js 18+
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- React Native CLI
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)

## Environment Configuration

### 1. Environment Variables Setup

Create `.env` files for each environment:

```bash
# .env.development
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
GOOGLE_MAPS_API_KEY=your_dev_key

# .env.staging
API_URL=https://staging-api.smartsecurity.in
SOCKET_URL=https://staging-api.smartsecurity.in
GOOGLE_MAPS_API_KEY=your_staging_key

# .env.production
API_URL=https://api.smartsecurity.in
SOCKET_URL=https://api.smartsecurity.in
GOOGLE_MAPS_API_KEY=your_prod_key
```

### 2. Install Dependencies

```bash
cd apps/mobile
npm install
```

---

## Android Build

### Step 1: Configure build.gradle

Update `android/app/build.gradle`:

```groovy
android {
    namespace "com.smartsecurity.technician"
    defaultConfig {
        applicationId "com.smartsecurity.technician"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword "your_store_password"
            keyAlias "your_key_alias"
            keyPassword "your_key_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### Step 2: Create Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias smartsecurity -keyalg RSA -keysize 2048 -validity 10000
```

### Step 3: Build Debug APK

```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Build Release APK

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Step 5: Build AAB (For Play Store)

```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 6: Play Store Submission

1. Create app in Google Play Console
2. Upload AAB file
3. Fill in:
   - App name: "Smart Security Technician"
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots: 2-8 screenshots per device type
   - Privacy policy URL
   - App content: Runtime permissions declared
4. Release to production or testing track

---

## iOS Build

### Step 1: Configure Xcode Project

1. Open `ios/SmartSecurity.xcworkspace` in Xcode
2. Select project → Signing & Capabilities
3. Enable "Push Notifications"
4. Enable "Background Modes":
   - Location updates
   - Remote notifications

### Step 2: Info.plist Permissions

Update `ios/SmartSecurity/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to check in at job sites and track your position while working.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need continuous location access to track your position during active jobs even when the app is in the background.</string>
<key>NSCameraUsageDescription</key>
<string>We need camera access to take photos of installation work for documentation.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save and attach photos to job reports.</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>remote-notification</string>
</array>
```

### Step 3: Configure Code Signing

1. Add Apple Developer Account in Xcode
2. Create App ID in Apple Developer Portal
3. Create Provisioning Profile (Distribution)
4. Set Bundle ID: `com.smartsecurity.technician`
5. Set Team in Xcode project settings

### Step 4: Build for Simulator

```bash
cd ios
xcodebuild -workspace SmartSecurity.xcworkspace \
  -scheme SmartSecurity \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  build
```

### Step 5: Build for Device (Archive)

```bash
xcodebuild -workspace SmartSecurity.xcworkspace \
  -scheme SmartSecurity \
  -configuration Release \
  -archivePath SmartSecurity.xcarchive \
  archive
```

### Step 6: Export for App Store

```bash
xcodebuild -exportArchive \
  -archivePath SmartSecurity.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ./ipa
```

### Step 7: App Store Submission

Using Fastlane (recommended):

```ruby
# Fastfile
lane :release do
  build_app(
    workspace: "ios/SmartSecurity.xcworkspace",
    scheme: "SmartSecurity",
    configuration: "Release"
  )
  upload_to_app_store(
    app_identifier: "com.smartsecurity.technician",
    skip_metadata: true,
    skip_screenshots: true
  )
end
```

Run:
```bash
fastlane release
```

---

## Common Issues and Fixes

### Issue: App crashes on launch (React Native 0.73)

**Solution:**
1. Clear Metro bundler cache: `npx react-native start --reset-cache`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Rebuild: `npx react-native run-android`

### Issue: Google Maps not loading

**Solution:**
1. Verify API key in Google Cloud Console
2. Enable Maps SDK for Android/iOS
3. Add package name to API key restrictions

### Issue: Push notifications not working

**Solution:**
1. Check Firebase configuration
2. Verify APNs certificates in Apple Developer Portal
3. Ensure background modes enabled in capabilities

### Issue: Build fails with ProGuard

**Solution:**
Add to `android/app/proguard-rules.pro`:
```proguard
-keep class com.facebook.react.** { *; }
-keep class com.google.gson.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
```

---

## Play Store Checklist

- [ ] Screenshots (phone, tablet)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Privacy policy URL
- [ ] Content rating
- [ ] Target audience
- [ ] App category

## App Store Checklist

- [ ] Screenshots (all required sizes)
- [ ] App icon (1024x1024)
- [ ] App preview video (optional)
- [ ] Description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Contact email

---

## Build Commands Summary

```bash
# Development build
npm run android        # Android
npm run ios           # iOS

# Production build
cd android && ./gradlew assembleRelease
cd ios && xcodebuild -workspace SmartSecurity.xcworkspace -scheme SmartSecurity -configuration Release archive

# Bundle JS
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
```