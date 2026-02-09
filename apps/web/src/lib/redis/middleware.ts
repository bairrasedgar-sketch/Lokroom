// apps/web/src/lib/redis/middleware.ts

/**
 * Middleware de cache pour les routes API Next.js.
 * Permet de cacher automatiquement les réponses GET.
 */

import { NextRequest, NextResponse } from "next/server";
import { cache } from "./cache";

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyPrefix?: string;
  skipCache?: (req: NextRequest) => boolean;
}

/**
 * Middleware de cache pour les routes API.
 * Cache automatiquement les réponses GET.
 */
export async function cacheMiddleware(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  cacheKey: string,
  options: CacheMiddlewareOptions = {}
): Promise<NextResponse> {
  const { ttl = 300, skipCache } = options;

  // Ne cacher que les requêtes GET
  if (req.method !== "GET") {
    return handler();
  }

  // Vérifier si on doit skip le cache
  if (skipCache && skipCache(req)) {
    return handler();
  }

  // Vérifier le cache
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "X-Cache": "HIT",
        "Cache-Control": `public, max-age=${ttl}`,
      },
    });
  }

  // Exécuter le handler
  const response = await handler();

  // Mettre en cache si succès
  if (response.ok) {
    try {
      const data = await response.clone().json();
      await cache.set(cacheKey, data, ttl);

      return NextResponse.json(data, {
        headers: {
          "X-Cache": "MISS",
          "Cache-Control": `public, max-age=${ttl}`,
        },
      });
    } catch (error) {
      console.error("[CacheMiddleware] Error caching response:", error);
      return response;
    }
  }

  return response;
}

/**
 * Génère une clé de cache basée sur l'URL et les query params.
 */
export function generateCacheKey(req: NextRequest, prefix: string = ""): string {
  const url = new URL(req.url);
  const path = url.pathname;
  const params = url.searchParams.toString();

  return `${prefix}${path}${params ? `:${params}` : ""}`;
}

/**
 * Middleware de cache avec support des headers conditionnels (ETag).
 */
export async function cacheMiddlewareWithETag(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  cacheKey: string,
  ttl: number = 300
): Promise<NextResponse> {
  // Ne cacher que les requêtes GET
  if (req.method !== "GET") {
    return handler();
  }

  // Vérifier le cache
  const cached = await cache.get<{ data: any; etag: string }>(cacheKey);

  if (cached) {
    const clientETag = req.headers.get("if-none-match");

    // Si l'ETag correspond, retourner 304 Not Modified
    if (clientETag === cached.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "X-Cache": "HIT",
          ETag: cached.etag,
        },
      });
    }

    // Sinon, retourner les données avec l'ETag
    return NextResponse.json(cached.data, {
      headers: {
        "X-Cache": "HIT",
        ETag: cached.etag,
        "Cache-Control": `public, max-age=${ttl}`,
      },
    });
  }

  // Exécuter le handler
  const response = await handler();

  // Mettre en cache si succès
  if (response.ok) {
    try {
      const data = await response.clone().json();
      const etag = `"${Buffer.from(JSON.stringify(data)).toString("base64").substring(0, 27)}"`;

      await cache.set(cacheKey, { data, etag }, ttl);

      return NextResponse.json(data, {
        headers: {
          "X-Cache": "MISS",
          ETag: etag,
          "Cache-Control": `public, max-age=${ttl}`,
        },
      });
    } catch (error) {
      console.error("[CacheMiddleware] Error caching response with ETag:", error);
      return response;
    }
  }

  return response;
}

/**
 * Wrapper pour créer un handler API avec cache automatique.
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    keyGenerator: (req: NextRequest) => string;
    ttl?: number;
    skipCache?: (req: NextRequest) => boolean;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const cacheKey = options.keyGenerator(req);
    return cacheMiddleware(req, () => handler(req), cacheKey, options);
  };
}
