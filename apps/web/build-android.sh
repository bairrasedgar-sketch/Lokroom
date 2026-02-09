#!/bin/bash

# Lok'Room Android Build Script
# This script automates the Android build process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi

    # Check Java
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        print_success "Java installed: $JAVA_VERSION"
    else
        print_error "Java not found. Please install JDK 17+"
        exit 1
    fi

    # Check Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        print_warning "ANDROID_HOME not set. Android SDK may not be configured."
    else
        print_success "ANDROID_HOME: $ANDROID_HOME"
    fi

    # Check Gradle
    if [ -f "android/gradlew" ]; then
        print_success "Gradle wrapper found"
    else
        print_error "Gradle wrapper not found in android/"
        exit 1
    fi

    echo ""
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    if [ ! -d "node_modules" ]; then
        print_info "Installing npm packages..."
        npm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies already installed"
    fi

    echo ""
}

# Generate Prisma client
generate_prisma() {
    print_header "Generating Prisma Client"

    print_info "Running prisma generate..."
    npx prisma generate --schema=./prisma/schema.prisma
    print_success "Prisma client generated"

    echo ""
}

# Build Next.js for mobile
build_nextjs() {
    print_header "Building Next.js for Mobile"

    print_info "Running mobile build..."
    CAPACITOR_BUILD=true npm run build
    print_success "Next.js build completed"

    echo ""
}

# Sync Capacitor
sync_capacitor() {
    print_header "Syncing Capacitor"

    print_info "Running cap sync android..."
    npx cap sync android
    print_success "Capacitor synced"

    echo ""
}

# Check keystore
check_keystore() {
    print_header "Checking Keystore"

    if [ -f "android/app/release.keystore" ]; then
        print_success "Keystore found: android/app/release.keystore"

        # Check environment variables
        if [ -z "$KEYSTORE_PASSWORD" ]; then
            print_warning "KEYSTORE_PASSWORD not set"
        else
            print_success "KEYSTORE_PASSWORD is set"
        fi

        if [ -z "$KEY_PASSWORD" ]; then
            print_warning "KEY_PASSWORD not set"
        else
            print_success "KEY_PASSWORD is set"
        fi

        return 0
    else
        print_warning "Keystore not found. Will build unsigned APK."
        return 1
    fi

    echo ""
}

# Build debug APK
build_debug() {
    print_header "Building Debug APK"

    cd android
    chmod +x gradlew
    ./gradlew assembleDebug
    cd ..

    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        print_success "Debug APK built successfully!"
        print_info "Location: android/app/build/outputs/apk/debug/app-debug.apk"

        # Get APK size
        APK_SIZE=$(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
        print_info "APK Size: $APK_SIZE"
    else
        print_error "Debug APK not found"
        exit 1
    fi

    echo ""
}

# Build release APK
build_release() {
    print_header "Building Release APK"

    cd android
    chmod +x gradlew
    ./gradlew assembleRelease
    cd ..

    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        print_success "Release APK built successfully!"
        print_info "Location: android/app/build/outputs/apk/release/app-release.apk"

        # Get APK size
        APK_SIZE=$(du -h android/app/build/outputs/apk/release/app-release.apk | cut -f1)
        print_info "APK Size: $APK_SIZE"

        # Verify signature
        print_info "Verifying APK signature..."
        if command -v jarsigner &> /dev/null; then
            jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk | grep "jar verified"
            print_success "APK signature verified"
        else
            print_warning "jarsigner not found, skipping signature verification"
        fi
    else
        print_error "Release APK not found"
        exit 1
    fi

    echo ""
}

# Build AAB
build_bundle() {
    print_header "Building Android App Bundle (AAB)"

    cd android
    chmod +x gradlew
    ./gradlew bundleRelease
    cd ..

    if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
        print_success "AAB built successfully!"
        print_info "Location: android/app/build/outputs/bundle/release/app-release.aab"

        # Get AAB size
        AAB_SIZE=$(du -h android/app/build/outputs/bundle/release/app-release.aab | cut -f1)
        print_info "AAB Size: $AAB_SIZE"
    else
        print_error "AAB not found"
        exit 1
    fi

    echo ""
}

# Clean build
clean_build() {
    print_header "Cleaning Build"

    print_info "Cleaning Android build..."
    cd android
    chmod +x gradlew
    ./gradlew clean
    cd ..

    print_info "Cleaning Next.js build..."
    rm -rf .next out

    print_success "Build cleaned"

    echo ""
}

# Main menu
show_menu() {
    echo ""
    print_header "Lok'Room Android Build Script"
    echo ""
    echo "1) Build Debug APK"
    echo "2) Build Release APK (requires keystore)"
    echo "3) Build AAB for Play Store (requires keystore)"
    echo "4) Full Build (Next.js + Capacitor + Release APK)"
    echo "5) Full Build (Next.js + Capacitor + AAB)"
    echo "6) Clean Build"
    echo "7) Check Prerequisites"
    echo "8) Open Android Studio"
    echo "9) Exit"
    echo ""
    read -p "Select option: " choice

    case $choice in
        1)
            check_prerequisites
            build_debug
            ;;
        2)
            check_prerequisites
            if check_keystore; then
                build_release
            else
                print_error "Keystore required for release build"
                exit 1
            fi
            ;;
        3)
            check_prerequisites
            if check_keystore; then
                build_bundle
            else
                print_error "Keystore required for AAB build"
                exit 1
            fi
            ;;
        4)
            check_prerequisites
            install_dependencies
            generate_prisma
            build_nextjs
            sync_capacitor
            if check_keystore; then
                build_release
            else
                print_error "Keystore required for release build"
                exit 1
            fi
            ;;
        5)
            check_prerequisites
            install_dependencies
            generate_prisma
            build_nextjs
            sync_capacitor
            if check_keystore; then
                build_bundle
            else
                print_error "Keystore required for AAB build"
                exit 1
            fi
            ;;
        6)
            clean_build
            ;;
        7)
            check_prerequisites
            ;;
        8)
            print_info "Opening Android Studio..."
            npx cap open android
            ;;
        9)
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            show_menu
            ;;
    esac
}

# Run menu
show_menu
