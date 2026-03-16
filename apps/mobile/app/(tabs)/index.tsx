import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Listing {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  currency: string;
  images: { url: string }[];
  averageRating?: number;
  reviewCount?: number;
}

async function fetchListings(search: string) {
  const params = new URLSearchParams({ pageSize: "20" });
  if (search) params.set("q", search);
  const { data } = await api.get(`/listings?${params}`);
  return data.listings as Listing[];
}

export default function ExploreScreen() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["listings", query],
    queryFn: () => fetchListings(query),
  });

  const handleSearch = () => setQuery(search.trim());

  const renderItem = useCallback(({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listings/${item.id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.images[0]?.url || "https://placehold.co/400x250" }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardLocation}>{item.city}, {item.country}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {item.pricePerNight} {item.currency}
            <Text style={styles.cardPriceUnit}> / nuit</Text>
          </Text>
          {item.averageRating ? (
            <Text style={styles.cardRating}>⭐ {item.averageRating.toFixed(1)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Explorer</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ville, pays..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Aucune annonce trouvée</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#111827" },
  searchBtn: { backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" },
  searchBtnText: { fontSize: 18 },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardImage: { width: "100%", height: 200 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
  cardLocation: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardPrice: { fontSize: 16, fontWeight: "700", color: "#2563EB" },
  cardPriceUnit: { fontSize: 13, fontWeight: "400", color: "#6B7280" },
  cardRating: { fontSize: 13, color: "#374151" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60, fontSize: 15 },
});
