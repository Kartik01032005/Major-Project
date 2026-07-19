import { Router } from "express";
import { getNotifications, markRead } from "../controllers/notificationController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

router.get("/", authGuard, getNotifications);
router.put("/read/:id", authGuard, markRead);

export default router;
