# 📱 Guide Complet - Déploiement App Mobile Lok'Room

## 🎯 Architecture

```
📲 App Mobile (iOS/Android)
└─ Interface locale (HTML/CSS/JS dans Capacitor)
└─ Appelle https://www.lokroom.com/api/* pour les données
   ↓
🖥️ Backend Vercel (https://www.lokroom.com)
└─ Gère toutes les APIs
└─ Base de données PostgreSQL
```

## ✅ Ce qui est déjà fait

- ✅ Configuration Capacitor (`capacitor.config.ts`)
- ✅ Build Next.js réussi
- ✅ Synchronisation Capacitor (Android + iOS)
- ✅ Dossier `out/` créé avec les assets web
- ✅ Commit sur GitHub

## 📥 Installation d'Android Studio

### Étape 1: Télécharger et Installer

1. **Télécharge Android Studio**: https://developer.android.com/studio
   - Taille: ~1 GB
   - Temps: 5-10 minutes

2. **Lance l'installateur**:
   - ✅ Coche "Android Virtual Device" (émulateur)
   - ✅ Laisse les options par défaut
   - ✅ Clique sur "Next" jusqu'à "Finish"

3. **Premier lancement**:
   - Choisis "Standard" installation
   - Accepte les licences Android SDK
   - Laisse télécharger les composants (5-10 min)

### Étape 2: Configuration des Variables d'Environnement

**Option A: Script Automatique (RECOMMANDÉ)**

1. Lance le script fourni:
```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
.\setup-android-env.bat
```

2. **Ferme et rouvre ton terminal PowerShell**

3. Vérifie que tout est configuré:
```bash
echo $env:ANDROID_HOME
# Devrait afficher: C:\Users\bairr\AppData\Local\Android\Sdk
```

**Option B: Configuration Manuelle**

1. Ouvre "Variables d'environnement système":
   - Recherche "variables d'environnement" dans Windows
   - Clique sur "Variables d'environnement..."

2. Ajoute ces variables utilisateur:
   - `ANDROID_HOME` = `C:\Users\bairr\AppData\Local\Android\Sdk`
   - `ANDROID_SDK_ROOT` = `C:\Users\bairr\AppData\Local\Android\Sdk`

3. Modifie la variable `Path`:
   - Ajoute ces lignes:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`
     - `%ANDROID_HOME%\emulator`

4. **Ferme et rouvre ton terminal**

## 🚀 Lancer l'App Mobile

### Option 1: Sur un Appareil Physique Android

1. **Active le mode développeur** sur ton téléphone:
   - Va dans Paramètres > À propos du téléphone
   - Tape 7 fois sur "Numéro de build"
   - Active "Débogage USB" dans Paramètres > Options développeur

2. **Connecte ton téléphone en USB** à ton PC

3. **Lance l'app**:
```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
npx cap run android
```

### Option 2: Sur un Émulateur Android

1. **Crée un émulateur** dans Android Studio:
   - Ouvre Android Studio
   - Clique sur "More Actions" > "Virtual Device Manager"
   - Clique sur "Create Device"
   - Choisis "Pixel 6" (recommandé)
   - Choisis "Tiramisu" (Android 13)
   - Clique sur "Finish"

2. **Lance l'émulateur**:
```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
npx cap run android
```

### Option 3: Ouvrir dans Android Studio

```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
npx cap open android
```

Puis dans Android Studio:
- Clique sur le bouton "Run" (▶️)
- Choisis ton appareil/émulateur

## 🔧 Commandes Utiles

### Synchroniser les changements
```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
npx cap sync
```

### Rebuilder l'app
```bash
npm run build
npx cap sync
npx cap run android
```

### Voir les logs
```bash
npx cap run android --livereload
```

### Générer un APK de production
```bash
cd android
.\gradlew assembleRelease
# APK dans: android/app/build/outputs/apk/release/
```

## 🐛 Résolution de Problèmes

### Erreur: "SDK not found"
- Vérifie que `ANDROID_HOME` est bien configuré
- Ferme et rouvre ton terminal
- Vérifie le chemin: `C:\Users\bairr\AppData\Local\Android\Sdk`

### Erreur: "Java not found"
- Android Studio installe Java automatiquement
- Redémarre ton PC après l'installation

### Erreur: "Device not found"
- Pour appareil physique: vérifie que le débogage USB est activé
- Pour émulateur: lance-le d'abord dans Android Studio

### L'app ne se connecte pas au backend
- Vérifie que `capacitor.config.ts` contient:
  ```typescript
  server: {
    url: 'https://www.lokroom.com',
  }
  ```
- Vérifie que ton backend Vercel est en ligne

## 📦 Structure des Fichiers

```
apps/web/
├── android/                    # Projet Android natif
│   ├── app/
│   │   └── src/main/assets/public/  # Assets web copiés
│   └── build/                  # APK générés
├── ios/                        # Projet iOS natif
├── out/                        # Build Next.js pour mobile
├── capacitor.config.ts         # Config Capacitor
└── setup-android-env.bat       # Script de configuration
```

## 🎉 Prochaines Étapes

Une fois l'app lancée:

1. **Teste les fonctionnalités**:
   - Connexion/Inscription
   - Navigation
   - Création d'annonce
   - Réservation
   - Messages

2. **Génère un APK de production**:
   ```bash
   cd android
   .\gradlew assembleRelease
   ```

3. **Publie sur Google Play Store**:
   - Crée un compte développeur Google Play (25$ one-time)
   - Suis le guide: https://developer.android.com/studio/publish

## 📞 Support

Si tu rencontres des problèmes:
1. Vérifie les logs: `npx cap run android --verbose`
2. Consulte la doc Capacitor: https://capacitorjs.com/docs
3. Vérifie que ton backend Vercel fonctionne

---

**Dernière mise à jour**: 2026-02-09
**Version Capacitor**: 8.0.2
**Version Next.js**: 14.2.33
