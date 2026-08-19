import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthError, AuthField, AuthFieldLabel } from "../../src/components/AuthField";
import { AuthShell } from "../../src/components/AuthShell";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isValidEmail, passwordError, required } from "../../src/utils/validation";
import type { UserRole } from "../../src/types/auth";

export default function RegisterScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { signUp } = useAuth();
  const [role, setRole] = useState<UserRole>("user");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", state: "", district: "", organizationName: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const validationError =
      required(form.name, "Name") ??
      (isValidEmail(form.email.trim()) ? undefined : "Enter a valid email address.") ??
      passwordError(form.password) ??
      (form.password === form.confirmPassword ? undefined : "Passwords do not match.") ??
      required(form.phone, "Phone number") ??
      required(form.state, "State") ??
      required(form.district, "District") ??
      (role === "admin" ? required(form.organizationName, "Organization name") : undefined);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        role,
        location: { state: form.state.trim(), district: form.district.trim() },
        ...(role === "admin" ? { organizationName: form.organizationName.trim() } : {}),
      });
      router.replace("/(auth)/login");
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Join BloodLink." subtitle="Create a secure account connected to the shared BloodLink network.">
      <View style={styles.fieldGroup}><AuthFieldLabel>Account type</AuthFieldLabel><View style={styles.roleRow}>{(["user", "admin"] as const).map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: role === option }} onPress={() => setRole(option)} style={[styles.roleOption, { backgroundColor: role === option ? colors.accent : colors.surface, borderColor: role === option ? colors.accent : colors.border }]}><Text style={[styles.roleOptionText, { color: role === option ? colors.surface : colors.muted }]}>{option === "user" ? "Donor / User" : "Admin"}</Text></Pressable>)}</View></View>
      <View style={styles.fieldGroup}><AuthFieldLabel>Full name</AuthFieldLabel><AuthField label="Full name" autoCapitalize="words" onChangeText={(value) => update("name", value)} placeholder="Your full name" value={form.name} /></View>
      <View style={styles.fieldGroup}><AuthFieldLabel>Email address</AuthFieldLabel><AuthField label="Email address" autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => update("email", value)} placeholder="you@example.com" value={form.email} /></View>
      <View style={styles.fieldGroup}><AuthFieldLabel>Phone number</AuthFieldLabel><AuthField label="Phone number" keyboardType="phone-pad" onChangeText={(value) => update("phone", value)} placeholder="10 digit phone number" value={form.phone} /></View>
      <View style={styles.fieldGroup}><AuthFieldLabel>Password</AuthFieldLabel><AuthField label="Password" autoCapitalize="none" onChangeText={(value) => update("password", value)} placeholder="At least 6 characters" secureTextEntry value={form.password} /></View>
      <View style={styles.fieldGroup}><AuthFieldLabel>Confirm password</AuthFieldLabel><AuthField label="Confirm password" autoCapitalize="none" onChangeText={(value) => update("confirmPassword", value)} placeholder="Repeat your password" secureTextEntry value={form.confirmPassword} /></View>
      {role === "admin" ? <View style={styles.fieldGroup}><AuthFieldLabel>Organization name</AuthFieldLabel><AuthField label="Organization name" autoCapitalize="words" onChangeText={(value) => update("organizationName", value)} placeholder="Hospital or blood bank" value={form.organizationName} /></View> : null}
      <View style={styles.fieldGroup}><AuthFieldLabel>State</AuthFieldLabel><AuthField label="State" autoCapitalize="words" onChangeText={(value) => update("state", value)} placeholder="Your state" value={form.state} /></View>
      <View style={styles.fieldGroup}><AuthFieldLabel>District</AuthFieldLabel><AuthField label="District" autoCapitalize="words" onChangeText={(value) => update("district", value)} placeholder="Your district" value={form.district} /></View>
      {error ? <AuthError message={error} /> : null}
      <View style={styles.submit}><PrimaryButton label="Create account" onPress={() => void submit()} disabled={isSubmitting} /></View>
      <Text style={[styles.footerText, { color: colors.muted }]}>Already registered? <Link href="/(auth)/login" style={{ color: colors.accent, fontWeight: "700" }}>Sign in</Link></Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: spacing.md },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleOption: { borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  roleOptionText: { fontSize: 14, fontWeight: "700" },
  submit: { marginTop: spacing.md },
  footerText: { fontSize: 14, marginTop: spacing.xl, textAlign: "center" },
});
