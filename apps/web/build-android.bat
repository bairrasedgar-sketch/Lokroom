@echo off
REM Lok'Room Android Build Script for Windows
REM This script automates the Android build process on Windows

setlocal enabledelayedexpansion

REM Colors (using Windows color codes)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

:main
cls
echo ========================================
echo Lok'Room Android Build Script
echo ========================================
echo.
echo 1) Build Debug APK
echo 2) Build Release APK (requires keystore)
echo 3) Build AAB for Play Store (requires keystore)
echo 4) Full Build (Next.js + Capacitor + Release APK)
echo 5) Full Build (Next.js + Capacitor + AAB)
echo 6) Clean Build
echo 7) Check Prerequisites
echo 8) Open Android Studio
echo 9) Generate Keystore
echo 0) Exit
echo.
set /p choice="Select option: "

if "%choice%"=="1" goto build_debug
if "%choice%"=="2" goto build_release
if "%choice%"=="3" goto build_bundle
if "%choice%"=="4" goto full_build_apk
if "%choice%"=="5" goto full_build_aab
if "%choice%"=="6" goto clean_build
if "%choice%"=="7" goto check_prereqs
if "%choice%"=="8" goto open_studio
if "%choice%"=="9" goto generate_keystore
if "%choice%"=="0" goto exit_script

echo Invalid option
pause
goto main

:check_prereqs
echo.
echo ========================================
echo Checking Prerequisites
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [92m✓ Node.js installed: !NODE_VERSION![0m
) else (
    echo [91m✗ Node.js not found. Please install Node.js 18+[0m
    pause
    goto main
)

REM Check npm
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [92m✓ npm installed: !NPM_VERSION![0m
) else (
    echo [91m✗ npm not found[0m
    pause
    goto main
)

REM Check Java
where java >nul 2>&1
if %errorlevel% equ 0 (
    echo [92m✓ Java installed[0m
) else (
    echo [91m✗ Java not found. Please install JDK 17+[0m
    echo Download from: https://adoptium.net/
    pause
    goto main
)

REM Check JAVA_HOME
if defined JAVA_HOME (
    echo [92m✓ JAVA_HOME: %JAVA_HOME%[0m
) else (
    echo [93m⚠ JAVA_HOME not set[0m
)

REM Check ANDROID_HOME
if defined ANDROID_HOME (
    echo [92m✓ ANDROID_HOME: %ANDROID_HOME%[0m
) else (
    echo [93m⚠ ANDROID_HOME not set. Android SDK may not be configured.[0m
)

REM Check Gradle wrapper
if exist "android\gradlew.bat" (
    echo [92m✓ Gradle wrapper found[0m
) else (
    echo [91m✗ Gradle wrapper not found in android/[0m
    pause
    goto main
)

echo.
echo [92mAll prerequisites checked![0m
pause
goto main

:build_debug
echo.
echo ========================================
echo Building Debug APK
echo ========================================
echo.

cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo [92m✓ Debug APK built successfully![0m
    echo [94mℹ Location: android\app\build\outputs\apk\debug\app-debug.apk[0m

    for %%A in ("android\app\build\outputs\apk\debug\app-debug.apk") do (
        set size=%%~zA
        set /a sizeMB=!size! / 1048576
        echo [94mℹ APK Size: !sizeMB! MB[0m
    )
) else (
    echo [91m✗ Debug APK not found[0m
)

echo.
pause
goto main

:build_release
echo.
echo ========================================
echo Building Release APK
echo ========================================
echo.

REM Check keystore
if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found: android\app\release.keystore[0m
    echo [93m⚠ Please generate a keystore first (option 9)[0m
    pause
    goto main
)

REM Check environment variables
if not defined KEYSTORE_PASSWORD (
    echo [93m⚠ KEYSTORE_PASSWORD not set[0m
    set /p KEYSTORE_PASSWORD="Enter keystore password: "
)

if not defined KEY_PASSWORD (
    echo [93m⚠ KEY_PASSWORD not set[0m
    set /p KEY_PASSWORD="Enter key password: "
)

if not defined KEY_ALIAS (
    set KEY_ALIAS=lokroom
)

if not defined KEYSTORE_FILE (
    set KEYSTORE_FILE=release.keystore
)

cd android
call gradlew.bat assembleRelease
cd ..

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo [92m✓ Release APK built successfully![0m
    echo [94mℹ Location: android\app\build\outputs\apk\release\app-release.apk[0m

    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do (
        set size=%%~zA
        set /a sizeMB=!size! / 1048576
        echo [94mℹ APK Size: !sizeMB! MB[0m
    )
) else (
    echo [91m✗ Release APK not found[0m
)

echo.
pause
goto main

:build_bundle
echo.
echo ========================================
echo Building Android App Bundle (AAB)
echo ========================================
echo.

REM Check keystore
if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found: android\app\release.keystore[0m
    echo [93m⚠ Please generate a keystore first (option 9)[0m
    pause
    goto main
)

REM Check environment variables
if not defined KEYSTORE_PASSWORD (
    set /p KEYSTORE_PASSWORD="Enter keystore password: "
)

if not defined KEY_PASSWORD (
    set /p KEY_PASSWORD="Enter key password: "
)

if not defined KEY_ALIAS (
    set KEY_ALIAS=lokroom
)

if not defined KEYSTORE_FILE (
    set KEYSTORE_FILE=release.keystore
)

cd android
call gradlew.bat bundleRelease
cd ..

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    echo.
    echo [92m✓ AAB built successfully![0m
    echo [94mℹ Location: android\app\build\outputs\bundle\release\app-release.aab[0m

    for %%A in ("android\app\build\outputs\bundle\release\app-release.aab") do (
        set size=%%~zA
        set /a sizeMB=!size! / 1048576
        echo [94mℹ AAB Size: !sizeMB! MB[0m
    )
) else (
    echo [91m✗ AAB not found[0m
)

echo.
pause
goto main

:full_build_apk
echo.
echo ========================================
echo Full Build (Next.js + Capacitor + APK)
echo ========================================
echo.

echo [94mℹ Step 1/5: Installing dependencies...[0m
call npm install

echo.
echo [94mℹ Step 2/5: Generating Prisma client...[0m
call npx prisma generate --schema=.\prisma\schema.prisma

echo.
echo [94mℹ Step 3/5: Building Next.js for mobile...[0m
set CAPACITOR_BUILD=true
call npm run build

echo.
echo [94mℹ Step 4/5: Syncing Capacitor...[0m
call npx cap sync android

echo.
echo [94mℹ Step 5/5: Building Release APK...[0m

REM Check keystore
if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found[0m
    pause
    goto main
)

if not defined KEYSTORE_PASSWORD (
    set /p KEYSTORE_PASSWORD="Enter keystore password: "
)

if not defined KEY_PASSWORD (
    set /p KEY_PASSWORD="Enter key password: "
)

cd android
call gradlew.bat assembleRelease
cd ..

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo [92m✓ Full build completed successfully![0m
    echo [94mℹ APK: android\app\build\outputs\apk\release\app-release.apk[0m
) else (
    echo [91m✗ Build failed[0m
)

echo.
pause
goto main

:full_build_aab
echo.
echo ========================================
echo Full Build (Next.js + Capacitor + AAB)
echo ========================================
echo.

echo [94mℹ Step 1/5: Installing dependencies...[0m
call npm install

echo.
echo [94mℹ Step 2/5: Generating Prisma client...[0m
call npx prisma generate --schema=.\prisma\schema.prisma

echo.
echo [94mℹ Step 3/5: Building Next.js for mobile...[0m
set CAPACITOR_BUILD=true
call npm run build

echo.
echo [94mℹ Step 4/5: Syncing Capacitor...[0m
call npx cap sync android

echo.
echo [94mℹ Step 5/5: Building AAB...[0m

REM Check keystore
if not exist "android\app\release.keystore" (
    echo [91m✗ Keystore not found[0m
    pause
    goto main
)

if not defined KEYSTORE_PASSWORD (
    set /p KEYSTORE_PASSWORD="Enter keystore password: "
)

if not defined KEY_PASSWORD (
    set /p KEY_PASSWORD="Enter key password: "
)

cd android
call gradlew.bat bundleRelease
cd ..

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    echo.
    echo [92m✓ Full build completed successfully![0m
    echo [94mℹ AAB: android\app\build\outputs\bundle\release\app-release.aab[0m
) else (
    echo [91m✗ Build failed[0m
)

echo.
pause
goto main

:clean_build
echo.
echo ========================================
echo Cleaning Build
echo ========================================
echo.

echo [94mℹ Cleaning Android build...[0m
cd android
call gradlew.bat clean
cd ..

echo [94mℹ Cleaning Next.js build...[0m
if exist ".next" rmdir /s /q .next
if exist "out" rmdir /s /q out

echo.
echo [92m✓ Build cleaned[0m
pause
goto main

:open_studio
echo.
echo [94mℹ Opening Android Studio...[0m
call npx cap open android
goto main

:generate_keystore
echo.
echo ========================================
echo Generate Keystore
echo ========================================
echo.

if exist "android\app\release.keystore" (
    echo [93m⚠ Keystore already exists: android\app\release.keystore[0m
    set /p overwrite="Overwrite existing keystore? (y/N): "
    if /i not "!overwrite!"=="y" goto main
)

echo.
echo [94mℹ Generating keystore...[0m
echo [93m⚠ Please answer the following questions:[0m
echo.

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
    echo [94mℹ Update .env.android with your keystore passwords[0m
) else (
    echo [91m✗ Keystore generation failed[0m
)

echo.
pause
goto main

:exit_script
echo.
echo [94mℹ Exiting...[0m
exit /b 0
