'use client';

import { isNativeMobile } from './capacitor';
import { Preferences } from '@capacitor/preferences';

/**
 * Configuration de l'API Client
 * Architecture professionnelle pour app mobile de qualité (style Airbnb)
 */

// URL du backend (à configurer selon l'environnement)
const getApiUrl = () => {
  // En production mobile, utiliser le backend distant
  if (isNativeMobile()) {
    return process.env.NEXT_PUBLIC_API_URL || 'https://lokroom.vercel.app';
  }

  // En développement web, utiliser le backend local
  return '';
};

const API_BASE_URL = getApiUrl();

/**
 * Gestion des tokens JWT (sécurisé avec Capacitor Storage)
 */
export const TokenManager = {
  async getToken(): Promise<string | null> {
    if (!isNativeMobile()) {
      // Sur web, le token est géré par les cookies (NextAuth)
      return null;
    }

    try {
      const { value } = await Preferences.get({ key: 'auth_token' });
      return value;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (!isNativeMobile()) return;

    try {
      await Preferences.set({ key: 'auth_token', value: token });
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    if (!isNativeMobile()) return;

    try {
      await Preferences.remove({ key: 'auth_token' });
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },
};

/**
 * Configuration des requêtes
 */
interface RequestConfig extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  retry?: number;
  cache?: boolean;
}

/**
 * Gestion du cache (pour mode offline)
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fonction principale pour les appels API
 * Style Airbnb : propre, robuste, avec retry et timeout
 */
export async function apiCall<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    timeout = 30000, // 30 secondes par défaut
    retry = 3,       // 3 tentatives par défaut
    cache: useCache = false,
    ...fetchConfig
  } = config;

  // Vérifier le cache si activé
  if (useCache && fetchConfig.method === 'GET') {
    const cached = getCachedData(endpoint);
    if (cached) {
      return cached as T;
    }
  }

  // Construire l'URL complète
  const url = `${API_BASE_URL}${endpoint}`;

  // Récupérer le token JWT
  const token = await TokenManager.getToken();

  // Préparer les headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Ajouter les headers personnalisés
  if (fetchConfig.headers) {
    const customHeaders = new Headers(fetchConfig.headers);
    customHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Ajouter le token si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fonction de retry avec backoff exponentiel
  const fetchWithRetry = async (attempt: number = 1): Promise<Response> => {
    try {
      // Créer un AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si la réponse est OK, retourner
      if (response.ok) {
        return response;
      }

      // Si 401 (Unauthorized), supprimer le token et rejeter
      if (response.status === 401) {
        await TokenManager.removeToken();
        throw new Error('Unauthorized - Please login again');
      }

      // Si 5xx (erreur serveur) et qu'il reste des tentatives, retry
      if (response.status >= 500 && attempt < retry) {
        const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }

      // Sinon, rejeter avec le message d'erreur
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);

    } catch (error: any) {
      // Si timeout et qu'il reste des tentatives, retry
      if (error.name === 'AbortError' && attempt < retry) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }

      throw error;
    }
  };

  try {
    const response = await fetchWithRetry();
    const data = await response.json();

    // Mettre en cache si activé
    if (useCache && fetchConfig.method === 'GET') {
      setCachedData(endpoint, data);
    }

    return data as T;

  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Helpers pour les méthodes HTTP courantes
 * Style Airbnb : API simple et intuitive
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, config?: RequestConfig) =>
    apiCall<T>(endpoint, { ...config, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiCall<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiCall<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiCall<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, config?: RequestConfig) =>
    apiCall<T>(endpoint, { ...config, method: 'DELETE' }),
};

/**
 * Hook pour vérifier la connexion réseau
 */
export function useNetworkStatus() {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Fonction pour vider le cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Fonction pour se déconnecter proprement
 */
export async function logout() {
  await TokenManager.removeToken();
  clearCache();

  // Rediriger vers la page de login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
