import { Router } from "express";
import { createInventoryMovement, getInventoryAlerts, listInventory, listInventoryMovements } from "../controllers/inventoryController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "almacen"), listInventory);
router.get("/alerts", authorizeRoles("admin", "almacen"), getInventoryAlerts);
router.get("/movements", authorizeRoles("admin", "almacen"), listInventoryMovements);
router.post("/movement", authorizeRoles("admin", "almacen"), createInventoryMovement);

export default router;
