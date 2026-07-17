import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe } from "../controllers/authController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please include a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("bloodGroup")
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Invalid user role"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please include a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", authGuard, getMe);

export default router;
