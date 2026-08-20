import { Platform } from "react-native";
import Constants from "expo-constants";

import type { Notification as BloodLinkNotification } from "../types/notification";

const CHANNEL_ID = "bloodlink-notifications";

/**
 * expo-notifications is a native-only surface. Web has no OS notification layer
 * at all, and Android running under Expo Go no longer ships the remote-push
 * native module — eagerly importing/evaluating the package there throws and
 * brings down every module that transitively imports this one (which includes
 * the root layout). (iOS Expo Go still supports local notifications.)
 *
 * To keep that crash from ever happening we NEVER import expo-notifications at
 * module load. The package is pulled in lazily (dynamic import) only inside the
 * functions below, and only when `isPushSupported` is true. On web and Android
 * Expo Go every function becomes a safe no-op / reports "unsupported" without
 * touching the native module at all.
 *
 * A real Expo development build or standalone build sets
 * `Constants.appOwnership = "standalone"`, unlocking the full feature set.
 */
const isWeb = Platform.OS === "web";
const isExpoGoOnAndroid = Platform.OS === "android" && Constants.appOwnership === "expo";
export const isPushSupported = !isWeb && !isExpoGoOnAndroid;

export type NotificationPermissionStatus = "granted" | "denied" | "unsupported";

/**
 * Lazily resolves the real expo-notifications module. Resolves to `null` on any
 * platform that doesn't support it, so callers can short-circuit without ever
 * evaluating the native module.
 */
async function loadNotifications(): Promise<typeof import("expo-notifications") | null> {
  if (!isPushSupported) return null;
  try {
    return await import("expo-notifications");
  } catch {
    // If the native module genuinely can't load (unexpected build), degrade
    // gracefully instead of crashing the app.
    return null;
  }
}

/**
 * Configures how incoming notifications are presented while the app is in the
 * foreground (so a Socket.IO alert isn't silently dropped when the user is
 * looking at the app). Must be called once at app startup. Safe no-op on web
 * and Android Expo Go (never imports expo-notifications there).
 */
export async function configureForegroundPresentation(): Promise<void> {
  if (!isPushSupported) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
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
 * repeatedly; reports "unsupported" on web and Android Expo Go without
 * importing expo-notifications.
 */
export async function ensureNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isPushSupported) return "unsupported";
  const Notifications = await loadNotifications();
  if (!Notifications) return "unsupported";

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
 * Safe no-op on web and Android Expo Go.
 */
export async function presentLocalNotification(
  notification: BloodLinkNotification,
): Promise<void> {
  if (!isPushSupported) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
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
 * from the payload `data`, if present. Reports an immediate no-op unsubscribe
 * on web and Android Expo Go without importing expo-notifications.
 */
export function addNotificationTapListener(
  onTap: (notificationId: string | undefined) => void,
): () => void {
  if (!isPushSupported) return () => undefined;
  // Fire-and-forget: wire the native listener as soon as the module resolves.
  void loadNotifications().then((Notifications) => {
    if (!Notifications) return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const notificationId =
        data && typeof data === "object" && "notificationId" in data
          ? (data as Record<string, unknown>).notificationId
          : undefined;
      onTap(typeof notificationId === "string" ? notificationId : undefined);
    });
    pendingUnsubscribes.push(() => subscription.remove());
  });
  return () => {
    while (pendingUnsubscribes.length > 0) {
      const unsubscribe = pendingUnsubscribes.pop();
      unsubscribe?.();
    }
  };
}

// Holds tap-listener cleanups registered once the native module has loaded, so
// the unsubscribe returned synchronously above can still tear them down later.
const pendingUnsubscribes: (() => void)[] = [];
