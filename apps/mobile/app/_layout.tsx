import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
          <Stack.Screen name="listings/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="bookings/new" options={{ headerShown: false }} />
          <Stack.Screen name="bookings/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="account/profile" options={{ headerShown: true, title: "Mon profil" }} />
          <Stack.Screen name="account/security" options={{ headerShown: true, title: "Sécurité" }} />
          <Stack.Screen name="account/settings" options={{ headerShown: true, title: "Paramètres" }} />
          <Stack.Screen name="host/dashboard" options={{ headerShown: true, title: "Dashboard" }} />
          <Stack.Screen name="host/listings" options={{ headerShown: true, title: "Mes annonces" }} />
          <Stack.Screen name="host/wallet" options={{ headerShown: true, title: "Portefeuille" }} />
          <Stack.Screen name="notifications/index" options={{ headerShown: true, title: "Notifications" }} />
          <Stack.Screen name="reviews/new" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
