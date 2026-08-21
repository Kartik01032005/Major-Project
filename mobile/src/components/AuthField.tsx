import { StyleSheet, Text, TextInput, type TextInputProps } from "react-native";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, ...inputProps }: AuthFieldProps) {
  const colors = useThemeColors();

  return (
    <TextInput
      accessibilityLabel={label}
      placeholderTextColor={colors.muted}
      style={[styles.input, { backgroundColor: colors.surface, borderColor: error ? colors.warning : colors.border, color: colors.ink }]}
      {...inputProps}
    />
  );
}

export function AuthFieldLabel({ children }: { children: string }) {
  const colors = useThemeColors();
  return <Text style={[styles.label, { color: colors.muted }]}>{children}</Text>;
}

export function AuthError({ message }: { message: string }) {
  const colors = useThemeColors();
  return <Text style={[styles.error, { color: colors.warning }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, minHeight: 48, paddingHorizontal: spacing.md },
  error: { fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
});
