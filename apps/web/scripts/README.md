# 🎯 Script de Déploiement Automatique - Lok'Room Mobile

Ce script automatise TOUT le processus de déploiement mobile.

## 🚀 Ce que fait ce script

1. ✅ Vérifie que Vercel est configuré
2. ✅ Migre automatiquement tous les appels API
3. ✅ Configure les variables d'environnement mobile
4. ✅ Build l'application mobile
5. ✅ Synchronise avec Capacitor
6. ✅ Affiche les instructions pour tester

## 📋 Prérequis

- Node.js installé
- Git configuré
- Compte Vercel créé (gratuit)
- Backend déployé sur Vercel

## 🎬 Utilisation

```bash
cd apps/web
npm run deploy:mobile
```

## 📝 Variables d'environnement requises

Le script va te demander :
- URL du backend Vercel (ex: https://lokroom.vercel.app)
- Clé Google Maps API
- Autres variables NEXT_PUBLIC_*

## ⚙️ Options

```bash
# Déploiement complet (recommandé)
npm run deploy:mobile

# Déploiement sans migration API (si déjà fait)
npm run deploy:mobile -- --skip-migration

# Déploiement en mode verbose (debug)
npm run deploy:mobile -- --verbose
```

## 🔍 Que faire en cas d'erreur ?

### Erreur : "Backend URL not configured"
→ Configure NEXT_PUBLIC_API_URL dans .env.local

### Erreur : "Capacitor not found"
→ Installe Capacitor : `npm install`

### Erreur : "Build failed"
→ Vérifie les logs et corrige les erreurs TypeScript

## 📊 Résultat attendu

Après exécution réussie :
- ✅ Tous les appels API migrés
- ✅ App mobile buildée
- ✅ Assets synchronisés
- ✅ Prêt à tester sur simulateur

## 🎯 Prochaine étape

```bash
# Pour iOS (Mac uniquement)
npm run cap:open:ios

# Pour Android
npm run cap:open:android
```

---

**Temps total : ~5 minutes** ⚡
