# Configuration Sentry - Lok'Room

Guide complet pour configurer et utiliser Sentry pour le monitoring des erreurs en production.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [Variables d'environnement](#variables-denvironnement)
4. [Architecture](#architecture)
5. [Intégration avec le logger](#intégration-avec-le-logger)
6. [Tests](#tests)
7. [Utilisation](#utilisation)
8. [Bonnes pratiques](#bonnes-pratiques)
9. [Dépannage](#dépannage)

## Vue d'ensemble

Sentry est configuré pour capturer automatiquement:
- Erreurs JavaScript/TypeScript (client et serveur)
- Erreurs non gérées dans les API routes
- Erreurs React (via ErrorBoundary)
- Performances lentes (> 1s)
- Session Replay pour les erreurs

### Fichiers de configuration

```
apps/web/
├── sentry.client.config.ts    # Configuration client (navigateur)
├── sentry.server.config.ts    # Configuration serveur (Node.js)
├── sentry.edge.config.ts      # Configuration Edge Runtime
├── src/
│   ├── instrumentation.ts     # Initialisation Sentry au démarrage
│   ├── lib/logger.ts          # Logger intégré avec Sentry
│   └── components/
│       └── SentryErrorBoundary.tsx  # Error Boundary React
└── next.config.mjs            # Configuration Next.js + Sentry
```

## Configuration initiale

### 1. Créer un projet Sentry

1. Aller sur [sentry.io](https://sentry.io)
2. Créer un compte ou se connecter
3. Créer un nouveau projet:
   - Platform: **Next.js**
   - Project name: **lokroom-web**
   - Organization: **lokroom**

### 2. Récupérer les credentials

Après création du projet, récupérer:
- **DSN** (Data Source Name): `https://xxx@xxx.ingest.sentry.io/xxx`
- **Auth Token**: Settings > Developer Settings > Auth Tokens > Create New Token
  - Permissions: `project:releases`, `org:read`

## Variables d'environnement

### Fichier `.env.local` (développement)

```bash
# Sentry - Error Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ORG="lokroom"
SENTRY_PROJECT="lokroom-web"
SENTRY_AUTH_TOKEN="sntrys_xxx..."

# Version de l'app (pour tracking des releases)
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Fichier `.env.production` (production)

```bash
# Sentry - Error Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ORG="lokroom"
SENTRY_PROJECT="lokroom-web"
SENTRY_AUTH_TOKEN="sntrys_xxx..."

# Version de l'app
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Environment
NODE_ENV="production"
```

### Variables Vercel

Dans Vercel Dashboard > Settings > Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xxx@xxx.ingest.sentry.io/xxx` | Production, Preview |
| `SENTRY_ORG` | `lokroom` | Production, Preview |
| `SENTRY_PROJECT` | `lokroom-web` | Production, Preview |
| `SENTRY_AUTH_TOKEN` | `sntrys_xxx...` | Production, Preview |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | Production, Preview |

## Architecture

### 1. Configuration client (`sentry.client.config.ts`)

Capture les erreurs côté navigateur:
- Erreurs JavaScript non gérées
- Erreurs React (via ErrorBoundary)
- Session Replay (10% des sessions, 100% des erreurs)
- Performance monitoring (10% en production)

### 2. Configuration serveur (`sentry.server.config.ts`)

Capture les erreurs côté serveur:
- Erreurs dans les API routes
- Erreurs dans les Server Components
- Erreurs de connexion DB (filtrées)

### 3. Configuration Edge (`sentry.edge.config.ts`)

Capture les erreurs dans Edge Runtime:
- Middleware
- Edge API routes

### 4. Instrumentation (`src/instrumentation.ts`)

Initialise Sentry au démarrage du serveur:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

## Intégration avec le logger

Le logger (`src/lib/logger.ts`) est intégré avec Sentry:

### Utilisation du logger

```typescript
import { logger } from "@/lib/logger";

// Log une erreur (envoyée à Sentry en production)
logger.error("Payment failed", error, {
  bookingId: "123",
  amount: 100,
});

// Log un warning
logger.warn("Slow API response", {
  endpoint: "/api/bookings",
  duration: 2500,
});

// Log une info (pas envoyée à Sentry)
logger.info("User logged in", {
  userId: "123",
});

// Log une performance lente (> 1s envoyée à Sentry)
logger.logPerformance("Database query", 1500, {
  query: "SELECT * FROM bookings",
});
```

### Avantages du logger

- Logs structurés avec contexte
- Envoi automatique à Sentry en production
- Filtrage intelligent (pas de spam)
- Support client et serveur
- Buffer des logs récents (debug)

## Tests

### Route de test

Une route de test est disponible: `/api/test-sentry`

```bash
# Test erreur
curl http://localhost:3000/api/test-sentry?type=error

# Test warning
curl http://localhost:3000/api/test-sentry?type=warning

# Test info
curl http://localhost:3000/api/test-sentry?type=info

# Test performance lente
curl http://localhost:3000/api/test-sentry?type=performance
```

### Vérifier dans Sentry

1. Aller sur [sentry.io](https://sentry.io)
2. Sélectionner le projet **lokroom-web**
3. Aller dans **Issues**
4. Vérifier que les erreurs de test apparaissent

### Test en développement

Par défaut, Sentry est **désactivé en développement** (`enabled: false`).

Pour tester en développement:

1. Modifier `sentry.client.config.ts` et `sentry.server.config.ts`:
```typescript
enabled: true, // Au lieu de: process.env.NODE_ENV === "production"
```

2. Redémarrer le serveur:
```bash
npm run dev
```

3. Tester la route `/api/test-sentry`

4. **Important**: Remettre `enabled: process.env.NODE_ENV === "production"` après les tests

## Utilisation

### Dans les API routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // Votre code...

    return NextResponse.json({ success: true });
  } catch (error) {
    // Erreur capturée et envoyée à Sentry
    logger.error("API error", error, {
      endpoint: "/api/bookings",
      method: "POST",
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Dans les composants React

```typescript
"use client";

import { logger } from "@/lib/logger";

export default function MyComponent() {
  const handleClick = async () => {
    try {
      // Votre code...
    } catch (error) {
      logger.error("Button click failed", error, {
        component: "MyComponent",
      });
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Capturer manuellement avec Sentry

```typescript
import * as Sentry from "@sentry/nextjs";

// Capturer une exception
Sentry.captureException(new Error("Something went wrong"), {
  tags: {
    section: "payment",
  },
  contexts: {
    booking: {
      id: "123",
      amount: 100,
    },
  },
});

// Capturer un message
Sentry.captureMessage("User completed onboarding", {
  level: "info",
  tags: {
    userId: "123",
  },
});
```

## Bonnes pratiques

### 1. Utiliser le logger

Préférer le logger à `console.log` ou `Sentry.captureException`:
```typescript
// ✅ Bon
logger.error("Payment failed", error, { bookingId: "123" });

// ❌ Éviter
console.error("Payment failed", error);
Sentry.captureException(error);
```

### 2. Ajouter du contexte

Toujours ajouter du contexte aux erreurs:
```typescript
logger.error("Database query failed", error, {
  query: "SELECT * FROM bookings",
  userId: "123",
  duration: 2500,
});
```

### 3. Filtrer les erreurs non pertinentes

Les erreurs suivantes sont déjà filtrées:
- Erreurs réseau (NetworkError)
- Timeouts
- Annulations de requêtes (AbortError)
- Erreurs de navigation

### 4. Ne pas exposer de données sensibles

```typescript
// ❌ Mauvais - expose le mot de passe
logger.error("Login failed", error, {
  email: "user@example.com",
  password: "secret123", // ❌ NE JAMAIS FAIRE ÇA
});

// ✅ Bon
logger.error("Login failed", error, {
  email: "user@example.com",
  // Pas de mot de passe
});
```

### 5. Utiliser les tags pour filtrer

```typescript
Sentry.captureException(error, {
  tags: {
    feature: "payment",
    provider: "stripe",
    critical: "true",
  },
});
```

## Dépannage

### Les erreurs n'apparaissent pas dans Sentry

1. Vérifier que `NEXT_PUBLIC_SENTRY_DSN` est défini:
```bash
echo $NEXT_PUBLIC_SENTRY_DSN
```

2. Vérifier que Sentry est activé en production:
```typescript
// sentry.client.config.ts
enabled: process.env.NODE_ENV === "production"
```

3. Vérifier les logs du serveur:
```bash
npm run dev
# Chercher "Sentry" dans les logs
```

4. Tester avec la route de test:
```bash
curl http://localhost:3000/api/test-sentry?type=error
```

### Erreur "Sentry is not defined"

Sentry est chargé dynamiquement. Utiliser le logger à la place:
```typescript
// ❌ Peut échouer
window.Sentry.captureException(error);

// ✅ Fonctionne toujours
logger.error("Error message", error);
```

### Trop d'erreurs envoyées

Ajuster les filtres dans `sentry.client.config.ts`:
```typescript
beforeSend(event, hint) {
  // Ignorer certaines erreurs
  if (event.exception?.values?.[0]?.value?.includes("specific error")) {
    return null;
  }
  return event;
}
```

### Source maps non uploadées

Vérifier que `SENTRY_AUTH_TOKEN` est défini:
```bash
echo $SENTRY_AUTH_TOKEN
```

Vérifier les logs de build:
```bash
npm run build
# Chercher "Sentry" dans les logs
```

## Monitoring en production

### Dashboard Sentry

1. **Issues**: Toutes les erreurs capturées
2. **Performance**: Temps de réponse des transactions
3. **Releases**: Tracking des versions déployées
4. **Alerts**: Notifications par email/Slack

### Alertes recommandées

Configurer des alertes pour:
- Nouvelles erreurs (first seen)
- Erreurs fréquentes (> 10/min)
- Erreurs critiques (tag: critical)
- Performances lentes (> 3s)

### Releases

Les releases sont automatiquement créées lors du build:
```typescript
// next.config.mjs
release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"
```

Pour tracker les releases:
1. Incrémenter `NEXT_PUBLIC_APP_VERSION` dans `.env`
2. Déployer
3. Voir la nouvelle release dans Sentry

## Support

Pour toute question:
- Documentation Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Équipe Lok'Room: contact@lokroom.com

---

**Configuration complétée le**: 2026-02-11
**Dernière mise à jour**: 2026-02-11
