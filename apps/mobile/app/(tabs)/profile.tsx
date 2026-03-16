import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth";

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function GuestProfile() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>
      <View style={styles.guestCard}>
        <View style={styles.guestAvatarPlaceholder}>
          <Text style={styles.guestAvatarIcon}>👤</Text>
        </View>
        <Text style={styles.guestTitle}>Connecte-toi à Lok'Room</Text>
        <Text style={styles.guestSubtitle}>
          Accède à tes réservations, messages et bien plus.
        </Text>
        <TouchableOpacity
          style={styles.guestLoginBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.guestLoginBtnText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.guestRegisterBtn}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.guestRegisterBtnText}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) return <GuestProfile />;

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: async () => {
        await logout();
      }},
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: "👤", label: "Mon profil", onPress: () => router.push("/account/profile") },
    { icon: "🏠", label: "Mes annonces", onPress: () => router.push("/host/listings") },
    { icon: "📊", label: "Dashboard hôte", onPress: () => router.push("/host/dashboard") },
    { icon: "💳", label: "Portefeuille", onPress: () => router.push("/host/wallet") },
    { icon: "❤️", label: "Favoris", onPress: () => router.push("/favorites") },
    { icon: "🔔", label: "Notifications", onPress: () => router.push("/notifications") },
    { icon: "🔒", label: "Sécurité", onPress: () => router.push("/account/security") },
    { icon: "⚙️", label: "Paramètres", onPress: () => router.push("/account/settings") },
    { icon: "🚪", label: "Déconnexion", onPress: handleLogout, danger: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatarWrap}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || "?"}</Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.role === "HOST" || user?.role === "BOTH" ? (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>🏠 Hôte</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
              {item.label}
            </Text>
            {!item.danger && <Text style={styles.menuArrow}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: {},
  header: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  guestCard: { backgroundColor: "#fff", alignItems: "center", paddingVertical: 48, paddingHorizontal: 32, marginTop: 24, marginHorizontal: 16, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  guestAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  guestAvatarIcon: { fontSize: 36 },
  guestTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" },
  guestSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 28, lineHeight: 20 },
  guestLoginBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 12 },
  guestLoginBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  guestRegisterBtn: { borderWidth: 1.5, borderColor: "#2563EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center" },
  guestRegisterBtnText: { color: "#2563EB", fontSize: 16, fontWeight: "600" },
  userCard: { backgroundColor: "#fff", alignItems: "center", paddingVertical: 28, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#2563EB" },
  userName: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  hostBadge: { backgroundColor: "#DBEAFE", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  hostBadgeText: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  menu: { backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuIcon: { fontSize: 20, marginRight: 14, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, color: "#111827" },
  menuLabelDanger: { color: "#EF4444" },
  menuArrow: { fontSize: 20, color: "#D1D5DB" },
});
