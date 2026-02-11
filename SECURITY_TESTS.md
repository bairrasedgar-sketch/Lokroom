# Tests de Sécurité - Lok'Room

Guide complet pour tester les nouvelles protections de sécurité.

## 🎯 Objectif

Passer de **Sécurité 6/10** à **Sécurité 7/10** avec:
- Rate limiting sur routes critiques
- CSRF protection complète
- Input sanitization systématique

## 📋 Prérequis

1. **Configurer Upstash Redis:**
   ```bash
   # Créer un compte sur https://upstash.com
   # Créer une base Redis
   # Copier les credentials dans .env
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

2. **Installer les dépendances:**
   ```bash
   cd apps/web
   npm install
   ```

3. **Démarrer le serveur:**
   ```bash
   npm run dev
   ```

## 🧪 Tests Rate Limiting

### Test 1: Route d'authentification (5 req/min)

```bash
# Test login - devrait bloquer après 5 tentatives
for i in {1..10}; do
  echo "Tentative $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done

# Résultat attendu:
# - Tentatives 1-5: 401 Unauthorized (credentials invalides)
# - Tentatives 6-10: 429 Too Many Requests (rate limited)
```

### Test 2: Route API (100 req/min)

```bash
# Test bookings - devrait bloquer après 100 requêtes
for i in {1..110}; do
  echo "Requête $i:"
  curl -X GET http://localhost:3000/api/bookings \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -w "\nStatus: %{http_code}\n"
done

# Résultat attendu:
# - Requêtes 1-100: 200 OK
# - Requêtes 101-110: 429 Too Many Requests
```

### Test 3: Route publique (1000 req/min)

```bash
# Test listings - devrait bloquer après 1000 requêtes
for i in {1..1010}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:3000/api/listings
done | sort | uniq -c

# Résultat attendu:
# 1000 200
#   10 429
```

### Test 4: Vérifier les headers de rate limiting

```bash
curl -v http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Headers attendus:
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 4
# X-RateLimit-Reset: 1234567890
```

## 🛡️ Tests CSRF Protection

### Test 1: Requête sans token CSRF (devrait échouer)

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"listingId":"123","startDate":"2026-03-01","endDate":"2026-03-02"}' \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 403 Forbidden
# Message: "Token CSRF invalide ou manquant"
```

### Test 2: Requête avec token CSRF valide (devrait réussir)

```bash
# 1. Récupérer le token CSRF
CSRF_TOKEN=$(curl -s http://localhost:3000/api/listings \
  -c cookies.txt | grep -o 'csrf-token=[^;]*' | cut -d= -f2)

# 2. Faire la requête avec le token
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION; csrf-token=$CSRF_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"listingId":"123","startDate":"2026-03-01","endDate":"2026-03-02"}' \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 200 OK ou 400 Bad Request (selon les données)
```

### Test 3: Requêtes GET (pas de CSRF requis)

```bash
curl -X GET http://localhost:3000/api/listings \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 200 OK (pas de CSRF sur GET)
```

## 🧹 Tests Input Sanitization

### Test 1: XSS dans les messages

```bash
# Envoyer un message avec script XSS
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "conversationId": "123",
    "content": "<script>alert(\"XSS\")</script>Hello World"
  }' \
  -w "\nStatus: %{http_code}\n"

# Vérifier en DB que le message est sanitizé:
# Attendu: "Hello World" (script supprimé)
```

### Test 2: Injection SQL dans email

```bash
# Tenter une injection SQL
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com; DROP TABLE users;--"
  }' \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 400 Bad Request
# Message: "Format d'email invalide"
```

### Test 3: URL malicieuse

```bash
# Tenter d'injecter une URL javascript:
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test",
    "description": "<a href=\"javascript:alert(1)\">Click me</a>"
  }' \
  -w "\nStatus: %{http_code}\n"

# Vérifier en DB que l'URL est supprimée ou bloquée
```

### Test 4: HTML dans titre d'annonce

```bash
# Envoyer du HTML dans le titre
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "<b>Bold Title</b><script>alert(1)</script>",
    "description": "Test"
  }' \
  -w "\nStatus: %{http_code}\n"

# Vérifier en DB:
# Attendu: "Bold Title" (tags supprimés)
```

## 🔍 Tests de Régression

### Test 1: Authentification normale

```bash
# Login avec credentials valides
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid@example.com",
    "password": "ValidPassword123!"
  }' \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 200 OK avec token
```

### Test 2: Création de réservation normale

```bash
# Créer une réservation valide
curl -X POST http://localhost:3000/api/bookings/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "listingId": "valid-listing-id",
    "startDate": "2026-03-01",
    "endDate": "2026-03-02"
  }' \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 200 OK avec booking
```

### Test 3: Envoi de message normal

```bash
# Envoyer un message normal
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "conversationId": "valid-conv-id",
    "content": "Bonjour, je suis intéressé par votre annonce."
  }' \
  -w "\nStatus: %{http_code}\n"

# Résultat attendu: 201 Created avec message
```

## 📊 Checklist de Validation

### Rate Limiting
- [ ] Login bloqué après 5 tentatives
- [ ] API bloquée après 100 requêtes
- [ ] Routes publiques bloquées après 1000 requêtes
- [ ] Headers X-RateLimit-* présents
- [ ] Message d'erreur clair (429)
- [ ] Retry-After header présent

### CSRF Protection
- [ ] POST sans token CSRF bloqué (403)
- [ ] POST avec token CSRF valide accepté
- [ ] GET sans token CSRF accepté
- [ ] Token CSRF dans cookie
- [ ] Token CSRF dans header X-CSRF-Token

### Input Sanitization
- [ ] Scripts XSS supprimés
- [ ] Tags HTML dangereux supprimés
- [ ] URLs javascript: bloquées
- [ ] Emails validés et normalisés
- [ ] Injection SQL impossible
- [ ] Caractères de contrôle supprimés

### Régression
- [ ] Login normal fonctionne
- [ ] Signup normal fonctionne
- [ ] Création de réservation fonctionne
- [ ] Envoi de message fonctionne
- [ ] Création d'annonce fonctionne
- [ ] Recherche fonctionne

## 🚨 Tests de Sécurité Avancés

### Test 1: Bypass rate limiting avec IPs multiples

```bash
# Tenter de bypass avec X-Forwarded-For
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 1.2.3.$i" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
done

# Devrait quand même être rate limited (utilise la vraie IP)
```

### Test 2: CSRF token replay attack

```bash
# 1. Récupérer un token CSRF
TOKEN1=$(curl -s http://localhost:3000/api/listings -c cookies1.txt | grep csrf-token)

# 2. Attendre 25h (expiration)
# 3. Réutiliser le token
curl -X POST http://localhost:3000/api/bookings \
  -H "X-CSRF-Token: $TOKEN1" \
  -d '{"listingId":"123"}' \
  -w "\nStatus: %{http_code}\n"

# Devrait échouer (token expiré)
```

### Test 3: Injection de caractères Unicode

```bash
# Tenter d'injecter des caractères Unicode malicieux
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "conversationId": "123",
    "content": "Hello\u0000World\u202E"
  }' \
  -w "\nStatus: %{http_code}\n"

# Devrait sanitizer les caractères de contrôle
```

## 📈 Résultats Attendus

### Avant (Sécurité 6/10)
- ❌ Pas de rate limiting global
- ❌ CSRF protection partielle
- ❌ Sanitization manuelle

### Après (Sécurité 7/10)
- ✅ Rate limiting sur toutes les routes critiques
- ✅ CSRF protection complète
- ✅ Sanitization automatique
- ✅ Protection XSS
- ✅ Validation stricte

## 🎓 Commandes Utiles

```bash
# Vérifier les logs Redis (rate limiting)
# Dashboard Upstash → Analytics

# Vérifier les cookies CSRF
curl -v http://localhost:3000/api/listings 2>&1 | grep -i "set-cookie"

# Tester avec différentes IPs
curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:3000/api/listings

# Monitorer les 429 en temps réel
tail -f logs/app.log | grep "429"
```

## 🔧 Troubleshooting

### Rate limiting ne fonctionne pas
1. Vérifier que Redis est configuré dans `.env`
2. Vérifier la connexion: `curl https://your-redis-url.upstash.io`
3. Vérifier les logs: `console.log` dans `rate-limit.ts`

### CSRF bloque les requêtes légitimes
1. Vérifier que le token est dans le cookie ET le header
2. Vérifier que `sameSite: 'strict'` n'est pas trop restrictif
3. En dev, mettre `SKIP_CSRF=true` temporairement

### Sanitization trop agressive
1. Utiliser `sanitizeRichText` au lieu de `sanitizeText` pour les descriptions
2. Ajuster `ALLOWED_TAGS` dans `sanitize.ts`
3. Vérifier que les champs corrects sont sanitizés

## ✅ Validation Finale

Une fois tous les tests passés:
1. Commit les changements
2. Déployer en staging
3. Tester en production avec des vraies données
4. Monitorer les métriques pendant 24h
5. Valider le score de sécurité: **7/10** ✨
