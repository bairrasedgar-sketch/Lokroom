import { useState, useCallback } from "react";
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

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  listing: { id: string; title: string; city: string; images: { url: string }[] };
}

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:   { label: "En attente",  bg: "#FEF3C7", fg: "#92400E" },
  CONFIRMED: { label: "Confirmée",   bg: "#D1FAE5", fg: "#065F46" },
  CANCELLED: { label: "Annulée",     bg: "#FEE2E2", fg: "#991B1B" },
  COMPLETED: { label: "Terminée",    bg: "#F3F4F6", fg: "#374151" },
  REJECTED:  { label: "Refusée",     bg: "#FEE2E2", fg: "#991B1B" },
};

async function fetchBookings(tab: "guest" | "host") {
  const endpoint = tab === "host" ? "/host/bookings" : "/bookings/checkout";
  const { data } = await api.get(endpoint);
  return (data.bookings || data) as Booking[];
}

function AuthGuard() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.guardWrap, { paddingTop: insets.top + 60 }]}>
      <View style={s.guardIcon}>
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={s.guardTitle}>Connecte-toi pour voir tes réservations</Text>
      <Text style={s.guardSub}>Tes voyages et réservations apparaîtront ici</Text>
      <TouchableOpacity style={s.guardBtn} onPress={() => router.push("/(auth)/login")}>
        <Text style={s.guardBtnText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"guest" | "host">("guest");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["bookings", tab],
    queryFn: () => fetchBookings(tab),
    enabled: isAuthenticated,
  });

  const renderItem = useCallback(({ item }: { item: Booking }) => {
    const st = STATUS[item.status] || { label: item.status, bg: "#F3F4F6", fg: "#374151" };
    const imgUrl = item.listing.images?.[0]?.url;
    const start = new Date(item.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const end = new Date(item.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/bookings/${item.id}`)} activeOpacity={0.8}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={s.cardImg} resizeMode="cover" />
        ) : (
          <View style={[s.cardImg, s.cardImgPlaceholder]}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        )}
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.listing.title}</Text>
          <Text style={s.cardCity}>{item.listing.city}</Text>
          <Text style={s.cardDates}>{start} → {end}</Text>
          <View style={s.cardFooter}>
            <Text style={s.cardPrice}>{item.totalPrice} {item.currency}</Text>
            <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[s.statusText, { color: st.fg }]}>{st.label}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitle}>Réservations</Text>
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tabBtn, tab === "guest" && s.tabActive]} onPress={() => setTab("guest")}>
            <Text style={[s.tabText, tab === "guest" && s.tabTextActive]}>Mes voyages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, tab === "host" && s.tabActive]} onPress={() => setTab("host")}>
            <Text style={[s.tabText, tab === "host" && s.tabTextActive]}>Hôte</Text>
          </TouchableOpacity>
        </View>
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
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
              <Text style={s.emptyTitle}>{tab === "guest" ? "Aucun voyage" : "Aucune réservation"}</Text>
              <Text style={s.emptySub}>{tab === "guest" ? "Tes prochains voyages apparaîtront ici" : "Les réservations de tes annonces apparaîtront ici"}</Text>
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
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 12 },

  // Tabs
  tabs: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#111827" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  // List
  list: { padding: 16, gap: 12 },

  // Card
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", flexDirection: "row", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardImg: { width: 100, height: 100 },
  cardImgPlaceholder: { backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  cardBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardCity: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  cardDates: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#111827" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },

  // Empty
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center", paddingHorizontal: 32 },

  // Guard
  guardWrap: { flex: 1, alignItems: "center", paddingHorizontal: 32 },
  guardIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  guardTitle: { fontSize: 18, fontWeight: "600", color: "#111827", textAlign: "center" },
  guardSub: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6, marginBottom: 24 },
  guardBtn: { backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  guardBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
