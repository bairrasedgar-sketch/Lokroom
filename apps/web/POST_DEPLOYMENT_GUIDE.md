# 🚀 Guide Post-Déploiement - Lok'Room

## 📋 Checklist Immédiate Après Déploiement

### 1️⃣ Vérifier que l'Application est Accessible

**URL de production:** https://lokroom.vercel.app (ou votre domaine personnalisé)

**Tests de base:**
- [ ] La page d'accueil se charge
- [ ] Pas d'erreur 500 ou 404
- [ ] Les images se chargent
- [ ] Le CSS est appliqué correctement

---

### 2️⃣ Tester les Fonctionnalités Critiques

#### A. Authentification
- [ ] Page de connexion accessible (`/login`)
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Session persiste après rafraîchissement

#### B. Listings (Annonces)
- [ ] Liste des annonces visible (`/listings`)
- [ ] Détail d'une annonce accessible (`/listings/[id]`)
- [ ] Création d'annonce fonctionne (`/listings/new`)
- [ ] Édition d'annonce fonctionne (`/listings/[id]/edit`)
- [ ] Images des annonces se chargent

#### C. Recherche
- [ ] Barre de recherche fonctionne
- [ ] Filtres fonctionnent
- [ ] Résultats s'affichent correctement

#### D. Réservations
- [ ] Formulaire de réservation fonctionne
- [ ] Calcul des prix correct
- [ ] Confirmation de réservation

#### E. Profil Utilisateur
- [ ] Page de profil accessible (`/profile`)
- [ ] Modification du profil fonctionne
- [ ] Upload d'avatar fonctionne

---

### 3️⃣ Vérifier les Logs Vercel

**Accès aux logs:**
1. Aller sur https://vercel.com/lokrooms-projects/lokroom
2. Cliquer sur "Deployments"
3. Cliquer sur le dernier déploiement
4. Onglet "Logs"

**Vérifier:**
- [ ] Pas d'erreurs critiques
- [ ] Pas d'erreurs Redis (devrait être géré gracieusement)
- [ ] Prisma Client généré correctement
- [ ] Pas d'erreurs de connexion DB

---

### 4️⃣ Tester les API Routes

**Routes critiques à tester:**

```bash
# Health check
curl https://votre-domaine.vercel.app/api/health

# Auth session
curl https://votre-domaine.vercel.app/api/auth/session

# Listings
curl https://votre-domaine.vercel.app/api/listings

# Amenities
curl https://votre-domaine.vercel.app/api/amenities
```

**Résultats attendus:**
- [ ] Status 200 pour toutes les routes
- [ ] Pas d'erreur Redis
- [ ] Données JSON valides

---

### 5️⃣ Vérifier les Variables d'Environnement

**Dans Vercel Dashboard > Settings > Environment Variables:**

**Variables Requises:**
- [ ] `DATABASE_URL` - Connexion PostgreSQL
- [ ] `NEXTAUTH_SECRET` - Secret pour NextAuth
- [ ] `NEXTAUTH_URL` - URL de production

**Variables Optionnelles:**
- [ ] `REDIS_URL` - Cache Redis (optionnel)
- [ ] `SENTRY_DSN` - Monitoring Sentry
- [ ] `STRIPE_SECRET_KEY` - Paiements Stripe
- [ ] `CLOUDFLARE_R2_*` - Stockage d'images

**Si une variable manque:**
1. Ajouter dans Vercel Dashboard
2. Redéployer l'application

---

## 🐛 Problèmes Courants et Solutions

### Problème 1: Erreur 500 au Chargement

**Cause possible:** Variable d'environnement manquante

**Solution:**
1. Vérifier les logs Vercel
2. Ajouter les variables manquantes
3. Redéployer

---

### Problème 2: Erreur de Connexion Base de Données

**Erreur:** `Can't reach database server`

**Solution:**
1. Vérifier que `DATABASE_URL` est correcte
2. Vérifier que la DB est accessible depuis Vercel
3. Vérifier les règles de firewall de la DB

---

### Problème 3: Images ne se Chargent Pas

**Cause possible:** Domaines d'images non autorisés

**Solution:**
1. Vérifier `next.config.mjs` - section `remotePatterns`
2. Ajouter les domaines manquants
3. Redéployer

---

### Problème 4: Erreur NextAuth

**Erreur:** `[next-auth][error][SIGNIN_OAUTH_ERROR]`

**Solution:**
1. Vérifier `NEXTAUTH_SECRET` est défini
2. Vérifier `NEXTAUTH_URL` pointe vers le bon domaine
3. Vérifier les credentials OAuth (Google, GitHub, etc.)

---

### Problème 5: Prisma Client Non Généré

**Erreur:** `@prisma/client did not initialize yet`

**Solution:**
1. Vérifier que `prisma generate` est dans le script build
2. Vérifier les logs de build Vercel
3. Redéployer si nécessaire

---

## 🔍 Monitoring et Debugging

### A. Logs en Temps Réel

**Commande CLI Vercel:**
```bash
vercel logs --follow
```

**Ou via Dashboard:**
https://vercel.com/lokrooms-projects/lokroom/logs

---

### B. Sentry (Si configuré)

**URL:** https://sentry.io/organizations/votre-org/issues/

**Vérifier:**
- [ ] Pas d'erreurs critiques
- [ ] Performance acceptable
- [ ] Pas de memory leaks

---

### C. Vercel Analytics

**URL:** https://vercel.com/lokrooms-projects/lokroom/analytics

**Métriques à surveiller:**
- [ ] Temps de réponse < 1s
- [ ] Taux d'erreur < 1%
- [ ] Core Web Vitals dans le vert

---

## 🚀 Optimisations Post-Déploiement

### 1️⃣ Configurer Redis (Recommandé)

**Pourquoi:** Améliore drastiquement les performances

**Comment:**
1. Créer une instance Redis (Upstash, Redis Cloud, etc.)
2. Ajouter `REDIS_URL` dans Vercel
3. Redéployer

**Bénéfices:**
- Cache des listings
- Cache des recherches
- Rate limiting
- Sessions

---

### 2️⃣ Configurer un CDN pour les Images

**Options:**
- Cloudflare R2
- AWS S3 + CloudFront
- Vercel Blob Storage

**Configuration:**
1. Créer un bucket de stockage
2. Configurer les variables d'environnement
3. Mettre à jour `next.config.mjs`

---

### 3️⃣ Activer la Compression

**Déjà configuré:**
- ✅ Brotli compression (script compress-assets.cjs)
- ✅ Gzip fallback
- ✅ Headers de cache optimisés

**Vérifier:**
```bash
curl -I https://votre-domaine.vercel.app/_next/static/chunks/main.js
# Devrait contenir: Content-Encoding: br ou gzip
```

---

### 4️⃣ Configurer le Monitoring

**Sentry (Recommandé):**
1. Créer un compte Sentry
2. Ajouter `SENTRY_DSN` dans Vercel
3. Redéployer

**Vercel Analytics:**
- Déjà activé par défaut
- Voir les métriques dans le dashboard

---

## 📊 Métriques de Succès

### Performance
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1

### Disponibilité
- [ ] Uptime > 99.9%
- [ ] Taux d'erreur < 0.1%
- [ ] Temps de réponse API < 500ms

### Fonctionnalités
- [ ] Toutes les pages accessibles
- [ ] Toutes les API routes fonctionnelles
- [ ] Authentification stable
- [ ] Paiements fonctionnels (si configuré)

---

## 🔄 Workflow de Déploiement Continu

### Déploiements Automatiques

**Déjà configuré:**
- ✅ Push sur `main` → Déploiement automatique
- ✅ Pull Requests → Preview deployments
- ✅ Rollback automatique si erreur

### Bonnes Pratiques

1. **Tester localement d'abord:**
   ```bash
   npm run build
   npm start
   ```

2. **Créer une branche pour les features:**
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   ```

3. **Tester le preview deployment:**
   - Vercel crée un preview pour chaque PR
   - Tester avant de merger

4. **Merger vers main:**
   ```bash
   git checkout main
   git merge feature/nouvelle-fonctionnalite
   git push origin main
   ```

---

## 🆘 Support et Aide

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Vercel:** https://vercel.com/docs
- **Prisma:** https://www.prisma.io/docs

### Logs et Debugging
- **Vercel Logs:** https://vercel.com/lokrooms-projects/lokroom/logs
- **Sentry:** https://sentry.io (si configuré)

### Communauté
- **Next.js Discord:** https://nextjs.org/discord
- **Vercel Discord:** https://vercel.com/discord

---

## ✅ Checklist Finale

Après avoir suivi ce guide:

- [ ] Application accessible en production
- [ ] Toutes les fonctionnalités critiques testées
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Variables d'environnement configurées
- [ ] Monitoring activé
- [ ] Performance acceptable
- [ ] Documentation à jour

---

## 🎉 Félicitations!

Votre application Lok'Room est maintenant déployée en production!

**Prochaines étapes:**
1. Partager l'URL avec les utilisateurs
2. Monitorer les performances
3. Itérer sur les feedbacks
4. Ajouter de nouvelles fonctionnalités

---

**Date de création:** 2026-02-09
**Version:** 1.0
**Auteur:** Claude Sonnet 4.5
