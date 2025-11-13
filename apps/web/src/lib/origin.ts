// apps/web/src/lib/origin.ts
import { headers } from "next/headers";

/**
 * Renvoie l'origine à utiliser pour fabriquer des URLs absolues.
 * Ordre de priorité:
 *   1) APP_BASE_URL (idéal en prod: https://lokroom.com)
 *   2) en-têtes (x-forwarded-*) fournis par le proxy/Next (dev/preview)
 *   3) fallback localhost
 */
export function getOrigin() {
  const fromEnv = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  // Côté client
  if (typeof window !== "undefined") return window.location.origin;

  // Côté serveur
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}
