import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";

export default function ProtectedHomeScreen() {
  const colors = useThemeColors();
  const { user, signOut, status } = useAuth();

  if (!user || status !== "authenticated") {
    return <ActivityIndicator color={colors.accent} size="large" />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.headerMark, { backgroundColor: colors.accent }]}>
          <Text style={[styles.headerMarkText, { color: colors.surface }]}>+</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>BLOODLINK MOBILE</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Welcome, {user.name.split(" ")[0]}.</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your secure account is connected to the BloodLink platform.</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.muted }]}>VERIFIED ACCOUNT</Text>
          <Text style={[styles.name, { color: colors.ink }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.muted }]}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.roleText, { color: colors.accent }]}>{user.role === "admin" ? "Admin access" : "Donor account"}</Text>
          </View>
        </View>

        <PrimaryButton label="Sign out" onPress={() => void signOut()} />
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.secondaryAction}>
          <Text style={[styles.secondaryActionText, { color: colors.muted }]}>End this session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: spacing.xl },
  headerMark: { alignItems: "center", borderRadius: 16, height: 48, justifyContent: "center", marginBottom: spacing.md, width: 48 },
  headerMarkText: { fontSize: 29, fontWeight: "700" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.8 },
  title: { fontSize: 34, fontWeight: "800", lineHeight: 40, marginTop: spacing.sm },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  profileCard: { borderRadius: 16, borderWidth: 1, marginVertical: spacing.xl, padding: spacing.lg },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  name: { fontSize: 21, fontWeight: "700", marginTop: spacing.md },
  email: { fontSize: 14, marginTop: spacing.sm },
  roleBadge: { alignSelf: "flex-start", borderRadius: 10, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  roleText: { fontSize: 13, fontWeight: "700" },
  secondaryAction: { alignItems: "center", marginTop: spacing.md, padding: spacing.sm },
  secondaryActionText: { fontSize: 14, fontWeight: "600" },
});
