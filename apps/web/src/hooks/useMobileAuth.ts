// apps/web/src/hooks/useMobileAuth.ts
"use client";

import { useState, useEffect } from "react";
import { isCapacitor } from "@/lib/capacitor";
import {
import { logger } from "@/lib/logger";

  mobileLogin,
  mobileLogout,
  getAuthUser,
  isAuthenticated,
  refreshAuth,
  type MobileUser,
} from "@/lib/auth/mobile";

interface UseMobileAuthReturn {
  user: MobileUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook pour gérer l'authentification mobile
 * Utilise Capacitor Storage pour persister la session
 */
export function useMobileAuth(): UseMobileAuthReturn {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Charger l'utilisateur au montage
  useEffect(() => {
    if (!isCapacitor()) {
      setIsLoading(false);
      return;
    }

    loadUser();
  }, []);

  async function loadUser() {
    try {
      const authenticated = await isAuthenticated();
      setAuthenticated(authenticated);

      if (authenticated) {
        const storedUser = await getAuthUser();
        setUser(storedUser);
      }
    } catch (error) {
      logger.error("[useMobileAuth] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const result = await mobileLogin(email, password);

      if (result.success && result.user) {
        setUser(result.user);
        setAuthenticated(true);
      }

      return result;
    } catch (error) {
      logger.error("[useMobileAuth] Login error:", error);
      return { success: false, error: "Erreur de connexion" };
    }
  }

  async function logout() {
    try {
      await mobileLogout();
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      logger.error("[useMobileAuth] Logout error:", error);
    }
  }

  async function refresh() {
    try {
      const result = await refreshAuth();

      if (result.success) {
        const storedUser = await getAuthUser();
        setUser(storedUser);
        setAuthenticated(true);
      } else {
        // Session expirée
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      logger.error("[useMobileAuth] Refresh error:", error);
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: authenticated,
    login,
    logout,
    refresh,
  };
}
