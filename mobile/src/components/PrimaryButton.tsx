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
    elevation: 2,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    shadowColor: "#991B1B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.65 },
  label: { fontSize: 15, fontWeight: "700", letterSpacing: -0.1 },
});
