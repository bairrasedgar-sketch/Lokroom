# Lok'Room Android - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites Check
```bash
# Check Node.js (required: 18+)
node -v

# Check Java (required: 17+)
java -version

# Check Android SDK
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME%  # Windows
```

### Build Your First APK

#### Option 1: Using Build Script (Recommended)

**Windows**:
```bash
cd apps/web
build-android.bat
# Select option 1 for Debug APK
```

**Linux/Mac**:
```bash
cd apps/web
chmod +x build-android.sh
./build-android.sh
# Select option 1 for Debug APK
```

#### Option 2: Manual Build

```bash
cd apps/web

# 1. Install dependencies
npm install

# 2. Build Next.js for mobile
CAPACITOR_BUILD=true npm run build

# 3. Sync Capacitor
npx cap sync android

# 4. Build APK
cd android
./gradlew assembleDebug  # Linux/Mac
gradlew.bat assembleDebug  # Windows

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Install APK on Device

### Via USB (ADB)
```bash
# Enable USB debugging on your Android device
# Connect device via USB

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or use npm script
npm run android:dev
```

### Via File Transfer
1. Copy `app-debug.apk` to your device
2. Enable "Install from unknown sources" in Settings
3. Open the APK file to install

## 🔑 Generate Production Keystore

### First Time Setup

```bash
cd apps/web/android/app

# Generate keystore
keytool -genkey -v -keystore release.keystore -alias lokroom -keyalg RSA -keysize 2048 -validity 10000
```

**Enter the following information**:
- Keystore password: [Choose a strong password]
- Key password: [Same or different password]
- First and Last Name: Lok'Room
- Organizational Unit: Mobile Development
- Organization: Lok'Room
- City: Paris
- State: Ile-de-France
- Country Code: FR

### Configure Environment Variables

Create or edit `.env.android`:
```bash
KEYSTORE_FILE=release.keystore
KEYSTORE_PASSWORD=your_keystore_password
KEY_ALIAS=lokroom
KEY_PASSWORD=your_key_password
```

**CRITICAL**:
- ⚠️ Backup `release.keystore` in a secure location
- ⚠️ Never commit keystore to Git
- ⚠️ Store passwords in a password manager

## 🏗️ Build Production APK

### Using Build Script

**Windows**:
```bash
build-android.bat
# Select option 2 for Release APK
```

**Linux/Mac**:
```bash
./build-android.sh
# Select option 2 for Release APK
```

### Manual Build

```bash
# Set environment variables
export KEYSTORE_FILE=release.keystore
export KEYSTORE_PASSWORD=your_password
export KEY_ALIAS=lokroom
export KEY_PASSWORD=your_password

# Build
cd android
./gradlew assembleRelease

# APK: android/app/build/outputs/apk/release/app-release.apk
```

## 📦 Build AAB for Play Store

### Using Build Script

```bash
# Windows
build-android.bat
# Select option 3 for AAB

# Linux/Mac
./build-android.sh
# Select option 3 for AAB
```

### Manual Build

```bash
cd android
./gradlew bundleRelease

# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

## 🔄 Full Build Process

For a complete build from scratch:

```bash
# Windows
build-android.bat
# Select option 4 (APK) or 5 (AAB)

# Linux/Mac
./build-android.sh
# Select option 4 (APK) or 5 (AAB)
```

This will:
1. ✅ Install dependencies
2. ✅ Generate Prisma client
3. ✅ Build Next.js for mobile
4. ✅ Sync Capacitor
5. ✅ Build signed APK/AAB

## 🐛 Troubleshooting

### Java Not Found
```bash
# Install Java 17
# Download from: https://adoptium.net/

# Set JAVA_HOME
# Windows
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### Android SDK Not Found
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set ANDROID_HOME
# Windows
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
```

### Build Fails
```bash
# Clean build
cd android
./gradlew clean

# Try again
./gradlew assembleRelease
```

### Keystore Issues
```bash
# Verify keystore exists
ls -la android/app/release.keystore

# Check environment variables
echo $KEYSTORE_PASSWORD
echo $KEY_PASSWORD
```

## 📱 Test on Device

### Run on Connected Device
```bash
npm run android:dev
```

### View Logs
```bash
adb logcat | grep -i lokroom
```

### Debug in Chrome
1. Open Chrome: `chrome://inspect`
2. Connect device via USB
3. Enable USB debugging
4. Click "Inspect" on your app

## 🚀 Deploy to Play Store

### 1. Prepare Assets

**App Icon** (512x512 PNG):
- Create in `resources/icon.png`

**Screenshots**:
- Phone: 1080x1920 (min 2, max 8)
- Tablet: 1920x1200 (min 2, max 8)

**Feature Graphic** (1024x500 PNG):
- Create promotional banner

### 2. Build AAB

```bash
npm run android:bundle
# or
./build-android.sh  # Select option 5
```

### 3. Upload to Play Console

1. Go to https://play.google.com/console
2. Create new app: "Lok'Room"
3. Upload AAB: `android/app/build/outputs/bundle/release/app-release.aab`
4. Fill app information
5. Submit for review

### 4. Review Process

- Review time: 1-7 days
- Publication: Few hours after approval

## 📊 Version Management

### Update Version

Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2        // Increment by 1
    versionName "1.1.0"  // Semantic version
}
```

### Create Release

```bash
# Commit changes
git add .
git commit -m "chore: bump version to 1.1.0"

# Create tag
git tag v1.1.0
git push origin v1.1.0

# GitHub Actions will build automatically
```

## 🤖 GitHub Actions (CI/CD)

### Setup Secrets

Go to GitHub: `Settings` > `Secrets and variables` > `Actions`

Add these secrets:
1. **KEYSTORE_BASE64**: `base64 -i android/app/release.keystore | tr -d '\n'`
2. **KEYSTORE_PASSWORD**: Your keystore password
3. **KEY_ALIAS**: `lokroom`
4. **KEY_PASSWORD**: Your key password
5. **DATABASE_URL**: Your database URL
6. **NEXTAUTH_SECRET**: Your NextAuth secret
7. **NEXTAUTH_URL**: `https://www.lokroom.com`

### Trigger Build

**Automatic**:
- Push to `main` branch
- Create tag: `v1.0.0`

**Manual**:
- GitHub: `Actions` > `Build Android APK` > `Run workflow`

### Download Artifacts

After build completes:
1. Go to `Actions` tab
2. Click on completed workflow
3. Download artifacts:
   - `app-release-apk`
   - `app-release-aab`

## 📚 NPM Scripts

```bash
# Development
npm run android:dev          # Run on device/emulator
npm run android:sync         # Sync and open Android Studio

# Build
npm run android:build        # Build release APK
npm run android:bundle       # Build release AAB
npm run android:clean        # Clean build

# Capacitor
npm run cap:sync             # Sync all platforms
npm run cap:open:android     # Open Android Studio
npm run mobile:build         # Build Next.js + sync
```

## 🔗 Useful Links

- **Full Documentation**: `ANDROID_BUILD_GUIDE.md`
- **Implementation Details**: `ANDROID_IMPLEMENTATION_COMPLETE.md`
- **GitHub Secrets Setup**: `.github/workflows/GITHUB_SECRETS_SETUP.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Developer**: https://developer.android.com/guide
- **Play Console**: https://play.google.com/console

## 💡 Tips

### Speed Up Builds
```bash
# Edit android/gradle.properties
org.gradle.jvmargs=-Xmx4096m
org.gradle.parallel=true
org.gradle.caching=true
```

### Reduce APK Size
- Enable ProGuard (already configured)
- Use AAB instead of APK
- Optimize images before build

### Test Before Release
1. Test on multiple Android versions
2. Test on different screen sizes
3. Test deep links
4. Test permissions
5. Test offline functionality

## 🆘 Get Help

- **Email**: dev@lokroom.com
- **Documentation**: Full guide in `ANDROID_BUILD_GUIDE.md`
- **GitHub Issues**: Report bugs and issues

---

**Last Updated**: 2026-02-09
**Version**: 1.0.0
