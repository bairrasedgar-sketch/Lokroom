import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabIcon from "@/components/ui/TabIcon";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          paddingTop: 6,
          paddingBottom: Platform.OS === "android" ? insets.bottom + 8 : insets.bottom || 8,
          height: Platform.OS === "android" ? 60 + insets.bottom : 52 + (insets.bottom || 8),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500", marginTop: -2 },
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
        name="favorites"
        options={{
          title: "Favoris",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="favorites" />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Voyages",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="trips" />,
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
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="profile" />,
        }}
      />
    </Tabs>
  );
}
