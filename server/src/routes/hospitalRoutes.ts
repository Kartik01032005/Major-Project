import { Router } from "express";
import { body } from "express-validator";
import {
  getHospitals,
  addHospital,
  updateHospital,
  deleteHospital,
} from "../controllers/hospitalController.js";
import { authGuard, adminGuard } from "../middleware/auth.js";

const router = Router();

const hospitalValidation = [
  body("name").notEmpty().withMessage("Hospital/Blood Bank name is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone number must be exactly 10 digits"),
];

router.get("/", authGuard, getHospitals);
router.post("/", authGuard, adminGuard, hospitalValidation, addHospital);
router.put("/:id", authGuard, adminGuard, hospitalValidation, updateHospital);
router.delete("/:id", authGuard, adminGuard, deleteHospital);

export default router;
