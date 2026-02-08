# 📱 Installation Android Studio - Guide Pas à Pas

## 🎯 Objectif

Installer Android Studio pour pouvoir lancer l'app mobile Lok'Room sur un émulateur ou un appareil physique.

---

## 📥 Étape 1: Téléchargement (5 min)

1. **Ouvre le lien**: https://developer.android.com/studio

2. **Clique sur "Download Android Studio"**
   - Taille: ~1 GB
   - Temps de téléchargement: 5-10 minutes (selon ta connexion)

3. **Accepte les conditions** et lance le téléchargement

---

## 💿 Étape 2: Installation (10 min)

### 2.1 Lance l'installateur

1. **Double-clique** sur le fichier téléchargé:
   - `android-studio-2024.x.x.x-windows.exe`

2. **Clique sur "Next"** dans l'écran de bienvenue

### 2.2 Choisis les composants

✅ **Coche ces options** (très important):
- [x] Android Studio
- [x] Android Virtual Device (AVD) ← **IMPORTANT pour l'émulateur**

Clique sur "Next"

### 2.3 Choisis l'emplacement d'installation

- **Emplacement par défaut recommandé**:
  ```
  C:\Program Files\Android\Android Studio
  ```

- Clique sur "Next"

### 2.4 Choisis le dossier du menu Démarrer

- Laisse le nom par défaut: "Android Studio"
- Clique sur "Install"

### 2.5 Attends l'installation

- ⏳ Prend environ 5-10 minutes
- ☕ C'est le moment de prendre un café !

### 2.6 Termine l'installation

- ✅ Coche "Start Android Studio"
- Clique sur "Finish"

---

## ⚙️ Étape 3: Configuration Initiale (10 min)

### 3.1 Premier lancement

1. **Écran de bienvenue**:
   - Choisis "Do not import settings"
   - Clique sur "OK"

2. **Partage de données** (optionnel):
   - Choisis "Don't send" ou "Send" selon ta préférence
   - Clique sur "Next"

### 3.2 Type d'installation

1. **Choisis "Standard"** ← **RECOMMANDÉ**
   - Installe tout ce dont tu as besoin automatiquement
   - Clique sur "Next"

2. **Choisis le thème**:
   - Light ou Darcula (au choix)
   - Clique sur "Next"

### 3.3 Vérification des paramètres

Tu verras un résumé avec:
- ✅ Android SDK Location: `C:\Users\bairr\AppData\Local\Android\Sdk`
- ✅ Android SDK Platform
- ✅ Android SDK Build-Tools
- ✅ Android Emulator
- ✅ Android SDK Platform-Tools

**Clique sur "Next"**

### 3.4 Accepte les licences

1. **Lis et accepte** chaque licence:
   - Clique sur chaque licence dans la liste
   - Coche "Accept" pour chacune
   - Clique sur "Finish"

### 3.5 Téléchargement des composants

- ⏳ Télécharge ~3-4 GB de composants
- ⏱️ Prend 10-20 minutes (selon ta connexion)
- 📊 Tu verras une barre de progression

**Attends que tout soit téléchargé et installé**

### 3.6 Fin de la configuration

- Clique sur "Finish" quand tout est terminé
- Android Studio est maintenant prêt ! 🎉

---

## 🔧 Étape 4: Configuration des Variables d'Environnement

### Option A: Script Automatique ⭐ RECOMMANDÉ

1. **Ouvre PowerShell** en tant qu'administrateur:
   - Clique droit sur le menu Démarrer
   - Choisis "Windows PowerShell (Admin)"

2. **Lance le script**:
   ```powershell
   cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
   .\setup-android-env.bat
   ```

3. **Ferme et rouvre ton terminal PowerShell**

4. **Vérifie que tout fonctionne**:
   ```powershell
   echo $env:ANDROID_HOME
   # Devrait afficher: C:\Users\bairr\AppData\Local\Android\Sdk

   adb version
   # Devrait afficher la version d'ADB
   ```

### Option B: Configuration Manuelle

Si le script ne fonctionne pas, voici comment faire manuellement:

#### 4.1 Ouvre les Variables d'Environnement

1. **Recherche** "variables d'environnement" dans Windows
2. Clique sur "Modifier les variables d'environnement système"
3. Clique sur "Variables d'environnement..."

#### 4.2 Ajoute ANDROID_HOME

1. Dans "Variables utilisateur", clique sur "Nouvelle..."
2. **Nom de la variable**: `ANDROID_HOME`
3. **Valeur de la variable**: `C:\Users\bairr\AppData\Local\Android\Sdk`
4. Clique sur "OK"

#### 4.3 Ajoute ANDROID_SDK_ROOT

1. Clique à nouveau sur "Nouvelle..."
2. **Nom de la variable**: `ANDROID_SDK_ROOT`
3. **Valeur de la variable**: `C:\Users\bairr\AppData\Local\Android\Sdk`
4. Clique sur "OK"

#### 4.4 Modifie le PATH

1. Dans "Variables utilisateur", sélectionne "Path"
2. Clique sur "Modifier..."
3. Clique sur "Nouveau" et ajoute ces lignes **une par une**:
   ```
   C:\Users\bairr\AppData\Local\Android\Sdk\platform-tools
   C:\Users\bairr\AppData\Local\Android\Sdk\tools
   C:\Users\bairr\AppData\Local\Android\Sdk\tools\bin
   C:\Users\bairr\AppData\Local\Android\Sdk\emulator
   ```
4. Clique sur "OK" sur toutes les fenêtres

#### 4.5 Redémarre ton terminal

**IMPORTANT**: Ferme et rouvre PowerShell pour que les changements prennent effet

---

## 📱 Étape 5: Créer un Émulateur Android (5 min)

### 5.1 Ouvre le Device Manager

1. Dans Android Studio, clique sur **"More Actions"**
2. Choisis **"Virtual Device Manager"**

### 5.2 Crée un nouvel appareil

1. Clique sur **"Create Device"**

2. **Choisis un appareil**:
   - Recommandé: **Pixel 6** ou **Pixel 7**
   - Clique sur "Next"

3. **Choisis une image système**:
   - Recommandé: **Tiramisu (API 33)** ou **UpsideDownCake (API 34)**
   - Si pas téléchargée, clique sur "Download" à côté
   - Attends le téléchargement (~1-2 GB)
   - Clique sur "Next"

4. **Configure l'AVD**:
   - Nom: Laisse le nom par défaut (ex: "Pixel 6 API 33")
   - Orientation: Portrait
   - Clique sur "Finish"

### 5.3 Lance l'émulateur (test)

1. Dans le Device Manager, clique sur le bouton **▶️ (Play)** à côté de ton émulateur
2. Attends que l'émulateur démarre (1-2 minutes la première fois)
3. Tu devrais voir un téléphone Android virtuel s'afficher ! 🎉

---

## 🚀 Étape 6: Lancer l'App Lok'Room

### 6.1 Ouvre PowerShell

```powershell
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
```

### 6.2 Lance l'app sur l'émulateur

```powershell
npx cap run android
```

**Ce qui va se passer**:
1. ✅ Capacitor copie les assets web
2. ✅ Gradle build l'app Android (prend 2-3 min la première fois)
3. ✅ L'app s'installe sur l'émulateur
4. ✅ L'app se lance automatiquement
5. 🎉 Tu vois l'app Lok'Room sur l'émulateur !

---

## 🔍 Vérification Finale

### Vérifie que tout fonctionne

```powershell
# 1. Vérifie ANDROID_HOME
echo $env:ANDROID_HOME
# Devrait afficher: C:\Users\bairr\AppData\Local\Android\Sdk

# 2. Vérifie ADB
adb version
# Devrait afficher: Android Debug Bridge version X.X.X

# 3. Vérifie les appareils connectés
adb devices
# Devrait afficher ton émulateur ou appareil physique

# 4. Vérifie Gradle (dans le dossier android)
cd android
.\gradlew --version
# Devrait afficher la version de Gradle
```

---

## 🐛 Problèmes Courants

### Problème 1: "ANDROID_HOME not found"

**Solution**:
1. Vérifie que tu as bien fermé et rouvert PowerShell
2. Vérifie le chemin: `C:\Users\bairr\AppData\Local\Android\Sdk` existe
3. Relance le script `setup-android-env.bat`

### Problème 2: "adb: command not found"

**Solution**:
1. Vérifie que `platform-tools` est dans ton PATH
2. Redémarre ton PC
3. Réinstalle Android Studio si nécessaire

### Problème 3: L'émulateur ne démarre pas

**Solution**:
1. Vérifie que la virtualisation est activée dans le BIOS
2. Désactive Hyper-V si activé:
   ```powershell
   bcdedit /set hypervisorlaunchtype off
   ```
3. Redémarre ton PC

### Problème 4: "Gradle build failed"

**Solution**:
1. Vérifie ta connexion Internet
2. Lance:
   ```powershell
   cd android
   .\gradlew clean
   .\gradlew build
   ```

### Problème 5: L'app ne se connecte pas au backend

**Solution**:
1. Vérifie que `capacitor.config.ts` contient:
   ```typescript
   server: {
     url: 'https://www.lokroom.com',
   }
   ```
2. Vérifie que ton backend Vercel est en ligne
3. Teste l'URL dans un navigateur: https://www.lokroom.com

---

## 📞 Besoin d'Aide ?

Si tu rencontres des problèmes:

1. **Consulte les logs**:
   ```powershell
   npx cap run android --verbose
   ```

2. **Consulte la documentation**:
   - Android Studio: https://developer.android.com/studio/intro
   - Capacitor: https://capacitorjs.com/docs/android

3. **Vérifie les issues GitHub**:
   - Capacitor: https://github.com/ionic-team/capacitor/issues

---

## ✅ Checklist Finale

Avant de lancer l'app, vérifie que:

- [ ] Android Studio est installé
- [ ] Les composants SDK sont téléchargés
- [ ] Les variables d'environnement sont configurées
- [ ] PowerShell a été fermé et rouvert
- [ ] Un émulateur est créé (ou appareil physique connecté)
- [ ] `adb devices` affiche un appareil
- [ ] Le build Next.js est à jour (`npm run build`)
- [ ] Capacitor est synchronisé (`npx cap sync`)

Si tout est ✅, lance:
```powershell
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web
npx cap run android
```

---

## 🎉 Félicitations !

Si tu vois l'app Lok'Room sur ton émulateur, tu as réussi ! 🚀

**Prochaines étapes**:
1. Teste toutes les fonctionnalités de l'app
2. Génère un APK de production
3. Publie sur Google Play Store

---

**Dernière mise à jour**: 2026-02-09
**Temps total estimé**: 30-45 minutes
**Difficulté**: Débutant
