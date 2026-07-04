import { Router } from "express";
import { health, info, status } from "../controllers/systemController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/health", asyncHandler(health));
router.get("/status", authenticate, authorizeRoles("admin"), asyncHandler(status));
router.get("/info", authenticate, authorizeRoles("admin"), asyncHandler(info));

export default router;
