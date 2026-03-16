import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function fetchWallet() {
  const { data } = await api.get("/host/overview");
  return data;
}

export default function HostWalletScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["host-wallet"],
    queryFn: fetchWallet,
  });

  const releaseMutation = useMutation({
    mutationFn: () => api.post("/host/release"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["host-wallet"] });
      Alert.alert("Succès", "Virement initié");
    },
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Virement impossible"),
  });

  const handlePayout = () => {
    Alert.alert("Virement", "Virer les fonds disponibles vers ton compte bancaire ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Virer", onPress: () => releaseMutation.mutate() },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Portefeuille", headerShown: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
        ) : (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceAmount}>{data?.availableBalance || 0} €</Text>
              <TouchableOpacity
                style={[styles.payoutBtn, !data?.availableBalance && styles.payoutBtnDisabled]}
                onPress={handlePayout}
                disabled={!data?.availableBalance || releaseMutation.isPending}
              >
                {releaseMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payoutBtnText}>Virer vers mon compte</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{data?.pendingBalance || 0} €</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{data?.totalEarned || 0} €</Text>
                <Text style={styles.statLabel}>Total gagné</Text>
              </View>
            </View>

            {data?.recentPayouts?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Virements récents</Text>
                {data.recentPayouts.map((p: any) => (
                  <View key={p.id} style={styles.payoutItem}>
                    <View>
                      <Text style={styles.payoutDate}>
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </Text>
                      <Text style={styles.payoutStatus}>{p.status}</Text>
                    </View>
                    <Text style={styles.payoutAmount}>{p.amount} €</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.stripeBtn}
              onPress={async () => {
                try {
                  const { data: res } = await api.get("/host/stripe/payout-link");
                  if (res.url) router.push(res.url);
                } catch {
                  Alert.alert("Erreur", "Impossible d'ouvrir Stripe");
                }
              }}
            >
              <Text style={styles.stripeBtnText}>⚙️ Gérer mon compte Stripe</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 16 },
  balanceCard: { backgroundColor: "#2563EB", borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16 },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  balanceAmount: { fontSize: 40, fontWeight: "700", color: "#fff", marginBottom: 20 },
  payoutBtn: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  payoutBtnDisabled: { backgroundColor: "rgba(255,255,255,0.4)" },
  payoutBtnText: { color: "#2563EB", fontWeight: "700", fontSize: 15 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#6B7280" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  payoutItem: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payoutDate: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  payoutStatus: { fontSize: 12, color: "#6B7280" },
  payoutAmount: { fontSize: 16, fontWeight: "700", color: "#10B981" },
  stripeBtn: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  stripeBtnText: { fontSize: 15, color: "#374151", fontWeight: "600" },
});
