@echo off
echo ============================================================
echo Configuration des Variables d'Environnement Android
echo ============================================================
echo.

REM Détection automatique du chemin Android SDK
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"

echo Verification du SDK Android...
if exist "%ANDROID_HOME%" (
    echo [OK] SDK Android trouve: %ANDROID_HOME%
) else (
    echo [ERREUR] SDK Android non trouve dans: %ANDROID_HOME%
    echo.
    echo Veuillez installer Android Studio d'abord.
    echo Puis relancez ce script.
    pause
    exit /b 1
)

echo.
echo Configuration des variables d'environnement...

REM Ajouter ANDROID_HOME aux variables utilisateur
setx ANDROID_HOME "%ANDROID_HOME%"
setx ANDROID_SDK_ROOT "%ANDROID_SDK_ROOT%"

REM Ajouter les outils Android au PATH
set "NEW_PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\emulator"
setx PATH "%PATH%;%NEW_PATH%"

echo.
echo ============================================================
echo Configuration terminee !
echo ============================================================
echo.
echo IMPORTANT: Fermez et rouvrez votre terminal PowerShell
echo pour que les changements prennent effet.
echo.
echo Ensuite, lancez:
echo   cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
echo   npx cap run android
echo.
pause
