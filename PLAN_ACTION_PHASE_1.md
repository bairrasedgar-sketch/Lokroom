# 📋 PLAN D'ACTION PHASE 1 - CORRECTIONS CRITIQUES

**Date de création**: 2026-02-20
**Objectif**: Passer de 5.8/10 à 7.0/10
**Durée estimée**: 40 heures (1 semaine)
**Budget**: 2,000€ - 3,000€
**Priorité**: 🔴 CRITIQUE - BLOQUANT POUR PRODUCTION

---

## 🎯 OBJECTIFS DE LA PHASE 1

### Résultats Attendus
- ✅ 100% des routes API protégées (actuellement 75%)
- ✅ 100% des routes avec CSRF protection (actuellement 0%)
- ✅ 100% des routes avec pagination (actuellement 50%)
- ✅ Accessibilité WCAG AA (actuellement Fail)
- ✅ Rate limiting sur toutes les opérations sensibles
- ✅ Validation des inputs sur 85% des routes (actuellement 25%)

### Métriques de Succès
| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Score Global | 5.8/10 | 7.0/10 | +20% |
| Routes protégées | 75% | 100% | +25% |
| CSRF protection | 0% | 100% | +100% |
| Pagination | 50% | 100% | +50% |
| Accessibilité | 2.0/10 | 7.0/10 | +250% |
| Validation inputs | 25% | 85% | +240% |

---

## 📦 TICKETS GITHUB - SÉCURITÉ (20h)

### 🔒 TICKET #1: Protéger les routes `/api/host/*` non protégées
**Priorité**: 🔴 Critique
**Durée estimée**: 4 heures
**Assigné à**: Dev Senior

**Description**:
17 routes `/api/host/*` sont accessibles sans authentification. Ajouter `requireHost()` middleware.

**Routes à corriger**:
```typescript
// src/app/api/host/listings/route.ts
// src/app/api/host/bookings/route.ts
// src/app/api/host/calendar/route.ts
// src/app/api/host/earnings/route.ts
// src/app/api/host/reviews/route.ts
// src/app/api/host/messages/route.ts
// src/app/api/host/disputes/route.ts
// src/app/api/host/experiences/route.ts
// src/app/api/host/analytics/route.ts
// src/app/api/host/payouts/route.ts
// src/app/api/host/settings/route.ts
// src/app/api/host/verification/route.ts
// src/app/api/host/insurance/route.ts
// src/app/api/host/taxes/route.ts
// src/app/api/host/support/route.ts
// src/app/api/host/notifications/route.ts
// src/app/api/host/onboard/route.ts
```

**Solution**:
```typescript
// Avant
export async function GET(req: NextRequest) {
  const listings = await prisma.listing.findMany();
  return NextResponse.json(listings);
}

// Après
export async function GET(req: NextRequest) {
  const session = await requireHost(req);
  const listings = await prisma.listing.findMany({
    where: { hostId: session.user.id }
  });
  return NextResponse.json(listings);
}
```

**Critères d'acceptation**:
- [ ] Toutes les 17 routes ont `requireHost()` en première ligne
- [ ] Les requêtes filtrent par `hostId: session.user.id`
- [ ] Tests manuels: 401 sans auth, 200 avec auth
- [ ] Commit avec message: `security: protect 17 host routes with requireHost middleware`

**Dépendances**: Aucune

---

### 🔒 TICKET #2: Implémenter CSRF protection sur toutes les routes POST/PUT/PATCH/DELETE
**Priorité**: 🔴 Critique
**Durée estimée**: 6 heures
**Assigné à**: Dev Senior

**Description**:
0% des routes ont une protection CSRF. Le module `src/lib/security/csrf.ts` existe mais n'est jamais utilisé.

**Routes critiques à protéger en priorité**:
```typescript
// Opérations financières (PRIORITÉ MAX)
POST /api/wallet/deposit
POST /api/wallet/withdraw
POST /api/bookings/create
POST /api/bookings/[id]/cancel
POST /api/payouts/request

// Opérations sensibles
POST /api/auth/register
POST /api/auth/login
POST /api/auth/reset-password
DELETE /api/account/delete
PUT /api/account/settings
POST /api/messages/send
POST /api/reviews/create
POST /api/disputes/create
```

**Solution**:
```typescript
// 1. Créer middleware CSRF global
// src/middleware.ts
import { validateCsrfToken } from '@/lib/security/csrf';

export async function middleware(req: NextRequest) {
  // Vérifier CSRF sur toutes les mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const isValid = await validateCsrfToken(req);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Critères d'acceptation**:
- [ ] Middleware CSRF actif sur toutes les routes API
- [ ] Token CSRF généré côté client (useEffect)
- [ ] Token CSRF envoyé dans header `X-CSRF-Token`
- [ ] Tests: 403 sans token, 200 avec token valide
- [ ] Commit: `security: implement CSRF protection on all mutation routes`

**Dépendances**: Aucune

---

### 🔒 TICKET #3: Ajouter rate limiting sur opérations financières
**Priorité**: 🔴 Critique
**Durée estimée**: 3 heures
**Assigné à**: Dev Senior

**Description**:
Les opérations financières n'ont pas de rate limiting, permettant des abus.

**Routes à protéger**:
```typescript
POST /api/wallet/deposit      → 10 req/heure
POST /api/wallet/withdraw     → 5 req/heure
POST /api/payouts/request     → 3 req/heure
POST /api/bookings/create     → 20 req/heure
POST /api/bookings/[id]/cancel → 10 req/heure
```

**Solution**:
```typescript
// src/lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const financialRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 req/heure
  analytics: true,
});

// Usage dans route
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  const { success } = await financialRateLimit.limit(session.user.id);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  // ... reste du code
}
```

**Critères d'acceptation**:
- [ ] Rate limiting actif sur 5 routes financières
- [ ] Limites configurées selon criticité
- [ ] Message d'erreur clair avec Retry-After header
- [ ] Tests: 429 après dépassement limite
- [ ] Commit: `security: add rate limiting to financial operations`

**Dépendances**: Upstash Redis configuré (.env)

---

### 🔒 TICKET #4: Ajouter try-catch sur 23 routes API sans gestion d'erreurs
**Priorité**: 🟠 Haute
**Durée estimée**: 4 heures
**Assigné à**: Dev Junior

**Description**:
23 routes API n'ont pas de try-catch, causant des crashes serveur.

**Routes à corriger** (liste partielle):
```typescript
// src/app/api/listings/[id]/route.ts
// src/app/api/bookings/create/route.ts
// src/app/api/messages/send/route.ts
// src/app/api/reviews/create/route.ts
// src/app/api/wallet/deposit/route.ts
// ... (18 autres)
```

**Solution**:
```typescript
// Avant
export async function POST(req: NextRequest) {
  const body = await req.json();
  const booking = await prisma.booking.create({ data: body });
  return NextResponse.json(booking);
}

// Après
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const booking = await prisma.booking.create({ data: body });
    return NextResponse.json(booking);
  } catch (error) {
    logger.error('Failed to create booking', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
```

**Critères d'acceptation**:
- [ ] Toutes les 23 routes ont try-catch
- [ ] Erreurs loggées avec `logger.error()`
- [ ] Messages d'erreur génériques (pas de détails internes)
- [ ] Status codes appropriés (400, 404, 500)
- [ ] Commit: `fix: add error handling to 23 API routes`

**Dépendances**: Aucune

---

### 🔒 TICKET #5: Valider les inputs sur 50 routes critiques
**Priorité**: 🟠 Haute
**Durée estimée**: 3 heures
**Assigné à**: Dev Junior

**Description**:
Seulement 25% des routes valident les inputs utilisateur. Ajouter validation avec `validateUserInput()`.

**Routes prioritaires**:
```typescript
// Opérations financières
POST /api/wallet/deposit → validateAmountCents()
POST /api/wallet/withdraw → validateAmountCents()
POST /api/bookings/create → validateBookingDates()

// Opérations utilisateur
POST /api/auth/register → validateEmail(), validatePassword()
POST /api/messages/send → validateUserInput()
POST /api/reviews/create → validateUserInput()
POST /api/listings/create → validateListingData()
```

**Solution**:
```typescript
import { validateUserInput, isValidEmail, isValidAmountCents } from '@/lib/security/input-validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const validationResult = validateUserInput(body.message);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // ... reste du code
  } catch (error) {
    // ...
  }
}
```

**Critères d'acceptation**:
- [ ] 50 routes critiques ont validation inputs
- [ ] Messages d'erreur clairs (400 Bad Request)
- [ ] Détection XSS/SQL injection active
- [ ] Tests: 400 avec inputs malformés, 200 avec inputs valides
- [ ] Commit: `security: add input validation to 50 critical routes`

**Dépendances**: Aucune

---

## 📦 TICKETS GITHUB - PERFORMANCE (10h)

### ⚡ TICKET #6: Ajouter pagination sur 60+ routes sans limite
**Priorité**: 🔴 Critique
**Durée estimée**: 5 heures
**Assigné à**: Dev Senior

**Description**:
60+ routes chargent TOUS les résultats sans pagination, causant des timeouts.

**Routes critiques**:
```typescript
GET /api/messages/list → Charge 1000+ messages
GET /api/admin/users → Charge TOUS les utilisateurs
GET /api/listings → Charge TOUS les listings
GET /api/bookings → Charge TOUTES les réservations
GET /api/reviews → Charge TOUS les avis
GET /api/notifications → Charge TOUTES les notifications
```

**Solution**:
```typescript
// Avant
export async function GET(req: NextRequest) {
  const messages = await prisma.message.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(messages);
}

// Après
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    }),
    prisma.message.count({
      where: { userId: session.user.id },
    }),
  ]);

  return NextResponse.json({
    data: messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

**Critères d'acceptation**:
- [ ] 60+ routes ont pagination (take/skip)
- [ ] Limite par défaut: 20 items
- [ ] Limite max: 100 items
- [ ] Réponse inclut metadata pagination
- [ ] Tests: vérifier limite respectée
- [ ] Commit: `perf: add pagination to 60+ routes to prevent timeouts`

**Dépendances**: Aucune

---

### ⚡ TICKET #7: Optimiser 10 N+1 queries critiques
**Priorité**: 🟠 Haute
**Durée estimée**: 3 heures
**Assigné à**: Dev Senior

**Description**:
118 routes ont des N+1 queries. Optimiser les 10 plus critiques en priorité.

**Routes à optimiser**:
```typescript
GET /api/listings → N+1 sur reviews, host, amenities
GET /api/bookings → N+1 sur listing, guest, host
GET /api/messages/list → N+1 sur sender, receiver
GET /api/host/earnings → N+1 sur bookings, listings
GET /api/admin/users → N+1 sur bookings, listings, reviews
```

**Solution**:
```typescript
// Avant (N+1)
const listings = await prisma.listing.findMany();
// Pour chaque listing, requête séparée pour reviews
for (const listing of listings) {
  listing.reviews = await prisma.review.findMany({
    where: { listingId: listing.id }
  });
}

// Après (1 requête)
const listings = await prisma.listing.findMany({
  include: {
    reviews: {
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    },
    host: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
    amenities: true,
  },
});
```

**Critères d'acceptation**:
- [ ] 10 routes critiques optimisées
- [ ] Temps de réponse divisé par 5-10x
- [ ] Tests de performance: <200ms au lieu de >800ms
- [ ] Commit: `perf: optimize N+1 queries on 10 critical routes`

**Dépendances**: Aucune

---

### ⚡ TICKET #8: Lazy load 3 composants lourds
**Priorité**: 🟡 Moyenne
**Durée estimée**: 2 heures
**Assigné à**: Dev Junior

**Description**:
3 composants lourds bloquent le chargement initial de la page.

**Composants à lazy load**:
```typescript
// src/components/Map.tsx (954 lignes)
// src/components/SearchModal.tsx (1341 lignes)
// src/components/Navbar.tsx (687 lignes)
```

**Solution**:
```typescript
// Avant
import Map from '@/components/Map';

export default function ListingPage() {
  return (
    <div>
      <Map listings={listings} />
    </div>
  );
}

// Après
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
  loading: () => <MapSkeleton />,
  ssr: false, // Désactiver SSR pour Map (Google Maps)
});

export default function ListingPage() {
  return (
    <div>
      <Map listings={listings} />
    </div>
  );
}
```

**Critères d'acceptation**:
- [ ] 3 composants lazy loadés avec `dynamic()`
- [ ] Skeleton loaders pendant chargement
- [ ] Bundle initial réduit de 500KB → 200KB
- [ ] LCP amélioré de 3.5s → 2.0s
- [ ] Commit: `perf: lazy load 3 heavy components to improve LCP`

**Dépendances**: Aucune

---

## 📦 TICKETS GITHUB - ACCESSIBILITÉ (10h)

### ♿ TICKET #9: Corriger contraste insuffisant (WCAG AA)
**Priorité**: 🔴 Critique (risque légal)
**Durée estimée**: 3 heures
**Assigné à**: Dev Junior

**Description**:
Contraste insuffisant sur 400+ éléments (text-gray-400 = ratio 2.8:1 au lieu de 4.5:1).

**Classes à corriger**:
```css
/* Avant (ratio 2.8:1 - FAIL) */
.text-gray-400 { color: #9CA3AF; }

/* Après (ratio 4.6:1 - PASS) */
.text-gray-600 { color: #4B5563; }
```

**Fichiers à modifier**:
```typescript
// Rechercher et remplacer dans tous les fichiers
text-gray-400 → text-gray-600
text-gray-300 → text-gray-500
```

**Solution automatisée**:
```bash
# Rechercher tous les fichiers avec text-gray-400
grep -r "text-gray-400" src/

# Remplacer automatiquement
find src/ -type f -name "*.tsx" -exec sed -i 's/text-gray-400/text-gray-600/g' {} +
find src/ -type f -name "*.tsx" -exec sed -i 's/text-gray-300/text-gray-500/g' {} +
```

**Critères d'acceptation**:
- [ ] Tous les textes ont ratio ≥ 4.5:1 (WCAG AA)
- [ ] Vérification avec outil: https://webaim.org/resources/contrastchecker/
- [ ] Tests visuels: texte lisible sur tous les backgrounds
- [ ] Commit: `a11y: fix contrast ratio to meet WCAG AA standards`

**Dépendances**: Aucune

---

### ♿ TICKET #10: Ajouter alt text sur 112 images
**Priorité**: 🔴 Critique (risque légal)
**Durée estimée**: 4 heures
**Assigné à**: Dev Junior

**Description**:
112 images n'ont pas d'attribut `alt` descriptif, bloquant les lecteurs d'écran.

**Fichiers à corriger**:
```typescript
// Rechercher toutes les images sans alt
grep -r "<img" src/ | grep -v "alt="
grep -r "<Image" src/ | grep -v "alt="
```

**Solution**:
```typescript
// Avant
<Image src="/listing.jpg" width={400} height={300} />

// Après
<Image
  src="/listing.jpg"
  width={400}
  height={300}
  alt="Modern apartment with ocean view in Nice, France"
/>

// Pour images décoratives
<Image
  src="/decoration.svg"
  width={50}
  height={50}
  alt="" // Alt vide pour images décoratives
  aria-hidden="true"
/>
```

**Guidelines alt text**:
- Listings: "Type de logement + caractéristique + localisation"
- Avatars: "Photo de profil de [Nom]"
- Icons: "" (vide) + aria-hidden="true"
- Logos: "Logo Lok'Room"

**Critères d'acceptation**:
- [ ] 100% des images ont attribut `alt`
- [ ] Alt text descriptif (pas "image" ou "photo")
- [ ] Images décoratives: alt="" + aria-hidden="true"
- [ ] Tests avec lecteur d'écran (NVDA/JAWS)
- [ ] Commit: `a11y: add descriptive alt text to 112 images`

**Dépendances**: Aucune

---

### ♿ TICKET #11: Ajouter aria-label sur 400 boutons icon-only
**Priorité**: 🟠 Haute
**Durée estimée**: 3 heures
**Assigné à**: Dev Junior

**Description**:
400 boutons avec seulement une icône n'ont pas d'aria-label, invisibles pour lecteurs d'écran.

**Exemples à corriger**:
```typescript
// Avant
<button onClick={handleLike}>
  <HeartIcon />
</button>

// Après
<button onClick={handleLike} aria-label="Ajouter aux favoris">
  <HeartIcon />
</button>

// Boutons avec état
<button
  onClick={handleLike}
  aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
  aria-pressed={isLiked}
>
  <HeartIcon />
</button>
```

**Patterns courants**:
```typescript
// Navigation
<button aria-label="Menu principal"><MenuIcon /></button>
<button aria-label="Fermer"><XIcon /></button>
<button aria-label="Retour"><ArrowLeftIcon /></button>

// Actions
<button aria-label="Modifier"><EditIcon /></button>
<button aria-label="Supprimer"><TrashIcon /></button>
<button aria-label="Partager"><ShareIcon /></button>

// Filtres
<button aria-label="Filtrer par prix"><FilterIcon /></button>
<button aria-label="Trier par date"><SortIcon /></button>
```

**Critères d'acceptation**:
- [ ] 100% des boutons icon-only ont aria-label
- [ ] Labels descriptifs (pas "Bouton" ou "Icône")
- [ ] États dynamiques avec aria-pressed/aria-expanded
- [ ] Tests avec lecteur d'écran
- [ ] Commit: `a11y: add aria-label to 400 icon-only buttons`

**Dépendances**: Aucune

---

## 📊 DASHBOARD DE SUIVI

### Progression Globale
```
Phase 1: [████████░░░░░░░░░░░░] 0/11 tickets (0%)

Sécurité:  [░░░░░░░░░░] 0/5 tickets (0h/20h)
Performance: [░░░░░░░░░░] 0/3 tickets (0h/10h)
Accessibilité: [░░░░░░░░░░] 0/3 tickets (0h/10h)

Score: 5.8/10 → 7.0/10 (objectif)
```

### Checklist Quotidienne
**Jour 1 (Lundi)** - Sécurité
- [ ] Ticket #1: Protéger routes host (4h)
- [ ] Ticket #2: CSRF protection (6h)

**Jour 2 (Mardi)** - Sécurité
- [ ] Ticket #3: Rate limiting financier (3h)
- [ ] Ticket #4: Try-catch 23 routes (4h)

**Jour 3 (Mercredi)** - Sécurité + Performance
- [ ] Ticket #5: Validation inputs (3h)
- [ ] Ticket #6: Pagination 60+ routes (5h)

**Jour 4 (Jeudi)** - Performance + Accessibilité
- [ ] Ticket #7: Optimiser N+1 queries (3h)
- [ ] Ticket #8: Lazy load composants (2h)
- [ ] Ticket #9: Corriger contraste (3h)

**Jour 5 (Vendredi)** - Accessibilité + Tests
- [ ] Ticket #10: Alt text 112 images (4h)
- [ ] Ticket #11: Aria-label 400 boutons (3h)
- [ ] Tests de validation (3h)

---

## ✅ CRITÈRES DE VALIDATION PHASE 1

### Tests de Sécurité
- [ ] Toutes les routes protégées retournent 401 sans auth
- [ ] CSRF: 403 sans token, 200 avec token valide
- [ ] Rate limiting: 429 après dépassement limite
- [ ] Validation: 400 avec inputs malformés
- [ ] Aucune fuite de données sensibles dans erreurs

### Tests de Performance
- [ ] Pagination: max 100 items par page
- [ ] Temps de réponse API: <200ms (95th percentile)
- [ ] Bundle initial: <200KB (gzip)
- [ ] LCP: <2.5s
- [ ] Aucun timeout sur routes

### Tests d'Accessibilité
- [ ] Contraste: ratio ≥ 4.5:1 sur tous les textes
- [ ] 100% des images ont alt text
- [ ] 100% des boutons icon-only ont aria-label
- [ ] Navigation clavier fonctionnelle
- [ ] Tests avec NVDA/JAWS: 0 erreur

### Tests Automatisés
```bash
# Lancer tous les tests
npm run test

# Tests E2E
npm run test:e2e

# Tests accessibilité
npm run test:a11y

# Lighthouse CI
npm run lighthouse
```

---

## 🚀 COMMANDES UTILES

### Recherche de problèmes
```bash
# Routes sans requireAuth/requireHost
grep -r "export async function" src/app/api/ | grep -v "requireAuth\|requireHost"

# Images sans alt
grep -r "<Image" src/ | grep -v "alt="

# Boutons sans aria-label
grep -r "<button" src/ | grep -v "aria-label"

# Contraste insuffisant
grep -r "text-gray-400\|text-gray-300" src/

# Routes sans pagination
grep -r "findMany" src/app/api/ | grep -v "take\|skip"
```

### Corrections automatiques
```bash
# Remplacer contraste
find src/ -type f -name "*.tsx" -exec sed -i 's/text-gray-400/text-gray-600/g' {} +

# Ajouter try-catch (manuel)
# Ajouter requireAuth (manuel)
# Ajouter pagination (manuel)
```

---

## 📞 SUPPORT

### Questions Techniques
- **Sécurité**: Tech Lead
- **Performance**: Senior Dev
- **Accessibilité**: Designer UI/UX

### Ressources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## 🎯 APRÈS LA PHASE 1

Une fois la Phase 1 terminée (score 7.0/10), passer à:

**Phase 2: Haute Priorité** (60h, 3-4K€)
- Refactoring 4 fichiers monstrueux
- Réorganisation architecture
- Augmenter couverture tests à 30%

**Phase 3: Moyenne Priorité** (80h, 4-6K€)
- Créer identité visuelle unique
- Implémenter SWR partout
- State management (Zustand)
- Documentation complète

---

**Plan créé par**: Claude Sonnet 4.6
**Date**: 2026-02-20
**Durée estimée**: 40 heures (1 semaine)
**Budget**: 2,000€ - 3,000€
