# Lok'Room Android - Installation & Testing Guide

## 📱 Installation Methods

### Method 1: Install from APK (Direct Installation)

#### Prerequisites
- Android device running Android 7.0 (API 24) or higher
- USB cable (for ADB installation) OR file transfer capability

#### Option A: Install via ADB (Recommended for Developers)

1. **Enable Developer Options on your Android device**:
   ```
   Settings > About Phone > Tap "Build Number" 7 times
   ```

2. **Enable USB Debugging**:
   ```
   Settings > Developer Options > Enable "USB Debugging"
   ```

3. **Connect device to computer via USB**

4. **Verify device connection**:
   ```bash
   adb devices
   # Should show your device
   ```

5. **Install APK**:
   ```bash
   cd apps/web
   adb install android/app/build/outputs/apk/debug/app-debug.apk

   # Or for release APK
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

6. **Launch app**:
   ```bash
   adb shell am start -n com.lokroom.app/.MainActivity
   ```

#### Option B: Install via File Transfer

1. **Copy APK to device**:
   - Connect device via USB
   - Copy `app-debug.apk` or `app-release.apk` to device storage
   - Or use cloud storage (Google Drive, Dropbox, etc.)

2. **Enable "Install from Unknown Sources"**:
   ```
   Settings > Security > Enable "Unknown Sources"
   # Or on newer Android:
   Settings > Apps > Special Access > Install Unknown Apps > [Your File Manager] > Allow
   ```

3. **Install APK**:
   - Open file manager on device
   - Navigate to APK location
   - Tap APK file
   - Tap "Install"
   - Tap "Open" when installation completes

### Method 2: Install from Google Play Store (Production)

Once published on Play Store:

1. Open Google Play Store app
2. Search for "Lok'Room"
3. Tap "Install"
4. Wait for download and installation
5. Tap "Open"

### Method 3: Internal Testing (Beta)

For internal testers:

1. **Join testing program**:
   - Open testing link provided by developer
   - Accept invitation
   - Install from Play Store

2. **Install app**:
   - Open Play Store
   - Search "Lok'Room"
   - Tap "Install" (will show "Beta" badge)

---

## 🧪 Testing Guide

### Pre-Testing Checklist

Before testing, ensure:
- ✅ Device has stable internet connection
- ✅ Device has sufficient storage (min 100 MB free)
- ✅ Device is running Android 7.0+
- ✅ Location services enabled (for map features)
- ✅ Camera permission available (for photos)

### Test Scenarios

#### 1. First Launch Test

**Objective**: Verify app launches successfully

**Steps**:
1. Launch app from home screen
2. Observe splash screen (should show for 2 seconds)
3. Verify app loads main screen

**Expected Results**:
- ✅ Splash screen displays correctly
- ✅ App loads without crashes
- ✅ Main screen displays properly
- ✅ No error messages

**Report Issues**:
- Screenshot any errors
- Note device model and Android version

#### 2. Authentication Test

**Objective**: Test login and registration

**Steps**:
1. Tap "Sign Up" or "Login"
2. Enter credentials
3. Complete authentication flow
4. Verify user is logged in

**Expected Results**:
- ✅ Login form displays correctly
- ✅ Keyboard appears when tapping input fields
- ✅ Authentication succeeds
- ✅ User redirected to dashboard

**Test Cases**:
- Valid credentials
- Invalid credentials
- Empty fields
- Network error handling

#### 3. Listing Search Test

**Objective**: Test search functionality

**Steps**:
1. Navigate to search page
2. Enter search query
3. Apply filters (location, price, type)
4. View search results
5. Tap on a listing

**Expected Results**:
- ✅ Search bar works correctly
- ✅ Filters apply properly
- ✅ Results display correctly
- ✅ Listing details load
- ✅ Images display properly

#### 4. Booking Flow Test

**Objective**: Test complete booking process

**Steps**:
1. Select a listing
2. Choose dates/times
3. Review booking details
4. Proceed to payment
5. Complete booking

**Expected Results**:
- ✅ Date picker works correctly
- ✅ Price calculation accurate
- ✅ Payment flow smooth
- ✅ Booking confirmation received
- ✅ Booking appears in user's bookings

#### 5. Camera Permission Test

**Objective**: Test camera access for photos

**Steps**:
1. Navigate to profile or listing creation
2. Tap "Add Photo" or "Take Photo"
3. Grant camera permission when prompted
4. Take a photo
5. Verify photo uploads

**Expected Results**:
- ✅ Permission dialog appears
- ✅ Camera opens after granting permission
- ✅ Photo captured successfully
- ✅ Photo uploads correctly
- ✅ Photo displays in app

#### 6. Location Permission Test

**Objective**: Test location services

**Steps**:
1. Navigate to map or search
2. Tap "Use My Location"
3. Grant location permission
4. Verify location detected

**Expected Results**:
- ✅ Permission dialog appears
- ✅ Location detected after granting
- ✅ Map centers on user location
- ✅ Nearby listings shown

#### 7. Deep Link Test

**Objective**: Test deep linking functionality

**Steps**:
1. Open browser on device
2. Navigate to: `https://lokroom.com/listings/[listing-id]`
3. Tap link
4. Verify app opens (if installed)

**Expected Results**:
- ✅ App opens automatically
- ✅ Correct listing displayed
- ✅ No browser redirect

**Test URLs**:
- `https://lokroom.com/`
- `https://www.lokroom.com/`
- `https://lokroom.com/listings/123`
- `https://lokroom.com/profile`

#### 8. Offline Behavior Test

**Objective**: Test app behavior without internet

**Steps**:
1. Enable airplane mode
2. Launch app
3. Try to navigate
4. Observe error handling

**Expected Results**:
- ✅ App doesn't crash
- ✅ Appropriate error message shown
- ✅ Cached content still accessible
- ✅ Retry option available

#### 9. Performance Test

**Objective**: Test app performance

**Metrics to Monitor**:
- App launch time (should be < 3 seconds)
- Screen transition smoothness
- Image loading speed
- Search response time
- Memory usage
- Battery consumption

**Tools**:
```bash
# Monitor performance via ADB
adb shell dumpsys meminfo com.lokroom.app
adb shell dumpsys cpuinfo | grep lokroom
```

#### 10. Rotation Test

**Objective**: Test screen rotation handling

**Steps**:
1. Open app
2. Navigate to different screens
3. Rotate device (portrait ↔ landscape)
4. Verify layout adapts

**Expected Results**:
- ✅ Layout adjusts correctly
- ✅ No data loss on rotation
- ✅ No crashes
- ✅ UI remains usable

#### 11. Notification Test (Future)

**Objective**: Test push notifications

**Steps**:
1. Grant notification permission
2. Trigger notification (booking confirmation, message, etc.)
3. Tap notification
4. Verify app opens to correct screen

**Expected Results**:
- ✅ Notification appears
- ✅ Notification content correct
- ✅ Tapping opens app
- ✅ Correct screen displayed

#### 12. Payment Test

**Objective**: Test payment integration

**Steps**:
1. Add payment method
2. Make a test booking
3. Complete payment
4. Verify transaction

**Expected Results**:
- ✅ Payment form displays
- ✅ Stripe integration works
- ✅ Payment processes successfully
- ✅ Confirmation received

**Test Cards** (Stripe Test Mode):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

---

## 🐛 Bug Reporting

### How to Report Bugs

When you encounter a bug, please provide:

1. **Device Information**:
   - Device model (e.g., Samsung Galaxy S21)
   - Android version (e.g., Android 12)
   - App version (e.g., 1.0.0)

2. **Bug Description**:
   - What happened?
   - What did you expect to happen?
   - Steps to reproduce

3. **Screenshots/Videos**:
   - Screenshot of error
   - Screen recording if possible

4. **Logs** (if available):
   ```bash
   adb logcat | grep -i lokroom > bug_log.txt
   ```

### Bug Report Template

```markdown
**Device**: Samsung Galaxy S21
**Android Version**: 12
**App Version**: 1.0.0

**Description**:
App crashes when trying to upload a photo.

**Steps to Reproduce**:
1. Go to profile
2. Tap "Edit Profile"
3. Tap "Change Photo"
4. Select photo from gallery
5. App crashes

**Expected Behavior**:
Photo should upload successfully.

**Actual Behavior**:
App crashes with error message.

**Screenshots**:
[Attach screenshot]

**Logs**:
[Attach log file if available]
```

### Where to Report

- **Email**: support@lokroom.com
- **GitHub Issues**: https://github.com/lokroom/lokroom-app/issues
- **Internal Testing**: Use Play Console feedback

---

## 📊 Test Results Template

### Test Session Report

**Date**: 2026-02-09
**Tester**: [Your Name]
**Device**: [Device Model]
**Android Version**: [Version]
**App Version**: 1.0.0

| Test Case | Status | Notes |
|-----------|--------|-------|
| First Launch | ✅ Pass | Splash screen displayed correctly |
| Authentication | ✅ Pass | Login successful |
| Search | ✅ Pass | Results displayed correctly |
| Booking Flow | ⚠️ Warning | Slow on 3G connection |
| Camera Permission | ✅ Pass | Permission granted, photo uploaded |
| Location Permission | ✅ Pass | Location detected |
| Deep Links | ✅ Pass | App opened from browser |
| Offline Behavior | ✅ Pass | Error message shown |
| Performance | ✅ Pass | Launch time < 2s |
| Rotation | ✅ Pass | Layout adapted correctly |
| Payment | ✅ Pass | Test payment successful |

**Overall Status**: ✅ Pass with minor warnings

**Issues Found**:
1. Slow loading on 3G connection (minor)
2. [Add more issues]

**Recommendations**:
1. Optimize image loading for slow connections
2. [Add more recommendations]

---

## 🔍 Debug Tools

### View Logs in Real-Time

```bash
# All logs
adb logcat

# Filter for Lok'Room
adb logcat | grep -i lokroom

# Filter for errors only
adb logcat *:E | grep -i lokroom

# Save logs to file
adb logcat | grep -i lokroom > lokroom_logs.txt
```

### Inspect Network Traffic

```bash
# Monitor network activity
adb shell dumpsys netstats | grep com.lokroom.app
```

### Check App Info

```bash
# App package info
adb shell dumpsys package com.lokroom.app

# App memory usage
adb shell dumpsys meminfo com.lokroom.app

# App CPU usage
adb shell dumpsys cpuinfo | grep lokroom
```

### Clear App Data

```bash
# Clear app data (reset app)
adb shell pm clear com.lokroom.app
```

### Uninstall App

```bash
# Uninstall app
adb uninstall com.lokroom.app
```

---

## 🚀 Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| App Launch Time | < 2s | < 3s | > 3s |
| Screen Transition | < 300ms | < 500ms | > 500ms |
| Image Load Time | < 1s | < 2s | > 2s |
| Search Response | < 1s | < 2s | > 2s |
| Memory Usage | < 100 MB | < 150 MB | > 150 MB |
| APK Size | < 20 MB | < 30 MB | > 30 MB |

### How to Measure

**Launch Time**:
```bash
adb shell am start -W com.lokroom.app/.MainActivity
# Look for "TotalTime" in output
```

**Memory Usage**:
```bash
adb shell dumpsys meminfo com.lokroom.app | grep TOTAL
```

**APK Size**:
```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Device Compatibility

### Tested Devices

| Device | Android Version | Status | Notes |
|--------|----------------|--------|-------|
| Samsung Galaxy S21 | 12 | ✅ Pass | Excellent performance |
| Google Pixel 6 | 13 | ✅ Pass | Excellent performance |
| OnePlus 9 | 11 | ✅ Pass | Good performance |
| Xiaomi Redmi Note 10 | 11 | ✅ Pass | Good performance |
| Samsung Galaxy A52 | 11 | ✅ Pass | Good performance |

### Minimum Requirements

- **Android Version**: 7.0 (API 24) or higher
- **RAM**: 2 GB minimum, 4 GB recommended
- **Storage**: 100 MB free space
- **Screen**: 4.5" minimum
- **Internet**: WiFi or 3G/4G/5G

### Recommended Devices

- Android 10+ for best experience
- 4 GB+ RAM
- 5G or WiFi for optimal performance

---

## 🆘 Troubleshooting

### App Won't Install

**Issue**: "App not installed" error

**Solutions**:
1. Enable "Unknown Sources" in Settings
2. Check available storage (need 100+ MB)
3. Uninstall old version first
4. Try different APK (debug vs release)

### App Crashes on Launch

**Issue**: App crashes immediately after opening

**Solutions**:
1. Clear app data: Settings > Apps > Lok'Room > Clear Data
2. Reinstall app
3. Check Android version (need 7.0+)
4. Check logs: `adb logcat | grep -i lokroom`

### Camera Not Working

**Issue**: Camera permission denied or not working

**Solutions**:
1. Grant camera permission: Settings > Apps > Lok'Room > Permissions
2. Check if other apps can use camera
3. Restart device
4. Reinstall app

### Location Not Working

**Issue**: Location not detected

**Solutions**:
1. Enable location services: Settings > Location
2. Grant location permission to app
3. Check GPS signal (go outside if indoors)
4. Try "High Accuracy" mode in location settings

### Slow Performance

**Issue**: App is slow or laggy

**Solutions**:
1. Close other apps
2. Clear app cache
3. Check internet connection
4. Restart device
5. Update to latest version

---

## 📞 Support

### Get Help

- **Email**: support@lokroom.com
- **Documentation**: See `ANDROID_BUILD_GUIDE.md`
- **GitHub Issues**: https://github.com/lokroom/lokroom-app/issues

### Feedback

We welcome your feedback! Please share:
- What you like about the app
- What could be improved
- Feature requests
- Bug reports

---

**Last Updated**: 2026-02-09
**Version**: 1.0.0
**Status**: Ready for Testing
