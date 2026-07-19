import { Router } from "express";
import { body } from "express-validator";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const updateValidation = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone number cannot be empty"),
  body("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood group"),
  body("location").optional().isObject().withMessage("Location must be an object"),
  body("location.state").optional().notEmpty().withMessage("State cannot be empty"),
  body("location.district").optional().notEmpty().withMessage("District cannot be empty"),
];

router.get("/profile", authGuard, getProfile);
router.put("/profile", authGuard, updateValidation, updateProfile);

export default router;
