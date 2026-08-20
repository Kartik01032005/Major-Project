import type { NotificationType } from "../types/notification";
import type { ThemeColors } from "../theme/colors";

export type NotificationTypeConfig = {
  glyph: string;
  colorKey: keyof Pick<
    ThemeColors,
    | "notificationEmergency"
    | "notificationApproval"
    | "notificationRejection"
    | "notificationInventory"
    | "notificationSystem"
  >;
  bgKey: keyof Pick<
    ThemeColors,
    | "notificationEmergencyBg"
    | "notificationApprovalBg"
    | "notificationRejectionBg"
    | "notificationInventoryBg"
    | "notificationSystemBg"
  >;
};

/**
 * Per-type styling, mirroring the web NotificationsPanel TYPE_CONFIG. The mobile
 * theme carries per-type color/background tokens so light + dark modes stay in sync
 * without tailwind classes.
 */
export const notificationTypeConfig: Record<NotificationType, NotificationTypeConfig> = {
  Emergency: { glyph: "🚨", colorKey: "notificationEmergency", bgKey: "notificationEmergencyBg" },
  Approval: { glyph: "✅", colorKey: "notificationApproval", bgKey: "notificationApprovalBg" },
  Rejection: { glyph: "❌", colorKey: "notificationRejection", bgKey: "notificationRejectionBg" },
  Inventory: { glyph: "📦", colorKey: "notificationInventory", bgKey: "notificationInventoryBg" },
  System: { glyph: "ℹ️", colorKey: "notificationSystem", bgKey: "notificationSystemBg" },
};
