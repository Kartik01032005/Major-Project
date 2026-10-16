import { Router } from "express";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

// In-app notifications
router.get("/", authGuard, getNotifications);
router.put("/read-all", authGuard, markAllRead);
router.put("/read/:id", authGuard, markRead);
router.delete("/:id", authGuard, deleteNotification);

export default router;
