import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  listing: { id: string; title: string; city: string; images: { url: string }[] };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "#F59E0B" },
  CONFIRMED: { label: "Confirmée", color: "#10B981" },
  CANCELLED: { label: "Annulée", color: "#EF4444" },
  COMPLETED: { label: "Terminée", color: "#6B7280" },
  REJECTED: { label: "Refusée", color: "#EF4444" },
};

async function fetchBookings(tab: "guest" | "host") {
  const endpoint = tab === "host" ? "/host/bookings" : "/bookings/checkout";
  const { data } = await api.get(endpoint);
  return (data.bookings || data) as Booking[];
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
    const status = STATUS_LABELS[item.status] || { label: item.status, color: "#6B7280" };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/bookings/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.listing.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.cardLocation}>{item.listing.city}</Text>
        <Text style={styles.cardDates}>
          {new Date(item.startDate).toLocaleDateString("fr-FR")} →{" "}
          {new Date(item.endDate).toLocaleDateString("fr-FR")}
        </Text>
        <Text style={styles.cardPrice}>
          {item.totalPrice} {item.currency}
        </Text>
      </TouchableOpacity>
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Réservations</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "guest" && styles.tabBtnActive]}
            onPress={() => setTab("guest")}
          >
            <Text style={[styles.tabText, tab === "guest" && styles.tabTextActive]}>Mes voyages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "host" && styles.tabBtnActive]}
            onPress={() => setTab("host")}
          >
            <Text style={[styles.tabText, tab === "host" && styles.tabTextActive]}>Mes hôtes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isAuthenticated ? (
        <View style={styles.guard}>
          <Text style={styles.guardIcon}>📅</Text>
          <Text style={styles.guardTitle}>Connecte-toi pour voir tes réservations</Text>
          <TouchableOpacity style={styles.guardBtn} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.guardBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guardBtnSecondary} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.guardBtnSecondaryText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          ListEmptyComponent={<Text style={styles.empty}>Aucune réservation</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 12 },
  tabs: { flexDirection: "row" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: "#2563EB" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#9CA3AF" },
  tabTextActive: { color: "#2563EB", fontWeight: "700" },
  guard: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  guardIcon: { fontSize: 48, marginBottom: 16 },
  guardTitle: { fontSize: 18, fontWeight: "600", color: "#111827", textAlign: "center", marginBottom: 24 },
  guardBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 12 },
  guardBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  guardBtnSecondary: { borderWidth: 1.5, borderColor: "#2563EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center" },
  guardBtnSecondaryText: { color: "#2563EB", fontSize: 16, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827", marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardLocation: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  cardDates: { fontSize: 13, color: "#374151", marginBottom: 6 },
  cardPrice: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60, fontSize: 15 },
});
