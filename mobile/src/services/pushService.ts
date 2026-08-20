import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { Notification as BloodLinkNotification } from "../types/notification";

const CHANNEL_ID = "bloodlink-notifications";

/**
 * expo-notifications is only available on native (Android/iOS). Web exposes no
 * notification surface, so every call here is a no-op there.
 */
const isSupported = Platform.OS === "android" || Platform.OS === "ios";

/**
 * Configures how incoming notifications are presented while the app is in the
 * foreground (so a Socket.IO alert isn't silently dropped when the user is
 * looking at the app). Must be called once at app startup.
 */
export function configureForegroundPresentation(): void {
  if (!isSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
  });
}

/**
 * Requests OS notification permission and, on Android, ensures a notification
 * channel exists. Returns whether notifications are granted. Safe to call
 * repeatedly; performs nothing on web.
 */
export type NotificationPermissionStatus = "granted" | "denied" | "unsupported";

export async function ensureNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isSupported) return "unsupported";
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "BloodLink Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? "granted" : "denied";
}

/**
 * Presents a BloodLink notification as an OS-level local notification. Used as
 * the delivery surface on top of the existing Socket.IO "notification" event so
 * the user sees the alert even when the app is backgrounded (but alive). The
 * notification `_id` is attached as `data` so a tap can navigate to it.
 */
export async function presentLocalNotification(
  notification: BloodLinkNotification,
): Promise<void> {
  if (!isSupported) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.message,
      data: { notificationId: notification._id, type: notification.type },
    },
    trigger: null,
  });
}

/**
 * Subscribes to OS notification taps (opening the app from a notification).
 * Returns an unsubscribe function. The callback receives the notification `_id`
 * from the payload `data`, if present.
 */
export function addNotificationTapListener(
  onTap: (notificationId: string | undefined) => void,
): () => void {
  if (!isSupported) return () => undefined;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const notificationId =
      data && typeof data === "object" && "notificationId" in data
        ? (data as Record<string, unknown>).notificationId
        : undefined;
    onTap(typeof notificationId === "string" ? notificationId : undefined);
  });
  return () => subscription.remove();
}
