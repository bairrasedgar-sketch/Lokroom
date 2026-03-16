import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Listing {
  id: string;
  title: string;
  city: string;
  pricePerNight: number;
  currency: string;
  status: string;
  images: { url: string }[];
}

async function fetchHostListings() {
  const { data } = await api.get("/host/listings");
  return data.listings as Listing[];
}

const STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "#10B981" },
  INACTIVE: { label: "Inactive", color: "#9CA3AF" },
  PENDING: { label: "En attente", color: "#F59E0B" },
};

export default function HostListingsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["host-listings"],
    queryFn: fetchHostListings,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/listings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["host-listings"] }),
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Suppression impossible"),
  });

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Supprimer", `Supprimer "${title}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Mes annonces",
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/host/listings/new")} style={{ marginRight: 16 }}>
              <Text style={{ color: "#2563EB", fontSize: 16, fontWeight: "600" }}>+ Ajouter</Text>
            </TouchableOpacity>
          ),
        }}
      />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          renderItem={({ item }) => {
            const s = STATUS[item.status] || { label: item.status, color: "#6B7280" };
            return (
              <View style={styles.card}>
                <Image
                  source={{ uri: item.images[0]?.url || "https://placehold.co/400x160" }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.body}>
                  <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.badge, { backgroundColor: s.color + "20" }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.location}>{item.city}</Text>
                  <Text style={styles.price}>{item.pricePerNight} {item.currency} / nuit</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => router.push(`/listings/${item.id}/edit`)}
                    >
                      <Text style={styles.editBtnText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id, item.title)}
                    >
                      <Text style={styles.deleteBtnText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyText}>Aucune annonce</Text>
              <TouchableOpacity onPress={() => router.push("/host/listings/new")}>
                <Text style={styles.emptyLink}>Créer ma première annonce</Text>
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
  card: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  image: { width: "100%", height: 160 },
  body: { padding: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827", marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  location: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  price: { fontSize: 14, fontWeight: "600", color: "#2563EB", marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8 },
  editBtn: { flex: 1, backgroundColor: "#EFF6FF", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  editBtnText: { color: "#2563EB", fontWeight: "600", fontSize: 14 },
  deleteBtn: { flex: 1, backgroundColor: "#FEF2F2", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  deleteBtnText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280", marginBottom: 12 },
  emptyLink: { fontSize: 15, color: "#2563EB", fontWeight: "600" },
});
