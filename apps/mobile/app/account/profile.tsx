import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function fetchProfile() {
  const { data } = await api.get("/me");
  return data;
}

export default function AccountProfileScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const loadUser = useAuthStore((s) => s.loadUser);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  const updateMutation = useMutation({
    mutationFn: () => api.patch("/me", { name: name || profile?.name, bio: bio || profile?.bio, phone: phone || profile?.phone }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      await loadUser();
      Alert.alert("Succès", "Profil mis à jour");
    },
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Mise à jour impossible"),
  });

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mon profil", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.avatarSection}>
          {profile?.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.changeAvatarBtn}>
            <Text style={styles.changeAvatarText}>Changer la photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            value={name || profile?.name || ""}
            onChangeText={setName}
            placeholder="Ton nom"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profile?.email || ""}
            editable={false}
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone || profile?.phone || ""}
            onChangeText={setPhone}
            placeholder="+33 6 00 00 00 00"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={bio || profile?.bio || ""}
            onChangeText={setBio}
            placeholder="Parle un peu de toi..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {},
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarSection: { alignItems: "center", paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: "700", color: "#2563EB" },
  changeAvatarBtn: {},
  changeAvatarText: { color: "#2563EB", fontSize: 15, fontWeight: "600" },
  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: "#111827", backgroundColor: "#F9FAFB" },
  inputDisabled: { color: "#9CA3AF", backgroundColor: "#F3F4F6" },
  inputMultiline: { height: 100, textAlignVertical: "top", paddingTop: 12 },
  saveBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
