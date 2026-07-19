import { Document, Types } from "mongoose";

export interface INotification extends Document {
  receiverId: Types.ObjectId;
  title: string;
  message: string;
  type: "Emergency" | "Approval" | "Rejection" | "Inventory" | "System";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
