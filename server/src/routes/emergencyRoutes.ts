import { Router } from "express";
import { body } from "express-validator";
import {
  createRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  deleteRequest
} from "../controllers/emergencyController.js";
import { authGuard, adminGuard } from "../middleware/auth.js";

const router = Router();

const createRequestValidation = [
  body("bloodGroup")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),
  body("hospital")
    .optional()
    .notEmpty()
    .withMessage("Hospital name is required"),
  body("hospitalName")
    .optional()
    .notEmpty()
    .withMessage("Hospital name is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("address").notEmpty().withMessage("Exact address is required"),
  body("contactNumber")
    .notEmpty()
    .withMessage("Contact number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Contact number must be exactly 10 digits"),
];

router.post("/", authGuard, createRequestValidation, createRequest);
router.get("/", getAllRequests);
router.get("/:id", getRequestById);
router.put("/:id/approve", authGuard, adminGuard, approveRequest);
router.put("/:id/reject", authGuard, adminGuard, rejectRequest);
router.delete("/:id", authGuard, deleteRequest);

export default router;
