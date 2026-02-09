@echo off
REM Lok'Room Android - Keystore Generator Script for Windows
REM This script helps generate and manage Android keystores

setlocal enabledelayedexpansion

:main
cls
echo ========================================
echo Lok'Room Android Keystore Manager
echo ========================================
echo.
echo 1) Generate new keystore
echo 2) Verify existing keystore
echo 3) Export keystore information
echo 4) Generate base64 for GitHub
echo 5) Configure .env.android
echo 6) Backup keystore
echo 7) Show keystore location
echo 8) Exit
echo.
set /p choice="Select option: "

if "%choice%"=="1" goto generate_keystore
if "%choice%"=="2" goto verify_keystore
if "%choice%"=="3" goto export_info
if "%choice%"=="4" goto generate_base64
if "%choice%"=="5" goto configure_env
if "%choice%"=="6" goto backup_keystore
if "%choice%"=="7" goto show_location
if "%choice%"=="8" goto exit_script

echo Invalid option
pause
goto main

:check_keytool
where keytool >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m✗ keytool not found. Please install Java JDK.[0m
    pause
    goto main
)
echo [92m✓ keytool found[0m
goto :eof

:generate_keystore
echo.
echo ========================================
echo Generate Android Keystore
echo ========================================
echo.

REM Check if keystore exists
if exist "android\app\release.keystore" (
    echo [93m⚠ Keystore already exists: android\app\release.keystore[0m
    set /p overwrite="Do you want to overwrite it? (y/N): "
    if /i not "!overwrite!"=="y" (
        echo [94mℹ Keeping existing keystore[0m
        pause
        goto main
    )
    echo [93m⚠ Backing up existing keystore...[0m
    copy android\app\release.keystore android\app\release.keystore.backup >nul
    echo [92m✓ Backup created: android\app\release.keystore.backup[0m
)

echo.
echo [94mℹ You will be asked to provide the following information:[0m
echo   - Keystore password (min 6 characters)
echo   - Key password (can be same as keystore password)
echo   - First and Last Name: Lok'Room
echo   - Organizational Unit: Mobile Development
echo   - Organization: Lok'Room
echo   - City: Paris
echo   - State: Ile-de-France
echo   - Country Code: FR
echo.
pause

REM Generate keystore
cd android\app
keytool -genkey -v -keystore release.keystore -alias lokroom -keyalg RSA -keysize 2048 -validity 10000
cd ..\..

if exist "android\app\release.keystore" (
    echo.
    echo [92m✓ Keystore generated successfully![0m
    echo [94mℹ Location: android\app\release.keystore[0m
    echo.
    echo [93m⚠ IMPORTANT: Backup this keystore in a secure location![0m
    echo [93m⚠ If you lose it, you cannot update your app on Play Store![0m
    echo.
) else (
    echo [91m✗ Keystore generation failed[0m
)

pause
goto main

:verify_keystore
echo.
echo ========================================
echo Verify Keystore
echo ========================================
echo.

if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found: android\app\release.keystore[0m
    pause
    goto main
)

echo [94mℹ Keystore information:[0m
keytool -list -v -keystore android\app\release.keystore

pause
goto main

:export_info
echo.
echo ========================================
echo Export Keystore Information
echo ========================================
echo.

if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found: android\app\release.keystore[0m
    pause
    goto main
)

echo [94mℹ Exporting keystore information to keystore-info.txt...[0m
keytool -list -v -keystore android\app\release.keystore > keystore-info.txt
echo [92m✓ Information exported to keystore-info.txt[0m

pause
goto main

:generate_base64
echo.
echo ========================================
echo Generate Base64 for GitHub Secrets
echo ========================================
echo.

if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found: android\app\release.keystore[0m
    pause
    goto main
)

echo [94mℹ Generating base64 encoding...[0m

REM Use PowerShell to generate base64
powershell -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('android\app\release.keystore'))" > keystore-base64.txt

if exist "keystore-base64.txt" (
    echo [92m✓ Base64 encoding saved to keystore-base64.txt[0m
    echo.
    echo [94mℹ Copy the content of keystore-base64.txt to GitHub Secret: KEYSTORE_BASE64[0m
    echo.
    echo [93m⚠ Remember to delete keystore-base64.txt after copying![0m
) else (
    echo [91m✗ Failed to generate base64[0m
)

pause
goto main

:configure_env
echo.
echo ========================================
echo Configure Environment Variables
echo ========================================
echo.

if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found. Generate keystore first.[0m
    pause
    goto main
)

echo.
echo [94mℹ Enter your keystore passwords:[0m
set /p keystore_password="Keystore password: "
set /p key_password="Key password: "

REM Create .env.android
(
echo # Android Build Configuration
echo # DO NOT commit this file to version control
echo.
echo # Keystore configuration for release builds
echo KEYSTORE_FILE=release.keystore
echo KEYSTORE_PASSWORD=%keystore_password%
echo KEY_ALIAS=lokroom
echo KEY_PASSWORD=%key_password%
echo.
echo # Instructions:
echo # 1. Keep this file secure and never commit it to git
echo # 2. Backup your keystore file ^(android/app/release.keystore^)
echo # 3. Store passwords in a password manager
) > .env.android

echo [92m✓ .env.android created[0m
echo.
echo [93m⚠ IMPORTANT: Never commit .env.android to git![0m
echo [94mℹ The file is already in .gitignore[0m

pause
goto main

:backup_keystore
echo.
echo ========================================
echo Backup Keystore
echo ========================================
echo.

if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found: android\app\release.keystore[0m
    pause
    goto main
)

REM Create backup directory
if not exist "keystore_backups" mkdir keystore_backups

REM Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%_%datetime:~8,6%

REM Backup keystore
copy android\app\release.keystore keystore_backups\release.keystore.%timestamp% >nul

echo [92m✓ Keystore backed up to: keystore_backups\release.keystore.%timestamp%[0m
echo.
echo [93m⚠ Additional backup recommendations:[0m
echo   1. Copy to a USB drive
echo   2. Upload to secure cloud storage ^(encrypted^)
echo   3. Store in a password manager ^(1Password, LastPass, etc.^)
echo   4. Keep a printed copy in a safe

pause
goto main

:show_location
echo.
echo ========================================
echo Keystore Location
echo ========================================
echo.

if exist "android\app\release.keystore" (
    echo [92m✓ Keystore found at: %CD%\android\app\release.keystore[0m
    dir android\app\release.keystore
) else (
    echo [91m✗ Keystore not found[0m
)

pause
goto main

:exit_script
echo.
echo [94mℹ Exiting...[0m
exit /b 0
