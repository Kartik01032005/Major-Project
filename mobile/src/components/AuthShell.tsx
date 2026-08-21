import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PropsWithChildren } from "react";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const colors = useThemeColors();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.brandMark, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[styles.brandMarkText, { color: colors.accent }]}>✚</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>BLOODLINK MOBILE</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  brandMark: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 48, justifyContent: "center", marginBottom: spacing.md, width: 48 },
  brandMarkText: { fontSize: 25, fontWeight: "800" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.8 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.4, lineHeight: 34, marginTop: spacing.sm },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  form: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    marginTop: spacing.xl,
    padding: spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
});
