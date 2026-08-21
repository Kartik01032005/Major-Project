import { Pressable, StyleSheet, Text } from "react-native";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  /** "primary" renders a filled accent button (e.g. Navigate); "outline" a bordered one (e.g. Call). */
  variant?: "primary" | "outline";
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityLabel,
}: ActionButtonProps) {
  const colors = useThemeColors();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.accent : "transparent",
          borderColor: isPrimary ? colors.accent : colors.border,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isPrimary ? colors.surface : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.6 },
});
