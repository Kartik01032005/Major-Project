import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { AppScreen, Surface } from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import { emergencyService } from "../../src/services/emergencyService";
import { requestBelongsToUser, type EmergencyRequest } from "../../src/types/userFeatures";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";

export default function HistoryScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void emergencyService.list().then((items) => setRequests(user ? items.filter((item) => requestBelongsToUser(item, user)) : [])).catch((requestError: unknown) => setError(getApiErrorMessage(requestError))).finally(() => setLoading(false)); }, [user]);
  return <AppScreen title="Request history" subtitle="A record of the emergency requests submitted from your account.">
    {loading ? <ActivityIndicator color={colors.accent} size="large" style={styles.loader} /> : null}
    {error ? <Text style={[styles.message, { color: colors.warning }]}>{error}</Text> : null}
    {!loading && !error && requests.length === 0 ? <Surface><Text style={[styles.message, { color: colors.muted }]}>No emergency requests yet.</Text></Surface> : null}
    {requests.map((request) => <Surface key={request._id}><Text style={[styles.group, { color: colors.accent }]}>{request.bloodGroup} · {request.unitsRequired} unit{request.unitsRequired === 1 ? "" : "s"}</Text><Text style={[styles.hospital, { color: colors.ink }]}>{request.hospital}</Text><Text style={[styles.detail, { color: colors.muted }]}>{request.district}, {request.state}</Text><Text style={[styles.detail, { color: colors.muted }]}>{request.address}</Text><Text style={[styles.status, { color: request.status === "Approved" ? colors.success : request.status === "Rejected" ? colors.warning : colors.accent }]}>{request.status}</Text></Surface>)}
  </AppScreen>;
}

const styles = StyleSheet.create({ loader: { marginTop: spacing.xl }, message: { fontSize: 14, lineHeight: 20 }, group: { fontSize: 14, fontWeight: "800" }, hospital: { fontSize: 18, fontWeight: "800", marginTop: spacing.sm }, detail: { fontSize: 14, lineHeight: 20, marginTop: 4 }, status: { fontSize: 13, fontWeight: "800", marginTop: spacing.md } });