import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (result.requires2FA) {
        router.push({ pathname: "/(auth)/2fa", params: { tempToken: (result as any).tempToken } });
      } else {
        router.dismiss();
      }
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.error || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      {/* Barre de swipe + croix */}
      <View style={styles.topBar}>
        <View style={styles.swipeHandle} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.dismiss()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inner}>
        <Text style={styles.logo}>Lok'Room</Text>
        <Text style={styles.subtitle}>Connecte-toi à ton compte</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Mot de passe oublié ?
        </Link>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/(auth)/register" style={styles.footerLink}>
            S'inscrire
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  topBar: { paddingTop: 12, paddingHorizontal: 16, alignItems: "center", position: "relative" },
  swipeHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", marginBottom: 8 },
  closeBtn: { position: "absolute", right: 16, top: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  closeBtnText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logo: { fontSize: 32, fontWeight: "700", color: "#2563EB", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  forgotLink: { color: "#2563EB", fontSize: 14, textAlign: "right", marginBottom: 24 },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#6B7280", fontSize: 14 },
  footerLink: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
});
