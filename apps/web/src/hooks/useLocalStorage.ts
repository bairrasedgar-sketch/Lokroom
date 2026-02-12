// apps/web/src/hooks/useLocalStorage.ts

/**
 * 🔒 SÉCURITÉ : Hook sécurisé pour localStorage avec protection SSR
 * Évite les erreurs d'hydratation et les crashes SSR
 */

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";


/**
 * Hook sécurisé pour utiliser localStorage avec Next.js SSR
 * @param key - Clé localStorage
 * @param initialValue - Valeur initiale si la clé n'existe pas
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // État pour stocker la valeur
  // On initialise avec initialValue pour éviter les erreurs SSR
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  // Effet pour détecter qu'on est côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effet pour charger la valeur depuis localStorage une fois côté client
  useEffect(() => {
    if (!isClient) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      logger.error(`Error loading localStorage key "${key}":`, error);
    }
  }, [key, isClient]);

  // Fonction pour sauvegarder la valeur
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre la valeur d'être une fonction pour avoir la même API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Sauvegarder l'état
      setStoredValue(valueToStore);

      // Sauvegarder dans localStorage seulement côté client
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logger.error(`Error saving localStorage key "${key}":`, error);
    }
  };

  // Fonction pour supprimer la valeur
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      logger.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * Hook simple pour vérifier si on est côté client
 * Utile pour les composants qui utilisent localStorage directement
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Fonction utilitaire pour lire localStorage de manière sécurisée
 * @param key - Clé localStorage
 * @param defaultValue - Valeur par défaut si la clé n'existe pas
 * @returns Valeur parsée ou defaultValue
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logger.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Fonction utilitaire pour écrire dans localStorage de manière sécurisée
 * @param key - Clé localStorage
 * @param value - Valeur à sauvegarder
 */
export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error(`Error writing localStorage key "${key}":`, error);
  }
}

/**
 * Fonction utilitaire pour supprimer une clé localStorage de manière sécurisée
 * @param key - Clé localStorage
 */
export function removeLocalStorageItem(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    logger.error(`Error removing localStorage key "${key}":`, error);
  }
}
