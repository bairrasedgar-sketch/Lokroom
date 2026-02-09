# Lok'Room Android - Guide de Démarrage Ultra-Rapide

## 🚀 En 3 Commandes

```bash
# 1. Générer le keystore
cd apps/web
./generate-keystore.sh  # ou .bat sur Windows

# 2. Builder l'APK
./build-android.sh  # ou .bat sur Windows

# 3. Installer sur appareil
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**C'est tout!** Votre app Android est installée et prête à être testée.

---

## 📱 Prérequis (Installation Unique)

### Windows
```bash
# 1. Installer Java 17
# Télécharger: https://adoptium.net/

# 2. Installer Android Studio
# Télécharger: https://developer.android.com/studio

# 3. Définir variables d'environnement
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
```

### Linux/Mac
```bash
# 1. Installer Java 17
sudo apt install openjdk-17-jdk  # Ubuntu/Debian
brew install openjdk@17          # macOS

# 2. Installer Android Studio
# Télécharger: https://developer.android.com/studio

# 3. Définir variables d'environnement
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
```

---

## 🎯 Commandes Essentielles

### Build
```bash
# Debug (pour tests)
npm run android:dev

# Release (pour production)
npm run android:build

# AAB (pour Play Store)
npm run android:bundle
```

### Développement
```bash
# Ouvrir Android Studio
npm run android:sync

# Nettoyer build
npm run android:clean

# Voir logs
adb logcat | grep -i lokroom
```

---

## 📚 Documentation

| Document | Usage |
|----------|-------|
| `README_ANDROID.md` | Vue d'ensemble |
| `ANDROID_QUICK_START.md` | Guide 5 minutes |
| `ANDROID_BUILD_GUIDE.md` | Guide complet |
| `ANDROID_TESTING_GUIDE.md` | Tests |

---

## 🆘 Problèmes Courants

### Java non trouvé
```bash
# Vérifier installation
java -version

# Définir JAVA_HOME
export JAVA_HOME=/path/to/jdk
```

### Android SDK non trouvé
```bash
# Vérifier installation
echo $ANDROID_HOME

# Définir ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
```

### Build échoue
```bash
# Nettoyer et rebuilder
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 📞 Support

- **Email**: dev@lokroom.com
- **Docs**: Voir `ANDROID_BUILD_GUIDE.md`
- **GitHub**: https://github.com/lokroom/lokroom-app

---

**Version**: 1.0.0
**Dernière mise à jour**: 2026-02-09
