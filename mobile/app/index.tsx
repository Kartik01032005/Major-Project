import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../src/components/PrimaryButton";
import { apiClient } from "../src/services/apiClient";
import { spacing } from "../src/theme/spacing";
import { useThemeColors } from "../src/theme/useThemeColors";
import type { HealthResponse } from "../src/types/api";

export default function HomeScreen() {
  const colors = useThemeColors();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkApiHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setHealth(await apiClient.getHealth());
    } catch (requestError) {
      setHealth(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to reach the BloodLink API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    void apiClient
      .getHealth()
      .then((response) => {
        if (isActive) {
          setHealth(response);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(requestError instanceof Error ? requestError.message : "Unable to reach the BloodLink API.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
          <Text style={[styles.brandMarkText, { color: colors.surface }]}>+</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>BLOODLINK MOBILE</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Ready when every second matters.</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Sprint 1 foundation for the shared BloodLink platform.
        </Text>

        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>API CONNECTION</Text>
            <View style={[styles.dot, { backgroundColor: health ? colors.success : colors.warning }]} />
          </View>
          <Text style={[styles.statusText, { color: colors.ink }]}>
            {isLoading ? "Checking the BloodLink server..." : health?.message ?? "Server unavailable"}
          </Text>
          {error ? <Text style={[styles.errorText, { color: colors.warning }]}>{error}</Text> : null}
        </View>

        <PrimaryButton label="Check connection" onPress={() => void checkApiHealth()} disabled={isLoading} />
        <Pressable accessibilityRole="button" onPress={() => void checkApiHealth()} style={styles.secondaryAction}>
          <Text style={[styles.secondaryActionText, { color: colors.accent }]}>Refresh status</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: spacing.xl },
  brandMark: {
    alignItems: "center",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: spacing.lg,
    width: 56,
  },
  brandMarkText: { fontSize: 34, fontWeight: "700" },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  title: { fontSize: 38, fontWeight: "800", lineHeight: 44, marginTop: spacing.sm },
  subtitle: { fontSize: 16, lineHeight: 24, marginTop: spacing.md },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: spacing.xl,
    padding: spacing.lg,
  },
  statusHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  dot: { borderRadius: 5, height: 10, width: 10 },
  statusText: { fontSize: 16, fontWeight: "600", lineHeight: 23, marginTop: spacing.md },
  errorText: { fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  secondaryAction: { alignItems: "center", marginTop: spacing.md, padding: spacing.sm },
  secondaryActionText: { fontSize: 14, fontWeight: "700" },
});
