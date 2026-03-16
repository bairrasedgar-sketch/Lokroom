import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";

const SCREEN_W = Dimensions.get("window").width;
const CARD_PAD = 16;
const IMG_W = SCREEN_W - CARD_PAD * 2;
const IMG_H = IMG_W * 0.75; // 4:3

export interface ListingCardData {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  pricePerHour?: number;
  currency: string;
  images: { url: string }[];
  averageRating?: number;
  reviewCount?: number;
  type?: string;
  isInstantBook?: boolean;
  maxGuests?: number;
  bedrooms?: number;
}

export default function ListingCard({ item }: { item: ListingCardData }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = item.images?.length ? item.images : [{ url: "" }];

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setImgIdx(viewableItems[0].index ?? 0);
  });
  const viewCfg = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderImg = useCallback(({ item: img }: { item: { url: string } }) => (
    <Image
      source={{ uri: img.url || "https://placehold.co/600x450/F3F4F6/9CA3AF?text=." }}
      style={{ width: IMG_W, height: IMG_H }}
      resizeMode="cover"
    />
  ), []);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push(`/listings/${item.id}`)}
      style={s.card}
    >
      {/* Image carousel */}
      <View style={s.imgWrap}>
        <FlatList
          data={imgs}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderImg}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewCfg.current}
          getItemLayout={(_, i) => ({ length: IMG_W, offset: IMG_W * i, index: i })}
        />

        {/* Dots */}
        {imgs.length > 1 && (
          <View style={s.dots}>
            {imgs.map((_, i) => (
              <View key={i} style={[s.dot, i === imgIdx && s.dotActive]} />
            ))}
          </View>
        )}

        {/* Instant book badge */}
        {item.isInstantBook && (
          <View style={s.badge}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={s.badgeText}>Instantané</Text>
          </View>
        )}

        {/* Favorite */}
        <TouchableOpacity style={s.fav} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#fff" strokeWidth={1.8} fill="rgba(0,0,0,0.3)" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={s.body}>
        <View style={s.row}>
          <Text style={s.title} numberOfLines={1}>{item.title}</Text>
          {item.averageRating ? (
            <View style={s.ratingRow}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="#111827">
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
              <Text style={s.rating}>{item.averageRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.location} numberOfLines={1}>{item.city}, {item.country}</Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{item.pricePerNight} {item.currency}</Text>
          <Text style={s.priceUnit}> / nuit</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 20 },
  imgWrap: { borderRadius: 24, overflow: "hidden", backgroundColor: "#F3F4F6" },
  dots: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 16, backgroundColor: "#fff" },
  badge: { position: "absolute", left: 12, top: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#111827" },
  fav: { position: "absolute", right: 12, top: 12 },
  body: { paddingTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111827", marginRight: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 13, fontWeight: "500", color: "#111827" },
  location: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  price: { fontSize: 14, fontWeight: "600", color: "#111827" },
  priceUnit: { fontSize: 13, color: "#6B7280" },
});
