import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PropsWithChildren } from "react";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

export function AppScreen({ title, subtitle, children, scroll = true }: PropsWithChildren<{ title: string; subtitle?: string; scroll?: boolean }>) {
  const colors = useThemeColors();
  const content = <View style={styles.content}><Text style={[styles.title, { color: colors.ink }]}>{title}</Text>{subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}{children}</View>;
  return <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
}

export function Surface({ children, style }: PropsWithChildren<{ style?: object }>) {
  const colors = useThemeColors();
  return <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  const colors = useThemeColors();
  return <Text style={[styles.sectionTitle, { color: colors.ink }]}>{children}</Text>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1 }, scroll: { paddingBottom: spacing.xl }, content: { padding: spacing.lg }, title: { fontSize: 30, fontWeight: "800", lineHeight: 36 }, subtitle: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm }, surface: { borderRadius: 16, borderWidth: 1, marginTop: spacing.lg, padding: spacing.md }, sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: spacing.xl } });