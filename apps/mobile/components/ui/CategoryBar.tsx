import { useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path, Rect, Circle, Ellipse } from "react-native-svg";

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "HOUSE", label: "Maison" },
  { value: "APARTMENT", label: "Appart." },
  { value: "ROOM", label: "Chambre" },
  { value: "STUDIO", label: "Studio" },
  { value: "OFFICE", label: "Bureau" },
  { value: "COWORKING", label: "Cowork." },
  { value: "MEETING_ROOM", label: "Réunion" },
  { value: "EVENT_SPACE", label: "Événem." },
  { value: "RECORDING_STUDIO", label: "Studio E." },
  { value: "PARKING", label: "Parking" },
  { value: "GARAGE", label: "Garage" },
  { value: "STORAGE", label: "Stockage" },
];

function CatIcon({ name, color }: { name: string; color: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const };
  const sp = { stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "HOUSE":
      return <Svg {...p}><Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" {...sp} /><Path d="M9 21V12h6v9" {...sp} /></Svg>;
    case "APARTMENT":
      return <Svg {...p}><Rect x="3" y="3" width="18" height="18" rx="2" {...sp} /><Path d="M9 3v18M3 9h18M3 15h18" {...sp} /></Svg>;
    case "ROOM":
      return <Svg {...p}><Path d="M3 10V19M21 10V19M3 14h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3" {...sp} /></Svg>;
    case "STUDIO":
      return <Svg {...p}><Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" {...sp} /><Rect x="8" y="13" width="8" height="8" rx="1" {...sp} /></Svg>;
    case "OFFICE":
      return <Svg {...p}><Rect x="2" y="14" width="20" height="3" rx="1" {...sp} /><Path d="M6 17v3M18 17v3M8 14V9h8v5" {...sp} /></Svg>;
    case "COWORKING":
      return <Svg {...p}><Path d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" {...sp} /></Svg>;
    case "MEETING_ROOM":
      return <Svg {...p}><Rect x="3" y="4" width="18" height="14" rx="2" {...sp} /><Path d="M7 22h10M12 18v4" {...sp} /></Svg>;
    case "EVENT_SPACE":
      return <Svg {...p}><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...sp} /></Svg>;
    case "RECORDING_STUDIO":
      return <Svg {...p}><Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" {...sp} /><Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" {...sp} /></Svg>;
    case "PARKING":
      return <Svg {...p}><Path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0M15 17a2 2 0 104 0" {...sp} /></Svg>;
    case "GARAGE":
      return <Svg {...p}><Path d="M3 21V8l9-5 9 5v13" {...sp} /><Rect x="6" y="13" width="12" height="8" rx="1" {...sp} /><Path d="M6 17h12" {...sp} /></Svg>;
    case "STORAGE":
      return <Svg {...p}><Path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 0L12 11M4 7l8 4" {...sp} /></Svg>;
    default:
      return <Svg {...p}><Circle cx="12" cy="12" r="9" {...sp} /><Path d="M8 12h8M12 8v8" {...sp} /></Svg>;
  }
}

type Props = {
  active: string;
  onChange: (v: string) => void;
};

export default function CategoryBar({ active, onChange }: Props) {
  return (
    <View style={s.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() => onChange(cat.value)}
              style={[s.item, isActive && s.itemActive]}
              activeOpacity={0.7}
            >
              {cat.value === "" ? (
                <View style={[s.allIcon, isActive && s.allIconActive]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 6h16M4 12h16M4 18h16" stroke={isActive ? "#fff" : "#6B7280"} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
              ) : (
                <CatIcon name={cat.value} color={isActive ? "#111827" : "#9CA3AF"} />
              )}
              <Text style={[s.label, isActive && s.labelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  scroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  item: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 56 },
  itemActive: { borderBottomWidth: 2, borderBottomColor: "#111827" },
  allIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  allIconActive: { backgroundColor: "#111827" },
  label: { fontSize: 10, fontWeight: "500", color: "#9CA3AF", marginTop: 4 },
  labelActive: { color: "#111827", fontWeight: "600" },
});
