import { Tabs } from "expo-router";
import TabIcon from "@/components/ui/TabIcon";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          paddingTop: 8,
          paddingBottom: 6,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explorer",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="explore" />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="messages" />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Réservations",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="bookings" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="profile" />,
        }}
      />
    </Tabs>
  );
}
