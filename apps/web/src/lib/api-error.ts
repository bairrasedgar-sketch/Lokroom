// apps/web/src/lib/api-error.ts
import { NextResponse } from "next/server";

/**
 * Helper pour renvoyer des erreurs JSON de manière uniforme.
 *
 * Exemple :
 *   return jsonError("unauthorized", 401);
 *   return jsonError("validation_error", 400, { field: "rating" });
 */
export function jsonError(
  code: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: code,
      ...(extra ?? {}),
    },
    { status }
  );
}
