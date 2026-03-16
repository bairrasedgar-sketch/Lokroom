import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Svg, { Path } from "react-native-svg";
import ListingCard, { type ListingCardData } from "@/components/ui/ListingCard";
import CategoryBar from "@/components/ui/CategoryBar";

async function fetchListings(search: string, type: string) {
  const params = new URLSearchParams({ pageSize: "20" });
  if (search) params.set("q", search);
  if (type) params.set("type", type);
  const { data } = await api.get(`/listings?${params}`);
  return data.listings as ListingCardData[];
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["listings", query, category],
    queryFn: () => fetchListings(query, category),
  });

  const handleSearch = () => setQuery(search.trim());

  const handleCategory = (v: string) => {
    setCategory(v);
  };

  const renderItem = useCallback(({ item }: { item: ListingCardData }) => (
    <View style={s.cardWrap}>
      <ListingCard item={item} />
    </View>
  ), []);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.logo}>Lok'Room</Text>

        {/* Search bar */}
        <TouchableOpacity style={s.searchBar} activeOpacity={0.8}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <TextInput
            style={s.searchInput}
            placeholder="Où allez-vous ?"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); setQuery(""); }} style={s.clearBtn}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <CategoryBar active={category} onChange={handleCategory} />

      {/* Listings */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#111827" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#111827" />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
              <Text style={s.emptyTitle}>Aucune annonce trouvée</Text>
              <Text style={s.emptySub}>Essaie de modifier ta recherche ou tes filtres</Text>
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
  logo: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: "#111827", paddingVertical: 0 },
  clearBtn: { padding: 4 },
  list: { padding: 16, paddingBottom: 32 },
  cardWrap: { marginBottom: 4 },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
});
