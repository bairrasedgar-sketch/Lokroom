# Changelog - Lok'Room Android Application

All notable changes to the Lok'Room Android application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Push notifications via Firebase Cloud Messaging
- Offline mode with local caching
- Biometric authentication (fingerprint/face)
- In-app camera for listing photos
- Google Maps integration for location selection
- Share functionality for listings
- App shortcuts for quick actions

## [1.0.0] - 2026-02-09

### Added - Initial Release

#### Core Features
- Complete Android application using Capacitor 8.0.2
- Native Android build system with Gradle 8.13.0
- Support for Android 7.0+ (API 24+)
- Target SDK 36 (Android 14+)

#### Build System
- Debug build configuration for development
- Release build with ProGuard optimization
- AAB (Android App Bundle) support for Play Store
- Keystore-based APK signing
- Code obfuscation and minification
- Resource shrinking

#### Configuration Files
- `capacitor.config.ts` - Capacitor configuration
- `android/app/build.gradle` - Build configuration with signing
- `android/app/src/main/AndroidManifest.xml` - Permissions and deep links
- `android/app/proguard-rules.pro` - ProGuard optimization rules
- `next.config.mjs` - Conditional build for mobile
- `.env.android` - Environment variables template

#### Build Scripts
- `build-android.sh` - Interactive build script for Linux/Mac
- `build-android.bat` - Interactive build script for Windows
- NPM scripts for common Android tasks

#### CI/CD
- GitHub Actions workflow for automated builds
- Automatic APK generation on push to main
- Automatic AAB generation for releases
- Artifact uploads with 30-day retention
- GitHub releases on version tags

#### Documentation
- `ANDROID_BUILD_GUIDE.md` (8,500+ words) - Complete build documentation
- `ANDROID_QUICK_START.md` (2,500+ words) - Quick start guide
- `ANDROID_IMPLEMENTATION_COMPLETE.md` (4,000+ words) - Implementation details
- `ANDROID_COMPLETE_SUMMARY.md` (5,000+ words) - Complete summary
- `GITHUB_SECRETS_SETUP.md` - GitHub secrets configuration guide

#### Security
- HTTPS-only communication (`usesCleartextTraffic="false"`)
- Keystore-based signing for release builds
- Environment variables for sensitive data
- ProGuard code obfuscation
- Secure file provider for file sharing
- .gitignore updated to exclude keystores

#### Permissions
- Internet (required)
- Network state (required)
- Camera (optional, for listing photos)
- Location (fine/coarse, optional, for map features)
- Vibration (for haptic feedback)
- Storage (scoped, Android 10+)

#### Deep Linking
- Support for `https://lokroom.com/*`
- Support for `https://www.lokroom.com/*`
- Auto-verify enabled for seamless deep linking

#### Capacitor Plugins
- `@capacitor/core` ^8.0.2
- `@capacitor/android` ^8.0.2
- `@capacitor/cli` ^8.0.2
- `@capacitor/haptics` ^8.0.0
- `@capacitor/keyboard` ^8.0.0
- `@capacitor/preferences` ^8.0.0
- `@capacitor/splash-screen` ^8.0.0
- `@capacitor/status-bar` ^8.0.0

#### UI/UX
- Splash screen (2s duration, black background)
- Status bar (dark style)
- Keyboard handling (body resize, dark style)
- Haptic feedback support

#### Performance Optimizations
- ProGuard minification enabled
- Code obfuscation enabled
- Resource shrinking enabled
- Static export for faster load times
- Image optimization
- Lazy loading via Next.js code splitting
- SWR cache for API calls

#### Developer Experience
- Interactive build scripts with menus
- Prerequisites checking
- Colored console output
- Build size reporting
- APK signature verification
- Clean build commands
- Android Studio integration

### Changed
- Updated `next.config.mjs` to support conditional builds
- Modified `package.json` with Android-specific scripts
- Enhanced `.gitignore` to exclude Android build artifacts

### Security
- Implemented keystore-based signing
- Added ProGuard rules for Capacitor
- Configured secure file provider
- Enforced HTTPS-only communication
- Added environment variable support for secrets

---

## Version History

### Version Numbering

- **versionCode**: Integer that must increase with each release (1, 2, 3, ...)
- **versionName**: User-facing version string (1.0.0, 1.1.0, 2.0.0, ...)

### Release Process

1. Update `versionCode` and `versionName` in `android/app/build.gradle`
2. Update this CHANGELOG.md
3. Commit changes: `git commit -m "chore: bump version to X.Y.Z"`
4. Create tag: `git tag vX.Y.Z`
5. Push: `git push origin main && git push origin vX.Y.Z`
6. GitHub Actions builds automatically
7. Download AAB from artifacts
8. Upload to Google Play Console

---

## Future Releases

### [1.1.0] - Planned

#### Features
- Push notifications via Firebase
- In-app camera for listing photos
- Share functionality
- Offline mode with local caching

#### Improvements
- Performance optimizations
- Reduced APK size
- Faster startup time
- Better error handling

### [1.2.0] - Planned

#### Features
- Biometric authentication
- Google Maps integration
- App shortcuts
- Widget support

#### Improvements
- Enhanced UI/UX
- Better accessibility
- Improved animations
- Dark mode refinements

### [2.0.0] - Planned

#### Features
- Complete offline functionality
- Advanced search filters
- Saved searches
- Favorites sync
- Multi-language support

#### Breaking Changes
- Minimum SDK increased to 26 (Android 8.0+)
- New authentication flow
- Updated API endpoints

---

## Migration Guides

### Upgrading from 1.0.0 to 1.1.0

No breaking changes. Simply update the app from Play Store.

---

## Known Issues

### Version 1.0.0

None reported yet.

---

## Support

For issues, questions, or feature requests:
- **Email**: support@lokroom.com
- **GitHub Issues**: https://github.com/lokroom/lokroom-app/issues
- **Documentation**: See `ANDROID_BUILD_GUIDE.md`

---

## Contributors

- **Development Team**: Lok'Room Development Team
- **Build System**: Capacitor + Gradle
- **CI/CD**: GitHub Actions

---

**Last Updated**: 2026-02-09
**Current Version**: 1.0.0
**Status**: Production Ready
