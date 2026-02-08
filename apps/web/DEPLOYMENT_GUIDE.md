# 🎯 Guide de Déploiement Complet - Lok'Room Mobile

## 📋 Checklist Complète

### ✅ Phase 1 : Configuration Locale (TERMINÉ)
- [x] Capacitor installé et configuré
- [x] Plugins natifs installés
- [x] Assets générés (104 fichiers)
- [x] Animation splash screen intégrée
- [x] API Client professionnel créé
- [x] Token Manager sécurisé
- [x] Middleware CORS configuré
- [x] Script de migration créé

### ⏳ Phase 2 : Déploiement Backend (À FAIRE)
- [ ] Créer compte Vercel
- [ ] Connecter GitHub à Vercel
- [ ] Configurer variables d'environnement
- [ ] Déployer le backend
- [ ] Tester les APIs en production

### ⏳ Phase 3 : Configuration Mobile (À FAIRE)
- [ ] Créer .env.local pour mobile
- [ ] Migrer les appels API
- [ ] Tester en local
- [ ] Build l'app mobile
- [ ] Tester sur simulateur

### ⏳ Phase 4 : Publication (À FAIRE)
- [ ] Créer compte Apple Developer (99$/an)
- [ ] Créer compte Google Play Developer (25$)
- [ ] Préparer screenshots
- [ ] Soumettre sur App Store
- [ ] Soumettre sur Play Store

---

## 🚀 Phase 2 : Déploiement Backend sur Vercel

### Étape 1 : Créer un Compte Vercel

1. **Aller sur Vercel**
   - URL : https://vercel.com
   - Cliquer sur "Sign Up"

2. **Se connecter avec GitHub**
   - Choisir "Continue with GitHub"
   - Autoriser Vercel à accéder à GitHub
   - Sélectionner le repo "Lokroom"

### Étape 2 : Importer le Projet

1. **Dans Vercel Dashboard**
   - Cliquer sur "Add New..." → "Project"
   - Sélectionner "Import Git Repository"
   - Choisir "bairrasedgar-sketch/Lokroom"

2. **Configuration du Projet**
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `apps/web`
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)

### Étape 3 : Variables d'Environnement

**IMPORTANT : Copier TOUTES les variables de `.env.local`**

Variables essentielles à configurer :

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://lokroom.vercel.app

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudflare R2 / S3
S3_ENDPOINT=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_PUBLIC_BASE=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# App URL
NEXT_PUBLIC_APP_URL=https://lokroom.vercel.app
```

**Comment ajouter les variables :**
1. Dans Vercel, aller dans "Settings" → "Environment Variables"
2. Ajouter chaque variable une par une
3. Sélectionner "Production", "Preview", "Development"
4. Cliquer sur "Save"

### Étape 4 : Déployer

1. **Cliquer sur "Deploy"**
   - Vercel va :
     - Cloner le repo
     - Installer les dépendances
     - Générer Prisma
     - Builder Next.js
     - Déployer sur le CDN

2. **Attendre 2-3 minutes**
   - Suivre les logs en temps réel
   - Vérifier qu'il n'y a pas d'erreurs

3. **Récupérer l'URL**
   - URL de production : `https://lokroom.vercel.app`
   - Ou URL personnalisée : `https://lokroom-xxx.vercel.app`

### Étape 5 : Tester le Backend

**Tester les APIs :**

```bash
# Health check
curl https://lokroom.vercel.app/api/health

# Listings
curl https://lokroom.vercel.app/api/listings

# Ping
curl https://lokroom.vercel.app/api/ping
```

**Vérifier dans le navigateur :**
- Aller sur `https://lokroom.vercel.app`
- Vérifier que le site fonctionne
- Tester la connexion
- Tester une recherche

---

## 🚀 Phase 3 : Configuration Mobile

### Étape 1 : Créer .env.local pour Mobile

**Créer `apps/web/.env.local.mobile` :**

```bash
# Backend API URL (Vercel)
NEXT_PUBLIC_API_URL=https://lokroom.vercel.app

# Mode Capacitor
CAPACITOR_BUILD=true

# Toutes les autres variables NEXT_PUBLIC_* de .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_APP_URL=https://lokroom.vercel.app
```

### Étape 2 : Migrer les Appels API

**Lancer le script de migration :**

```bash
cd apps/web
npm run migrate:api
```

**Ce que fait le script :**
- ✅ Trouve tous les `fetch('/api/...')`
- ✅ Les remplace par `api.get/post/put/delete()`
- ✅ Ajoute l'import `import { api } from '@/lib/api-client'`
- ✅ Affiche un résumé des modifications

**Exemple de transformation :**

**Avant :**
```typescript
const response = await fetch('/api/listings');
const data = await response.json();
```

**Après :**
```typescript
import { api } from '@/lib/api-client';

const data = await api.get('/api/listings');
```

### Étape 3 : Build l'App Mobile

```bash
cd apps/web

# Copier les variables d'environnement mobile
cp .env.local.mobile .env.local

# Build l'app mobile
npm run mobile:build
```

**Ce que ça fait :**
1. Génère Prisma
2. Build Next.js en mode static
3. Copie le build vers iOS et Android
4. Synchronise les assets

### Étape 4 : Tester sur Simulateur

**Pour iOS (Mac uniquement) :**
```bash
npm run cap:open:ios
```
- Xcode s'ouvre
- Sélectionner iPhone 15 Pro
- Cliquer sur ▶️ (Run)
- L'app se lance avec ton animation ! 🎬

**Pour Android :**
```bash
npm run cap:open:android
```
- Android Studio s'ouvre
- Créer un émulateur Pixel 7
- Cliquer sur ▶️ (Run)
- L'app se lance avec ton animation ! 🎬

---

## 🎯 Phase 4 : Publication (Optionnel)

### App Store (iOS)

**Prérequis :**
- Mac avec Xcode
- Compte Apple Developer (99$/an)
- iPhone pour tester

**Étapes :**
1. Configurer le Bundle ID dans Xcode
2. Configurer les certificats et profils
3. Archiver l'app (Product → Archive)
4. Uploader vers App Store Connect
5. Remplir les métadonnées
6. Soumettre pour review (1-3 jours)

### Play Store (Android)

**Prérequis :**
- Compte Google Play Developer (25$ une fois)
- Android Studio

**Étapes :**
1. Générer une clé de signature
2. Builder l'AAB (Android App Bundle)
3. Créer une app dans Play Console
4. Uploader l'AAB
5. Remplir les métadonnées
6. Soumettre pour review (quelques heures)

---

## 📊 Résumé des Coûts

| Service | Coût | Fréquence |
|---------|------|-----------|
| Vercel (Backend) | Gratuit | - |
| Apple Developer | 99$ | /an |
| Google Play Developer | 25$ | Une fois |
| **Total première année** | **124$** | - |
| **Total années suivantes** | **99$** | /an |

---

## 🎯 Prochaine Action Immédiate

**Je te recommande de faire dans l'ordre :**

### 1. Déployer sur Vercel (10 minutes)
- Créer compte Vercel
- Importer le projet
- Configurer les variables d'environnement
- Déployer

### 2. Migrer les APIs (5 minutes)
```bash
npm run migrate:api
```

### 3. Build et Tester (10 minutes)
```bash
npm run mobile:build
npm run cap:open:android  # ou cap:open:ios
```

**Total : 25 minutes pour une app mobile complète ! 🚀**

---

## 💡 Besoin d'Aide ?

**Je peux t'aider avec :**
- A) Te guider pas à pas pour Vercel
- B) Résoudre les erreurs de build
- C) Configurer les comptes développeur
- D) Autre chose

**Dis-moi ce que tu veux faire maintenant !** 🚀
