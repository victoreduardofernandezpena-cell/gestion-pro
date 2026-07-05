import { Router } from "express";
import { createWarehouse, listWarehouses, updateWarehouse, updateWarehouseStatus } from "../controllers/warehouseController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "ventas", "almacen", "contabilidad"), listWarehouses);
router.post("/", authorizeRoles("admin", "almacen"), createWarehouse);
router.put("/:id", authorizeRoles("admin", "almacen"), updateWarehouse);
router.patch("/:id/status", authorizeRoles("admin", "almacen"), updateWarehouseStatus);

export default router;
