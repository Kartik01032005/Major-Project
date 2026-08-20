export type NotificationType = "Emergency" | "Approval" | "Rejection" | "Inventory" | "System";

export const notificationTypes: readonly NotificationType[] = [
  "Emergency",
  "Approval",
  "Rejection",
  "Inventory",
  "System",
];

export type Notification = {
  _id: string;
  receiverId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export function isNotification(value: unknown): value is Notification {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate._id === "string" &&
    typeof candidate.receiverId === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.isRead === "boolean" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    notificationTypes.includes(candidate.type as NotificationType)
  );
}
