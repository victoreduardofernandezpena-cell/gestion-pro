import { Router } from "express";
import { changeProfilePassword, getProfile, updateProfile } from "../controllers/profileController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getProfile);
router.put("/", updateProfile);
router.patch("/password", changeProfilePassword);

export default router;
