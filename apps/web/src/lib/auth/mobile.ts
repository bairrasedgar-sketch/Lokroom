// apps/web/src/lib/auth/mobile.ts
import { Preferences } from "@capacitor/preferences";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export interface MobileUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Stocke le token d'authentification dans Capacitor Storage
 */
export async function setAuthToken(token: string): Promise<void> {
  await Preferences.set({
    key: AUTH_TOKEN_KEY,
    value: token,
  });
}

/**
 * Récupère le token d'authentification depuis Capacitor Storage
 */
export async function getAuthToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
  return value;
}

/**
 * Supprime le token d'authentification
 */
export async function removeAuthToken(): Promise<void> {
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
}

/**
 * Stocke les données utilisateur dans Capacitor Storage
 */
export async function setAuthUser(user: MobileUser): Promise<void> {
  await Preferences.set({
    key: AUTH_USER_KEY,
    value: JSON.stringify(user),
  });
}

/**
 * Récupère les données utilisateur depuis Capacitor Storage
 */
export async function getAuthUser(): Promise<MobileUser | null> {
  const { value } = await Preferences.get({ key: AUTH_USER_KEY });
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Supprime les données utilisateur
 */
export async function removeAuthUser(): Promise<void> {
  await Preferences.remove({ key: AUTH_USER_KEY });
}

/**
 * Connexion mobile - stocke le token et l'utilisateur
 */
export async function mobileLogin(email: string, password: string): Promise<{ success: boolean; error?: string; user?: MobileUser }> {
  try {
    const res = await fetch("/api/auth/mobile/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Erreur de connexion" };
    }

    // Stocker le token et l'utilisateur
    await setAuthToken(data.token);
    await setAuthUser(data.user);

    return { success: true, user: data.user };
  } catch (error) {
    console.error("[Mobile Auth] Login error:", error);
    return { success: false, error: "Erreur réseau" };
  }
}

/**
 * Déconnexion mobile - supprime le token et l'utilisateur
 */
export async function mobileLogout(): Promise<void> {
  await removeAuthToken();
  await removeAuthUser();
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Récupère le token pour les requêtes API
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Rafraîchit le token et les données utilisateur
 */
export async function refreshAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Non connecté" };
    }

    const res = await fetch("/api/auth/mobile/refresh", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      // Token invalide - déconnecter
      await mobileLogout();
      return { success: false, error: data.error || "Session expirée" };
    }

    // Mettre à jour le token et l'utilisateur
    await setAuthToken(data.token);
    await setAuthUser(data.user);

    return { success: true };
  } catch (error) {
    console.error("[Mobile Auth] Refresh error:", error);
    return { success: false, error: "Erreur réseau" };
  }
}
