import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useRouter } from "expo-router";

import { notificationService } from "../services/notificationService";
import { socketService } from "../services/socketService";
import {
  addNotificationTapListener,
  configureForegroundPresentation,
  ensureNotificationPermission,
  type NotificationPermissionStatus,
  presentLocalNotification,
} from "../services/pushService";
import { isNotification, type Notification } from "../types/notification";
import { useAuth } from "./AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

type NotificationPermission = NotificationPermissionStatus | "unknown";

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  permission: NotificationPermission;
  /** Marks a single notification read (optimistic, persists via REST). */
  markRead: (id: string) => Promise<void>;
  /** Marks every unread notification read (loops the REST mark-one endpoint). */
  markAllRead: () => Promise<void>;
  /** Re-fetches the notification list from the backend. */
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated, status } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("unknown");

  // Keeps callbacks stable while always acting on the freshest notification list.
  const notificationsRef = useRef<Notification[]>([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refresh = useCallback(async () => {
    // Defer the loading-state transition so mount-effect callers never trigger a
    // synchronous setState (cascading render heuristic).
    await Promise.resolve();
    setLoading(true);
    try {
      const items = await notificationService.list();
      setError(null);
      setNotifications(items);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((current) =>
      current.some((item) => item._id === id && !item.isRead)
        ? current.map((item) => (item._id === id ? { ...item, isRead: true } : item))
        : current,
    );
    try {
      const updated = await notificationService.markRead(id);
      setNotifications((current) => current.map((item) => (item._id === id ? updated : item)));
    } catch (requestError: unknown) {
      // Revert on failure so the UI reflects the server's true state.
      setNotifications((current) => current.map((item) => (item._id === id ? { ...item, isRead: false } : item)));
      console.warn("markNotificationRead failed:", getApiErrorMessage(requestError));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notificationsRef.current.filter((item) => !item.isRead);
    if (unread.length === 0) return;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    await Promise.all(unread.map((item) => notificationService.markRead(item._id)));
    await refresh();
  }, [refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  // Configure foreground presentation once for the app lifetime.
  useEffect(() => {
    configureForegroundPresentation();
  }, []);

  // Reset history whenever the session changes (login/logout). This synchronizes
  // owned state with auth state — a legitimate external→internal sync.
  useEffect(() => {
    if (isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications([]);
    setError(null);
  }, [isAuthenticated]);

  // Connect socket + request permission + initial fetch once authenticated.
  // `refresh` defers its first setState behind an await, and the socket lifecycle
  // is external-system sync, so the effect body performs no synchronous state write.
  useEffect(() => {
    if (status !== "authenticated" || !isAuthenticated || !user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    void ensureNotificationPermission().then(setPermission);
    socketService.connect(user._id);

    const handleIncoming = (payload: unknown) => {
      // Validate then surface as an OS notification; refetch so history stays in sync
      // with the single source of truth (the REST endpoint).
      if (isNotification(payload)) void presentLocalNotification(payload);
      void refresh();
    };
    socketService.on<unknown>("notification", handleIncoming);

    return () => {
      socketService.off("notification");
      socketService.disconnect();
    };
  }, [status, isAuthenticated, user, refresh]);

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, unreadCount, loading, error, permission, markRead, markAllRead, refresh }),
    [notifications, unreadCount, loading, error, permission, markRead, markAllRead, refresh],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
}

/**
 * Rendered inside the router tree. Subscribes to OS notification taps and
 * navigates the user to the Notifications tab. Returns null (renders nothing).
 */
export function NotificationTapBridge() {
  const router = useRouter();
  useEffect(() => {
    return addNotificationTapListener((notificationId) => {
      router.navigate("/(protected)/notifications");
      // notificationId reserved for future deep-linking to a specific alert.
      void notificationId;
    });
  }, [router]);
  return null;
}
