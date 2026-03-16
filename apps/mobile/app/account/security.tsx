import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, Stack } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function fetchSecurityStatus() {
  const { data } = await api.get("/api/account/security/status");
  return data;
}

export default function AccountSecurityScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["security-status"],
    queryFn: fetchSecurityStatus,
  });

  const disable2FAMutation = useMutation({
    mutationFn: (code: string) => api.post("/auth/2fa/disable", { code }),
    onSuccess: () => { refetch(); Alert.alert("Succès", "2FA désactivé"); },
    onError: (err: any) => Alert.alert("Erreur", err.response?.data?.error || "Impossible"),
  });

  const handleToggle2FA = () => {
    if (data?.twoFactorEnabled) {
      Alert.prompt("Désactiver 2FA", "Entre ton code 2FA pour confirmer", (code) => {
        if (code) disable2FAMutation.mutate(code);
      });
    } else {
      router.push("/account/2fa-setup");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Sécurité", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentification</Text>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>🔐</Text>
                  <View>
                    <Text style={styles.rowLabel}>Double authentification (2FA)</Text>
                    <Text style={styles.rowDesc}>
                      {data?.twoFactorEnabled ? "Activé" : "Désactivé"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={data?.twoFactorEnabled || false}
                  onValueChange={handleToggle2FA}
                  trackColor={{ true: "#2563EB" }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mot de passe</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => router.push("/account/change-password")}
              >
                <Text style={styles.btnIcon}>🔑</Text>
                <Text style={styles.btnLabel}>Changer le mot de passe</Text>
                <Text style={styles.btnArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessions</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  Alert.alert(
                    "Déconnecter toutes les sessions",
                    "Tu seras déconnecté de tous tes appareils.",
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Confirmer",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await api.post("/api/account/security/refresh-identity");
                            Alert.alert("Succès", "Toutes les sessions ont été révoquées");
                          } catch {
                            Alert.alert("Erreur", "Impossible de révoquer les sessions");
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.btnIcon}>📱</Text>
                <Text style={styles.btnLabel}>Déconnecter tous les appareils</Text>
                <Text style={styles.btnArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Données</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={async () => {
                  try {
                    await api.post("/api/account/export");
                    Alert.alert("Succès", "Export en cours, tu recevras un email");
                  } catch {
                    Alert.alert("Erreur", "Export impossible");
                  }
                }}
              >
                <Text style={styles.btnIcon}>📦</Text>
                <Text style={styles.btnLabel}>Exporter mes données</Text>
                <Text style={styles.btnArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnDanger]}
                onPress={() => {
                  Alert.alert(
                    "Supprimer mon compte",
                    "Cette action est irréversible. Toutes tes données seront supprimées.",
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await api.delete("/api/account/delete");
                            router.replace("/(auth)/login");
                          } catch {
                            Alert.alert("Erreur", "Suppression impossible");
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.btnIcon}>🗑️</Text>
                <Text style={[styles.btnLabel, styles.btnLabelDanger]}>Supprimer mon compte</Text>
                <Text style={styles.btnArrow}>›</Text>
              </TouchableOpacity>
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
  rowLabel: { fontSize: 15, fontWeight: "500", color: "#111827" },
  rowDesc: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  btn: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  btnDanger: {},
  btnIcon: { fontSize: 22, marginRight: 14 },
  btnLabel: { flex: 1, fontSize: 15, color: "#111827" },
  btnLabelDanger: { color: "#DC2626" },
  btnArrow: { fontSize: 20, color: "#D1D5DB" },
});
