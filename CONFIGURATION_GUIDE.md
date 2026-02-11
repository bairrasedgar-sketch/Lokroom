# 🚀 Guide de Configuration - Lok'Room

## 📋 Étapes Rapides (1h total)

### 1️⃣ Upstash Redis (30 min) - Rate Limiting

#### Créer un compte Upstash
1. Aller sur https://upstash.com
2. Créer un compte (gratuit)
3. Cliquer sur "Create Database"
4. Choisir:
   - **Type**: Redis
   - **Name**: lokroom-redis
   - **Region**: Europe (eu-central-1) ou proche de ton serveur
   - **Plan**: Free (25k requests/jour)

#### Récupérer les credentials
1. Une fois la base créée, aller dans l'onglet "Details"
2. Copier:
   - **UPSTASH_REDIS_REST_URL**: `https://xxx-xxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `AXXXxxx...`

#### Ajouter dans .env
```bash
# Ajouter ces lignes dans apps/web/.env
UPSTASH_REDIS_REST_URL="https://xxx-xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXxxx..."
```

#### Ajouter dans Vercel
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet Lok'Room
3. Settings → Environment Variables
4. Ajouter:
   - `UPSTASH_REDIS_REST_URL` = `https://xxx-xxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `AXXXxxx...`
5. Redéployer: Deployments → Latest → Redeploy

#### Tester
```bash
# En local
npm run dev

# Tester une route protégée (max 10 requêtes/min)
curl http://localhost:3000/api/listings
```

---

### 2️⃣ Sentry (30 min) - Monitoring

#### Créer un compte Sentry
1. Aller sur https://sentry.io
2. Créer un compte (gratuit - 5k events/mois)
3. Créer un nouveau projet:
   - **Platform**: Next.js
   - **Project Name**: lokroom-web
   - **Team**: Personal

#### Récupérer le DSN
1. Une fois le projet créé, copier le **DSN**:
   - Format: `https://xxx@xxx.ingest.sentry.io/xxx`

#### Ajouter dans .env
```bash
# Ajouter ces lignes dans apps/web/.env
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ORG="lokroom"
SENTRY_PROJECT="lokroom-web"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

#### Ajouter dans Vercel
1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet Lok'Room
3. Settings → Environment Variables
4. Ajouter:
   - `SENTRY_DSN` = `https://xxx@xxx.ingest.sentry.io/xxx`
   - `NEXT_PUBLIC_SENTRY_DSN` = `https://xxx@xxx.ingest.sentry.io/xxx`
   - `SENTRY_ORG` = `lokroom`
   - `SENTRY_PROJECT` = `lokroom-web`
   - `NEXT_PUBLIC_APP_VERSION` = `1.0.0`
5. Redéployer

#### Tester
```bash
# En local
npm run dev

# Tester l'envoi d'erreur à Sentry
curl "http://localhost:3000/api/test-sentry?type=error"

# Vérifier sur Sentry.io → Issues
```

---

## ✅ Vérification Finale

### Checklist
- [ ] Upstash Redis configuré (local + Vercel)
- [ ] Sentry configuré (local + Vercel)
- [ ] Rate limiting fonctionne (tester avec 10+ requêtes)
- [ ] Sentry reçoit les erreurs (tester avec /api/test-sentry)
- [ ] Vercel redéployé avec les nouvelles variables

### Commandes de test
```bash
# Test rate limiting (doit bloquer après 10 requêtes)
for i in {1..15}; do curl http://localhost:3000/api/listings; done

# Test Sentry
curl "http://localhost:3000/api/test-sentry?type=error"
curl "http://localhost:3000/api/test-sentry?type=message"
```

---

## 📊 Impact sur le Score

Après configuration:
- **Sécurité**: 7/10 → 8/10 (rate limiting actif)
- **Monitoring**: 6/10 → 8/10 (Sentry en production)
- **Score Global**: 6.8/10 → 7.2/10 ✅

---

## 🆘 Problèmes Courants

### Upstash Redis
- **Erreur "Invalid token"**: Vérifier que le token est bien copié (pas d'espaces)
- **Erreur "Connection refused"**: Vérifier l'URL (doit commencer par https://)

### Sentry
- **Pas d'erreurs dans Sentry**: Vérifier que NEXT_PUBLIC_SENTRY_DSN est bien défini
- **Erreur "Invalid DSN"**: Vérifier le format du DSN

---

## 📝 Notes

- Les variables `NEXT_PUBLIC_*` sont exposées au client (browser)
- Les autres variables sont uniquement côté serveur
- Redéployer Vercel après chaque modification des variables d'environnement
- Le plan gratuit Upstash suffit pour 25k requêtes/jour
- Le plan gratuit Sentry suffit pour 5k events/mois
