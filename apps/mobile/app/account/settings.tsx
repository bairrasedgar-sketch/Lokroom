import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function fetchPrefs() {
  const { data } = await api.get("/prefs");
  return data;
}

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["prefs"], queryFn: fetchPrefs });
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const mutation = useMutation({
    mutationFn: (prefs: any) => api.patch("/prefs", prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prefs"] });
      Alert.alert("Succès", "Paramètres enregistrés");
    },
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Impossible"),
  });

  return (
    <>
      <Stack.Screen options={{ title: "Paramètres", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>📧</Text>
                  <Text style={styles.rowLabel}>Notifications email</Text>
                </View>
                <Switch
                  value={data?.emailNotifications ?? emailNotifs}
                  onValueChange={(v) => {
                    setEmailNotifs(v);
                    mutation.mutate({ emailNotifications: v });
                  }}
                  trackColor={{ true: "#2563EB" }}
                />
              </View>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>🔔</Text>
                  <Text style={styles.rowLabel}>Notifications push</Text>
                </View>
                <Switch
                  value={data?.pushNotifications ?? pushNotifs}
                  onValueChange={(v) => {
                    setPushNotifs(v);
                    mutation.mutate({ pushNotifications: v });
                  }}
                  trackColor={{ true: "#2563EB" }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Langue & Région</Text>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>🌍</Text>
                  <Text style={styles.rowLabel}>Langue</Text>
                </View>
                <Text style={styles.rowValue}>Français</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>💱</Text>
                  <Text style={styles.rowLabel}>Devise</Text>
                </View>
                <Text style={styles.rowValue}>{data?.currency || "EUR"}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>📱</Text>
                  <Text style={styles.rowLabel}>Version</Text>
                </View>
                <Text style={styles.rowValue}>1.0.0</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: {},
  section: { backgroundColor: "#fff", marginBottom: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowIcon: { fontSize: 22, marginRight: 14 },
  rowLabel: { fontSize: 15, color: "#111827" },
  rowValue: { fontSize: 14, color: "#6B7280" },
});
