import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://lokroom.com";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const token = await SecureStore.getItemAsync("access_token");
        const { data } = await axios.post(`${API_URL}/api/auth/mobile/refresh`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await SecureStore.setItemAsync("access_token", data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync("access_token");
      }
    }
    return Promise.reject(error);
  }
);
