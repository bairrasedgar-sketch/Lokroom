import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function fetchDashboard() {
  const { data } = await api.get("/host/dashboard");
  return data;
}

export default function HostDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["host-dashboard"],
    queryFn: fetchDashboard,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Dashboard hôte", headerShown: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard icon="💰" label="Revenus ce mois" value={`${data?.monthlyRevenue || 0} €`} />
              <StatCard icon="📅" label="Réservations" value={data?.totalBookings || 0} />
              <StatCard icon="⭐" label="Note moyenne" value={data?.averageRating ? data.averageRating.toFixed(1) : "—"} />
              <StatCard icon="🏠" label="Annonces actives" value={data?.activeListings || 0} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <View style={styles.actions}>
                <ActionBtn icon="➕" label="Nouvelle annonce" onPress={() => router.push("/host/listings/new")} />
                <ActionBtn icon="📋" label="Mes annonces" onPress={() => router.push("/host/listings")} />
                <ActionBtn icon="📅" label="Calendrier" onPress={() => router.push("/host/calendar")} />
                <ActionBtn icon="💳" label="Portefeuille" onPress={() => router.push("/host/wallet")} />
              </View>
            </View>

            {data?.pendingBookings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Réservations en attente</Text>
                {data.pendingBookings.map((b: any) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.bookingItem}
                    onPress={() => router.push(`/bookings/${b.id}`)}
                  >
                    <View>
                      <Text style={styles.bookingGuest}>{b.guest?.name}</Text>
                      <Text style={styles.bookingListing}>{b.listing?.title}</Text>
                      <Text style={styles.bookingDates}>
                        {new Date(b.startDate).toLocaleDateString("fr-FR")} → {new Date(b.endDate).toLocaleDateString("fr-FR")}
                      </Text>
                    </View>
                    <Text style={styles.bookingPrice}>{b.totalPrice} {b.currency}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: any }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },
  bookingItem: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingGuest: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
  bookingListing: { fontSize: 13, color: "#6B7280", marginBottom: 2 },
  bookingDates: { fontSize: 12, color: "#9CA3AF" },
  bookingPrice: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
});
