// apps/web/src/lib/redis/__tests__/rate-limit.test.ts

/**
 * Tests pour le rate limiting avec Redis.
 */

import { checkRateLimit, resetRateLimit } from "../rate-limit-redis";

describe("Rate Limiting", () => {
  const testIp = "127.0.0.1";
  const testEndpoint = "/api/test";

  beforeEach(async () => {
    // Réinitialiser le rate limit avant chaque test
    await resetRateLimit(testIp, testEndpoint);
  });

  it("should allow requests within limit", async () => {
    const limit = 5;
    const window = 60;

    for (let i = 0; i < limit; i++) {
      const result = await checkRateLimit(testIp, testEndpoint, limit, window);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - i - 1);
    }
  });

  it("should block requests exceeding limit", async () => {
    const limit = 3;
    const window = 60;

    // Faire 3 requêtes (limite)
    for (let i = 0; i < limit; i++) {
      await checkRateLimit(testIp, testEndpoint, limit, window);
    }

    // La 4ème devrait être bloquée
    const result = await checkRateLimit(testIp, testEndpoint, limit, window);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset after window expires", async () => {
    const limit = 2;
    const window = 1; // 1 seconde

    // Atteindre la limite
    await checkRateLimit(testIp, testEndpoint, limit, window);
    await checkRateLimit(testIp, testEndpoint, limit, window);

    // Vérifier qu'on est bloqué
    let result = await checkRateLimit(testIp, testEndpoint, limit, window);
    expect(result.allowed).toBe(false);

    // Attendre que la fenêtre expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Devrait être autorisé à nouveau
    result = await checkRateLimit(testIp, testEndpoint, limit, window);
    expect(result.allowed).toBe(true);
  }, 10000);

  it("should handle different IPs independently", async () => {
    const limit = 2;
    const window = 60;
    const ip1 = "192.168.1.1";
    const ip2 = "192.168.1.2";

    // IP1 atteint la limite
    await checkRateLimit(ip1, testEndpoint, limit, window);
    await checkRateLimit(ip1, testEndpoint, limit, window);

    // IP1 devrait être bloquée
    let result1 = await checkRateLimit(ip1, testEndpoint, limit, window);
    expect(result1.allowed).toBe(false);

    // IP2 devrait être autorisée
    let result2 = await checkRateLimit(ip2, testEndpoint, limit, window);
    expect(result2.allowed).toBe(true);
  });

  it("should handle different endpoints independently", async () => {
    const limit = 2;
    const window = 60;
    const endpoint1 = "/api/endpoint1";
    const endpoint2 = "/api/endpoint2";

    // Endpoint1 atteint la limite
    await checkRateLimit(testIp, endpoint1, limit, window);
    await checkRateLimit(testIp, endpoint1, limit, window);

    // Endpoint1 devrait être bloqué
    let result1 = await checkRateLimit(testIp, endpoint1, limit, window);
    expect(result1.allowed).toBe(false);

    // Endpoint2 devrait être autorisé
    let result2 = await checkRateLimit(testIp, endpoint2, limit, window);
    expect(result2.allowed).toBe(true);
  });

  it("should reset rate limit manually", async () => {
    const limit = 2;
    const window = 60;

    // Atteindre la limite
    await checkRateLimit(testIp, testEndpoint, limit, window);
    await checkRateLimit(testIp, testEndpoint, limit, window);

    // Vérifier qu'on est bloqué
    let result = await checkRateLimit(testIp, testEndpoint, limit, window);
    expect(result.allowed).toBe(false);

    // Réinitialiser
    await resetRateLimit(testIp, testEndpoint);

    // Devrait être autorisé à nouveau
    result = await checkRateLimit(testIp, testEndpoint, limit, window);
    expect(result.allowed).toBe(true);
  });
});
