import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function fetchListing(id: string) {
  const { data } = await api.get(`/listings/${id}`);
  return data;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewBookingScreen() {
  const insets = useSafeAreaInsets();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const today = new Date();
  const [startDate, setStartDate] = useState(addDays(today, 1));
  const [endDate, setEndDate] = useState(addDays(today, 3));
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => fetchListing(listingId),
  });

  const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const subtotal = listing ? listing.pricePerNight * nights : 0;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + serviceFee;

  const handleBook = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/bookings/instant", {
        listingId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        guests,
      });
      router.replace(`/bookings/${data.bookingId || data.id}`);
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.error || "Réservation impossible");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: "Réserver", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.listingTitle}>{listing?.title}</Text>
        <Text style={styles.listingLocation}>{listing?.city}, {listing?.country}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Arrivée</Text>
              <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
              <View style={styles.dateControls}>
                <TouchableOpacity onPress={() => {
                  const d = addDays(startDate, -1);
                  if (d > today) setStartDate(d);
                }}>
                  <Text style={styles.ctrl}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const d = addDays(startDate, 1);
                  if (d < endDate) setStartDate(d);
                }}>
                  <Text style={styles.ctrl}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Départ</Text>
              <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
              <View style={styles.dateControls}>
                <TouchableOpacity onPress={() => {
                  const d = addDays(endDate, -1);
                  if (d > startDate) setEndDate(d);
                }}>
                  <Text style={styles.ctrl}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEndDate(addDays(endDate, 1))}>
                  <Text style={styles.ctrl}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voyageurs</Text>
          <View style={styles.guestsRow}>
            <TouchableOpacity onPress={() => setGuests(Math.max(1, guests - 1))} style={styles.guestBtn}>
              <Text style={styles.guestBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.guestsCount}>{guests}</Text>
            <TouchableOpacity
              onPress={() => setGuests(Math.min(listing?.maxGuests || 10, guests + 1))}
              style={styles.guestBtn}
            >
              <Text style={styles.guestBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{listing?.pricePerNight} {listing?.currency} × {nights} nuit{nights > 1 ? "s" : ""}</Text>
            <Text style={styles.priceValue}>{subtotal} {listing?.currency}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Frais de service</Text>
            <Text style={styles.priceValue}>{serviceFee} {listing?.currency}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total} {listing?.currency}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>Confirmer la réservation</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listingTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  listingLocation: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBox: { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  dateLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  dateValue: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 8 },
  dateControls: { flexDirection: "row", gap: 8 },
  ctrl: { fontSize: 20, color: "#2563EB", fontWeight: "700", paddingHorizontal: 8 },
  arrow: { fontSize: 20, color: "#9CA3AF" },
  guestsRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  guestBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  guestBtnText: { fontSize: 20, color: "#111827" },
  guestsCount: { fontSize: 20, fontWeight: "700", color: "#111827", minWidth: 30, textAlign: "center" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  priceLabel: { fontSize: 15, color: "#374151" },
  priceValue: { fontSize: 15, color: "#374151" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  bookBtn: { backgroundColor: "#2563EB", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
