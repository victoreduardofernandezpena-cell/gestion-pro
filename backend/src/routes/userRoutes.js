import { Router } from "express";
import {
  changeUserPassword,
  changeUserStatus,
  createUser,
  deleteUser,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin"));

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", changeUserStatus);
router.patch("/:id/reset-password", resetUserPassword);
router.patch("/:id/password", changeUserPassword);
router.delete("/:id", deleteUser);

export default router;
