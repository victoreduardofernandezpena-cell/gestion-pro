import { Router } from "express";
import { createClient, deleteClient, getClient, listClients, updateClient } from "../controllers/clientController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "ventas"), listClients);
router.get("/:id", authorizeRoles("admin", "ventas"), getClient);
router.post("/", authorizeRoles("admin", "ventas"), createClient);
router.put("/:id", authorizeRoles("admin", "ventas"), updateClient);
router.delete("/:id", authorizeRoles("admin"), deleteClient);

export default router;
