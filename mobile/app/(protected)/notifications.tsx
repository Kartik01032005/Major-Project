import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AppScreen, SectionTitle, Surface } from "../../src/components/AppScreen";
import { NotificationItem } from "../../src/components/NotificationItem";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useNotifications } from "../../src/context/NotificationContext";
import { ensureNotificationPermission } from "../../src/services/pushService";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import type { Notification } from "../../src/types/notification";

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const { notifications, unreadCount, loading, error, permission, markRead, markAllRead, refresh } =
    useNotifications();

  const handlePress = (notification: Notification) => {
    void markRead(notification._id);
  };

  return (
    <AppScreen title="Notifications" subtitle="Stay updated with alerts about your requests.">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Inbox</Text>
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{unreadCount} new</Text>
          </View>
        ) : null}
        {unreadCount > 0 ? (
          <Pressable onPress={() => void markAllRead()} style={styles.markAll}>
            <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {permission === "denied" ? (
        <Surface style={styles.banner}>
          <Text style={[styles.bannerText, { color: colors.warning }]}>
            Notifications are turned off. Enable them in your device settings to receive emergency alerts.
          </Text>
          <Pressable onPress={() => void ensureNotificationPermission().then(() => void refresh())}>
            <Text style={[styles.bannerAction, { color: colors.accent }]}>Check again</Text>
          </Pressable>
        </Surface>
      ) : null}

      <SectionTitle>Recent</SectionTitle>

      {loading && notifications.length === 0 ? (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      ) : null}

      {error && notifications.length === 0 ? (
        <Surface>
          <Text style={[styles.message, { color: colors.warning }]}>{error}</Text>
          <PrimaryButton label="Retry" onPress={() => void refresh()} />
        </Surface>
      ) : null}

      {!loading && !error && notifications.length === 0 ? (
        <Surface style={styles.empty}>
          <Text style={styles.emptyGlyph}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No notifications yet</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            You will be notified about request updates here.
          </Text>
        </Surface>
      ) : null}

      {notifications.length > 0 ? (
        <Surface style={styles.list}>
          {notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} onPress={handlePress} />
          ))}
        </Surface>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  markAll: { marginLeft: "auto" },
  markAllText: { fontSize: 13, fontWeight: "800" },
  banner: { gap: spacing.sm },
  bannerText: { fontSize: 13, lineHeight: 19 },
  bannerAction: { fontSize: 13, fontWeight: "800" },
  loader: { marginTop: spacing.xl },
  message: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyGlyph: { fontSize: 28 },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  list: { padding: 0 },
});
