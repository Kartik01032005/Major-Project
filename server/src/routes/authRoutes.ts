import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe, deleteAccount, forgotPassword, resetPassword } from "../controllers/authController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const registerValidation = [
  body("name")
    .notEmpty()
    .withMessage((value, { req }) => req.body.role === "admin" ? "Contact person name is required." : "Name is required."),
  body("organizationName")
    .if((value, { req }) => req.body.role === "admin")
    .notEmpty()
    .withMessage("Hospital name is required."),
  body("email").isEmail().withMessage("Please include a valid email."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
  body("phone").notEmpty().withMessage("Phone number is required."),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Invalid user role."),
  body("location.state").notEmpty().withMessage("State is required."),
  body("location.district").notEmpty().withMessage("District is required."),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please include a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
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

export default router;
