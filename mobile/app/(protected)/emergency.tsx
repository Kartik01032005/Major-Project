import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen, SectionTitle } from "../../src/components/AppScreen";
import { AuthError, AuthField, AuthFieldLabel } from "../../src/components/AuthField";
import { ChoiceGrid } from "../../src/components/ChoiceGrid";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { emergencyService } from "../../src/services/emergencyService";
import { bloodGroups, type BloodGroup, type EmergencyRequestInput } from "../../src/types/userFeatures";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";

const initialForm: EmergencyRequestInput = { bloodGroup: "O+", unitsRequired: 1, hospital: "", state: "", district: "", address: "", contactNumber: "" };

export default function EmergencyScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = (key: keyof EmergencyRequestInput, value: string) => setForm((current) => ({ ...current, [key]: key === "unitsRequired" ? Math.max(1, Number(value.replace(/[^0-9]/g, "")) || 1) : value }));
  const submit = async () => {
    if (!form.hospital.trim() || !form.state.trim() || !form.district.trim() || !form.address.trim() || !/^\d{10}$/.test(form.contactNumber.trim())) { setError("Enter the hospital, location, address, and a valid 10 digit contact number."); return; }
    setSaving(true); setError(null); setSubmitted(false);
    try { await emergencyService.create({ ...form, hospital: form.hospital.trim(), state: form.state.trim(), district: form.district.trim(), address: form.address.trim(), contactNumber: form.contactNumber.trim() }); setForm({ ...initialForm, bloodGroup: (user?.bloodGroup as BloodGroup | undefined) ?? "O+", contactNumber: user?.phone ?? "" }); setSubmitted(true); }
    catch (requestError: unknown) { setError(getApiErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  return <AppScreen title="Emergency request" subtitle="Share the essential details so nearby blood support can respond quickly.">
    <SectionTitle>Blood needed</SectionTitle><ChoiceGrid options={bloodGroups} value={form.bloodGroup} onChange={(value) => update("bloodGroup", value)} />
    <View style={styles.field}><AuthFieldLabel>Units required</AuthFieldLabel><AuthField label="Units required" keyboardType="number-pad" onChangeText={(value) => update("unitsRequired", value)} value={String(form.unitsRequired)} /></View>
    <SectionTitle>Where help is needed</SectionTitle>
    <View style={styles.field}><AuthFieldLabel>Hospital name</AuthFieldLabel><AuthField label="Hospital name" onChangeText={(value) => update("hospital", value)} placeholder="City Hospital" value={form.hospital} /></View><View style={styles.field}><AuthFieldLabel>State</AuthFieldLabel><AuthField label="State" onChangeText={(value) => update("state", value)} value={form.state} /></View><View style={styles.field}><AuthFieldLabel>District</AuthFieldLabel><AuthField label="District" onChangeText={(value) => update("district", value)} value={form.district} /></View><View style={styles.field}><AuthFieldLabel>Exact address</AuthFieldLabel><AuthField label="Exact address" multiline onChangeText={(value) => update("address", value)} style={styles.address} value={form.address} /></View><View style={styles.field}><AuthFieldLabel>Contact number</AuthFieldLabel><AuthField label="Contact number" keyboardType="phone-pad" onChangeText={(value) => update("contactNumber", value)} value={form.contactNumber} /></View>
    {error ? <AuthError message={error} /> : null}{submitted ? <Text style={[styles.success, { color: colors.success }]}>Request submitted. You can track it in Request history.</Text> : null}<View style={styles.button}><PrimaryButton label="Submit emergency request" onPress={() => void submit()} disabled={saving} /></View>
  </AppScreen>;
}

const styles = StyleSheet.create({ field: { marginTop: spacing.md }, address: { minHeight: 90, paddingTop: spacing.md, textAlignVertical: "top" }, success: { fontSize: 13, lineHeight: 19, marginTop: spacing.md }, button: { marginTop: spacing.lg } });