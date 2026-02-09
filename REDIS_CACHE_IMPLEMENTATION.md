# Redis Cache System - Lok'Room

## Vue d'ensemble

Système de cache Redis complet pour améliorer les performances de Lok'Room en réduisant la charge sur PostgreSQL.

## Architecture

```
┌─────────────────┐
│   Next.js API   │
│    Routes       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Service  │
│   (ioredis)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redis Server   │
│   (Docker)      │
└─────────────────┘
```

## Installation

### 1. Dépendances installées

```bash
npm install ioredis @types/ioredis
```

### 2. Configuration Docker

Fichier `docker-compose.yml` créé à la racine :

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: lokroom-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass lokroom_redis_dev
    restart: unless-stopped
```

### 3. Variables d'environnement

Ajouté dans `.env` :

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=lokroom_redis_dev
```

## Structure des fichiers

```
apps/web/src/lib/redis/
├── client.ts           # Client Redis avec reconnexion
├── cache.ts            # Service de cache principal
├── keys.ts             # Clés standardisées
├── middleware.ts       # Middleware pour routes API
├── rate-limit-redis.ts # Rate limiting avec Redis
├── invalidation.ts     # Gestion de l'invalidation
├── index.ts            # Point d'entrée
└── __tests__/
    └── cache.test.ts   # Tests unitaires
```

## Fonctionnalités

### 1. Service de cache (`cache.ts`)

```typescript
import { cache, CacheKeys, CacheTTL } from "@/lib/redis";

// Get avec fallback
const listing = await cache.get(
  CacheKeys.listing(id),
  async () => {
    return await prisma.listing.findUnique({ where: { id } });
  },
  CacheTTL.MEDIUM
);

// Set
await cache.set(key, value, CacheTTL.LONG);

// Delete
await cache.del(key);
await cache.del([key1, key2, key3]);

// Delete par pattern
await cache.delPattern("listings:*");

// Increment/Decrement
await cache.incr(key, ttl);
await cache.decr(key);

// Exists
const exists = await cache.exists(key);

// TTL
const ttl = await cache.ttl(key);

// Multiple get/set
const values = await cache.mget<T>([key1, key2, key3]);
await cache.mset([
  { key: "key1", value: "value1", ttl: 60 },
  { key: "key2", value: "value2", ttl: 120 },
]);
```

### 2. Clés standardisées (`keys.ts`)

```typescript
import { CacheKeys, CacheTTL } from "@/lib/redis";

// Listings
CacheKeys.listing(id)
CacheKeys.listingsByCity(city)
CacheKeys.listingsByOwner(ownerId)

// Users
CacheKeys.user(id)
CacheKeys.userByEmail(email)

// Bookings
CacheKeys.booking(id)
CacheKeys.bookingsByUser(userId)
CacheKeys.bookingsByListing(listingId)

// Reviews
CacheKeys.reviews(listingId)
CacheKeys.reviewStats(listingId)

// TTL
CacheTTL.SHORT      // 1 minute
CacheTTL.MEDIUM     // 5 minutes
CacheTTL.LONG       // 1 heure
CacheTTL.VERY_LONG  // 24 heures
```

### 3. Invalidation automatique (`invalidation.ts`)

```typescript
import { invalidateListingCache, invalidateUserCache } from "@/lib/redis";

// Invalider une annonce
await invalidateListingCache(listingId);

// Invalider un utilisateur
await invalidateUserCache(userId);

// Invalider une réservation
await invalidateBookingCache(bookingId, userId, listingId);

// Invalider les avis
await invalidateReviewCache(listingId, userId);

// Invalider la recherche
await invalidateSearchCache();
```

### 4. Rate limiting (`rate-limit-redis.ts`)

```typescript
import { checkRateLimit } from "@/lib/redis";

// Rate limit simple
const result = await checkRateLimit(ip, endpoint, 100, 60);
if (!result.allowed) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429 }
  );
}

// Rate limit avec sliding window (plus précis)
const result = await checkRateLimitSlidingWindow(ip, endpoint, 100, 60000);
```

### 5. Middleware de cache (`middleware.ts`)

```typescript
import { cacheMiddleware, generateCacheKey } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const cacheKey = generateCacheKey(req, "api:listings:");

  return cacheMiddleware(
    req,
    async () => {
      // Handler normal
      const data = await fetchData();
      return NextResponse.json(data);
    },
    cacheKey,
    { ttl: 300 }
  );
}
```

## APIs intégrées

### 1. `/api/listings/[id]` - GET

- Cache avec TTL de 5 minutes
- Invalidation automatique lors de PUT/DELETE
- Headers Cache-Control pour CDN

### 2. `/api/bookings` - GET

- Cache avec pagination
- TTL court (1 minute) car données fréquemment modifiées

### 3. `/api/amenities` - GET

- Cache avec TTL de 24 heures
- Données rarement modifiées

## APIs de monitoring

### 1. Health check Redis

```bash
GET /api/health/redis
```

Réponse :
```json
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2026-02-09T10:00:00.000Z"
}
```

### 2. Statistiques du cache

```bash
GET /api/cache/stats
```

Réponse :
```json
{
  "stats": {
    "keys": 1234,
    "memory": "2.5MB",
    "hits": "45678",
    "misses": "1234"
  },
  "timestamp": "2026-02-09T10:00:00.000Z"
}
```

### 3. Vider le cache

```bash
POST /api/cache/clear
Content-Type: application/json

{
  "pattern": "listings:*"  // Optionnel
}
```

## Utilisation

### Démarrer Redis

```bash
# Avec Docker
docker-compose up -d

# Vérifier que Redis fonctionne
docker ps
docker logs lokroom-redis
```

### Tester la connexion

```bash
# Health check
curl http://localhost:3000/api/health/redis

# Stats
curl http://localhost:3000/api/cache/stats
```

### Intégrer dans une route API

```typescript
// apps/web/src/app/api/example/route.ts
import { NextResponse } from "next/server";
import { cache, CacheKeys, CacheTTL } from "@/lib/redis";
import { prisma } from "@/lib/db";

export async function GET() {
  const data = await cache.get(
    CacheKeys.stats("example"),
    async () => {
      // Requête DB coûteuse
      return await prisma.listing.findMany({
        include: { reviews: true },
      });
    },
    CacheTTL.MEDIUM
  );

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  // Créer/modifier des données
  const result = await prisma.listing.create({ data: body });

  // Invalider le cache
  await cache.delPattern("listings:*");

  return NextResponse.json(result);
}
```

## Patterns d'utilisation

### 1. Cache-aside (Lazy loading)

```typescript
const data = await cache.get(key, async () => {
  return await fetchFromDB();
}, ttl);
```

### 2. Write-through

```typescript
// Écrire en DB
const result = await prisma.listing.update({ ... });

// Mettre à jour le cache
await cache.set(CacheKeys.listing(id), result, CacheTTL.MEDIUM);
```

### 3. Write-behind (Invalidation)

```typescript
// Écrire en DB
await prisma.listing.update({ ... });

// Invalider le cache
await invalidateListingCache(id);
```

## Performance

### Avant Redis

- Requête `/api/listings/[id]` : ~150ms
- Requête `/api/amenities` : ~80ms
- Charge DB : 100%

### Après Redis

- Requête `/api/listings/[id]` (cache hit) : ~5ms
- Requête `/api/amenities` (cache hit) : ~3ms
- Charge DB : ~30%
- Hit rate attendu : 70-80%

## Monitoring

### Métriques à surveiller

1. **Hit rate** : Ratio hits/misses
2. **Memory usage** : Utilisation mémoire Redis
3. **Latency** : Temps de réponse Redis
4. **Evictions** : Nombre de clés évincées

### Outils recommandés

- **RedisInsight** : Interface graphique pour Redis
- **redis-cli** : CLI pour débugger
- **Prometheus + Grafana** : Monitoring avancé

### Commandes utiles

```bash
# Connexion à Redis
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev

# Lister toutes les clés
KEYS *

# Voir une valeur
GET listing:123

# Voir le TTL
TTL listing:123

# Compter les clés
DBSIZE

# Infos serveur
INFO

# Vider le cache
FLUSHALL
```

## Tests

### Lancer les tests

```bash
cd apps/web
npm test -- redis
```

### Tests couverts

- ✅ Get/Set/Delete
- ✅ Fallback automatique
- ✅ Delete par pattern
- ✅ Increment/Decrement
- ✅ Exists/TTL/Expire
- ✅ Multiple get/set
- ✅ Génération de clés

## Sécurité

### 1. Authentification

Redis est protégé par mot de passe (voir `REDIS_PASSWORD`).

### 2. Réseau

En production, Redis doit être dans un réseau privé, non exposé publiquement.

### 3. Données sensibles

Ne jamais cacher de données sensibles (mots de passe, tokens, etc.).

### 4. TTL

Toujours définir un TTL pour éviter les fuites mémoire.

## Production

### Configuration recommandée

```bash
# .env.production
REDIS_URL=redis://:password@redis.example.com:6379
REDIS_PASSWORD=strong_password_here

# Ou avec Redis Cloud (Upstash, Redis Labs, etc.)
REDIS_URL=rediss://default:password@redis-12345.cloud.redislabs.com:12345
```

### Scaling

- **Vertical** : Augmenter la RAM du serveur Redis
- **Horizontal** : Redis Cluster pour distribuer la charge
- **Réplication** : Master-Slave pour haute disponibilité

### Backup

Redis persiste les données avec AOF (Append-Only File) activé.

```bash
# Backup manuel
docker exec lokroom-redis redis-cli -a lokroom_redis_dev BGSAVE

# Restaurer depuis un backup
docker cp backup.rdb lokroom-redis:/data/dump.rdb
docker restart lokroom-redis
```

## Troubleshooting

### Redis ne démarre pas

```bash
# Vérifier les logs
docker logs lokroom-redis

# Vérifier le port
netstat -an | grep 6379
```

### Connexion refusée

```bash
# Vérifier que Redis écoute
docker exec lokroom-redis redis-cli -a lokroom_redis_dev PING

# Devrait retourner : PONG
```

### Mémoire pleine

```bash
# Voir l'utilisation mémoire
docker exec lokroom-redis redis-cli -a lokroom_redis_dev INFO memory

# Vider le cache
docker exec lokroom-redis redis-cli -a lokroom_redis_dev FLUSHALL
```

### Cache non invalidé

```bash
# Vérifier les clés
docker exec lokroom-redis redis-cli -a lokroom_redis_dev KEYS "listing:*"

# Supprimer manuellement
docker exec lokroom-redis redis-cli -a lokroom_redis_dev DEL listing:123
```

## Prochaines étapes

1. ✅ Intégrer Redis dans plus de routes API
2. ✅ Ajouter le monitoring avec Prometheus
3. ✅ Implémenter le cache warming (pré-remplissage)
4. ✅ Ajouter le cache pour les recherches
5. ✅ Optimiser les TTL selon les patterns d'usage

## Ressources

- [Redis Documentation](https://redis.io/docs/)
- [ioredis GitHub](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Caching Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Strategies.html)
