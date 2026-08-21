import { Router } from "express";
import multer from "multer";
import { body } from "express-validator";
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
import { handleUploadError, validateUploadedInventoryFile } from "../middleware/uploadSecurity.js";
import { validateRequest } from "../middleware/requestValidation.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 },
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
const unitsValidation = [body("units").isFloat({ min: 0 }).withMessage("Units must be a non-negative number"), validateRequest];
const deltaValidation = [body("delta").isFloat().withMessage("delta must be a finite number"), validateRequest];
const modeValidation = [body("mode").optional().isIn(["merge", "replace"]).withMessage("Invalid upload mode"), validateRequest];

// All inventory routes are admin-only
router.get("/", authGuard, adminGuard, getInventory);
router.put("/:id", authGuard, adminGuard, unitsValidation, updateInventory);
router.post("/:id/adjust", authGuard, adminGuard, deltaValidation, adjustInventory);
router.post("/:id/sync", authGuard, adminGuard, syncInventoryFromUpload);
router.post("/upload", authGuard, adminGuard, upload.single("file"), modeValidation, validateUploadedInventoryFile, uploadInventoryFile);
router.use(handleUploadError);
router.get("/upload-history", authGuard, adminGuard, getUploadHistory);
router.get("/thresholds", authGuard, adminGuard, getThresholds);
router.put("/thresholds", authGuard, adminGuard, updateThresholds);

export default router;
