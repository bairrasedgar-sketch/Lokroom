# Configuration Sentry pour Lok'Room

## Vue d'ensemble

Sentry est configuré pour le monitoring des erreurs en production. Cette configuration capture automatiquement les erreurs côté client et serveur, les performances lentes, et les sessions avec erreurs.

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre `.env.local`:

```bash
# Sentry DSN (obtenu depuis sentry.io)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Organisation et projet (pour upload des source maps)
SENTRY_ORG="lokroom"
SENTRY_PROJECT="lokroom-web"
SENTRY_AUTH_TOKEN="votre-token-auth"

# Version de l'app (optionnel)
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Obtenir le DSN Sentry

1. Créez un compte sur [sentry.io](https://sentry.io)
2. Créez un nouveau projet Next.js
3. Copiez le DSN fourni
4. Ajoutez-le dans `.env.local`

### Obtenir le token d'authentification

Pour l'upload des source maps en production:

1. Allez dans Settings > Auth Tokens
2. Créez un nouveau token avec les permissions:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copiez le token dans `SENTRY_AUTH_TOKEN`

## Fichiers de configuration

### `sentry.client.config.ts`
Configuration pour le navigateur (client-side):
- Capture des erreurs JavaScript
- Session Replay (10% des sessions, 100% des erreurs)
- Performance monitoring (10% des transactions)
- Filtrage des erreurs non pertinentes (timeout, navigation, etc.)

### `sentry.server.config.ts`
Configuration pour le serveur Node.js:
- Capture des erreurs API
- Performance monitoring
- Filtrage des erreurs DB temporaires

### `sentry.edge.config.ts`
Configuration pour Edge Runtime (middleware):
- Capture des erreurs middleware
- Performance monitoring léger

## Logger structuré

Le logger (`src/lib/logger.ts`) remplace `console.log` et intègre Sentry automatiquement:

```typescript
import { logger } from "@/lib/logger";

// Logs basiques
logger.info("User logged in", { userId: "123" });
logger.warn("Slow query detected", { duration: 1500 });
logger.error("Payment failed", error, { orderId: "456" });

// Logs spécialisés
logger.logApi("POST", "/api/bookings", 201, 150);
logger.logPerformance("database-query", 1200);
logger.logAuth("login", userId);
logger.logPayment("charge-created", 5000, "EUR");
logger.logSecurity("suspicious-activity", "high", { ip: "1.2.3.4" });
```

## Fichiers modifiés

Les fichiers suivants utilisent maintenant le logger au lieu de `console.log`:

1. `src/app/api/listings/route.ts` - Création/liste des annonces
2. `src/app/api/listings/search/route.ts` - Recherche d'annonces
3. `src/app/api/listings/[id]/route.ts` - CRUD annonces
4. `src/app/api/listings/[id]/amenities/route.ts` - Gestion amenities
5. `src/app/api/listings/[id]/images/route.ts` - Upload/suppression images

## Tests

### Route de test

Une route de test est disponible pour vérifier la configuration:

```bash
# Test d'erreur
curl http://localhost:3000/api/test-sentry?type=error

# Test de warning
curl http://localhost:3000/api/test-sentry?type=warning

# Test de performance lente
curl http://localhost:3000/api/test-sentry?type=performance
```

### Vérification manuelle

1. Démarrez l'app en mode production:
```bash
npm run build
npm run start
```

2. Visitez `/api/test-sentry?type=error`
3. Vérifiez dans Sentry que l'erreur apparaît

## Alertes email

### Configuration dans Sentry

1. Allez dans **Settings > Alerts**
2. Créez une nouvelle règle:
   - **Nom**: "Erreurs critiques production"
   - **Conditions**:
     - Environment = production
     - Level = error
   - **Actions**:
     - Send email to: votre-email@lokroom.com
     - Frequency: Immediately

3. Créez une règle pour les performances:
   - **Nom**: "Opérations lentes"
   - **Conditions**:
     - Transaction duration > 1000ms
   - **Actions**:
     - Send email (Daily digest)

### Types d'alertes recommandées

1. **Erreurs critiques** (immédiat)
   - Erreurs 500
   - Erreurs de paiement
   - Erreurs d'authentification

2. **Performances** (quotidien)
   - Requêtes > 1s
   - Transactions lentes

3. **Sécurité** (immédiat)
   - Tentatives de connexion suspectes
   - Rate limiting déclenché

## Bonnes pratiques

### Utiliser le logger partout

❌ **Éviter**:
```typescript
console.log("User created");
console.error("Error:", error);
```

✅ **Préférer**:
```typescript
logger.info("User created", { userId: user.id });
logger.error("Failed to create user", error, { email: user.email });
```

### Ajouter du contexte

```typescript
// Bon: contexte riche
logger.error("Payment failed", error, {
  userId: user.id,
  amount: 5000,
  currency: "EUR",
  paymentMethod: "stripe",
});

// Mauvais: pas de contexte
logger.error("Payment failed", error);
```

### Filtrer les erreurs non pertinentes

Les erreurs suivantes sont automatiquement filtrées:
- Timeouts réseau
- Erreurs de navigation
- Annulations de requêtes (AbortError)
- Erreurs de connexion DB temporaires

## Performance

### Impact sur les performances

- **Client**: ~10KB gzipped
- **Overhead**: < 5ms par requête
- **Sampling**: 10% des transactions en production

### Optimisations

1. **Session Replay**: Seulement 10% des sessions normales
2. **Source maps**: Uploadées uniquement en production
3. **Filtrage**: Erreurs non pertinentes ignorées
4. **Sampling**: Performance monitoring sur 10% des requêtes

## Sécurité

### Données sensibles

Le logger masque automatiquement:
- Mots de passe
- Tokens
- Clés API
- Données PII (via Session Replay masking)

### Configuration Session Replay

```typescript
maskAllText: true,        // Masque tout le texte
blockAllMedia: true,      // Bloque images/vidéos
```

## Monitoring en production

### Métriques clés à surveiller

1. **Error Rate**: < 1%
2. **Response Time**: < 500ms (p95)
3. **Apdex Score**: > 0.9
4. **Session Replay**: Vérifier les erreurs UX

### Dashboard recommandé

Créez un dashboard Sentry avec:
- Erreurs par endpoint
- Temps de réponse par route
- Taux d'erreur par jour
- Top 10 des erreurs

## Dépannage

### Sentry ne capture pas les erreurs

1. Vérifiez que `NEXT_PUBLIC_SENTRY_DSN` est défini
2. Vérifiez que `NODE_ENV=production`
3. Vérifiez les logs: `logger.info("Test")`
4. Testez avec `/api/test-sentry?type=error`

### Source maps non uploadées

1. Vérifiez `SENTRY_AUTH_TOKEN`
2. Vérifiez `SENTRY_ORG` et `SENTRY_PROJECT`
3. Vérifiez les logs de build

### Trop d'erreurs capturées

Ajustez les filtres dans `sentry.client.config.ts`:

```typescript
beforeSend(event, hint) {
  // Ignorer certaines erreurs
  if (event.exception?.values?.[0]?.value?.includes("MonErreur")) {
    return null;
  }
  return event;
}
```

## Ressources

- [Documentation Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Dashboard Sentry](https://sentry.io)
- [Logger Lok'Room](./src/lib/logger.ts)
- [Route de test](./src/app/api/test-sentry/route.ts)
