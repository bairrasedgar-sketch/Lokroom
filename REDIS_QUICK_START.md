# Guide de Démarrage Rapide - Redis Cache

## Installation et Configuration

### 1. Démarrer Redis avec Docker

```bash
# Démarrer Redis
docker-compose up -d

# Vérifier que Redis fonctionne
docker ps | grep redis

# Tester la connexion
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev PING
# Devrait retourner: PONG
```

### 2. Vérifier l'installation

```bash
# Démarrer l'application
cd apps/web
npm run dev

# Tester le health check
curl http://localhost:3000/api/health/redis

# Devrait retourner:
# {
#   "status": "healthy",
#   "redis": "connected",
#   "timestamp": "2026-02-09T..."
# }
```

### 3. Tester le cache

```bash
# Première requête (MISS - va en DB)
curl http://localhost:3000/api/amenities
# Header: X-Cache: MISS

# Deuxième requête (HIT - depuis Redis)
curl http://localhost:3000/api/amenities
# Header: X-Cache: HIT
```

## Exemples d'utilisation

### Exemple 1: Cache simple avec fallback

```typescript
import { cache, CacheKeys, CacheTTL } from "@/lib/redis";

export async function GET() {
  const data = await cache.get(
    CacheKeys.amenities(),
    async () => {
      // Cette fonction ne s'exécute que si le cache est vide
      return await prisma.amenity.findMany();
    },
    CacheTTL.VERY_LONG
  );

  return NextResponse.json(data);
}
```

### Exemple 2: Invalidation après modification

```typescript
import { cache, invalidateListingCache } from "@/lib/redis";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  // Modifier en DB
  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: await req.json(),
  });

  // Invalider le cache
  await invalidateListingCache(params.id);

  return NextResponse.json(updated);
}
```

### Exemple 3: Rate limiting

```typescript
import { checkRateLimit } from "@/lib/redis";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  // Vérifier le rate limit (100 requêtes par minute)
  const rateLimit = await checkRateLimit(ip, "/api/bookings", 100, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetAt.toString(),
        },
      }
    );
  }

  // Traiter la requête normalement
  // ...
}
```

## Commandes Redis utiles

```bash
# Se connecter à Redis
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev

# Lister toutes les clés
KEYS *

# Voir une valeur
GET listing:123

# Voir le TTL d'une clé
TTL listing:123

# Supprimer une clé
DEL listing:123

# Supprimer toutes les clés d'un pattern
KEYS "listings:*" | xargs redis-cli -a lokroom_redis_dev DEL

# Compter les clés
DBSIZE

# Voir les infos du serveur
INFO

# Voir l'utilisation mémoire
INFO memory

# Vider tout le cache
FLUSHALL
```

## Monitoring

### Voir les statistiques

```bash
# Via l'API
curl http://localhost:3000/api/cache/stats

# Via Redis CLI
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev INFO stats
```

### Vider le cache

```bash
# Tout le cache
curl -X POST http://localhost:3000/api/cache/clear

# Un pattern spécifique
curl -X POST http://localhost:3000/api/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"pattern": "listings:*"}'
```

## Troubleshooting

### Redis ne démarre pas

```bash
# Vérifier les logs
docker logs lokroom-redis

# Redémarrer Redis
docker-compose restart redis
```

### Cache non invalidé

```bash
# Vérifier les clés existantes
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev KEYS "*"

# Supprimer manuellement
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev FLUSHALL
```

### Connexion refusée

```bash
# Vérifier que Redis écoute
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev PING

# Vérifier les variables d'environnement
cat .env | grep REDIS
```

## Prochaines étapes

1. Intégrer le cache dans d'autres routes API
2. Ajouter le monitoring avec Prometheus/Grafana
3. Optimiser les TTL selon les patterns d'usage
4. Implémenter le cache warming pour les données populaires
