import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TwoFAScreen() {
  const insets = useSafeAreaInsets();
  const { tempToken } = useLocalSearchParams<{ tempToken: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const verify2FA = useAuthStore((s) => s.verify2FA);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert("Erreur", "Entre le code à 6 chiffres");
      return;
    }
    setLoading(true);
    try {
      await verify2FA(code, tempToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.error || "Code invalide");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.back, { top: insets.top + 12 }]} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.inner}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Vérification en 2 étapes</Text>
        <Text style={styles.desc}>
          Entre le code à 6 chiffres de ton application d'authentification.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
        />

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Vérifier</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  back: { position: "absolute", left: 24, zIndex: 1 },
  backText: { color: "#2563EB", fontSize: 16 },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  icon: { fontSize: 48, textAlign: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" },
  desc: { fontSize: 15, color: "#6B7280", marginBottom: 32, lineHeight: 22, textAlign: "center" },
  input: {
    borderWidth: 2,
    borderColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
    letterSpacing: 8,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
