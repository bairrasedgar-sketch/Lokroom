# Guide d'Implémentation - Sécurité Lok'Room

## Vue d'Ensemble

Ce guide explique comment utiliser le système de logging sécurisé et les bonnes pratiques de sécurité dans l'application Lok'Room.

## 1. Utilisation du Logger Structuré

### Import du Logger

```typescript
import { logger } from '@/lib/logger';
```

### Méthodes Disponibles

#### Debug (Développement uniquement)
```typescript
logger.debug('User data loaded', { userId: user.id, timestamp: Date.now() });
```

#### Info (Informations générales)
```typescript
logger.info('Payment processed successfully', {
  bookingId: booking.id,
  amount: booking.totalPrice
});
```

#### Warning (Avertissements)
```typescript
logger.warn('Rate limit approaching', {
  ip: req.ip,
  requestCount: count
});
```

#### Error (Erreurs)
```typescript
logger.error('Payment failed', error, {
  bookingId: booking.id,
  paymentMethod: 'stripe'
});
```

### Méthodes Spécialisées

#### Log API Request
```typescript
logger.apiRequest('POST', '/api/bookings', { userId: user.id });
```

#### Log API Response
```typescript
logger.apiResponse('POST', '/api/bookings', 201, { bookingId: booking.id });
```

#### Log User Action
```typescript
logger.userAction('booking_created', user.id, { listingId: listing.id });
```

#### Log Database Operation
```typescript
logger.dbOperation('INSERT', 'bookings', { bookingId: booking.id });
```

#### Log Payment
```typescript
logger.payment('stripe_payment_intent_created', {
  amount: 10000,
  currency: 'EUR'
});
```

#### Log Security Event
```typescript
logger.security('suspicious_login_attempt', {
  ip: req.ip,
  userId: user.id
});
```

## 2. Bonnes Pratiques de Logging

### ✅ À FAIRE

```typescript
// 1. Utiliser le logger structuré
logger.info('User logged in', { userId: user.id });

// 2. Protéger les logs sensibles
if (process.env.NODE_ENV === 'development') {
  console.error('[PayPal] Error:', error);
}

// 3. Masquer les données sensibles
logger.info('Payment processed', {
  cardLast4: card.last4, // ✅ OK
  // cardNumber: card.number // ❌ JAMAIS
});

// 4. Ajouter du contexte
logger.error('Database query failed', error, {
  query: 'SELECT * FROM bookings',
  userId: user.id,
  timestamp: Date.now()
});
```

### ❌ À ÉVITER

```typescript
// 1. Console.log en production
console.log('User data:', user); // ❌ Exposé en production

// 2. Logger des secrets
logger.info('API Key:', process.env.STRIPE_SECRET_KEY); // ❌ DANGER

// 3. Logger des mots de passe
logger.debug('Login attempt', { password: password }); // ❌ DANGER

// 4. Logger des tokens
console.log('JWT Token:', token); // ❌ DANGER

// 5. Logger des données de carte
logger.info('Payment', { cardNumber: '4242...' }); // ❌ DANGER
```

## 3. Masquage des Données Sensibles

### Utiliser les Fonctions de Masquage

```typescript
import { maskEmail, maskPhone, maskIban } from '@/lib/security';

// Email
const maskedEmail = maskEmail('user@example.com');
// Résultat: u*****r@e***e.com

// Téléphone
const maskedPhone = maskPhone('+33612345678');
// Résultat: +33******78

// IBAN
const maskedIban = maskIban('FR7630001007941234567890185');
// Résultat: FR76**********************85

logger.info('User profile updated', {
  email: maskEmail(user.email),
  phone: maskPhone(user.phone)
});
```

## 4. Logging dans les Routes API

### Template de Route API Sécurisée

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { securityLog } from '@/lib/security';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { ok } = await rateLimit(`api:${ip}`, 10, 60000);

    if (!ok) {
      logger.security('rate_limit_exceeded', { ip });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // 2. Validation
    const body = await req.json();
    // ... validation logic

    // 3. Business logic
    const result = await processRequest(body);

    // 4. Log success
    const duration = Date.now() - startTime;
    logger.apiResponse('POST', '/api/endpoint', 200, {
      duration,
      resultId: result.id
    });

    return NextResponse.json(result);

  } catch (error) {
    // 5. Log error (uniquement en dev pour les détails)
    const duration = Date.now() - startTime;
    logger.error('API request failed', error as Error, {
      method: 'POST',
      path: '/api/endpoint',
      duration
    });

    // En production, ne pas exposer les détails
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Error details:', error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 5. Logging dans les Composants React

### Hook useEffect avec Logging

```typescript
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

function MyComponent() {
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const response = await fetch('/api/data', {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        logger.debug('Data loaded', { itemCount: data.length });

      } catch (error) {
        // Ne logger que si ce n'est pas une annulation
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.error('Failed to fetch data', error);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  return <div>...</div>;
}
```

## 6. Logging des Paiements

### Stripe

```typescript
import { logger } from '@/lib/logger';
import { securityLog } from '@/lib/security';

async function processStripePayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Log success (sans données sensibles)
    logger.payment('stripe_payment_retrieved', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    // Vérification de sécurité
    if (paymentIntent.amount !== expectedAmount) {
      securityLog('security', 'payment_amount_mismatch', undefined, {
        paymentIntentId,
        expected: expectedAmount,
        actual: paymentIntent.amount
      });
    }

    return paymentIntent;

  } catch (error) {
    // Logger l'erreur sans exposer les détails en production
    logger.error('Stripe payment failed', error as Error, {
      paymentIntentId
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('[Stripe] Error details:', error);
    }

    throw error;
  }
}
```

### PayPal

```typescript
import { logger } from '@/lib/logger';

async function processPayPalPayment(orderId: string) {
  try {
    const order = await capturePayPalOrder(orderId);

    // Log success (uniquement en dev pour les détails)
    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal] Order captured:', {
        orderId: order.id,
        status: order.status
      });
    }

    logger.payment('paypal_order_captured', {
      orderId: order.id,
      status: order.status
    });

    return order;

  } catch (error) {
    logger.error('PayPal payment failed', error as Error, { orderId });

    if (process.env.NODE_ENV === 'development') {
      console.error('[PayPal] Error details:', error);
    }

    throw error;
  }
}
```

## 7. Logging de Sécurité

### Utiliser securityLog pour les Événements Critiques

```typescript
import { securityLog } from '@/lib/security';

// Tentative de connexion suspecte
securityLog('security', 'suspicious_login', userId, {
  ip: req.ip,
  userAgent: req.headers.get('user-agent'),
  failedAttempts: 5
});

// Accès non autorisé
securityLog('security', 'unauthorized_access', userId, {
  resource: '/admin/users',
  role: user.role
});

// Modification de données sensibles
securityLog('info', 'sensitive_data_modified', userId, {
  field: 'email',
  oldValue: maskEmail(oldEmail),
  newValue: maskEmail(newEmail)
});
```

## 8. Intégration avec Sentry (Future)

### Configuration Sentry

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,

    beforeSend(event, hint) {
      // Masquer les données sensibles
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    }
  });
}
```

### Utilisation avec le Logger

```typescript
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

try {
  // ... code
} catch (error) {
  // Logger localement
  logger.error('Operation failed', error as Error, { context });

  // Envoyer à Sentry en production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: { context }
    });
  }

  throw error;
}
```

## 9. Checklist de Sécurité

Avant de déployer en production:

- [ ] Tous les console.log critiques sont protégés par `process.env.NODE_ENV === 'development'`
- [ ] Aucun secret (API keys, tokens) n'est loggé
- [ ] Les données sensibles sont masquées (emails, téléphones, IBAN)
- [ ] Les erreurs de paiement ne révèlent pas de détails sensibles
- [ ] Le CSP est configuré et testé
- [ ] Les security headers sont activés
- [ ] Le rate limiting est en place
- [ ] Sentry/Datadog est configuré (optionnel)
- [ ] Les logs de sécurité sont surveillés

## 10. Commandes Utiles

### Vérifier les console.log restants
```bash
# Compter les occurrences
grep -r "console\." src --include="*.ts" --include="*.tsx" | wc -l

# Trouver les fichiers avec console.log
grep -r "console\." src --include="*.ts" --include="*.tsx" -l

# Chercher les logs non protégés (dangereux)
grep -r "console\.error" src --include="*.ts" --include="*.tsx" | grep -v "NODE_ENV"
```

### Tester la CSP
```bash
# Démarrer en mode production
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Vérifier les violations CSP dans la console du navigateur
```

### Analyser les logs en production
```bash
# Avec Vercel
vercel logs --follow

# Avec Docker
docker logs -f lokroom-web

# Avec PM2
pm2 logs lokroom-web
```

## 11. Ressources

- [Documentation Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [CSP Generator](https://report-uri.com/home/generate)
- [Security Headers Checker](https://securityheaders.com/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

---

**Date**: 2026-02-09
**Version**: 1.0
**Auteur**: Claude Sonnet 4.5
