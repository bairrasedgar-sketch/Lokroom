import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

async function fetchNotifications() {
  const { data } = await api.get("/notifications");
  return data.notifications as Notification[];
}

const TYPE_ICONS: Record<string, string> = {
  BOOKING: "📅",
  MESSAGE: "💬",
  REVIEW: "⭐",
  PAYMENT: "💳",
  SYSTEM: "🔔",
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const handlePress = (notif: Notification) => {
    if (notif.link) router.push(notif.link as any);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Notifications", headerShown: true }} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, !item.read && styles.itemUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.icon}>{TYPE_ICONS[item.type] || "🔔"}</Text>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.bodyText} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucune notification</Text>}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "flex-start", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: "#fff" },
  itemUnread: { backgroundColor: "#EFF6FF" },
  icon: { fontSize: 24, marginRight: 14, marginTop: 2 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
  bodyText: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 12, color: "#9CA3AF" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB", marginTop: 6 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60, fontSize: 15 },
});
