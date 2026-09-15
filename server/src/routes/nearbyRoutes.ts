import { Router } from "express";
import { getNearbyFacilities, geocodeLocation } from "../controllers/nearbyController.js";

const router = Router();

// Geocode endpoint for manual location search
router.get("/geocode", geocodeLocation);

// Public route to retrieve nearby hospitals and blood banks
router.get("/", getNearbyFacilities);

export default router;
