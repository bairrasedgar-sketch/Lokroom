import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "#D97706", bg: "#FEF3C7" },
  CONFIRMED: { label: "Confirmée", color: "#059669", bg: "#D1FAE5" },
  CANCELLED: { label: "Annulée", color: "#DC2626", bg: "#FEE2E2" },
  COMPLETED: { label: "Terminée", color: "#6B7280", bg: "#F3F4F6" },
  REJECTED: { label: "Refusée", color: "#DC2626", bg: "#FEE2E2" },
};

async function fetchBooking(id: string) {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
}

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBooking(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/bookings/${id}`, { action: "cancel" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Annulation impossible"),
  });

  const handleCancel = () => {
    Alert.alert("Annuler la réservation", "Tu veux vraiment annuler ?", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: () => cancelMutation.mutate() },
    ]);
  };

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!booking) return null;

  const status = STATUS_LABELS[booking.status] || { label: booking.status, color: "#6B7280", bg: "#F3F4F6" };
  const nights = Math.round(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86400000
  );

  return (
    <>
      <Stack.Screen options={{ title: "Réservation", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Statut */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Annonce */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logement</Text>
          <TouchableOpacity onPress={() => router.push(`/listings/${booking.listing.id}`)}>
            <Text style={styles.listingTitle}>{booking.listing.title}</Text>
            <Text style={styles.listingLocation}>📍 {booking.listing.city}, {booking.listing.country}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.datesRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Arrivée</Text>
              <Text style={styles.dateValue}>
                {new Date(booking.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Départ</Text>
              <Text style={styles.dateValue}>
                {new Date(booking.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
          </View>
          <Text style={styles.nightsText}>{nights} nuit{nights > 1 ? "s" : ""}</Text>
        </View>

        <View style={styles.divider} />

        {/* Prix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix</Text>
          {booking.priceBreakdown ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Sous-total</Text>
                <Text style={styles.priceValue}>{booking.priceBreakdown.subtotal} {booking.currency}</Text>
              </View>
              {booking.priceBreakdown.serviceFee > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Frais de service</Text>
                  <Text style={styles.priceValue}>{booking.priceBreakdown.serviceFee} {booking.currency}</Text>
                </View>
              )}
            </>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{booking.totalPrice} {booking.currency}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Hôte / Voyageur */}
        {booking.host && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hôte</Text>
            <Text style={styles.personName}>{booking.host.name}</Text>
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() => router.push(`/conversation/${booking.conversationId}`)}
            >
              <Text style={styles.msgBtnText}>💬 Envoyer un message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text style={styles.cancelBtnText}>Annuler la réservation</Text>
            )}
          </TouchableOpacity>
        ) : null}

        {booking.status === "COMPLETED" && !booking.hasReview && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => router.push(`/reviews/new?bookingId=${booking.id}`)}
          >
            <Text style={styles.reviewBtnText}>⭐ Laisser un avis</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {},
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusBanner: { paddingVertical: 14, alignItems: "center" },
  statusText: { fontSize: 16, fontWeight: "700" },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  listingTitle: { fontSize: 17, fontWeight: "700", color: "#2563EB", marginBottom: 4 },
  listingLocation: { fontSize: 14, color: "#6B7280" },
  divider: { height: 1, backgroundColor: "#F3F4F6" },
  datesRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  arrow: { fontSize: 18, color: "#9CA3AF" },
  nightsText: { fontSize: 13, color: "#6B7280" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priceLabel: { fontSize: 15, color: "#374151" },
  priceValue: { fontSize: 15, color: "#374151" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  personName: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 12 },
  msgBtn: { backgroundColor: "#EFF6FF", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  msgBtnText: { color: "#2563EB", fontWeight: "600", fontSize: 15 },
  cancelBtn: { marginHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelBtnText: { color: "#DC2626", fontWeight: "600", fontSize: 15 },
  reviewBtn: { marginHorizontal: 20, marginTop: 8, backgroundColor: "#FEF3C7", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  reviewBtnText: { color: "#D97706", fontWeight: "600", fontSize: 15 },
});
