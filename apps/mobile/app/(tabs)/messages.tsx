import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Conversation {
  id: string;
  otherUser: { id: string; name: string; image?: string };
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
}

async function fetchConversations() {
  const { data } = await api.get("/messages/list");
  return data.conversations as Conversation[];
}

function AuthGuard() {
  return (
    <View style={styles.guard}>
      <Text style={styles.guardIcon}>💬</Text>
      <Text style={styles.guardTitle}>Connecte-toi pour voir tes messages</Text>
      <TouchableOpacity style={styles.guardBtn} onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.guardBtnText}>Se connecter</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.guardBtnSecondary} onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.guardBtnSecondaryText}>Créer un compte</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: isAuthenticated,
  });

  const renderItem = useCallback(({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(`/conversation/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        {item.otherUser.image ? (
          <Image source={{ uri: item.otherUser.image }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{item.otherUser.name[0].toUpperCase()}</Text>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemName}>{item.otherUser.name}</Text>
        <Text style={styles.itemMsg} numberOfLines={1}>
          {item.lastMessage?.content || "Nouvelle conversation"}
        </Text>
      </View>
      {item.lastMessage && (
        <Text style={styles.itemTime}>
          {new Date(item.lastMessage.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </Text>
      )}
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      {!isAuthenticated ? (
        <AuthGuard />
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          ListEmptyComponent={<Text style={styles.empty}>Aucun message pour l'instant</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  guard: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  guardIcon: { fontSize: 48, marginBottom: 16 },
  guardTitle: { fontSize: 18, fontWeight: "600", color: "#111827", textAlign: "center", marginBottom: 24 },
  guardBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 12 },
  guardBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  guardBtnSecondary: { borderWidth: 1.5, borderColor: "#2563EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center" },
  guardBtnSecondaryText: { color: "#2563EB", fontSize: 16, fontWeight: "600" },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", marginRight: 12, position: "relative" },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  badge: { position: "absolute", top: -2, right: -2, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  itemBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
  itemMsg: { fontSize: 13, color: "#6B7280" },
  itemTime: { fontSize: 12, color: "#9CA3AF" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60, fontSize: 15 },
});
