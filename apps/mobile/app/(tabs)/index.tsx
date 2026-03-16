import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Svg, { Path } from "react-native-svg";
import ListingCard, { type ListingCardData } from "@/components/ui/ListingCard";
import CategoryBar from "@/components/ui/CategoryBar";

const POPULAR_CITIES = [
  { name: "Paris", country: "France" },
  { name: "Montréal", country: "Canada" },
  { name: "Lyon", country: "France" },
  { name: "Toronto", country: "Canada" },
  { name: "Marseille", country: "France" },
  { name: "Vancouver", country: "Canada" },
];

async function fetchListings(params: Record<string, string>) {
  const qs = new URLSearchParams({ pageSize: "20", ...params });
  const { data } = await api.get(`/listings?${qs}`);
  return data.listings as ListingCardData[];
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Build query params
  const queryParams: Record<string, string> = {};
  if (selectedCity) queryParams.q = selectedCity;
  if (category) queryParams.type = category;
  if (adults + children > 0) queryParams.guests = String(adults + children);
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (minPrice) queryParams.minPrice = minPrice;
  if (maxPrice) queryParams.maxPrice = maxPrice;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["listings", queryParams],
    queryFn: () => fetchListings(queryParams),
  });

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setCityQuery(city);
    setShowSearch(false);
  };

  const clearSearch = () => {
    setSelectedCity("");
    setCityQuery("");
  };

  const activeFiltersCount = [
    adults > 1 || children > 0,
    startDate,
    minPrice || maxPrice,
  ].filter(Boolean).length;

  const renderItem = useCallback(({ item }: { item: ListingCardData }) => (
    <View style={s.cardWrap}>
      <ListingCard item={item} />
    </View>
  ), []);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerTop}>
          <Text style={s.logo}>Lok'Room</Text>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={s.searchBar} onPress={() => setShowSearch(true)} activeOpacity={0.8}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <View style={s.searchTextWrap}>
            <Text style={selectedCity ? s.searchTextActive : s.searchTextPlaceholder} numberOfLines={1}>
              {selectedCity || "Où allez-vous ?"}
            </Text>
            {(adults > 1 || children > 0 || startDate) && (
              <Text style={s.searchSub} numberOfLines={1}>
                {[
                  startDate && endDate ? `${startDate} → ${endDate}` : startDate || null,
                  `${adults + children} voyageur${adults + children > 1 ? "s" : ""}`,
                ].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
          {selectedCity ? (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.filterBtn} onPress={() => setShowFilters(true)}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke="#111827" strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
              {activeFiltersCount > 0 && (
                <View style={s.filterBadge}>
                  <Text style={s.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <CategoryBar active={category} onChange={setCategory} />

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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#111827" />}
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

      {/* ═══ SEARCH MODAL ═══ */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modalContainer, { paddingTop: insets.top + 12 }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearch(false)} style={s.modalClose}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#111827" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Rechercher</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* City input */}
          <View style={s.searchInputWrap}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 13a3 3 0 100-6 3 3 0 000 6z" stroke="#6B7280" strokeWidth={1.5} />
            </Svg>
            <TextInput
              style={s.searchModalInput}
              placeholder="Rechercher une ville..."
              placeholderTextColor="#9CA3AF"
              value={cityQuery}
              onChangeText={setCityQuery}
              autoFocus
            />
            {cityQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCityQuery("")}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>

          {/* Popular cities */}
          <ScrollView style={s.citiesList}>
            {!cityQuery && (
              <Text style={s.citiesLabel}>Villes populaires</Text>
            )}
            {(cityQuery
              ? POPULAR_CITIES.filter((c) => c.name.toLowerCase().includes(cityQuery.toLowerCase()))
              : POPULAR_CITIES
            ).map((city) => (
              <TouchableOpacity
                key={city.name}
                style={s.cityItem}
                onPress={() => handleSelectCity(city.name)}
              >
                <View style={s.cityIcon}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M12 13a3 3 0 100-6 3 3 0 000 6z" stroke="#6B7280" strokeWidth={1.5} />
                  </Svg>
                </View>
                <View>
                  <Text style={s.cityName}>{city.name}</Text>
                  <Text style={s.cityCountry}>{city.country}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Search by text */}
            {cityQuery.length > 0 && (
              <TouchableOpacity style={s.cityItem} onPress={() => handleSelectCity(cityQuery)}>
                <View style={s.cityIcon}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" />
                  </Svg>
                </View>
                <View>
                  <Text style={s.cityName}>Rechercher "{cityQuery}"</Text>
                  <Text style={s.cityCountry}>Toutes les villes</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ═══ FILTERS MODAL ═══ */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modalContainer, { paddingTop: insets.top + 12 }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={s.modalClose}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#111827" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Filtres</Text>
            <TouchableOpacity onPress={() => {
              setAdults(1); setChildren(0); setStartDate(""); setEndDate(""); setMinPrice(""); setMaxPrice("");
            }}>
              <Text style={s.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.filtersScroll} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
            {/* Voyageurs */}
            <View style={s.filterSection}>
              <Text style={s.filterSectionTitle}>Voyageurs</Text>
              <View style={s.counterRow}>
                <View>
                  <Text style={s.counterLabel}>Adultes</Text>
                  <Text style={s.counterSub}>13 ans et plus</Text>
                </View>
                <View style={s.counterBtns}>
                  <TouchableOpacity style={[s.counterBtn, adults <= 1 && s.counterBtnDisabled]} onPress={() => setAdults(Math.max(1, adults - 1))}>
                    <Text style={[s.counterBtnText, adults <= 1 && s.counterBtnTextDisabled]}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.counterValue}>{adults}</Text>
                  <TouchableOpacity style={s.counterBtn} onPress={() => setAdults(adults + 1)}>
                    <Text style={s.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.counterRow}>
                <View>
                  <Text style={s.counterLabel}>Enfants</Text>
                  <Text style={s.counterSub}>2 - 12 ans</Text>
                </View>
                <View style={s.counterBtns}>
                  <TouchableOpacity style={[s.counterBtn, children <= 0 && s.counterBtnDisabled]} onPress={() => setChildren(Math.max(0, children - 1))}>
                    <Text style={[s.counterBtnText, children <= 0 && s.counterBtnTextDisabled]}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.counterValue}>{children}</Text>
                  <TouchableOpacity style={s.counterBtn} onPress={() => setChildren(children + 1)}>
                    <Text style={s.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Dates */}
            <View style={s.filterSection}>
              <Text style={s.filterSectionTitle}>Dates</Text>
              <View style={s.dateRow}>
                <View style={s.dateInput}>
                  <Text style={s.dateLabel}>Arrivée</Text>
                  <TextInput
                    style={s.dateField}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor="#9CA3AF"
                    value={startDate}
                    onChangeText={setStartDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <Text style={s.dateSep}>→</Text>
                <View style={s.dateInput}>
                  <Text style={s.dateLabel}>Départ</Text>
                  <TextInput
                    style={s.dateField}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor="#9CA3AF"
                    value={endDate}
                    onChangeText={setEndDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            </View>

            {/* Prix */}
            <View style={s.filterSection}>
              <Text style={s.filterSectionTitle}>Fourchette de prix</Text>
              <View style={s.dateRow}>
                <View style={s.dateInput}>
                  <Text style={s.dateLabel}>Minimum</Text>
                  <TextInput
                    style={s.dateField}
                    placeholder="0 €"
                    placeholderTextColor="#9CA3AF"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={s.dateSep}>–</Text>
                <View style={s.dateInput}>
                  <Text style={s.dateLabel}>Maximum</Text>
                  <TextInput
                    style={s.dateField}
                    placeholder="∞"
                    placeholderTextColor="#9CA3AF"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Apply button */}
          <View style={[s.filterFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={s.applyBtn} onPress={() => { setShowFilters(false); refetch(); }}>
              <Text style={s.applyBtnText}>Afficher les résultats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  // Header
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  logo: { fontSize: 22, fontWeight: "700", color: "#111827" },

  // Search bar
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 28, paddingHorizontal: 16, height: 48, gap: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchTextWrap: { flex: 1 },
  searchTextActive: { fontSize: 14, fontWeight: "600", color: "#111827" },
  searchTextPlaceholder: { fontSize: 14, color: "#6B7280" },
  searchSub: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  filterBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  filterBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#111827", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  filterBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff" },

  // List
  list: { padding: 16, paddingBottom: 32 },
  cardWrap: { marginBottom: 4 },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  resetText: { fontSize: 13, fontWeight: "600", color: "#111827", textDecorationLine: "underline" },

  // Search modal
  searchInputWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 16, backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 10 },
  searchModalInput: { flex: 1, fontSize: 15, color: "#111827" },
  citiesList: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
  citiesLabel: { fontSize: 12, fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  cityItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  cityIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  cityName: { fontSize: 15, fontWeight: "500", color: "#111827" },
  cityCountry: { fontSize: 12, color: "#6B7280", marginTop: 1 },

  // Filters modal
  filtersScroll: { flex: 1 },
  filterSection: { paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  filterSectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 16 },

  // Counter
  counterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  counterLabel: { fontSize: 15, fontWeight: "500", color: "#111827" },
  counterSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  counterBtns: { flexDirection: "row", alignItems: "center", gap: 14 },
  counterBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center" },
  counterBtnDisabled: { borderColor: "#E5E7EB" },
  counterBtnText: { fontSize: 18, fontWeight: "500", color: "#111827" },
  counterBtnTextDisabled: { color: "#D1D5DB" },
  counterValue: { fontSize: 16, fontWeight: "600", color: "#111827", minWidth: 24, textAlign: "center" },

  // Dates
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateInput: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: "500", color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  dateField: { backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 14, color: "#111827" },
  dateSep: { fontSize: 16, color: "#9CA3AF", marginTop: 16 },

  // Filter footer
  filterFooter: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingHorizontal: 16, paddingTop: 12 },
  applyBtn: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
