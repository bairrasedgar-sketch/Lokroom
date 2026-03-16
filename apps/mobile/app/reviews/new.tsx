import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewReviewScreen() {
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post("/reviews", { bookingId, rating, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      Alert.alert("Merci !", "Ton avis a été publié.");
      router.back();
    },
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Impossible de publier"),
  });

  return (
    <>
      <Stack.Screen options={{ title: "Laisser un avis", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.title}>Comment s'est passé ton séjour ?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent"][rating]}
        </Text>

        <Text style={styles.label}>Ton commentaire</Text>
        <TextInput
          style={styles.textarea}
          value={comment}
          onChangeText={setComment}
          placeholder="Décris ton expérience..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{comment.length}/1000</Text>

        <TouchableOpacity
          style={[styles.submitBtn, !comment.trim() && styles.submitBtnDisabled]}
          onPress={() => mutation.mutate()}
          disabled={!comment.trim() || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Publier l'avis</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 24, textAlign: "center" },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 },
  star: { fontSize: 40, color: "#E5E7EB" },
  starActive: { color: "#F59E0B" },
  ratingLabel: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 28, height: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  textarea: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 15, color: "#111827", backgroundColor: "#F9FAFB", height: 140, textAlignVertical: "top" },
  charCount: { fontSize: 12, color: "#9CA3AF", textAlign: "right", marginTop: 4, marginBottom: 24 },
  submitBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  submitBtnDisabled: { backgroundColor: "#BFDBFE" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
