import { Router } from "express";
import { createBrand, listBrands, updateBrand, updateBrandStatus } from "../controllers/brandController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "ventas", "almacen", "contabilidad"), listBrands);
router.post("/", authorizeRoles("admin", "almacen"), createBrand);
router.put("/:id", authorizeRoles("admin", "almacen"), updateBrand);
router.patch("/:id/status", authorizeRoles("admin", "almacen"), updateBrandStatus);

export default router;
