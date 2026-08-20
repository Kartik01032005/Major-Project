import { apiClient } from "./apiClient";
import type { Notification } from "../types/notification";

export const notificationService = {
  list: (): Promise<Notification[]> => apiClient.getNotifications(),
  markRead: (id: string): Promise<Notification> => apiClient.markNotificationRead(id),
};
