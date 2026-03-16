import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabIcon from "@/components/ui/TabIcon";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F43F5E",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 8,
          paddingBottom: bottomPad,
          height: 56 + bottomPad,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
        tabBarHideOnKeyboard: true,
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
