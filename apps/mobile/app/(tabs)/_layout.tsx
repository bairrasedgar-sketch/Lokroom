import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingBottom: 4 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explorer",
          tabBarIcon: ({ focused }) => <TabIcon emoji={focused ? "🏠" : "🏡"} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: () => <TabIcon emoji="💬" />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Réservations",
          tabBarIcon: () => <TabIcon emoji="📅" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
