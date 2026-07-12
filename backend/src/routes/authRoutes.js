import { Router } from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { changeForcedPassword, login, profile, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { buildLoginRateLimitConfig, shouldDisableLoginRateLimit } from "../utils/security.js";

dotenv.config();
const router = Router();
const loginLimiter = rateLimit(buildLoginRateLimitConfig());
const loginMiddlewares = shouldDisableLoginRateLimit() ? [] : [loginLimiter];

router.post("/login", ...loginMiddlewares, login);
router.post("/register", ...loginMiddlewares, register);
router.get("/profile", authenticate, profile);
router.patch("/change-forced-password", authenticate, changeForcedPassword);

export default router;
