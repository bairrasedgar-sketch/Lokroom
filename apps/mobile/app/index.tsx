import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />;
}
