import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  ViewToken,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import Svg, { Path } from "react-native-svg";

const W = Dimensions.get("window").width;
const IMG_H = W * 0.75;

interface ListingDetail {
  id: string;
  title: string;
  description?: string;
  city: string;
  country: string;
  type: string;
  pricePerNight: number;
  pricePerHour?: number;
  currency: string;
  images: { url: string }[];
  averageRating?: number;
  reviewCount?: number;
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  isInstantBook?: boolean;
  amenities?: string[];
  owner?: { id: string; name: string; image?: string; createdAt?: string };
  spaceDescription?: string;
  guestAccessDescription?: string;
  neighborhoodDescription?: string;
  highlights?: string[];
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [imgIdx, setImgIdx] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`);
      return (data.listing || data) as ListingDetail;
    },
  });

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setImgIdx(viewableItems[0].index ?? 0);
  });
  const viewCfg = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderImg = useCallback(({ item: img }: { item: { url: string } }) => (
    <Image source={{ uri: img.url }} style={{ width: W, height: IMG_H }} resizeMode="cover" />
  ), []);

  if (isLoading || !listing) {
    return (
      <View style={[s.loadWrap, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  const imgs = listing.images?.length ? listing.images : [{ url: "https://placehold.co/600x450/F3F4F6/9CA3AF?text=." }];
  const desc = listing.description || listing.spaceDescription || "";
  const shortDesc = desc.length > 200 ? desc.slice(0, 200) + "..." : desc;

  const details = [
    listing.maxGuests && { label: `${listing.maxGuests} voyageurs` },
    listing.bedrooms && { label: `${listing.bedrooms} chambre${listing.bedrooms > 1 ? "s" : ""}` },
    listing.beds && { label: `${listing.beds} lit${listing.beds > 1 ? "s" : ""}` },
    listing.bathrooms && { label: `${listing.bathrooms} salle${listing.bathrooms > 1 ? "s" : ""} de bain` },
  ].filter(Boolean) as { label: string }[];

  return (
    <View style={s.container}>
      {/* Sticky header */}
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => router.back()}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#111827" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#111827" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#111827" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={s.gallery}>
          <FlatList
            data={imgs}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderImg}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewCfg.current}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          />
          {imgs.length > 1 && (
            <View style={s.counter}>
              <Text style={s.counterText}>{imgIdx + 1} / {imgs.length}</Text>
            </View>
          )}
        </View>

        <View style={s.content}>
          {/* Title */}
          <View style={s.section}>
            <Text style={s.title}>{listing.title}</Text>
            <Text style={s.subtitle}>
              {listing.type}{listing.city ? ` · ${listing.city}` : ""}
              {listing.maxGuests ? ` · ${listing.maxGuests} voyageurs` : ""}
            </Text>
            {listing.averageRating ? (
              <View style={s.ratingRow}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="#111827">
                  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </Svg>
                <Text style={s.ratingText}>{listing.averageRating.toFixed(1)}</Text>
                {listing.reviewCount ? <Text style={s.reviewCount}>({listing.reviewCount} avis)</Text> : null}
              </View>
            ) : null}
          </View>

          {/* Host */}
          {listing.owner && (
            <View style={s.section}>
              <View style={s.hostRow}>
                {listing.owner.image ? (
                  <Image source={{ uri: listing.owner.image }} style={s.hostAvatar} />
                ) : (
                  <View style={s.hostAvatarPlaceholder}>
                    <Text style={s.hostInitial}>{listing.owner.name?.[0]?.toUpperCase() || "?"}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.hostName}>Hébergé par {listing.owner.name}</Text>
                  {listing.owner.createdAt && (
                    <Text style={s.hostSince}>Hôte depuis {new Date(listing.owner.createdAt).getFullYear()}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Details grid */}
          {details.length > 0 && (
            <View style={s.section}>
              <View style={s.detailsGrid}>
                {details.map((d, i) => (
                  <View key={i} style={s.detailItem}>
                    <View style={s.detailIcon}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                    <Text style={s.detailText}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {desc ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.descText}>{showFullDesc ? desc : shortDesc}</Text>
              {desc.length > 200 && (
                <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                  <Text style={s.showMore}>{showFullDesc ? "Voir moins" : "Voir plus"}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Équipements</Text>
              <View style={s.amenitiesGrid}>
                {listing.amenities.slice(0, 8).map((a, i) => (
                  <View key={i} style={s.amenityItem}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={s.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
              {listing.amenities.length > 8 && (
                <Text style={s.showMore}>+{listing.amenities.length - 8} équipements</Text>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Booking footer */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <View style={s.priceRow}>
            <Text style={s.footerPrice}>{listing.pricePerNight} {listing.currency}</Text>
            <Text style={s.footerPriceUnit}> / nuit</Text>
          </View>
          {listing.averageRating ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="#111827">
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>{listing.averageRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={s.bookBtn} onPress={() => router.push({ pathname: "/bookings/new", params: { listingId: listing.id } })}>
          <Text style={s.bookBtnText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "rgba(255,255,255,0.95)" },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  headerRight: { flexDirection: "row", gap: 8 },
  scroll: { flex: 1 },
  gallery: { backgroundColor: "#F3F4F6" },
  counter: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  content: { paddingHorizontal: 16 },
  section: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "600", color: "#111827", lineHeight: 28 },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  reviewCount: { fontSize: 13, color: "#6B7280" },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  hostAvatar: { width: 48, height: 48, borderRadius: 24 },
  hostAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#111827", justifyContent: "center", alignItems: "center" },
  hostInitial: { fontSize: 18, fontWeight: "700", color: "#fff" },
  hostName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  hostSince: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8, width: "46%" },
  detailIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  detailText: { fontSize: 13, color: "#374151" },
  descText: { fontSize: 14, color: "#4B5563", lineHeight: 22 },
  showMore: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 8, textDecorationLine: "underline" },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "46%", marginBottom: 4 },
  amenityText: { fontSize: 13, color: "#374151" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E7EB", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 5 },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  footerPrice: { fontSize: 18, fontWeight: "700", color: "#111827" },
  footerPriceUnit: { fontSize: 14, color: "#6B7280" },
  bookBtn: { backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  bookBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
