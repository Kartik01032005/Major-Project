import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View, type ColorValue } from "react-native";

import { useAuth } from "../../src/context/AuthContext";
import { useThemeColors } from "../../src/theme/useThemeColors";

export default function ProtectedLayout() {
  const colors = useThemeColors();
  const { isAuthenticated, status, user } = useAuth();

  if (status === "loading") {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: styles.tabLabel, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 8 } }}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="⌂" /> }} />
    <Tabs.Screen name="notifications" options={{ title: "Alerts", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="●" /> }} />
    <Tabs.Screen name="nearby" options={{ title: "Nearby", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="⌖" /> }} />
    <Tabs.Screen name="history" options={{ title: "Requests", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="≡" /> }} />
    <Tabs.Screen name="emergency" options={{ title: "Emergency", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="!" /> }} />
    <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="●" /> }} />
    <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <TabIcon color={color} glyph="◉" /> }} />
    <Tabs.Screen name="admin" options={{ title: "Admin", href: user?.role === "admin" ? undefined : null }} />
    <Tabs.Screen name="inventory" options={{ title: "Inventory", href: null }} />
    <Tabs.Screen name="admin-requests" options={{ title: "Review", href: null }} />
    <Tabs.Screen name="admin-hospitals" options={{ title: "Hospitals", href: null }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  tabIcon: { fontSize: 18, fontWeight: "800" },
  tabLabel: { fontSize: 10, fontWeight: "700" },
});

function TabIcon({ color, glyph }: { color: ColorValue; glyph: string }) {
  return <Text style={[styles.tabIcon, { color }]}>{glyph}</Text>;
}
