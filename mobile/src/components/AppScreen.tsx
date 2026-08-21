import { SafeAreaView, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { PropsWithChildren } from "react";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

export function AppScreen({ title, subtitle, children, scroll = true }: PropsWithChildren<{ title: string; subtitle?: string; scroll?: boolean }>) {
  const colors = useThemeColors();
  const content = <View style={styles.content}><Text style={[styles.title, { color: colors.ink }]}>{title}</Text>{subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}{children}</View>;
  return <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surfaceMuted }]}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
}

export function Surface({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const colors = useThemeColors();
  return <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  const colors = useThemeColors();
  return <Text style={[styles.sectionTitle, { color: colors.ink }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4, lineHeight: 30 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  surface: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    marginTop: spacing.lg,
    padding: spacing.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: spacing.xl },
});