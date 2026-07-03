import { Router } from "express";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "../controllers/productController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "ventas", "almacen"), listProducts);
router.get("/:id", authorizeRoles("admin", "ventas", "almacen"), getProduct);
router.post("/", authorizeRoles("admin", "almacen"), createProduct);
router.put("/:id", authorizeRoles("admin", "almacen"), updateProduct);
router.delete("/:id", authorizeRoles("admin"), deleteProduct);

export default router;
