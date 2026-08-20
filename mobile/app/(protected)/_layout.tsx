import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../../src/context/AuthContext";
import { useThemeColors } from "../../src/theme/useThemeColors";

export default function ProtectedLayout() {
  const colors = useThemeColors();
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
    <Tabs.Screen name="index" options={{ title: "Home" }} />
    <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
    <Tabs.Screen name="nearby" options={{ title: "Nearby" }} />
    <Tabs.Screen name="history" options={{ title: "Requests" }} />
    <Tabs.Screen name="emergency" options={{ title: "Emergency" }} />
    <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    <Tabs.Screen name="account" options={{ title: "Account" }} />
  </Tabs>;
}

const styles = StyleSheet.create({ loading: { alignItems: "center", flex: 1, justifyContent: "center" } });
