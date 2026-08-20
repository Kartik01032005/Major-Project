import { Alert, StyleSheet, Text, View } from "react-native";

import { AppScreen, Surface } from "../../src/components/AppScreen";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { userService } from "../../src/services/userService";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { useState } from "react";

export default function AccountScreen() {
  const colors = useThemeColors();
  const { user, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteAccount = async () => { setDeleting(true); setError(null); try { await userService.deleteAccount(); await signOut(); } catch (requestError: unknown) { setError(getApiErrorMessage(requestError)); setDeleting(false); } };
  const confirmDelete = () => Alert.alert("Delete account", "This permanently removes your account and associated requests.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void deleteAccount() }]);
  return <AppScreen title="Account" subtitle="Manage your BloodLink session and account access.">
    <Surface><Text style={[styles.label, { color: colors.muted }]}>SIGNED IN AS</Text><Text style={[styles.name, { color: colors.ink }]}>{user?.name}</Text><Text style={[styles.email, { color: colors.muted }]}>{user?.email}</Text></Surface>
    <View style={styles.actions}><PrimaryButton label="Sign out" onPress={() => void signOut()} disabled={deleting} /><PrimaryButton label="Delete account" onPress={confirmDelete} disabled={deleting} /></View>
    {error ? <Text style={[styles.error, { color: colors.warning }]}>{error}</Text> : null}
  </AppScreen>;
}

const styles = StyleSheet.create({ label: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, name: { fontSize: 20, fontWeight: "800", marginTop: spacing.md }, email: { fontSize: 14, marginTop: spacing.sm }, actions: { gap: spacing.sm, marginTop: spacing.xl }, error: { fontSize: 13, lineHeight: 19, marginTop: spacing.md } });