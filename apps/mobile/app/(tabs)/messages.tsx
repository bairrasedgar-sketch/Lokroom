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
import Svg, { Path } from "react-native-svg";

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

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function AuthGuard() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.guardWrap, { paddingTop: insets.top + 60 }]}>
      <View style={s.guardIcon}>
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={s.guardTitle}>Connecte-toi pour voir tes messages</Text>
      <Text style={s.guardSub}>Tes conversations avec les hôtes apparaîtront ici</Text>
      <TouchableOpacity style={s.guardBtn} onPress={() => router.push("/(auth)/login")}>
        <Text style={s.guardBtnText}>Se connecter</Text>
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

  const renderItem = useCallback(({ item }: { item: Conversation }) => {
    const hasUnread = item.unreadCount > 0;
    const timeStr = item.lastMessage
      ? new Date(item.lastMessage.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      : "";

    return (
      <TouchableOpacity style={s.item} onPress={() => router.push(`/conversation/${item.id}`)} activeOpacity={0.7}>
        <View style={s.avatarWrap}>
          {item.otherUser.image ? (
            <Image source={{ uri: item.otherUser.image }} style={s.avatar} />
          ) : (
            <View style={[s.avatarPlaceholder, { backgroundColor: avatarColor(item.otherUser.name) }]}>
              <Text style={s.avatarInitial}>{item.otherUser.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          {hasUnread && (
            <View style={s.unreadDot}>
              <Text style={s.unreadText}>{item.unreadCount > 9 ? "9+" : item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          <View style={s.nameRow}>
            <Text style={[s.name, hasUnread && s.nameBold]} numberOfLines={1}>{item.otherUser.name}</Text>
            {timeStr ? <Text style={[s.time, hasUnread && s.timeBold]}>{timeStr}</Text> : null}
          </View>
          <Text style={[s.msg, hasUnread && s.msgBold]} numberOfLines={1}>
            {item.lastMessage?.content || "Nouvelle conversation"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitle}>Messages</Text>
      </View>

      {!isAuthenticated ? (
        <AuthGuard />
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#111827" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#111827" />}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
              <Text style={s.emptyTitle}>Aucun message</Text>
              <Text style={s.emptySub}>Tes conversations apparaîtront ici</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  list: { paddingTop: 4 },
  sep: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 76 },

  // Item
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: "#fff" },
  unreadDot: { position: "absolute", top: -2, right: -2, backgroundColor: "#2563EB", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 5, borderWidth: 2, borderColor: "#fff" },
  unreadText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  body: { flex: 1 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "500", color: "#111827", flex: 1, marginRight: 8 },
  nameBold: { fontWeight: "700" },
  time: { fontSize: 12, color: "#9CA3AF" },
  timeBold: { color: "#111827" },
  msg: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  msgBold: { color: "#374151", fontWeight: "500" },

  // Empty
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  // Guard
  guardWrap: { flex: 1, alignItems: "center", paddingHorizontal: 32 },
  guardIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  guardTitle: { fontSize: 18, fontWeight: "600", color: "#111827", textAlign: "center" },
  guardSub: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6, marginBottom: 24 },
  guardBtn: { backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  guardBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
