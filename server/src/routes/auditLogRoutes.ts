import { Router } from "express";
import { authGuard } from "../middleware/auth.js";
import { getAuditLogsHandler } from "../controllers/auditLogController.js";

const router = Router();

// Private audit log history
router.get("/", authGuard, getAuditLogsHandler);

export default router;
