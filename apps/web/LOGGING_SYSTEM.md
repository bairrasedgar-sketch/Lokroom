# Système de Logging Avancé - Lok'Room

## Vue d'ensemble

Système de logging professionnel basé sur Winston avec rotation automatique des fichiers, niveaux de logs structurés et monitoring en temps réel.

## Architecture

### Composants principaux

1. **Configuration Winston** (`src/lib/logger/config.ts`)
   - 3 loggers spécialisés (app, http, business)
   - Rotation quotidienne des fichiers
   - Format personnalisé avec timestamps
   - Console colorée en développement

2. **Service de logging** (`src/lib/logger/service.ts`)
   - API unifiée pour tous les types de logs
   - Méthodes spécialisées pour les événements métier
   - Logs de sécurité et performance

3. **Intégration Prisma** (`src/lib/db.ts`)
   - Détection automatique des requêtes lentes (>1s)
   - Logs des erreurs et warnings Prisma
   - Monitoring des performances DB

4. **Middleware HTTP** (`src/middleware/logging.ts`)
   - Logs automatiques de toutes les requêtes
   - Mesure de la durée d'exécution
   - Capture des erreurs

5. **Interface admin** (`src/app/admin/system-logs/page.tsx`)
   - Visualisation en temps réel
   - Filtrage par type (error, warn, info, http, business)
   - Interface style terminal

## Types de logs

### 1. Logs généraux (app-YYYY-MM-DD.log)
- Rétention: 14 jours
- Contenu: info, warn, debug
- Taille max: 20MB par fichier

### 2. Logs d'erreurs (error-YYYY-MM-DD.log)
- Rétention: 30 jours
- Contenu: erreurs uniquement avec stack traces
- Taille max: 20MB par fichier

### 3. Logs HTTP (http-YYYY-MM-DD.log)
- Rétention: 7 jours
- Contenu: requêtes HTTP avec durée et status
- Taille max: 20MB par fichier

### 4. Logs métier (business-YYYY-MM-DD.log)
- Rétention: 30 jours
- Contenu: événements business (bookings, payments, users, listings)
- Taille max: 20MB par fichier

## Utilisation

### Logs basiques

```typescript
import { log } from "@/lib/logger/service";

// Info
log.info("User logged in", { userId: "123" });

// Warning
log.warn("Rate limit approaching", { userId: "123", count: 8 });

// Error
log.error("Payment failed", error, { bookingId: "456" });

// Debug (dev uniquement)
log.debug("Cache miss", { key: "user:123" });
```

### Logs métier

```typescript
// Réservation créée
log.logBookingCreated("booking-id", "user-id", "listing-id", 150.00);

// Paiement réussi
log.logPaymentSucceeded("payment-id", 150.00, "user-id");

// Utilisateur enregistré
log.logUserRegistered("user-id", "email@example.com", "email");

// Annonce créée
log.logListingCreated("listing-id", "owner-id", "APARTMENT");
```

### Logs de sécurité

```typescript
log.logSecurityEvent("unauthorized_access", userId, ip, {
  resource: "/admin",
  action: "DELETE",
});
```

### Logs de performance

```typescript
log.logSlowQuery("SELECT * FROM users", 1500, { limit: 100 });
```

### Logs HTTP (automatique via middleware)

```typescript
import { loggingMiddleware } from "@/middleware/logging";

export async function GET(req: NextRequest) {
  return loggingMiddleware(req, async () => {
    // Votre logique ici
    return NextResponse.json({ data: "..." });
  });
}
```

## Intégration dans les APIs

### Exemple: API de paiement

```typescript
// apps/web/src/app/api/bookings/pay/route.ts
import { log } from "@/lib/logger/service";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Logique de paiement...

    const duration = Date.now() - startTime;
    log.info("Payment intent created", {
      bookingId: booking.id,
      userId,
      amount: booking.totalPrice,
      duration: `${duration}ms`,
    });

    return NextResponse.json({ clientSecret });
  } catch (e) {
    log.error("Payment creation failed", e as Error, {
      duration: `${Date.now() - startTime}ms`,
    });
    throw e;
  }
}
```

### Exemple: API de création d'annonce

```typescript
// apps/web/src/app/api/listings/route.ts
import { log } from "@/lib/logger/service";

export async function POST(req: NextRequest) {
  try {
    // Création de l'annonce...

    log.logListingCreated(listing.id, user.id, data.type);

    return NextResponse.json({ listing });
  } catch (err) {
    log.error("POST /api/listings error", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Monitoring Prisma

Les requêtes lentes sont automatiquement détectées:

```typescript
// src/lib/db.ts
prisma.$on("query", (e: any) => {
  if (e.duration > 1000) {
    log.logSlowQuery(e.query, e.duration, e.params);
  }
});
```

## Interface d'administration

### Accès
- URL: `/admin/system-logs`
- Authentification: Admin uniquement

### Fonctionnalités
- Filtrage par type (all, error, warn, info, http, business)
- Affichage des 100 dernières lignes
- Rafraîchissement manuel
- Interface style terminal (fond noir, texte vert)

## Scripts de maintenance

### Nettoyage des logs

```bash
npm run logs:clean
```

Supprime automatiquement les logs de plus de 30 jours.

### Configuration du cron (production)

```bash
# Ajouter au crontab
0 2 * * * cd /path/to/app && npm run logs:clean
```

## Variables d'environnement

```bash
# Niveau de log (debug, info, warn, error)
LOG_LEVEL=info

# Environnement
NODE_ENV=production
```

## Structure des fichiers

```
apps/web/
├── logs/                           # Dossier des logs (gitignored)
│   ├── app-2026-02-09.log         # Logs généraux
│   ├── error-2026-02-09.log       # Erreurs uniquement
│   ├── http-2026-02-09.log        # Requêtes HTTP
│   └── business-2026-02-09.log    # Événements métier
├── src/
│   ├── lib/
│   │   ├── logger/
│   │   │   ├── config.ts          # Configuration Winston
│   │   │   └── service.ts         # Service de logging
│   │   └── db.ts                  # Intégration Prisma
│   ├── middleware/
│   │   └── logging.ts             # Middleware HTTP
│   ├── app/
│   │   ├── admin/
│   │   │   └── system-logs/
│   │   │       └── page.tsx       # Interface admin
│   │   └── api/
│   │       └── admin/
│   │           └── system-logs/
│   │               └── route.ts   # API de lecture des logs
├── scripts/
│   └── clean-logs.js              # Script de nettoyage
└── __tests__/
    └── logger.test.ts             # Tests unitaires
```

## Format des logs

### Format général
```
2026-02-09 14:30:45 [info]: User logged in {"userId":"123","ip":"192.168.1.1"}
```

### Format erreur
```
2026-02-09 14:30:45 [error]: Payment failed {"error":"Insufficient funds","stack":"Error: Insufficient funds\n    at ..."}
```

### Format HTTP
```
2026-02-09 14:30:45 [info]: HTTP Request {"method":"POST","url":"/api/bookings","statusCode":201,"duration":"150ms"}
```

### Format business
```
2026-02-09 14:30:45 [info]: Booking Created {"event":"booking.created","bookingId":"abc123","userId":"user456","listingId":"list789","amount":150}
```

## Tests

### Exécution des tests

```bash
npm test -- logger.test.ts
```

### Tests couverts
- Logs info/warn/error/debug
- Logs métier (booking, payment, user, listing)
- Logs de sécurité
- Logs de performance (slow queries)
- Gestion des erreurs avec stack traces

## Performance

### Impact
- < 1ms par log en moyenne
- Écriture asynchrone (non-bloquante)
- Rotation automatique sans interruption

### Optimisations
- Logs debug désactivés en production
- Buffer d'écriture pour les logs fréquents
- Compression automatique des anciens logs

## Sécurité

### Données sensibles
- Ne jamais logger de mots de passe
- Ne jamais logger de tokens complets
- Masquer les données PII si nécessaire

### Exemple de masquage

```typescript
log.info("User action", {
  userId: user.id,
  email: user.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // ma***@example.com
  action: "profile_update",
});
```

## Monitoring en production

### Métriques à surveiller
- Nombre d'erreurs par heure
- Requêtes lentes (>1s)
- Événements de sécurité
- Taux de succès des paiements

### Alertes recommandées
- > 10 erreurs/minute → alerte critique
- > 5 requêtes lentes/minute → alerte warning
- Événement de sécurité → alerte immédiate

## Intégration future

### Sentry
Les logs d'erreurs peuvent être envoyés à Sentry:

```typescript
log.error("Critical error", error, { context });
// Sentry.captureException(error, { contexts: { custom: context } });
```

### DataDog / New Relic
Les logs peuvent être streamés vers des services de monitoring:

```typescript
// Configuration Winston pour DataDog
const datadogTransport = new DatadogTransport({
  apiKey: process.env.DATADOG_API_KEY,
});
```

## Dépannage

### Les logs ne s'écrivent pas
1. Vérifier que le dossier `logs/` existe
2. Vérifier les permissions d'écriture
3. Vérifier la variable `LOG_LEVEL`

### Les logs sont trop volumineux
1. Réduire la rétention (modifier `maxFiles` dans config.ts)
2. Augmenter la fréquence de nettoyage
3. Filtrer les logs non essentiels

### Performance dégradée
1. Vérifier la taille des fichiers de logs
2. Désactiver les logs debug en production
3. Augmenter `maxSize` pour réduire la fréquence de rotation

## Checklist de déploiement

- [ ] Variable `LOG_LEVEL` configurée
- [ ] Dossier `logs/` dans `.gitignore`
- [ ] Cron de nettoyage configuré
- [ ] Permissions d'écriture vérifiées
- [ ] Tests de logging exécutés
- [ ] Interface admin accessible
- [ ] Rotation des logs testée
- [ ] Monitoring configuré (optionnel)

## Support

Pour toute question ou problème:
1. Consulter les logs d'erreurs: `logs/error-YYYY-MM-DD.log`
2. Vérifier l'interface admin: `/admin/system-logs`
3. Exécuter les tests: `npm test -- logger.test.ts`
