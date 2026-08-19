import { Redirect, Stack } from "expo-router";
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

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({ loading: { alignItems: "center", flex: 1, justifyContent: "center" } });
