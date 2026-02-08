# 📱 Guide de Build Mobile - Lok'Room

Ce guide explique comment builder et publier l'application Lok'Room sur iOS (App Store) et Android (Play Store).

## ✅ Configuration Terminée

- ✅ Capacitor installé et configuré
- ✅ Plateformes iOS et Android ajoutées
- ✅ Plugins natifs installés (SplashScreen, StatusBar, Keyboard, Haptics)
- ✅ Next.js configuré pour l'export static
- ✅ Initialisation automatique des plugins

## 📋 Prérequis

### Pour iOS (App Store)
- 💻 **Mac avec macOS** (obligatoire)
- 🛠️ **Xcode** (dernière version depuis l'App Store)
- 👤 **Compte Apple Developer** (99$/an) - https://developer.apple.com
- 📱 **iPhone** pour tester (ou simulateur iOS)

### Pour Android (Play Store)
- 💻 **N'importe quel OS** (Windows, Mac, Linux)
- 🛠️ **Android Studio** - https://developer.android.com/studio
- 👤 **Compte Google Play Developer** (25$ une fois) - https://play.google.com/console
- 📱 **Appareil Android** pour tester (ou émulateur)

## 🚀 Workflow de Build

### 1️⃣ Build de l'application Next.js pour mobile

```bash
cd apps/web

# Build en mode static pour Capacitor
npm run mobile:build
```

Cette commande :
- ✅ Génère Prisma
- ✅ Build Next.js en mode export static
- ✅ Copie le build vers les projets iOS/Android

### 2️⃣ Ouvrir les projets natifs

**Pour iOS :**
```bash
npm run cap:open:ios
```
Cela ouvre Xcode avec le projet iOS.

**Pour Android :**
```bash
npm run cap:open:android
```
Cela ouvre Android Studio avec le projet Android.

### 3️⃣ Synchroniser après modifications

Après chaque modification du code web :
```bash
npm run mobile:build
```

Ou juste pour synchroniser sans rebuild :
```bash
npm run cap:sync
```

## 🎨 Assets Nécessaires (À CRÉER)

### Icône de l'application
Créer une icône **1024x1024 px** :
- Format : PNG avec fond opaque
- Nom : `icon.png`
- Emplacement : `apps/web/public/`

### Splash Screen
Créer un splash screen **2732x2732 px** :
- Format : PNG
- Nom : `splash.png`
- Emplacement : `apps/web/public/`

### Générer automatiquement toutes les tailles

```bash
# Installer l'outil de génération d'assets
npm install -g @capacitor/assets

# Générer toutes les tailles d'icônes et splash screens
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'
```

## 📱 Configuration iOS (Xcode)

### 1. Ouvrir le projet
```bash
npm run cap:open:ios
```

### 2. Configuration de base dans Xcode

**General Tab :**
- **Display Name** : Lokroom
- **Bundle Identifier** : com.lokroom.app
- **Version** : 1.0.0
- **Build** : 1
- **Deployment Target** : iOS 13.0 minimum

**Signing & Capabilities :**
- Sélectionner votre **Team** (compte Apple Developer)
- Activer **Automatically manage signing**

**Info Tab :**
- Vérifier les permissions (caméra, localisation, etc.)

### 3. Permissions iOS (Info.plist)

Ajouter dans `ios/App/App/Info.plist` :

```xml
<key>NSCameraUsageDescription</key>
<string>Lokroom a besoin d'accéder à votre caméra pour prendre des photos d'annonces</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Lokroom a besoin d'accéder à vos photos pour les annonces</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Lokroom utilise votre position pour trouver des espaces près de vous</string>
```

### 4. Build et Test

**Sur simulateur :**
1. Sélectionner un simulateur (iPhone 15 Pro par exemple)
2. Cliquer sur ▶️ (Run)

**Sur appareil réel :**
1. Connecter l'iPhone via USB
2. Sélectionner l'appareil dans Xcode
3. Cliquer sur ▶️ (Run)

### 5. Publier sur l'App Store

```bash
# 1. Archiver l'app
Product > Archive (dans Xcode)

# 2. Valider l'archive
Window > Organizer > Distribute App > App Store Connect

# 3. Uploader vers App Store Connect
Suivre l'assistant Xcode
```

Ensuite sur **App Store Connect** (https://appstoreconnect.apple.com) :
1. Créer une nouvelle app
2. Remplir les métadonnées (description, screenshots, etc.)
3. Soumettre pour review

## 🤖 Configuration Android (Android Studio)

### 1. Ouvrir le projet
```bash
npm run cap:open:android
```

### 2. Configuration de base

**build.gradle (Module: app) :**
```gradle
android {
    namespace "com.lokroom.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.lokroom.app"
        minSdk 22
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 3. Permissions Android

Vérifier dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 4. Build et Test

**Sur émulateur :**
1. Créer un émulateur (Pixel 7 par exemple)
2. Cliquer sur ▶️ (Run)

**Sur appareil réel :**
1. Activer le **mode développeur** sur Android
2. Activer le **débogage USB**
3. Connecter via USB
4. Cliquer sur ▶️ (Run)

### 5. Générer l'APK/AAB pour le Play Store

**Créer une clé de signature :**
```bash
cd android/app
keytool -genkey -v -keystore lokroom-release.keystore -alias lokroom -keyalg RSA -keysize 2048 -validity 10000
```

**Configurer la signature dans `android/app/build.gradle` :**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('lokroom-release.keystore')
            storePassword 'VOTRE_MOT_DE_PASSE'
            keyAlias 'lokroom'
            keyPassword 'VOTRE_MOT_DE_PASSE'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Générer l'AAB (Android App Bundle) :**
```bash
cd android
./gradlew bundleRelease
```

Le fichier sera dans : `android/app/build/outputs/bundle/release/app-release.aab`

### 6. Publier sur le Play Store

1. Aller sur **Google Play Console** (https://play.google.com/console)
2. Créer une nouvelle application
3. Remplir les informations (description, screenshots, etc.)
4. Uploader l'AAB
5. Soumettre pour review

## 🔧 Plugins Capacitor Supplémentaires (Optionnels)

### Notifications Push
```bash
npm install @capacitor/push-notifications
```

### Caméra
```bash
npm install @capacitor/camera
```

### Géolocalisation
```bash
npm install @capacitor/geolocation
```

### Partage
```bash
npm install @capacitor/share
```

Après installation, synchroniser :
```bash
npm run cap:sync
```

## 🐛 Debugging

### Logs iOS
Dans Xcode : **View > Debug Area > Activate Console**

### Logs Android
Dans Android Studio : **View > Tool Windows > Logcat**

### Debugging Web dans l'app

**iOS (Safari) :**
1. Sur Mac : Safari > Develop > [Votre iPhone] > localhost
2. Ouvre les DevTools Safari

**Android (Chrome) :**
1. Sur PC : Chrome > `chrome://inspect`
2. Sélectionner l'appareil
3. Ouvre les DevTools Chrome

## 📊 Checklist avant Publication

### Technique
- [ ] L'app build sans erreur
- [ ] Testée sur simulateur/émulateur
- [ ] Testée sur appareil réel
- [ ] Toutes les fonctionnalités marchent
- [ ] Pas de crash
- [ ] Performance acceptable

### Assets
- [ ] Icône 1024x1024 créée
- [ ] Splash screen créé
- [ ] Toutes les tailles générées
- [ ] Screenshots pour les stores (5-8 par plateforme)

### Légal
- [ ] Politique de confidentialité
- [ ] Conditions d'utilisation
- [ ] Conformité RGPD
- [ ] Âge minimum défini

### Store Listing
- [ ] Titre de l'app (30 caractères max)
- [ ] Description courte (80 caractères)
- [ ] Description longue (4000 caractères)
- [ ] Mots-clés / Tags
- [ ] Catégorie (Lifestyle / Travel)
- [ ] Screenshots (iPhone, iPad, Android)
- [ ] Vidéo de démo (optionnel mais recommandé)

## 🎯 Prochaines Étapes Recommandées

1. **Créer les assets** (icône + splash screen)
2. **Générer toutes les tailles** avec `@capacitor/assets`
3. **Premier build de test** avec `npm run mobile:build`
4. **Tester sur simulateur** iOS et Android
5. **Configurer les comptes développeur** (Apple + Google)
6. **Préparer les screenshots** pour les stores
7. **Première soumission** en mode "test interne"

## 📚 Ressources

- **Capacitor Docs** : https://capacitorjs.com/docs
- **iOS Human Interface Guidelines** : https://developer.apple.com/design/human-interface-guidelines/
- **Android Design Guidelines** : https://developer.android.com/design
- **App Store Connect** : https://appstoreconnect.apple.com
- **Google Play Console** : https://play.google.com/console

## 🆘 Support

En cas de problème :
1. Vérifier les logs (Xcode/Android Studio)
2. Consulter la doc Capacitor
3. Vérifier les issues GitHub de Capacitor
4. Stack Overflow avec tag `capacitor`

---

**Bon build ! 🚀**
