import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { AuthProvider } from "../src/context/AuthContext";
import { NotificationProvider, NotificationTapBridge } from "../src/context/NotificationContext";
import { useThemeColors } from "../src/theme/useThemeColors";

export default function RootLayout() {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationTapBridge />
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.ink,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}
