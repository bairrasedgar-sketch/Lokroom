import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

async function fetchListing(id: string) {
  const { data } = await api.get(`/listings/${id}`);
  return data;
}

export default function ListingDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [imgIndex, setImgIndex] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  const handleBook = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    router.push(`/bookings/new?listingId=${listing.id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!listing) return null;

  return (
    <>
      <Stack.Screen options={{ title: listing.title, headerShown: true }} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Images */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {(listing.images?.length ? listing.images : [{ url: "https://placehold.co/400x300" }]).map(
              (img: { url: string }, i: number) => (
                <Image key={i} source={{ uri: img.url }} style={styles.image} resizeMode="cover" />
              )
            )}
          </ScrollView>
          {listing.images?.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_: any, i: number) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.body}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.location}>
              📍 {listing.city}, {listing.country}
            </Text>

            <View style={styles.row}>
              <Text style={styles.price}>
                {listing.pricePerNight} {listing.currency}
                <Text style={styles.priceUnit}> / nuit</Text>
              </Text>
              {listing.averageRating ? (
                <Text style={styles.rating}>⭐ {listing.averageRating.toFixed(1)} ({listing.reviewCount})</Text>
              ) : null}
            </View>

            <View style={styles.divider} />

            {/* Infos rapides */}
            <View style={styles.quickInfo}>
              {listing.maxGuests && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>👥</Text>
                  <Text style={styles.infoText}>{listing.maxGuests} voyageurs</Text>
                </View>
              )}
              {listing.bedrooms && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>🛏</Text>
                  <Text style={styles.infoText}>{listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""}</Text>
                </View>
              )}
              {listing.bathrooms && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>🚿</Text>
                  <Text style={styles.infoText}>{listing.bathrooms} sdb</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Description */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>

            {/* Équipements */}
            {listing.amenities?.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Équipements</Text>
                <View style={styles.amenities}>
                  {listing.amenities.map((a: string, i: number) => (
                    <View key={i} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Hôte */}
            {listing.host && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Hôte</Text>
                <View style={styles.hostRow}>
                  <View style={styles.hostAvatar}>
                    {listing.host.image ? (
                      <Image source={{ uri: listing.host.image }} style={styles.hostAvatarImg} />
                    ) : (
                      <Text style={styles.hostAvatarText}>{listing.host.name?.[0]?.toUpperCase()}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.hostName}>{listing.host.name}</Text>
                    <Text style={styles.hostSince}>
                      Membre depuis {new Date(listing.host.createdAt).getFullYear()}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* CTA fixe en bas */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <View>
            <Text style={styles.footerPrice}>
              {listing.pricePerNight} {listing.currency}
            </Text>
            <Text style={styles.footerPriceUnit}>par nuit</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={handleBook}
          >
            <Text style={styles.bookBtnText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width, height: 280 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D1D5DB" },
  dotActive: { backgroundColor: "#2563EB", width: 18 },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 6 },
  location: { fontSize: 14, color: "#6B7280", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 22, fontWeight: "700", color: "#2563EB" },
  priceUnit: { fontSize: 14, fontWeight: "400", color: "#6B7280" },
  rating: { fontSize: 14, color: "#374151" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 20 },
  quickInfo: { flexDirection: "row", gap: 20 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 14, color: "#374151" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 10 },
  description: { fontSize: 15, color: "#374151", lineHeight: 24 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityTag: { backgroundColor: "#F3F4F6", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  amenityText: { fontSize: 13, color: "#374151" },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  hostAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" },
  hostAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  hostAvatarText: { fontSize: 20, fontWeight: "700", color: "#2563EB" },
  hostName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  hostSince: { fontSize: 13, color: "#6B7280" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F3F4F6", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  footerPrice: { fontSize: 20, fontWeight: "700", color: "#111827" },
  footerPriceUnit: { fontSize: 13, color: "#6B7280" },
  bookBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
