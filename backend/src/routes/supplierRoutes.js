import { Router } from "express";
import { createSupplier, deleteSupplier, getSupplier, listSuppliers, updateSupplier } from "../controllers/supplierController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "almacen", "contabilidad"), listSuppliers);
router.get("/:id", authorizeRoles("admin", "almacen", "contabilidad"), getSupplier);
router.post("/", authorizeRoles("admin", "almacen"), createSupplier);
router.put("/:id", authorizeRoles("admin", "almacen"), updateSupplier);
router.delete("/:id", authorizeRoles("admin"), deleteSupplier);

export default router;
