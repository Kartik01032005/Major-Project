import { useColorScheme } from "react-native";

import { themeColors, type ThemeColors } from "./colors";

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return themeColors[colorScheme === "dark" ? "dark" : "light"];
}