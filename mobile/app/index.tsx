import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../src/context/AuthContext";
import { useThemeColors } from "../src/theme/useThemeColors";

export default function IndexScreen() {
  const colors = useThemeColors();
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") {
    return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }

  return <Redirect href={isAuthenticated ? "/(protected)" : "/(auth)/login"} />;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
});
