# Lok'Room - Sécurité

Ce dossier contient tous les utilitaires de sécurité pour Lok'Room.

## 📦 Modules

### 1. Rate Limiting (`rate-limit.ts`)

Protection contre les abus et attaques DDoS avec Upstash Redis.

**Limiters disponibles:**
- `authRateLimiter`: 5 req/min (login, signup, reset password)
- `apiRateLimiter`: 100 req/min (bookings, messages, listings)
- `publicRateLimiter`: 1000 req/min (search, public listings)
- `strictRateLimiter`: 10 req/min (paiements, modifications critiques)

**Usage:**
```typescript
import { authRateLimiter, withRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  // Vérifier rate limit
  const rateLimitResult = await withRateLimit(req, authRateLimiter);
  if (rateLimitResult.success !== true) {
    return rateLimitResult; // Retourne 429 Too Many Requests
  }

  // Votre logique ici
}
```

**Configuration:**
Ajouter dans `.env`:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 2. CSRF Protection (`csrf.ts`)

Protection contre les attaques Cross-Site Request Forgery.

**Fonctionnalités:**
- Génération de tokens CSRF
- Validation automatique sur POST/PUT/DELETE
- Cookies sécurisés (httpOnly, sameSite)

**Usage côté serveur:**
```typescript
import { withCsrfProtection } from "@/lib/security/csrf";

export const POST = withCsrfProtection(async (req: NextRequest) => {
  // Votre logique ici
  // Le token CSRF est déjà validé
});
```

**Usage côté client:**
```typescript
import { addCsrfHeader } from "@/lib/security/csrf";

const response = await fetch("/api/bookings", {
  method: "POST",
  headers: addCsrfHeader({
    "Content-Type": "application/json",
  }),
  body: JSON.stringify(data),
});
```

### 3. Input Sanitization (`sanitize.ts`)

Protection contre XSS et injection de code.

**Fonctions disponibles:**
- `sanitizeText(input)`: Texte simple (supprime tous les tags HTML)
- `sanitizeRichText(input)`: Texte riche (autorise formatage basique)
- `sanitizeEmail(input)`: Email normalisé et validé
- `sanitizeUrl(input)`: URL sécurisée (bloque javascript:, data:)
- `sanitizePhone(input)`: Numéro de téléphone
- `sanitizeObject(obj, richTextFields)`: Objet entier (récursif)

**Usage:**
```typescript
import { sanitizeText, sanitizeEmail } from "@/lib/security/sanitize";

const body = await req.json();

// Sanitize inputs
const name = sanitizeText(body.name);
const email = sanitizeEmail(body.email);
const description = sanitizeRichText(body.description);

if (!email) {
  return NextResponse.json({ error: "Email invalide" }, { status: 400 });
}
```

## 🔒 Routes Protégées

### Routes d'authentification
- `/api/auth/login` - Rate limited (5 req/min)
- `/api/auth/signup` - Rate limited (5 req/min)
- `/api/auth/forgot-password` - Rate limited (5 req/min)

### Routes API sensibles
- `/api/bookings/*` - Rate limited (100 req/min)
- `/api/messages/*` - Rate limited (100 req/min)
- `/api/listings/*` - Rate limited (100 req/min pour POST, 1000 req/min pour GET)

### Routes publiques
- `/api/listings` (GET) - Rate limited (1000 req/min)
- `/api/search` - Rate limited (1000 req/min)

## 🧪 Tests

### Tester le rate limiting

```bash
# Tester login (5 req/min)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# Devrait retourner 429 après 5 requêtes
```

### Tester CSRF protection

```bash
# Sans token CSRF (devrait échouer)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"listingId":"123"}' \
  -w "\nStatus: %{http_code}\n"

# Devrait retourner 403 Forbidden
```

### Tester sanitization

```typescript
import { sanitizeText, containsMaliciousCode } from "@/lib/security/sanitize";

// Test XSS
const malicious = '<script>alert("XSS")</script>Hello';
console.log(sanitizeText(malicious)); // "Hello"

// Test détection
console.log(containsMaliciousCode(malicious)); // true
```

## 📊 Monitoring

Les rate limiters incluent des analytics automatiques via Upstash.

**Métriques disponibles:**
- Nombre de requêtes par IP
- Taux de blocage (429)
- Patterns d'abus

**Accès:**
Dashboard Upstash → Analytics → Rate Limiting

## 🚨 Alertes

En production, configurer des alertes pour:
- Taux de 429 > 5%
- Pics de requêtes suspects
- Tentatives de bypass CSRF

## 🔧 Configuration Avancée

### Personnaliser les limites

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const customLimiter = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(50, "1 m"), // 50 req/min
  analytics: true,
  prefix: "ratelimit:custom",
});
```

### Whitelist d'IPs

```typescript
const WHITELISTED_IPS = ["1.2.3.4", "5.6.7.8"];

export async function withRateLimitWhitelist(req: NextRequest, limiter: Ratelimit) {
  const ip = getIdentifier(req);

  if (WHITELISTED_IPS.includes(ip)) {
    return { success: true };
  }

  return withRateLimit(req, limiter);
}
```

## 📚 Ressources

- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

## 🎯 Score de Sécurité

**Avant:** 6/10
**Après:** 7/10

**Améliorations:**
- ✅ Rate limiting sur toutes les routes critiques
- ✅ CSRF protection complète
- ✅ Input sanitization systématique
- ✅ Protection XSS
- ✅ Validation stricte des emails/URLs

**Prochaines étapes (8/10):**
- [ ] WAF (Web Application Firewall)
- [ ] Détection d'anomalies ML
- [ ] Honeypots pour bots
- [ ] 2FA obligatoire pour admins
