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
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const loadUser = useAuthStore((s) => s.loadUser);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/mobile/register", {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });
      await SecureStore.setItemAsync("access_token", data.token);
      await loadUser();
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.error || "Inscription impossible");
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
      <View style={styles.topBar}>
        <View style={styles.swipeHandle} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.dismiss()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Lok'Room</Text>
        <Text style={styles.subtitle}>Crée ton compte</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom complet"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />
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
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#9CA3AF"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
            Se connecter
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  topBar: { paddingTop: 12, paddingHorizontal: 16, alignItems: "center", position: "relative" },
  swipeHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", marginBottom: 8 },
  closeBtn: { position: "absolute", right: 16, top: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  closeBtnText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  inner: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 20 },
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
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#6B7280", fontSize: 14 },
  footerLink: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
});
