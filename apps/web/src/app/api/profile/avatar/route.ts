/**
 * API de mise à jour d'avatar utilisateur
 * Validation stricte des URLs pour éviter les attaques XSS/injection
 */
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import {
  secureJsonResponse,
  secureErrorResponse,
  requireAuth,
} from "@/lib/security";

/**
 * Domaines autorisés pour les images d'avatar
 */
const ALLOWED_IMAGE_HOSTS = [
  // Cloudflare R2 (votre stockage principal)
  process.env.S3_PUBLIC_BASE?.replace(/^https?:\/\//, "").split("/")[0],
  "pub-lokroom.r2.dev",
  // Google (pour les avatars OAuth)
  "lh3.googleusercontent.com",
  // CDN additionnels si nécessaire
  "images.unsplash.com",
].filter(Boolean) as string[];

/**
 * Valide qu'une URL d'image est sécurisée
 */
function validateImageUrl(url: string): { valid: boolean; error?: string } {
  // Vérifier que c'est une string non vide
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL manquante" };
  }

  // Longueur maximale
  if (url.length > 2048) {
    return { valid: false, error: "URL trop longue" };
  }

  // Parser l'URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "URL invalide" };
  }

  // Protocole HTTPS uniquement (sauf en dev)
  const allowedProtocols =
    process.env.NODE_ENV === "development"
      ? ["https:", "http:"]
      : ["https:"];

  if (!allowedProtocols.includes(parsed.protocol)) {
    return { valid: false, error: "L'URL doit utiliser HTTPS" };
  }

  // Bloquer les schémas dangereux
  const dangerousPatterns = [
    /^javascript:/i,
    /^data:/i,
    /^vbscript:/i,
    /^file:/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(url)) {
      return { valid: false, error: "Schéma d'URL non autorisé" };
    }
  }

  // Vérifier que le domaine est dans la whitelist
  const isAllowedHost = ALLOWED_IMAGE_HOSTS.some((allowed) => {
    if (!allowed) return false;
    return parsed.host === allowed || parsed.host.endsWith(`.${allowed}`);
  });

  if (!isAllowedHost) {
    return {
      valid: false,
      error: `Domaine non autorisé. Domaines acceptés: ${ALLOWED_IMAGE_HOSTS.join(", ")}`,
    };
  }

  // On n'impose pas l'extension car certains CDN utilisent des URLs sans extension

  return { valid: true };
}

export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour upload avatar
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`avatar-upload:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return secureErrorResponse("Trop de tentatives. Réessayez dans une minute.", 429);
    }

    // Authentification
    const authResult = await requireAuth();
    if (!authResult.success) {
      return authResult.response;
    }

  // Parser le body
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return secureErrorResponse("Corps de requête invalide", 400);
  }

  const { url } = body;

  // Valider l'URL
  if (typeof url !== "string") {
    return secureErrorResponse("URL manquante ou invalide", 400);
  }

  const validation = validateImageUrl(url);
  if (!validation.valid) {
    return secureErrorResponse(validation.error || "URL invalide", 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id: authResult.user.id },
      data: {
        profile: {
          upsert: {
            create: { avatarUrl: url },
            update: { avatarUrl: url },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return secureJsonResponse({ success: true, user });
  } catch (error) {
    logger.error("POST /api/profile/avatar error", { error });
    return secureErrorResponse("Erreur lors de la mise à jour", 500);
  }
  } catch (error) {
    logger.error("POST /api/profile/avatar outer error", { error });
    return secureErrorResponse("Erreur serveur", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour suppression avatar
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`avatar-delete:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return secureErrorResponse("Trop de tentatives. Réessayez dans une minute.", 429);
    }

    // Authentification
    const authResult = await requireAuth();
    if (!authResult.success) {
      return authResult.response;
    }

  try {
    await prisma.userProfile.updateMany({
      where: { userId: authResult.user.id },
      data: { avatarUrl: null },
    });

    return secureJsonResponse({ success: true });
  } catch (error) {
    logger.error("DELETE /api/profile/avatar error", { error });
    return secureErrorResponse("Erreur lors de la suppression", 500);
  }
  } catch (error) {
    logger.error("DELETE /api/profile/avatar outer error", { error });
    return secureErrorResponse("Erreur serveur", 500);
  }
}
