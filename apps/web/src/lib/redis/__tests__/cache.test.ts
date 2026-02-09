// apps/web/src/lib/redis/__tests__/cache.test.ts

/**
 * Tests unitaires pour le service de cache Redis.
 */

import { cache } from "../cache";
import { CacheKeys, CacheTTL } from "../keys";

describe("CacheService", () => {
  beforeEach(async () => {
    // Nettoyer le cache avant chaque test
    await cache.flushAll();
  });

  afterAll(async () => {
    // Nettoyer après tous les tests
    await cache.flushAll();
  });

  describe("get/set", () => {
    it("should set and get a value", async () => {
      const key = "test:key";
      const value = { foo: "bar" };

      await cache.set(key, value, CacheTTL.SHORT);
      const result = await cache.get(key);

      expect(result).toEqual(value);
    });

    it("should return null for non-existent key", async () => {
      const result = await cache.get("non:existent");
      expect(result).toBeNull();
    });

    it("should use fallback when key does not exist", async () => {
      const key = "test:fallback";
      const fallbackValue = { data: "from fallback" };

      const result = await cache.get(
        key,
        async () => fallbackValue,
        CacheTTL.SHORT
      );

      expect(result).toEqual(fallbackValue);

      // Vérifier que la valeur a été mise en cache
      const cached = await cache.get(key);
      expect(cached).toEqual(fallbackValue);
    });
  });

  describe("del", () => {
    it("should delete a single key", async () => {
      const key = "test:delete";
      await cache.set(key, "value", CacheTTL.SHORT);

      await cache.del(key);
      const result = await cache.get(key);

      expect(result).toBeNull();
    });

    it("should delete multiple keys", async () => {
      const keys = ["test:del1", "test:del2", "test:del3"];

      for (const key of keys) {
        await cache.set(key, "value", CacheTTL.SHORT);
      }

      await cache.del(keys);

      for (const key of keys) {
        const result = await cache.get(key);
        expect(result).toBeNull();
      }
    });
  });

  describe("delPattern", () => {
    it("should delete keys matching pattern", async () => {
      await cache.set("user:1", "value1", CacheTTL.SHORT);
      await cache.set("user:2", "value2", CacheTTL.SHORT);
      await cache.set("listing:1", "value3", CacheTTL.SHORT);

      await cache.delPattern("user:*");

      expect(await cache.get("user:1")).toBeNull();
      expect(await cache.get("user:2")).toBeNull();
      expect(await cache.get("listing:1")).not.toBeNull();
    });
  });

  describe("incr/decr", () => {
    it("should increment a counter", async () => {
      const key = "test:counter";

      const val1 = await cache.incr(key, CacheTTL.SHORT);
      const val2 = await cache.incr(key);
      const val3 = await cache.incr(key);

      expect(val1).toBe(1);
      expect(val2).toBe(2);
      expect(val3).toBe(3);
    });

    it("should decrement a counter", async () => {
      const key = "test:counter:decr";

      await cache.incr(key, CacheTTL.SHORT);
      await cache.incr(key);
      await cache.incr(key);

      const val = await cache.decr(key);
      expect(val).toBe(2);
    });
  });

  describe("exists", () => {
    it("should check if key exists", async () => {
      const key = "test:exists";

      expect(await cache.exists(key)).toBe(false);

      await cache.set(key, "value", CacheTTL.SHORT);

      expect(await cache.exists(key)).toBe(true);
    });
  });

  describe("ttl", () => {
    it("should get TTL of a key", async () => {
      const key = "test:ttl";
      const ttl = 60;

      await cache.set(key, "value", ttl);

      const remainingTTL = await cache.ttl(key);
      expect(remainingTTL).toBeGreaterThan(0);
      expect(remainingTTL).toBeLessThanOrEqual(ttl);
    });

    it("should return -1 for non-existent key", async () => {
      const ttl = await cache.ttl("non:existent");
      expect(ttl).toBe(-1);
    });
  });

  describe("expire", () => {
    it("should set expiration on existing key", async () => {
      const key = "test:expire";

      await cache.set(key, "value", CacheTTL.LONG);
      const success = await cache.expire(key, 10);

      expect(success).toBe(true);

      const ttl = await cache.ttl(key);
      expect(ttl).toBeLessThanOrEqual(10);
    });
  });

  describe("mget/mset", () => {
    it("should get multiple values", async () => {
      await cache.set("key1", "value1", CacheTTL.SHORT);
      await cache.set("key2", "value2", CacheTTL.SHORT);
      await cache.set("key3", "value3", CacheTTL.SHORT);

      const values = await cache.mget<string>(["key1", "key2", "key3", "key4"]);

      expect(values).toEqual(["value1", "value2", "value3", null]);
    });

    it("should set multiple values", async () => {
      await cache.mset([
        { key: "mkey1", value: "mvalue1", ttl: CacheTTL.SHORT },
        { key: "mkey2", value: "mvalue2", ttl: CacheTTL.SHORT },
        { key: "mkey3", value: "mvalue3" },
      ]);

      expect(await cache.get("mkey1")).toBe("mvalue1");
      expect(await cache.get("mkey2")).toBe("mvalue2");
      expect(await cache.get("mkey3")).toBe("mvalue3");
    });
  });

  describe("CacheKeys", () => {
    it("should generate correct cache keys", () => {
      expect(CacheKeys.listing("123")).toBe("listing:123");
      expect(CacheKeys.user("456")).toBe("user:456");
      expect(CacheKeys.bookingsByUser("789")).toBe("bookings:user:789");
      expect(CacheKeys.rateLimit("127.0.0.1", "/api/test")).toBe(
        "ratelimit:127.0.0.1:/api/test"
      );
    });
  });
});
