import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  deleteAccount,
  forgotPassword,
  resetPassword,
  getPendingInstitutions,
  updateInstitutionApproval,
} from "../controllers/authController.js";
import { authGuard, adminGuard } from "../middleware/auth.js";

const router = Router();

const isInstitutionalRequest = (role?: string) => {
  const upper = (role || "").toUpperCase();
  return upper === "BLOOD_BANK" || upper === "HOSPITAL" || upper === "ADMIN";
};

const registerValidation = [
  body("name")
    .notEmpty()
    .withMessage((value, { req }) =>
      isInstitutionalRequest(req.body.role) ? "Contact person name is required." : "Name is required."
    ),
  body("organizationName")
    .if((value, { req }) => isInstitutionalRequest(req.body.role))
    .notEmpty()
    .withMessage((value, { req }) =>
      (req.body.role || "").toUpperCase() === "HOSPITAL" ? "Hospital name is required." : "Blood bank name is required."
    ),
  body("email").isEmail().withMessage("Please include a valid email."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
  body("phone").notEmpty().withMessage("Phone number is required."),
  body("role")
    .optional()
    .isIn(["USER", "BLOOD_BANK", "HOSPITAL", "user", "admin"])
    .withMessage("Invalid user role."),
  body("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group."),
  body("location.state").notEmpty().withMessage("State is required."),
  body("location.district").notEmpty().withMessage("District is required."),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please include a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  body("role")
    .optional()
    .isIn(["USER", "BLOOD_BANK", "HOSPITAL", "user", "admin"])
    .withMessage("Invalid user role."),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Please provide a valid email address"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.get("/me", authGuard, getMe);
router.delete("/delete-account", authGuard, deleteAccount);

// Institutional approval management (Admins / Approved Blood Banks)
router.get("/institutions/pending", authGuard, adminGuard, getPendingInstitutions);
router.patch("/institutions/:id/approval", authGuard, adminGuard, updateInstitutionApproval);

export default router;
