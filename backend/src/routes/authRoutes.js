import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changeForcedPassword, login, profile, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de login. Intenta nuevamente mas tarde." }
});
const loginMiddlewares = process.env.DISABLE_LOGIN_RATE_LIMIT === "true" ? [] : [loginLimiter];

router.post("/login", ...loginMiddlewares, login);
router.post("/register", ...loginMiddlewares, register);
router.get("/profile", authenticate, profile);
router.patch("/change-forced-password", authenticate, changeForcedPassword);

export default router;
