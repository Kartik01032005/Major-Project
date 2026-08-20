import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";
import { timeAgo } from "../utils/time";
import { notificationTypeConfig } from "../utils/notificationTypeConfig";
import type { Notification } from "../types/notification";

type NotificationItemProps = {
  notification: Notification;
  onPress: (notification: Notification) => void;
};

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const colors = useThemeColors();
  const config = notificationTypeConfig[notification.type];
  const accent = colors[config.colorKey];
  const iconBackground = colors[config.bgKey];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${notification.title}`}
      onPress={() => onPress(notification)}
      style={[
        styles.row,
        { backgroundColor: notification.isRead ? colors.surface : colors.notificationEmergencyBg },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Text style={styles.glyph}>{config.glyph}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              { color: notification.isRead ? colors.muted : colors.ink },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={[styles.time, { color: colors.muted }]}>{timeAgo(notification.createdAt)}</Text>
        </View>
        <Text style={[styles.message, { color: colors.muted }]} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>

      {!notification.isRead ? <View style={[styles.dot, { backgroundColor: accent }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  icon: { alignItems: "center", borderRadius: 8, height: 28, justifyContent: "center", width: 28 },
  glyph: { fontSize: 15 },
  body: { flex: 1, minWidth: 0 },
  titleRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  title: { flex: 1, fontSize: 13, fontWeight: "700" },
  time: { fontSize: 11, flexShrink: 0 },
  message: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  dot: { borderRadius: 4, height: 8, marginTop: 4, width: 8 },
});
