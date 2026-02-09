# Redis Cache System - Test Plan

## Overview

This document provides a comprehensive test plan for the Redis cache system implementation.

## Prerequisites

1. Redis running via Docker
2. Application running on localhost:3000
3. Database seeded with test data

## Test Scenarios

### 1. Redis Connection Tests

#### 1.1 Health Check
```bash
# Test Redis health endpoint
curl http://localhost:3000/api/health/redis

# Expected response:
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2026-02-09T..."
}
```

#### 1.2 Redis CLI Connection
```bash
# Connect to Redis
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev

# Test PING
127.0.0.1:6379> PING
# Expected: PONG

# Check database size
127.0.0.1:6379> DBSIZE
# Expected: (integer) 0 or more
```

### 2. Cache Operations Tests

#### 2.1 Listings Cache (GET)
```bash
# First request (MISS - goes to DB)
curl -i http://localhost:3000/api/listings/[listing-id]
# Check header: X-Cache: MISS
# Note response time

# Second request (HIT - from cache)
curl -i http://localhost:3000/api/listings/[listing-id]
# Check header: X-Cache: HIT
# Response time should be much faster
```

#### 2.2 Amenities Cache
```bash
# First request (MISS)
curl -i http://localhost:3000/api/amenities
# Check header: X-Cache: MISS

# Second request (HIT)
curl -i http://localhost:3000/api/amenities
# Check header: X-Cache: HIT
# Should be instant
```

#### 2.3 Bookings Cache with Pagination
```bash
# Login first to get session
# Then test bookings

# Page 1 (MISS)
curl -i http://localhost:3000/api/bookings?page=1&pageSize=10
# Check header: X-Cache: MISS

# Page 1 again (HIT)
curl -i http://localhost:3000/api/bookings?page=1&pageSize=10
# Check header: X-Cache: HIT

# Page 2 (MISS - different cache key)
curl -i http://localhost:3000/api/bookings?page=2&pageSize=10
# Check header: X-Cache: MISS
```

### 3. Cache Invalidation Tests

#### 3.1 Listing Update Invalidation
```bash
# 1. Get listing (cache it)
curl http://localhost:3000/api/listings/[id]

# 2. Verify it's cached
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev
127.0.0.1:6379> KEYS "listing:*"
# Should show the listing key

# 3. Update the listing
curl -X PUT http://localhost:3000/api/listings/[id] \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", ...}'

# 4. Verify cache was invalidated
127.0.0.1:6379> KEYS "listing:*"
# Should not show the listing key anymore

# 5. Get listing again (should be MISS)
curl -i http://localhost:3000/api/listings/[id]
# Check header: X-Cache: MISS
```

#### 3.2 Manual Cache Clear
```bash
# 1. Cache some data
curl http://localhost:3000/api/amenities

# 2. Verify cache exists
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev KEYS "*"

# 3. Clear specific pattern
curl -X POST http://localhost:3000/api/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"pattern": "amenities:*"}'

# 4. Verify cache cleared
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev KEYS "amenities:*"
# Should return empty

# 5. Clear all cache
curl -X POST http://localhost:3000/api/cache/clear

# 6. Verify all cleared
docker exec -it lokroom-redis redis-cli -a lokroom_redis_dev DBSIZE
# Should return 0
```

### 4. Rate Limiting Tests

#### 4.1 Basic Rate Limit
```bash
# Test rate limiting (100 requests per minute)
for i in {1..105}; do
  curl -i http://localhost:3000/api/listings/[id]
  echo "Request $i"
done

# After 100 requests, should get 429 Too Many Requests
# Check headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: [timestamp]
```

### 5. Cache Statistics Tests

#### 5.1 Get Cache Stats
```bash
# Get statistics
curl http://localhost:3000/api/cache/stats

# Expected response:
{
  "stats": {
    "keys": 10,
    "memory": "1.2MB",
    "hits": "150",
    "misses": "50"
  },
  "timestamp": "2026-02-09T..."
}
```

## Performance Benchmarks

### Expected Results

| Endpoint | Without Cache | With Cache (Hit) | Improvement |
|----------|--------------|------------------|-------------|
| GET /api/listings/[id] | ~150ms | ~5ms | 97% faster |
| GET /api/amenities | ~80ms | ~3ms | 96% faster |
| GET /api/bookings | ~120ms | ~4ms | 97% faster |

## Success Criteria

✅ All health checks passing
✅ Cache hit rate > 70%
✅ Response time improvement > 90%
✅ No Redis errors in logs
✅ Rate limiting working
✅ Cache invalidation working
✅ All unit tests passing
✅ Memory usage stable
✅ Fallback to DB working
