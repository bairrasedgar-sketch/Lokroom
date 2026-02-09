// apps/web/src/lib/auth/api-client.ts
"use client";

import { isCapacitor } from "@/lib/capacitor";
import { getAuthHeaders } from "@/lib/auth/mobile";

/**
 * Wrapper pour fetch qui ajoute automatiquement le token JWT mobile
 * Utilise le token depuis Capacitor Storage si on est dans l'app mobile
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Si on est dans Capacitor, ajouter le token JWT
  if (isCapacitor()) {
    const authHeaders = await getAuthHeaders();

    options.headers = {
      ...options.headers,
      ...authHeaders,
    };
  }

  return fetch(url, options);
}

/**
 * Helper pour les requêtes GET authentifiées
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: "GET",
  });
}

/**
 * Helper pour les requêtes POST authentifiées
 */
export async function authenticatedPost(
  url: string,
  body: unknown
): Promise<Response> {
  return authenticatedFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper pour les requêtes PUT authentifiées
 */
export async function authenticatedPut(
  url: string,
  body: unknown
): Promise<Response> {
  return authenticatedFetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper pour les requêtes DELETE authentifiées
 */
export async function authenticatedDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: "DELETE",
  });
}

/**
 * Helper pour les requêtes PATCH authentifiées
 */
export async function authenticatedPatch(
  url: string,
  body: unknown
): Promise<Response> {
  return authenticatedFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
