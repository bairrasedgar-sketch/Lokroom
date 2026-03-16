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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import ListingCard, { type ListingCardData } from "@/components/ui/ListingCard";

interface Favorite {
  id: string;
  listing: ListingCardData;
}

async function fetchFavorites() {
  const { data } = await api.get("/favorites");
  return (data.favorites || []) as Favorite[];
}

export default function FavoritesTab() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <View style={[s.guardWrap, { paddingTop: insets.top + 60 }]}>
        <View style={s.guardIcon}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={s.guardTitle}>Connecte-toi pour voir tes favoris</Text>
        <Text style={s.guardSub}>Sauvegarde tes annonces preferees ici</Text>
        <TouchableOpacity style={s.guardBtn} onPress={() => router.push("/(auth)/login")}>
          <Text style={s.guardBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitle}>Favoris</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#111827" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <ListingCard item={item.listing} />
            </View>
          )}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#111827" />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
              <Text style={s.emptyTitle}>Aucun favori</Text>
              <Text style={s.emptySub}>Appuie sur le coeur pour sauvegarder une annonce</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  list: { padding: 16 },
  cardWrap: { marginBottom: 4 },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center", paddingHorizontal: 32 },
  guardWrap: { flex: 1, alignItems: "center", paddingHorizontal: 32, backgroundColor: "#F9FAFB" },
  guardIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  guardTitle: { fontSize: 18, fontWeight: "600", color: "#111827", textAlign: "center" },
  guardSub: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6, marginBottom: 24 },
  guardBtn: { backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  guardBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
