import { Schema, model } from "mongoose";
import { INotification } from "../types/notification.js";

const NotificationSchema = new Schema<INotification>({
  receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ["Emergency", "Approval", "Rejection", "Inventory", "System"]
  },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index to speed up fetching user notifications
NotificationSchema.index({ receiverId: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", NotificationSchema);
export default Notification;
