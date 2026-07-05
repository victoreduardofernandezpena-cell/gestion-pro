import { Router } from "express";
import { createSupplier, deleteSupplier, getSupplier, listSuppliers, updateSupplier } from "../controllers/supplierController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "contabilidad"), listSuppliers);
router.get("/:id", authorizeRoles("admin", "contabilidad"), getSupplier);
router.post("/", authorizeRoles("admin", "contabilidad"), createSupplier);
router.put("/:id", authorizeRoles("admin", "contabilidad"), updateSupplier);
router.delete("/:id", authorizeRoles("admin"), deleteSupplier);

export default router;
