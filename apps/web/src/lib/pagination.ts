// apps/web/src/lib/pagination.ts
/**
 * 🔒 SÉCURITÉ : Helpers de pagination pour éviter les requêtes trop larges
 *
 * Usage:
 * ```typescript
 * const params = getPaginationParams(req, 20, 100);
 * const result = await paginate(prisma.listing, {}, params, { orderBy: { createdAt: 'desc' } });
 * return NextResponse.json(result);
 * ```
 */

import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Extrait et valide les paramètres de pagination depuis la requête
 * @param req - NextRequest
 * @param defaultLimit - Limite par défaut (défaut: 20)
 * @param maxLimit - Limite maximale (défaut: 100)
 * @returns PaginationParams validés
 */
export function getPaginationParams(
  req: NextRequest,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const searchParams = req.nextUrl.searchParams;

  // Valider et limiter la page (minimum 1)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

  // Valider et limiter la limite (entre 1 et maxLimit)
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit)))
  );

  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Pagine une requête Prisma et retourne les données + métadonnées de pagination
 * @param model - Modèle Prisma (ex: prisma.listing)
 * @param where - Clause WHERE Prisma
 * @param params - Paramètres de pagination
 * @param options - Options Prisma supplémentaires (include, select, orderBy, etc.)
 * @returns PaginatedResponse avec données et métadonnées
 */
export async function paginate<T>(
  model: any,
  where: any,
  params: PaginationParams,
  options?: any
): Promise<PaginatedResponse<T>> {
  // Exécuter findMany et count en parallèle pour optimiser les performances
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip: params.skip,
      take: params.take,
      ...options,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Ajoute une limite simple à une requête (sans pagination complète)
 * Utile pour les routes qui n'ont pas besoin de pagination mais doivent limiter les résultats
 * @param req - NextRequest
 * @param defaultLimit - Limite par défaut (défaut: 100)
 * @param maxLimit - Limite maximale (défaut: 1000)
 * @returns Limite validée
 */
export function getSimpleLimit(
  req: NextRequest,
  defaultLimit = 100,
  maxLimit = 1000
): number {
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || String(defaultLimit));
  return Math.min(maxLimit, Math.max(1, limit));
}
