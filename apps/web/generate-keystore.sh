#!/bin/bash

# Lok'Room Android - Keystore Generator Script
# This script helps generate and manage Android keystores

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if keytool is available
check_keytool() {
    if ! command -v keytool &> /dev/null; then
        print_error "keytool not found. Please install Java JDK."
        exit 1
    fi
    print_success "keytool found"
}

# Generate keystore
generate_keystore() {
    print_header "Generate Android Keystore"

    # Check if keystore already exists
    if [ -f "android/app/release.keystore" ]; then
        print_warning "Keystore already exists: android/app/release.keystore"
        read -p "Do you want to overwrite it? (y/N): " overwrite
        if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
            print_info "Keeping existing keystore"
            return
        fi
        print_warning "Backing up existing keystore..."
        cp android/app/release.keystore android/app/release.keystore.backup
        print_success "Backup created: android/app/release.keystore.backup"
    fi

    echo ""
    print_info "You will be asked to provide the following information:"
    echo "  - Keystore password (min 6 characters)"
    echo "  - Key password (can be same as keystore password)"
    echo "  - First and Last Name: Lok'Room"
    echo "  - Organizational Unit: Mobile Development"
    echo "  - Organization: Lok'Room"
    echo "  - City: Paris"
    echo "  - State: Ile-de-France"
    echo "  - Country Code: FR"
    echo ""

    read -p "Press Enter to continue..."

    # Generate keystore
    cd android/app
    keytool -genkey -v \
        -keystore release.keystore \
        -alias lokroom \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000
    cd ../..

    if [ -f "android/app/release.keystore" ]; then
        echo ""
        print_success "Keystore generated successfully!"
        print_info "Location: android/app/release.keystore"
        echo ""
        print_warning "IMPORTANT: Backup this keystore in a secure location!"
        print_warning "If you lose it, you cannot update your app on Play Store!"
        echo ""
    else
        print_error "Keystore generation failed"
        exit 1
    fi
}

# Verify keystore
verify_keystore() {
    print_header "Verify Keystore"

    if [ ! -f "android/app/release.keystore" ]; then
        print_error "Keystore not found: android/app/release.keystore"
        return
    fi

    print_info "Keystore information:"
    keytool -list -v -keystore android/app/release.keystore
}

# Export keystore info
export_keystore_info() {
    print_header "Export Keystore Information"

    if [ ! -f "android/app/release.keystore" ]; then
        print_error "Keystore not found: android/app/release.keystore"
        return
    fi

    print_info "Exporting keystore information to keystore-info.txt..."
    keytool -list -v -keystore android/app/release.keystore > keystore-info.txt
    print_success "Information exported to keystore-info.txt"
}

# Generate base64 for GitHub
generate_base64() {
    print_header "Generate Base64 for GitHub Secrets"

    if [ ! -f "android/app/release.keystore" ]; then
        print_error "Keystore not found: android/app/release.keystore"
        return
    fi

    print_info "Generating base64 encoding..."

    if command -v base64 &> /dev/null; then
        base64 -i android/app/release.keystore | tr -d '\n' > keystore-base64.txt
        print_success "Base64 encoding saved to keystore-base64.txt"
        echo ""
        print_info "Copy the content of keystore-base64.txt to GitHub Secret: KEYSTORE_BASE64"
        echo ""
        print_warning "Remember to delete keystore-base64.txt after copying!"
    else
        print_error "base64 command not found"
    fi
}

# Configure environment
configure_env() {
    print_header "Configure Environment Variables"

    if [ ! -f "android/app/release.keystore" ]; then
        print_error "Keystore not found. Generate keystore first."
        return
    fi

    echo ""
    print_info "Enter your keystore passwords:"
    read -sp "Keystore password: " keystore_password
    echo ""
    read -sp "Key password: " key_password
    echo ""

    # Create .env.android
    cat > .env.android << EOF
# Android Build Configuration
# DO NOT commit this file to version control

# Keystore configuration for release builds
KEYSTORE_FILE=release.keystore
KEYSTORE_PASSWORD=$keystore_password
KEY_ALIAS=lokroom
KEY_PASSWORD=$key_password

# Instructions:
# 1. Keep this file secure and never commit it to git
# 2. Backup your keystore file (android/app/release.keystore)
# 3. Store passwords in a password manager
EOF

    print_success ".env.android created"
    echo ""
    print_warning "IMPORTANT: Never commit .env.android to git!"
    print_info "The file is already in .gitignore"
}

# Backup keystore
backup_keystore() {
    print_header "Backup Keystore"

    if [ ! -f "android/app/release.keystore" ]; then
        print_error "Keystore not found: android/app/release.keystore"
        return
    fi

    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="keystore_backups"

    mkdir -p "$backup_dir"
    cp android/app/release.keystore "$backup_dir/release.keystore.$timestamp"

    print_success "Keystore backed up to: $backup_dir/release.keystore.$timestamp"
    echo ""
    print_warning "Additional backup recommendations:"
    echo "  1. Copy to a USB drive"
    echo "  2. Upload to secure cloud storage (encrypted)"
    echo "  3. Store in a password manager (1Password, LastPass, etc.)"
    echo "  4. Keep a printed copy in a safe"
}

# Main menu
show_menu() {
    clear
    print_header "Lok'Room Android Keystore Manager"
    echo ""
    echo "1) Generate new keystore"
    echo "2) Verify existing keystore"
    echo "3) Export keystore information"
    echo "4) Generate base64 for GitHub"
    echo "5) Configure .env.android"
    echo "6) Backup keystore"
    echo "7) Show keystore location"
    echo "8) Exit"
    echo ""
    read -p "Select option: " choice

    case $choice in
        1)
            check_keytool
            generate_keystore
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        2)
            verify_keystore
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        3)
            export_keystore_info
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        4)
            generate_base64
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        5)
            configure_env
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        6)
            backup_keystore
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        7)
            print_header "Keystore Location"
            if [ -f "android/app/release.keystore" ]; then
                print_success "Keystore found at: $(pwd)/android/app/release.keystore"
                ls -lh android/app/release.keystore
            else
                print_error "Keystore not found"
            fi
            echo ""
            read -p "Press Enter to continue..."
            show_menu
            ;;
        8)
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            sleep 1
            show_menu
            ;;
    esac
}

# Run menu
show_menu
