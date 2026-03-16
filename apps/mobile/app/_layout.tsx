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
          <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listings/[id]" options={{ headerShown: true, title: "" }} />
          <Stack.Screen name="bookings/[id]" options={{ headerShown: true, title: "Réservation" }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
