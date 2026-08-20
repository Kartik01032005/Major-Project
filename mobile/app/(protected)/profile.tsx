import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen, SectionTitle, Surface } from "../../src/components/AppScreen";
import { AuthError, AuthField, AuthFieldLabel } from "../../src/components/AuthField";
import { ChoiceGrid } from "../../src/components/ChoiceGrid";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { userService } from "../../src/services/userService";
import { bloodGroups, type BloodGroup } from "../../src/types/userFeatures";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { user, refreshSession } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(user?.bloodGroup as BloodGroup | undefined);
  const [available, setAvailable] = useState(user?.isAvailableDonor ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const save = async () => {
    if (!name.trim() || !phone.trim() || !bloodGroup) { setError("Name, phone number, and blood group are required."); return; }
    setSaving(true); setError(null); setSaved(false);
    try { await userService.updateProfile({ name: name.trim(), phone: phone.trim(), bloodGroup, isAvailableDonor: available }); await refreshSession(); setSaved(true); }
    catch (requestError: unknown) { setError(getApiErrorMessage(requestError)); }
    finally { setSaving(false); }
  };

  return <AppScreen title="Your profile" subtitle="Keep your donor details current so the right help can reach you.">
    <Surface><AuthFieldLabel>Full name</AuthFieldLabel><AuthField label="Full name" autoCapitalize="words" onChangeText={setName} value={name} /><View style={styles.field}><AuthFieldLabel>Phone number</AuthFieldLabel><AuthField label="Phone number" keyboardType="phone-pad" onChangeText={setPhone} value={phone} /></View><Text style={[styles.readOnly, { color: colors.muted }]}>{user.email}</Text></Surface>
    <SectionTitle>Blood group</SectionTitle>
    <ChoiceGrid options={bloodGroups} value={bloodGroup} onChange={(value) => setBloodGroup(value as BloodGroup)} />
    <SectionTitle>Donor availability</SectionTitle>
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: available }} onPress={() => setAvailable((current) => !current)} style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.switch, { backgroundColor: available ? colors.success : colors.border }]} /><View><Text style={[styles.switchTitle, { color: colors.ink }]}>{available ? "Available to donate" : "Currently unavailable"}</Text><Text style={[styles.switchText, { color: colors.muted }]}>You can change this anytime.</Text></View></Pressable>
    {error ? <AuthError message={error} /> : null}{saved ? <Text style={[styles.saved, { color: colors.success }]}>Profile updated successfully.</Text> : null}
    <View style={styles.button}><PrimaryButton label="Save profile" onPress={() => void save()} disabled={saving} /></View>
  </AppScreen>;
}

const styles = StyleSheet.create({ field: { marginTop: spacing.md }, readOnly: { fontSize: 14, marginTop: spacing.md }, switchRow: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: spacing.md, marginTop: spacing.md, padding: spacing.md }, switch: { borderRadius: 12, height: 24, width: 24 }, switchTitle: { fontSize: 15, fontWeight: "700" }, switchText: { fontSize: 13, marginTop: 4 }, saved: { fontSize: 13, marginTop: spacing.md }, button: { marginTop: spacing.lg } });