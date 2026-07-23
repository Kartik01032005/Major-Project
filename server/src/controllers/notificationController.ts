import { Request, Response } from "express";
import Notification from "../models/Notification.js";

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const notifications = await Notification.find({ receiverId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications
    });
  } catch (error: any) {
    console.error("❌ Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error during notifications retrieval" });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/read/:id
// @access  Private
export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    // Ensure notification belongs to the logged-in user
    const recId = notification.receiverId as any;
    const receiverIdStr = (typeof recId === "object" && recId !== null)
      ? (recId._id || recId.id || recId).toString()
      : String(recId);

    const userIdStr = (req.user._id || (req.user as any).id).toString();

    if (receiverIdStr !== userIdStr) {
      res.status(403).json({ success: false, message: "Not authorized to modify this notification" });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error: any) {
    console.error("❌ Mark notification read error:", error);
    res.status(500).json({ success: false, message: "Server error during notification update" });
  }
};
