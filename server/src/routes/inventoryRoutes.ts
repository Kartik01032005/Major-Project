import { Router } from "express";
import { getInventory, updateInventory } from "../controllers/inventoryController.js";
import { authGuard, adminGuard } from "../middleware/auth.js";

const router = Router();

// All inventory routes are admin-only
router.get("/", authGuard, adminGuard, getInventory);
router.put("/:id", authGuard, adminGuard, updateInventory);

export default router;
