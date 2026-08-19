import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AuthError, AuthField, AuthFieldLabel } from "../../src/components/AuthField";
import { AuthShell } from "../../src/components/AuthShell";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isValidEmail, passwordError, required } from "../../src/utils/validation";

export default function LoginScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const emailError = required(email, "Email") ?? (isValidEmail(email.trim()) ? undefined : "Enter a valid email address.");
    const validationError = emailError ?? passwordError(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      router.replace("/(protected)");
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back." subtitle="Sign in to continue helping people find blood when it matters most.">
      <View style={styles.fieldGroup}>
        <AuthFieldLabel>Email address</AuthFieldLabel>
        <AuthField label="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" value={email} />
      </View>
      <View style={styles.fieldGroup}>
        <AuthFieldLabel>Password</AuthFieldLabel>
        <AuthField label="Password" autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Your password" secureTextEntry value={password} />
      </View>
      {error ? <AuthError message={error} /> : null}
      <View style={styles.submit}>
        <PrimaryButton label="Sign in" onPress={() => void submit()} disabled={isSubmitting} />
        {isSubmitting ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
      </View>
      <Text style={[styles.footerText, { color: colors.muted }]}>New to BloodLink? <Link href="/(auth)/register" style={{ color: colors.accent, fontWeight: "700" }}>Create an account</Link></Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: spacing.md },
  submit: { marginTop: spacing.md },
  loader: { marginTop: spacing.md },
  footerText: { fontSize: 14, marginTop: spacing.xl, textAlign: "center" },
});
