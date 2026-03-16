import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: "GUEST" | "HOST" | "BOTH" | "ADMIN";
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean }>;
  verify2FA: (code: string, tempToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post("/auth/mobile/login", { email, password });
    await SecureStore.setItemAsync("access_token", data.token);
    set({ user: data.user, isAuthenticated: true });
    return { requires2FA: false };
  },

  verify2FA: async (code, tempToken) => {
    const { data } = await api.post("/auth/2fa/verify", { code, tempToken });
    await SecureStore.setItemAsync("access_token", data.token);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post("/auth/mobile/logout");
    } catch {}
    await SecureStore.deleteItemAsync("access_token");
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (!token) return set({ isLoading: false });
      const { data } = await api.get("/auth/mobile/me");
      set({ user: data.user, isAuthenticated: true });
    } catch {
      await SecureStore.deleteItemAsync("access_token");
    } finally {
      set({ isLoading: false });
    }
  },
}));
