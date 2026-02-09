# Guide de Build Android pour Lok'Room

## Table des Matières
1. [Prérequis](#prérequis)
2. [Configuration Initiale](#configuration-initiale)
3. [Génération du Keystore](#génération-du-keystore)
4. [Build de l'Application](#build-de-lapplication)
5. [Publication sur Google Play Store](#publication-sur-google-play-store)
6. [Troubleshooting](#troubleshooting)

## Prérequis

### Logiciels Requis
- **Node.js** 18+ (déjà installé)
- **Java Development Kit (JDK)** 17 ou 21
  - Télécharger: https://adoptium.net/
  - Vérifier: `java -version`
- **Android Studio** (recommandé) ou Android SDK Command Line Tools
  - Télécharger: https://developer.android.com/studio
- **Gradle** (inclus avec Android Studio)

### Variables d'Environnement
Ajouter à votre PATH système:
```bash
# Windows
ANDROID_HOME=C:\Users\[USERNAME]\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

## Configuration Initiale

### 1. Installer les Dépendances
```bash
cd apps/web
npm install
```

### 2. Vérifier Capacitor
```bash
npx cap doctor
```

### 3. Installer les Plugins Capacitor Additionnels (Optionnel)
```bash
npm install @capacitor/app @capacitor/browser @capacitor/camera @capacitor/geolocation @capacitor/push-notifications @capacitor/share @capacitor/network
```

### 4. Synchroniser le Projet Android
```bash
npm run cap:sync
# ou
npx cap sync android
```

## Génération du Keystore

### Créer un Keystore de Production

**IMPORTANT**: Le keystore est la clé de signature de votre application. Si vous le perdez, vous ne pourrez plus publier de mises à jour sur Google Play Store.

```bash
cd android/app

keytool -genkey -v -keystore release.keystore -alias lokroom -keyalg RSA -keysize 2048 -validity 10000
```

**Informations à fournir**:
- **Keystore password**: Choisir un mot de passe fort (min 6 caractères)
- **Key password**: Peut être identique au keystore password
- **First and Last Name**: Lok'Room
- **Organizational Unit**: Mobile Development
- **Organization**: Lok'Room
- **City**: Paris
- **State**: Ile-de-France
- **Country Code**: FR

### Sauvegarder le Keystore

**CRITIQUE**: Sauvegarder le keystore dans un endroit sécurisé:
1. Copier `release.keystore` dans un coffre-fort numérique (1Password, LastPass, etc.)
2. Noter les mots de passe dans un gestionnaire de mots de passe
3. Ne JAMAIS commiter le keystore dans Git

### Configurer les Variables d'Environnement

Éditer `.env.android`:
```bash
KEYSTORE_FILE=release.keystore
KEYSTORE_PASSWORD=votre_mot_de_passe_keystore
KEY_ALIAS=lokroom
KEY_PASSWORD=votre_mot_de_passe_key
```

## Build de l'Application

### Build Debug (pour tests)
```bash
cd android
./gradlew assembleDebug

# APK généré dans:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Release (pour production)

#### Option 1: Build Local avec Variables d'Environnement
```bash
# Windows (PowerShell)
$env:KEYSTORE_FILE="release.keystore"
$env:KEYSTORE_PASSWORD="votre_password"
$env:KEY_ALIAS="lokroom"
$env:KEY_PASSWORD="votre_password"
cd android
./gradlew assembleRelease

# Linux/Mac
export KEYSTORE_FILE=release.keystore
export KEYSTORE_PASSWORD=votre_password
export KEY_ALIAS=lokroom
export KEY_PASSWORD=votre_password
cd android
./gradlew assembleRelease
```

#### Option 2: Build avec Script NPM
```bash
npm run android:build
```

**APK signé généré dans**:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Build Android App Bundle (AAB) pour Play Store

Google Play Store préfère le format AAB (plus petit, optimisé):

```bash
cd android
./gradlew bundleRelease

# ou
npm run android:bundle
```

**AAB généré dans**:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Vérifier la Signature de l'APK

```bash
# Windows
"%JAVA_HOME%\bin\jarsigner" -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# Linux/Mac
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

## Publication sur Google Play Store

### 1. Créer un Compte Développeur Google Play
- Coût: 25$ (paiement unique)
- URL: https://play.google.com/console/signup

### 2. Créer une Nouvelle Application
1. Aller sur https://play.google.com/console
2. Cliquer sur "Créer une application"
3. Remplir les informations:
   - **Nom**: Lok'Room
   - **Langue par défaut**: Français
   - **Type**: Application
   - **Gratuite ou payante**: Gratuite

### 3. Préparer les Assets

#### Icône de l'Application
- **Format**: PNG
- **Taille**: 512x512 pixels
- **Fond**: Transparent ou couleur unie

#### Captures d'Écran
- **Téléphone**: Min 2, max 8 (1080x1920 ou 1080x2340)
- **Tablette 7"**: Min 2, max 8 (1200x1920)
- **Tablette 10"**: Min 2, max 8 (1920x1200)

#### Bannière Feature Graphic
- **Taille**: 1024x500 pixels
- **Format**: PNG ou JPEG

### 4. Remplir les Informations de l'Application

#### Description Courte (80 caractères max)
```
Louez des espaces uniques à l'heure. Studios, appartements, parkings et plus.
```

#### Description Complète (4000 caractères max)
```
Lok'Room est la plateforme de location d'espaces à l'heure qui révolutionne le partage d'espaces en France.

🏠 LOUEZ DES ESPACES UNIQUES
• Appartements et maisons pour vos événements
• Studios photo et vidéo professionnels
• Espaces de coworking flexibles
• Parkings et garages sécurisés

⏱️ RÉSERVATION FLEXIBLE
• Location à l'heure, à la journée ou plus
• Réservation instantanée
• Paiement sécurisé via Stripe
• Annulation flexible

🔒 SÉCURITÉ ET CONFIANCE
• Vérification des utilisateurs
• Assurance incluse
• Support client 7j/7
• Avis et notes vérifiés

💰 POUR LES PROPRIÉTAIRES
• Monétisez vos espaces inutilisés
• Fixez vos propres tarifs
• Gérez vos disponibilités facilement
• Recevez vos paiements rapidement

Rejoignez la communauté Lok'Room et découvrez une nouvelle façon de partager et louer des espaces !
```

#### Catégorie
- **Catégorie principale**: Immobilier
- **Catégorie secondaire**: Lifestyle

#### Coordonnées
- **Email**: support@lokroom.com
- **Site web**: https://www.lokroom.com
- **Politique de confidentialité**: https://www.lokroom.com/privacy

### 5. Configurer la Classification du Contenu
1. Répondre au questionnaire de classification
2. Sélectionner la tranche d'âge appropriée (généralement 3+)
3. Indiquer si l'app contient des publicités (Non)

### 6. Uploader l'AAB

#### Production Track (Lancement Public)
1. Aller dans "Production" > "Créer une version"
2. Uploader `app-release.aab`
3. Remplir les notes de version:
```
Version 1.0.0 - Lancement Initial

✨ Fonctionnalités:
• Recherche et réservation d'espaces
• Paiement sécurisé
• Messagerie intégrée
• Gestion des réservations
• Profil utilisateur complet
• Notifications push
```

#### Internal Testing Track (Tests Internes)
Pour tester avant le lancement public:
1. Aller dans "Tests internes"
2. Créer une liste de testeurs (emails)
3. Uploader l'AAB
4. Partager le lien de test

### 7. Soumettre pour Révision
1. Vérifier que toutes les sections sont complètes (✓ vert)
2. Cliquer sur "Envoyer pour révision"
3. Délai de révision: 1-7 jours

### 8. Publication
Une fois approuvé, l'app sera disponible sur Google Play Store dans quelques heures.

## Mises à Jour

### Publier une Nouvelle Version

1. **Incrémenter la version** dans `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2  // Incrémenter de 1
    versionName "1.1.0"  // Nouvelle version
}
```

2. **Rebuild l'AAB**:
```bash
npm run android:bundle
```

3. **Uploader sur Play Console**:
- Aller dans "Production" > "Créer une version"
- Uploader le nouveau AAB
- Ajouter les notes de version
- Soumettre

## Troubleshooting

### Erreur: "JAVA_HOME not set"
```bash
# Windows
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### Erreur: "Android SDK not found"
```bash
# Windows
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
```

### Erreur: "Keystore not found"
Vérifier que:
1. Le fichier `release.keystore` existe dans `android/app/`
2. Les variables d'environnement sont correctement définies
3. Le chemin dans `KEYSTORE_FILE` est correct

### Erreur: "Execution failed for task ':app:packageRelease'"
```bash
# Nettoyer le build
cd android
./gradlew clean
./gradlew assembleRelease
```

### Erreur: "Duplicate class found"
```bash
# Supprimer les caches
rm -rf android/.gradle
rm -rf android/app/build
./gradlew clean
```

### L'app crash au démarrage
1. Vérifier les logs:
```bash
adb logcat | grep -i lokroom
```

2. Vérifier que `capacitor.config.ts` pointe vers le bon serveur:
```typescript
server: {
  url: 'https://www.lokroom.com',
}
```

### Build très lent
```bash
# Augmenter la mémoire Gradle dans android/gradle.properties
org.gradle.jvmargs=-Xmx4096m
org.gradle.parallel=true
org.gradle.caching=true
```

## Scripts NPM Disponibles

```bash
# Développement
npm run android:dev          # Lance l'app sur un émulateur/device
npm run android:sync         # Synchronise et ouvre Android Studio

# Build
npm run android:build        # Build APK release
npm run android:bundle       # Build AAB release
npm run android:clean        # Nettoie le build

# Capacitor
npm run cap:sync             # Synchronise tous les platforms
npm run cap:open:android     # Ouvre Android Studio
npm run mobile:build         # Build Next.js + sync Capacitor
```

## Ressources Utiles

- **Documentation Capacitor**: https://capacitorjs.com/docs
- **Android Developer Guide**: https://developer.android.com/guide
- **Google Play Console**: https://play.google.com/console
- **Capacitor Android Plugin**: https://capacitorjs.com/docs/android
- **Gradle Documentation**: https://docs.gradle.org/

## Support

Pour toute question ou problème:
- **Email**: dev@lokroom.com
- **Documentation**: https://docs.lokroom.com
- **GitHub Issues**: https://github.com/lokroom/lokroom-app/issues

---

**Dernière mise à jour**: 2026-02-09
**Version du guide**: 1.0.0
