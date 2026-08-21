import { StyleSheet, Text, View } from "react-native";

import type { AvailabilityThresholds } from "../types/userFeatures";
import { useThemeColors } from "../theme/useThemeColors";

const fallback: AvailabilityThresholds = { highlyAvailable: 200, veryHigh: 150, high: 100, good: 70, available: 50, moderate: 30, low: 15, veryLow: 10, critical: 5, almostEmpty: 0 };

export function getInventoryStatus(units: number, thresholds: AvailabilityThresholds | null) {
  const t = thresholds ?? fallback;
  if (units >= t.highlyAvailable) return { label: "1. Highly Available", color: "#059669", width: "100%" as const };
  if (units >= t.veryHigh) return { label: "2. Very High", color: "#10B981", width: "90%" as const };
  if (units >= t.high) return { label: "3. High", color: "#14B8A6", width: "80%" as const };
  if (units >= t.good) return { label: "4. Good", color: "#2563EB", width: "70%" as const };
  if (units >= t.available) return { label: "5. Available", color: "#3B82F6", width: "60%" as const };
  if (units >= t.moderate) return { label: "6. Moderate", color: "#6366F1", width: "50%" as const };
  if (units >= t.low) return { label: "7. Low", color: "#F59E0B", width: "35%" as const };
  if (units >= t.veryLow) return { label: "8. Very Low", color: "#F97316", width: "20%" as const };
  if (units >= t.critical) return { label: "9. Critical", color: "#EF4444", width: "10%" as const };
  return { label: "10. Almost Empty", color: "#E11D48", width: "5%" as const };
}

export function InventoryStatus({ units, thresholds }: { units: number; thresholds: AvailabilityThresholds | null }) {
  const colors = useThemeColors();
  const status = getInventoryStatus(units, thresholds);
  return <View style={styles.wrap}><View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.fill, { backgroundColor: status.color, width: status.width }]} /></View><Text style={[styles.label, { color: status.color }]}>{status.label}</Text></View>;
}

const styles = StyleSheet.create({ wrap: { gap: 6 }, track: { borderRadius: 999, height: 8, overflow: "hidden" }, fill: { borderRadius: 999, height: "100%" }, label: { fontSize: 12, fontWeight: "800" } });
