import { Router } from "express";
import {
  getNotifications,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

// In-app notifications
router.get("/", authGuard, getNotifications);
router.put("/read-all", authGuard, markAllRead);
router.put("/read/:id", authGuard, markRead);

export default router;
