import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { getCompanySettings, updateCompanySettings, uploadCompanyLogo } from "../controllers/companySettingsController.js";
import { changeTaxStatus, createTax, deleteTax, getTax, listTaxes, setDefaultTax, updateTax } from "../controllers/taxSettingsController.js";
import { changeNumberingStatus, createNumbering, getNumbering, listNumbering, updateNumbering } from "../controllers/numberingSettingsController.js";
import { changeCategoryStatus, createCategory, deleteCategory, getCategory, listCategories, updateCategory } from "../controllers/categorySettingsController.js";
import { getDocumentSettings, updateDocumentSettings } from "../controllers/documentSettingsController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(authenticate);

const canView = authorizeRoles("admin", "contabilidad", "ventas", "almacen");
const canEdit = authorizeRoles("admin");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logosDir = path.resolve(__dirname, "../../uploads/logos");
fs.mkdirSync(logosDir, { recursive: true });

const allowedLogoTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedLogoTypes.has(file.mimetype)) {
      return cb(new Error("Solo se permiten imagenes PNG, JPG, JPEG o WEBP"));
    }
    cb(null, true);
  }
});

const handleLogoUpload = (req, res, next) => {
  logoUpload.single("logo")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "El logo no puede pesar mas de 2MB" });
    }
    return res.status(400).json({ message: error.message || "No se pudo subir el logo" });
  });
};

router.get("/company", canView, getCompanySettings);
router.put("/company", canEdit, updateCompanySettings);
router.post("/company/logo", canEdit, handleLogoUpload, uploadCompanyLogo);

router.get("/taxes", canView, listTaxes);
router.get("/taxes/:id", canView, getTax);
router.post("/taxes", canEdit, createTax);
router.put("/taxes/:id", canEdit, updateTax);
router.patch("/taxes/:id/status", canEdit, changeTaxStatus);
router.patch("/taxes/:id/default", canEdit, setDefaultTax);
router.delete("/taxes/:id", canEdit, deleteTax);

router.get("/numbering", canView, listNumbering);
router.get("/numbering/:id", canView, getNumbering);
router.post("/numbering", canEdit, createNumbering);
router.put("/numbering/:id", canEdit, updateNumbering);
router.patch("/numbering/:id/status", canEdit, changeNumberingStatus);

router.get("/categories", canView, listCategories);
router.get("/categories/:id", canView, getCategory);
router.post("/categories", canEdit, createCategory);
router.put("/categories/:id", canEdit, updateCategory);
router.patch("/categories/:id/status", canEdit, changeCategoryStatus);
router.delete("/categories/:id", canEdit, deleteCategory);

router.get("/documents", canView, getDocumentSettings);
router.put("/documents", canEdit, updateDocumentSettings);

export default router;
