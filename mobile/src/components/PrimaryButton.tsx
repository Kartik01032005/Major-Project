import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled = false }: PrimaryButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.accent }, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {disabled ? <ActivityIndicator color={colors.surface} /> : <Text style={[styles.label, { color: colors.surface }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.65 },
  label: { fontSize: 16, fontWeight: "700" },
});
