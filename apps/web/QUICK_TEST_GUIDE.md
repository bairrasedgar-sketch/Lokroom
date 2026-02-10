# 🧪 Guide de Test Rapide - Lok'Room

## ✅ Checklist de Test Immédiat (5 minutes)

### 1. Test de Base - Page d'Accueil
**URL:** https://www.lokroom.com

**À vérifier:**
- [ ] La page se charge (pas d'erreur 500)
- [ ] Le logo et la navigation sont visibles
- [ ] Les images se chargent
- [ ] Pas d'erreur dans la console du navigateur (F12)

**Si erreur 500:**
- Ouvrir la console (F12)
- Copier l'erreur exacte
- Vérifier les logs Vercel

---

### 2. Test de Navigation
**Pages à tester:**

- [ ] `/` - Page d'accueil
- [ ] `/listings` - Liste des annonces
- [ ] `/about` - À propos
- [ ] `/contact` - Contact
- [ ] `/login` - Connexion

**Résultat attendu:** Toutes les pages se chargent sans erreur 500

---

### 3. Test des API Routes
**Ouvrir dans un nouvel onglet:**

```
https://www.lokroom.com/api/health
https://www.lokroom.com/api/amenities
https://www.lokroom.com/api/listings
```

**Résultat attendu:**
- Status 200 ou données JSON
- Pas d'erreur EROFS
- Pas d'erreur Redis

---

### 4. Test des Logs Vercel
**URL:** https://vercel.com/lokrooms-projects/lokroom/logs

**À vérifier:**
- [ ] Pas d'erreur EROFS: mkdir 'logs/'
- [ ] Pas d'erreur Redis (ou géré gracieusement)
- [ ] Les logs apparaissent correctement

---

## 🐛 Problèmes Courants et Solutions Rapides

### Problème 1: Erreur 500 Persistante

**Diagnostic:**
1. Ouvrir F12 > Console
2. Regarder l'erreur exacte
3. Vérifier les logs Vercel

**Solutions possibles:**
- Variable d'environnement manquante
- Erreur de connexion DB
- Autre problème de configuration

---

### Problème 2: Images ne se Chargent Pas

**Diagnostic:**
- Vérifier la console (F12)
- Chercher des erreurs 404 ou CORS

**Solution:**
- Vérifier `next.config.mjs` - section `remotePatterns`
- Ajouter les domaines manquants

---

### Problème 3: Erreur NextAuth

**Diagnostic:**
- Erreur de connexion/inscription
- Erreur de session

**Solution:**
- Vérifier `NEXTAUTH_SECRET` dans Vercel
- Vérifier `NEXTAUTH_URL` pointe vers le bon domaine

---

## 📊 Résultats Attendus

### ✅ Succès Total
- Toutes les pages se chargent
- Pas d'erreur 500
- Pas d'erreur EROFS dans les logs
- API routes fonctionnent
- Navigation fluide

### ⚠️ Succès Partiel
- Page d'accueil fonctionne
- Quelques erreurs mineures (images, etc.)
- Fonctionnalités principales OK

### ❌ Échec
- Erreur 500 persistante
- Application inaccessible
- Erreurs critiques dans les logs

---

## 🚀 Après les Tests

### Si Tout Fonctionne 🎉
1. **Félicitations!** L'application est déployée
2. Suivre le guide complet: `POST_DEPLOYMENT_GUIDE.md`
3. Tester les fonctionnalités avancées
4. Configurer Redis (optionnel)
5. Activer le monitoring

### Si Problèmes Mineurs ⚠️
1. Noter les problèmes
2. Continuer les tests
3. Corriger les problèmes un par un

### Si Échec Critique ❌
1. Copier l'erreur exacte
2. Copier les logs Vercel
3. Me donner ces informations
4. Je corrigerai immédiatement

---

## 📝 Template de Rapport de Test

```
## Test de Déploiement Lok'Room

**Date:** [DATE]
**URL:** https://www.lokroom.com

### Résultats:
- [ ] Page d'accueil: OK / ERREUR
- [ ] Navigation: OK / ERREUR
- [ ] API Routes: OK / ERREUR
- [ ] Logs Vercel: OK / ERREUR

### Erreurs Rencontrées:
[Copier les erreurs ici]

### Logs Vercel:
[Copier les logs pertinents]

### Captures d'Écran:
[Si applicable]
```

---

## 🔗 Liens Utiles

- **Application:** https://www.lokroom.com
- **Vercel Dashboard:** https://vercel.com/lokrooms-projects/lokroom
- **Logs Vercel:** https://vercel.com/lokrooms-projects/lokroom/logs
- **Guide Complet:** POST_DEPLOYMENT_GUIDE.md

---

**Temps estimé:** 5 minutes
**Difficulté:** Facile
**Prérequis:** Aucun

Bonne chance! 🚀
