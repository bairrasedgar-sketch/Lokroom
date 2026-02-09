# 🚀 Déploiement Beta Privée - Lok'Room Mobile

## 🎯 Objectif

Déployer l'app Lok'Room sur **Google Play Store (Android)** et **Apple App Store (iOS)** en mode **beta privée** pour tester sur ton téléphone personnel.

---

## 📋 Prérequis

### Pour Android (Google Play)
- ✅ Compte Google Play Console (25$ one-time)
- ✅ APK signé en mode release
- ✅ Icônes et screenshots
- ✅ Description de l'app

### Pour iOS (Apple App Store)
- ✅ Compte Apple Developer (99$/an)
- ✅ Mac avec Xcode (obligatoire pour iOS)
- ✅ Certificats et profils de provisioning
- ✅ Build signé

---

## 🤖 Partie 1: Déploiement Android (Google Play Beta)

### Étape 1: Créer un Compte Google Play Console

1. **Va sur**: https://play.google.com/console
2. **Clique sur "Créer un compte développeur"**
3. **Paye les 25$ (one-time)** - c'est à vie !
4. **Remplis les informations**:
   - Nom du développeur: "Lok'Room" ou ton nom
   - Email de contact
   - Adresse

### Étape 2: Préparer l'APK de Production

#### 2.1 Générer une Clé de Signature

```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web\android\app

# Créer un keystore (clé de signature)
keytool -genkey -v -keystore lokroom-release.keystore -alias lokroom -keyalg RSA -keysize 2048 -validity 10000

# Répondre aux questions:
# - Mot de passe du keystore: [CHOISIS UN MOT DE PASSE FORT]
# - Prénom et nom: Lok'Room
# - Unité organisationnelle: Mobile
# - Organisation: Lok'Room
# - Ville: [Ta ville]
# - État: [Ton état/région]
# - Code pays: FR (ou ton pays)
```

**⚠️ IMPORTANT**: Sauvegarde ce fichier `lokroom-release.keystore` et le mot de passe dans un endroit sûr ! Si tu le perds, tu ne pourras plus mettre à jour l'app.

#### 2.2 Configurer Gradle pour Signer l'APK

Créer le fichier `android/key.properties`:

```properties
storePassword=TON_MOT_DE_PASSE_KEYSTORE
keyPassword=TON_MOT_DE_PASSE_KEY
keyAlias=lokroom
storeFile=app/lokroom-release.keystore
```

#### 2.3 Builder l'APK Signé

```bash
cd C:\Users\bairr\Downloads\lokroom-starter\apps\web\android

# Builder l'APK de production signé
.\gradlew assembleRelease

# L'APK sera dans:
# android/app/build/outputs/apk/release/app-release.apk
```

### Étape 3: Créer l'App sur Google Play Console

1. **Dans Google Play Console**, clique sur **"Créer une application"**

2. **Remplis les informations**:
   - Nom de l'app: **Lok'Room**
   - Langue par défaut: **Français**
   - Type: **Application**
   - Gratuite ou payante: **Gratuite**

3. **Accepte les déclarations**

### Étape 4: Configurer la Fiche de l'App

#### 4.1 Fiche du Play Store

- **Titre**: Lok'Room
- **Description courte** (80 caractères max):
  ```
  Location d'espaces à l'heure - Maisons, studios, parkings et plus
  ```

- **Description complète**:
  ```
  Lok'Room est la plateforme de location d'espaces à l'heure.

  🏠 Loue des espaces uniques:
  - Maisons et appartements
  - Studios photo/vidéo
  - Parkings et garages
  - Bureaux et salles de réunion
  - Espaces événementiels

  ⏰ Réservation flexible:
  - À l'heure, à la journée ou plus
  - Paiement sécurisé
  - Confirmation instantanée

  💬 Communication directe:
  - Messagerie intégrée
  - Notifications en temps réel

  🔒 Sécurité garantie:
  - Vérification d'identité
  - Paiements sécurisés via Stripe
  - Assurance incluse

  Télécharge Lok'Room et découvre des espaces uniques près de chez toi !
  ```

#### 4.2 Icône et Screenshots

**Icône de l'app** (512x512 px):
- Utilise ton logo Lok'Room
- Format PNG avec transparence

**Screenshots** (minimum 2, recommandé 8):
- Taille: 1080x1920 px (portrait) ou 1920x1080 px (paysage)
- Capture d'écran de:
  1. Page d'accueil
  2. Recherche d'annonces
  3. Détail d'une annonce
  4. Messagerie
  5. Profil utilisateur
  6. Création d'annonce
  7. Réservations
  8. Paiement

#### 4.3 Catégorie et Tags

- **Catégorie**: Voyages et infos locales
- **Tags**: location, espace, maison, studio, parking

### Étape 5: Créer une Version Beta Privée

1. **Va dans "Tests" > "Tests internes"**

2. **Clique sur "Créer une version"**

3. **Upload l'APK**:
   - Clique sur "Upload"
   - Sélectionne `app-release.apk`

4. **Remplis les notes de version**:
   ```
   Version 1.0.0 (Beta)
   - Première version beta
   - Fonctionnalités principales implémentées
   - Tests en cours
   ```

5. **Enregistre et publie**

### Étape 6: Ajouter des Testeurs

1. **Va dans "Tests" > "Tests internes" > "Testeurs"**

2. **Crée une liste de testeurs**:
   - Nom: "Beta Privée"
   - Ajoute ton email Gmail

3. **Enregistre**

### Étape 7: Installer l'App sur Ton Téléphone

1. **Tu recevras un email** avec un lien d'invitation

2. **Clique sur le lien** depuis ton téléphone Android

3. **Accepte l'invitation**

4. **Télécharge l'app** depuis le Play Store (version beta)

5. **L'app s'installe** comme une app normale !

---

## 🍎 Partie 2: Déploiement iOS (TestFlight Beta)

### Prérequis iOS

⚠️ **IMPORTANT**: Pour déployer sur iOS, tu as **BESOIN** d'un Mac avec Xcode. Pas de solution alternative.

Si tu n'as pas de Mac:
- **Option 1**: Utilise un Mac d'un ami/famille
- **Option 2**: Loue un Mac dans le cloud (MacStadium, MacinCloud)
- **Option 3**: Achète un Mac Mini (le moins cher)

### Étape 1: Créer un Compte Apple Developer

1. **Va sur**: https://developer.apple.com/
2. **Clique sur "Account"**
3. **Inscris-toi** (99$/an)
4. **Paye les 99$**

### Étape 2: Configurer Xcode (sur Mac uniquement)

```bash
# Ouvrir le projet iOS dans Xcode
cd /path/to/lokroom-starter/apps/web
npx cap open ios
```

### Étape 3: Configurer les Certificats

1. **Dans Xcode**, va dans **"Signing & Capabilities"**
2. **Sélectionne ton équipe** (Apple Developer Account)
3. **Xcode génère automatiquement** les certificats

### Étape 4: Builder l'App

1. **Dans Xcode**, sélectionne **"Any iOS Device"** comme destination
2. **Clique sur "Product" > "Archive"**
3. **Attends que le build se termine** (5-10 min)

### Étape 5: Upload sur App Store Connect

1. **Une fois l'archive créée**, clique sur **"Distribute App"**
2. **Choisis "App Store Connect"**
3. **Suis les étapes** pour uploader

### Étape 6: Créer une Version TestFlight

1. **Va sur**: https://appstoreconnect.apple.com/
2. **Clique sur "My Apps" > "+"** pour créer une nouvelle app
3. **Remplis les informations**:
   - Nom: Lok'Room
   - Langue: Français
   - Bundle ID: com.lokroom.app
   - SKU: lokroom-app

4. **Va dans "TestFlight"**
5. **Ajoute des testeurs internes** (toi-même)
6. **Envoie l'invitation**

### Étape 7: Installer via TestFlight

1. **Télécharge TestFlight** depuis l'App Store
2. **Accepte l'invitation** reçue par email
3. **Installe l'app** depuis TestFlight

---

## 📊 Résumé des Coûts

| Plateforme | Coût | Fréquence |
|------------|------|-----------|
| **Google Play** | 25$ | One-time (à vie) |
| **Apple App Store** | 99$ | Par an |
| **Total première année** | 124$ | - |
| **Total années suivantes** | 99$ | Par an |

---

## ✅ Checklist Avant Déploiement

### Android
- [ ] Compte Google Play Console créé et payé
- [ ] Keystore généré et sauvegardé
- [ ] APK signé généré
- [ ] Icône 512x512 prête
- [ ] Screenshots (minimum 2) prêts
- [ ] Description rédigée
- [ ] Version beta créée
- [ ] Testeur ajouté (toi)

### iOS
- [ ] Compte Apple Developer créé et payé
- [ ] Accès à un Mac avec Xcode
- [ ] Certificats configurés
- [ ] Build archivé
- [ ] App créée sur App Store Connect
- [ ] Version TestFlight créée
- [ ] Testeur ajouté (toi)

---

## 🎯 Avantages de la Beta Privée

✅ **Tester sur ton vrai téléphone** (plus de bugs d'émulateur)
✅ **Notifications push réelles**
✅ **Performance réelle**
✅ **Tester les paiements** (mode test Stripe)
✅ **Tester la géolocalisation**
✅ **Tester l'appareil photo**
✅ **Partager avec quelques amis** si tu veux
✅ **Mises à jour faciles** (upload nouvelle version)

---

## 🚀 Prochaines Étapes

1. **Je vais optimiser l'interface mobile** pour tous les écrans
2. **Tu crées les comptes** (Google Play + Apple Developer)
3. **Je t'aide à générer les APK/IPA**
4. **Tu déploies en beta**
5. **Tu testes sur ton téléphone** 🎉

---

## 💡 Conseils

- **Commence par Android** (plus simple, pas besoin de Mac)
- **Teste bien sur Android** avant de payer pour iOS
- **Prends des screenshots** de qualité pour le store
- **Utilise ton vrai logo** pour l'icône
- **Teste toutes les fonctionnalités** avant de passer en production

---

## 📞 Besoin d'Aide ?

Si tu bloques à une étape:
1. Dis-moi où tu en es
2. Envoie-moi les messages d'erreur
3. Je t'aide à débloquer !

---

**Prêt à déployer ? Dis-moi quand tu veux commencer !** 🚀
