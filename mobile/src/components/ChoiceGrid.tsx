import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";

export function ChoiceGrid({ options, value, onChange }: { options: readonly string[]; value: string | undefined; onChange: (value: string) => void }) {
  const colors = useThemeColors();
  return <View style={styles.grid}>{options.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: value === option }} onPress={() => onChange(option)} style={[styles.choice, { backgroundColor: value === option ? colors.accent : colors.surfaceMuted, borderColor: value === option ? colors.accent : colors.border }]}><Text style={[styles.choiceText, { color: value === option ? colors.surface : colors.ink }]}>{option}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }, choice: { alignItems: "center", borderRadius: 10, borderWidth: 1, minWidth: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, choiceText: { fontSize: 14, fontWeight: "800" } });