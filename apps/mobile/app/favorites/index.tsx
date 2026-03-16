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
import { router, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Favorite {
  id: string;
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    pricePerNight: number;
    currency: string;
    images: { url: string }[];
    averageRating?: number;
  };
}

async function fetchFavorites() {
  const { data } = await api.get("/favorites");
  return data.favorites as Favorite[];
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  const removeMutation = useMutation({
    mutationFn: (listingId: string) => api.delete(`/favorites/${listingId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  return (
    <>
      <Stack.Screen options={{ title: "Favoris", headerShown: true }} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/listings/${item.listing.id}`)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.listing.images[0]?.url || "https://placehold.co/400x200" }}
                style={styles.image}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => removeMutation.mutate(item.listing.id)}
              >
                <Text style={styles.heartIcon}>❤️</Text>
              </TouchableOpacity>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>{item.listing.title}</Text>
                <Text style={styles.location}>{item.listing.city}, {item.listing.country}</Text>
                <View style={styles.footer}>
                  <Text style={styles.price}>
                    {item.listing.pricePerNight} {item.listing.currency}
                    <Text style={styles.priceUnit}> / nuit</Text>
                  </Text>
                  {item.listing.averageRating ? (
                    <Text style={styles.rating}>⭐ {item.listing.averageRating.toFixed(1)}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>❤️</Text>
              <Text style={styles.emptyText}>Aucun favori pour l'instant</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)")}>
                <Text style={styles.emptyLink}>Explorer les annonces</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  image: { width: "100%", height: 180 },
  heartBtn: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  heartIcon: { fontSize: 18 },
  body: { padding: 14 },
  title: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 4 },
  location: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  priceUnit: { fontSize: 13, fontWeight: "400", color: "#6B7280" },
  rating: { fontSize: 13, color: "#374151" },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280", marginBottom: 12 },
  emptyLink: { fontSize: 15, color: "#2563EB", fontWeight: "600" },
});
