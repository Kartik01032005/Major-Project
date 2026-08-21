import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AdminAccess } from "../../src/components/AdminAccess";
import { AppScreen, SectionTitle, Surface } from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import { adminService } from "../../src/services/adminService";
import { emergencyService } from "../../src/services/emergencyService";
import { apiClient } from "../../src/services/apiClient";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";

export default function AdminDashboardScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [stats, setStats] = useState({ units: 0, pending: 0, hospitals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { void Promise.all([adminService.getInventory(), emergencyService.list(), apiClient.getHospitals()]).then(([inventory, requests, hospitals]) => setStats({ units: inventory.reduce((total, item) => total + item.units, 0), pending: requests.filter((item) => item.status === "Pending").length, hospitals: hospitals.length })).finally(() => setLoading(false)); }, []);

  return <AdminAccess><AppScreen title="Admin Dashboard" subtitle="Manage blood inventory, emergency requests, and hospital records.">
    <Surface style={[styles.banner, { backgroundColor: colors.ink }]}><Text style={[styles.panel, { color: "#FCA5A5" }]}>Admin Panel</Text><Text style={styles.bannerTitle}>Welcome, {user?.name.split(" ")[0] ?? "Admin"}</Text><Text style={styles.bannerText}>Your blood-bank operations at a glance.</Text></Surface>
    <SectionTitle>Network overview</SectionTitle>
    {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : <View style={styles.grid}>
      <Metric label="Total Blood Units" value={stats.units} color="#DC2626" /><Metric label="Pending Requests" value={stats.pending} color="#D97706" /><Metric label="Hospitals Managed" value={stats.hospitals} color="#2563EB" />
    </View>}
    <SectionTitle>Admin tools</SectionTitle>
    <View style={styles.tools}><Tool href="/(protected)/inventory" glyph="▣" title="Blood Inventory" text="Upload files or adjust stock." /><Tool href="/(protected)/admin-requests" glyph="!" title="Emergency Requests" text="Review pending requests." /><Tool href="/(protected)/admin-hospitals" glyph="+" title="Hospital Management" text="Add and maintain hospitals." /><Tool href="/(protected)/notifications" glyph="●" title="Admin Notifications" text="Critical-stock and request alerts." /></View>
  </AppScreen></AdminAccess>;
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) { const colors = useThemeColors(); return <Surface style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}><Text style={{ color, fontWeight: "900" }}>●</Text></View><Text style={[styles.metricValue, { color: colors.ink }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text></Surface>; }
function Tool({ href, glyph, title, text }: { href: "/(protected)/inventory" | "/(protected)/admin-requests" | "/(protected)/admin-hospitals" | "/(protected)/notifications"; glyph: string; title: string; text: string }) { const colors = useThemeColors(); return <Link href={href} asChild><Surface style={styles.tool}><View style={[styles.toolIcon, { backgroundColor: "#FEF2F2" }]}><Text style={{ color: "#DC2626", fontWeight: "900" }}>{glyph}</Text></View><View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.ink }]}>{title}</Text><Text style={[styles.toolText, { color: colors.muted }]}>{text}</Text></View><Text style={[styles.chevron, { color: colors.muted }]}>›</Text></Surface></Link>; }
const styles = StyleSheet.create({ banner: { gap: 7 }, panel: { alignSelf: "flex-start", borderColor: "#EF444455", borderRadius: 999, borderWidth: 1, fontSize: 11, fontWeight: "800", paddingHorizontal: 9, paddingVertical: 4 }, bannerTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" }, bannerText: { color: "#CBD5E1", fontSize: 13 }, loader: { marginTop: spacing.lg }, grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg }, metric: { flexGrow: 1, minWidth: "45%", marginTop: 0 }, metricIcon: { alignItems: "center", borderRadius: 10, height: 30, justifyContent: "center", width: 30 }, metricValue: { fontSize: 26, fontWeight: "900", marginTop: spacing.sm }, metricLabel: { fontSize: 12, marginTop: 3 }, tools: { gap: spacing.sm, marginTop: spacing.lg }, tool: { alignItems: "center", flexDirection: "row", marginTop: 0 }, toolIcon: { alignItems: "center", borderRadius: 11, height: 36, justifyContent: "center", width: 36 }, toolCopy: { flex: 1, marginLeft: spacing.md }, toolTitle: { fontSize: 14, fontWeight: "800" }, toolText: { fontSize: 12, marginTop: 2 }, chevron: { fontSize: 25 } });
