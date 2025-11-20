// apps/web/src/lib/rate-limit.ts

/**
 * Rate limiting ultra simple en mémoire.
 * ⚠️ Sur Vercel, chaque lambda a sa mémoire → c'est du "best effort",
 * pas une sécurité parfaite. Mais suffisant pour éviter le spam de base.
 */

type Entry = {
  count: number;
  expiresAt: number;
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;

const buckets = new Map<string, Entry>();

export async function rateLimit(
  key: string,
  maxRequests = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.expiresAt < now) {
    buckets.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { ok: false, remaining: 0 };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    ok: true,
    remaining: maxRequests - current.count,
  };
}
