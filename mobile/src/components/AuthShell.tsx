import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PropsWithChildren } from "react";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const colors = useThemeColors();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
          <Text style={[styles.brandMarkText, { color: colors.surface }]}>+</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>BLOODLINK MOBILE</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
        <View style={styles.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing.lg },
  brandMark: { alignItems: "center", borderRadius: 18, height: 48, justifyContent: "center", marginBottom: spacing.md, width: 48 },
  brandMarkText: { fontSize: 30, fontWeight: "700" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.8 },
  title: { fontSize: 32, fontWeight: "800", lineHeight: 38, marginTop: spacing.sm },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
});
