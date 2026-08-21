import { Pressable, StyleSheet, Text } from "react-native";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function SecondaryButton({ label, onPress }: SecondaryButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  label: { fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.75 },
});
