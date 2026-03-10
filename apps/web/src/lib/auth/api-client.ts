// apps/web/src/lib/auth/api-client.ts
"use client";

import { isCapacitor } from "@/lib/capacitor";
import { getAuthHeaders } from "@/lib/auth/mobile";
import { getCsrfToken } from "@/lib/csrf-client";

/**
 * Wrapper pour fetch qui ajoute automatiquement le token JWT mobile
 * Utilise le token depuis Capacitor Storage si on est dans l'app mobile
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {};

  // Si on est dans Capacitor, ajouter le token JWT
  if (isCapacitor()) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
  }

  // Ajouter le token CSRF pour les requêtes mutantes (web uniquement)
  const method = (options.method || 'GET').toUpperCase();
  if (!isCapacitor() && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  options.headers = {
    ...options.headers,
    ...headers,
  };

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
