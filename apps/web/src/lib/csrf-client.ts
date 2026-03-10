/**
 * Utilitaire client pour la protection CSRF
 * Lit le cookie csrf-token et l'ajoute automatiquement aux requêtes mutantes
 */

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Wrapper fetch qui ajoute automatiquement le header X-CSRF-Token
 * sur les requêtes POST/PUT/PATCH/DELETE
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (!mutating) {
    return fetch(input, init);
  }

  const token = getCsrfToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("X-CSRF-Token", token);
  }

  return fetch(input, { ...init, headers });
}
