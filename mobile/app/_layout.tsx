import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useThemeColors } from "../src/theme/useThemeColors";

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
