import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppScreen, SectionTitle, Surface } from "../../src/components/AppScreen";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { emergencyService } from "../../src/services/emergencyService";
import { requestBelongsToUser, type EmergencyRequest } from "../../src/types/userFeatures";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { Link } from "expo-router";
import { useEffect, useState } from "react";

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void emergencyService.list().then(setRequests).catch((requestError: unknown) => setError(getApiErrorMessage(requestError))).finally(() => setLoading(false));
  }, []);

  if (!user) {
    return <ActivityIndicator color={colors.accent} size="large" />;
  }
  const ownRequests = requests.filter((request) => requestBelongsToUser(request, user));

  return <AppScreen title={`Hello, ${user.name.split(" ")[0]}.`} subtitle="Your blood donation profile, requests, and account in one place.">
    <Surface style={styles.hero}><View style={[styles.bloodBadge, { backgroundColor: colors.accent }]}><Text style={[styles.bloodText, { color: colors.surface }]}>{user.bloodGroup ?? "--"}</Text></View><View style={styles.heroCopy}><Text style={[styles.heroTitle, { color: colors.ink }]}>{user.bloodGroup ? "Your blood group is ready" : "Add your blood group"}</Text><Text style={[styles.heroText, { color: colors.muted }]}>{user.isAvailableDonor ? "You are marked available to help nearby." : "You are currently unavailable to donate."}</Text></View></Surface>
    <Link href="/(protected)/emergency" asChild><View style={styles.cta}><PrimaryButton label="Create emergency request" onPress={() => undefined} /></View></Link>
    <SectionTitle>Request overview</SectionTitle>
    <Surface>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading emergency requests" color={colors.accent} />
      ) : (
        <Text style={[styles.metric, { color: colors.ink }]}>{ownRequests.length}</Text>
      )}
      <Text style={[styles.metricLabel, { color: colors.muted }]}>Your emergency requests</Text>
      {error ? <Text style={[styles.error, { color: colors.warning }]}>{error}</Text> : null}
    </Surface>
    <SectionTitle>Quick actions</SectionTitle>
    <View style={styles.actions}><Link href="/(protected)/profile" asChild><PrimaryButton label="Update profile" onPress={() => undefined} /></Link><Link href="/(protected)/history" asChild><PrimaryButton label="View request history" onPress={() => undefined} /></Link></View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", flexDirection: "row" }, bloodBadge: { alignItems: "center", borderRadius: 30, height: 60, justifyContent: "center", width: 60 }, bloodText: { fontSize: 18, fontWeight: "800" }, heroCopy: { flex: 1, marginLeft: spacing.md }, heroTitle: { fontSize: 17, fontWeight: "800" }, heroText: { fontSize: 13, lineHeight: 19, marginTop: spacing.sm }, cta: { marginTop: spacing.lg }, metric: { fontSize: 30, fontWeight: "800" }, metricLabel: { fontSize: 14, marginTop: spacing.sm }, error: { fontSize: 13, lineHeight: 19, marginTop: spacing.sm }, actions: { gap: spacing.sm, marginTop: spacing.md },
});
