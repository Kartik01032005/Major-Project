import { Router } from "express";
import multer from "multer";
import {
  getInventory,
  updateInventory,
  adjustInventory,
  syncInventoryFromUpload,
  uploadInventoryFile,
  getUploadHistory,
  getThresholds,
  updateThresholds,
} from "../controllers/inventoryController.js";
import { authGuard, adminGuard } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = [".xlsx", ".xls", ".csv", ".pdf"];
    const ext = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel, CSV, and PDF files are allowed."));
    }
  },
});

const router = Router();

// All inventory routes are admin-only
router.get("/", authGuard, adminGuard, getInventory);
router.put("/:id", authGuard, adminGuard, updateInventory);
router.post("/:id/adjust", authGuard, adminGuard, adjustInventory);
router.post("/:id/sync", authGuard, adminGuard, syncInventoryFromUpload);
router.post("/upload", authGuard, adminGuard, upload.single("file"), uploadInventoryFile);
router.get("/upload-history", authGuard, adminGuard, getUploadHistory);
router.get("/thresholds", authGuard, adminGuard, getThresholds);
router.put("/thresholds", authGuard, adminGuard, updateThresholds);

export default router;
