import { Router } from "express";
import { body } from "express-validator";
import {
  getProfile,
  getDonorProfile,
  getPublicDonorProfile,
  updateProfile,
  getSettings,
  updateSettings,
  changePassword,
  exportUserData
} from "../controllers/userController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const updateValidation = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone number cannot be empty"),
  body("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),
  body("isAvailableDonor")
    .optional()
    .isBoolean()
    .withMessage("isAvailableDonor must be a boolean"),
  body("organizationName").optional().isString().withMessage("Organization name must be a string"),
  body("address").optional().isString().withMessage("Address must be a string"),
  body("registrationNumber").optional().isString().withMessage("Registration number must be a string"),
  body("hospitalType").optional().isString().withMessage("Hospital type must be a string"),
  body("operatingHours").optional().isString().withMessage("Operating hours must be a string"),
  body("emergencyContactPhone").optional().isString().withMessage("Emergency contact phone must be a string"),
  body("location").optional().isObject().withMessage("Location must be an object"),
  body("location.state").optional().notEmpty().withMessage("State cannot be empty"),
  body("location.district").optional().notEmpty().withMessage("District cannot be empty"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
];

router.get("/profile", authGuard, getProfile);
router.get("/donor-profile", authGuard, getDonorProfile);
router.get("/donor/:id", authGuard, getPublicDonorProfile);
router.put("/profile", authGuard, updateValidation, updateProfile);

router.get("/settings", authGuard, getSettings);
router.put("/settings", authGuard, updateSettings);
router.put("/change-password", authGuard, changePasswordValidation, changePassword);
router.get("/export-data", authGuard, exportUserData);

export default router;
