import { Router } from "express";
import {
  accountingReport,
  accountsPayableReport,
  accountsReceivableReport,
  bankReport,
  cashBoxReport,
  expensesReport,
  exportAccountingReport,
  exportReport,
  inventoryReport,
  purchasesReport,
  salesReport,
  summaryReport
} from "../controllers/reportController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);

const allReports = authorizeRoles("admin", "contabilidad");
const salesAccess = authorizeRoles("admin", "contabilidad", "ventas");
const warehouseAccess = authorizeRoles("admin", "contabilidad", "almacen");

router.get("/summary", allReports, summaryReport);

router.get("/sales", salesAccess, salesReport);
router.get("/sales/export/excel", salesAccess, exportReport("sales", "excel"));
router.get("/sales/export/pdf", salesAccess, exportReport("sales", "pdf"));

router.get("/purchases", warehouseAccess, purchasesReport);
router.get("/purchases/export/excel", warehouseAccess, exportReport("purchases", "excel"));
router.get("/purchases/export/pdf", warehouseAccess, exportReport("purchases", "pdf"));

router.get("/inventory", warehouseAccess, inventoryReport);
router.get("/inventory/export/excel", warehouseAccess, exportReport("inventory", "excel"));
router.get("/inventory/export/pdf", warehouseAccess, exportReport("inventory", "pdf"));

router.get("/accounts-receivable", salesAccess, accountsReceivableReport);
router.get("/accounts-reivable", salesAccess, accountsReceivableReport);
router.get("/accounts-receivable/export/excel", salesAccess, exportReport("accounts-receivable", "excel"));
router.get("/accounts-receivable/export/pdf", salesAccess, exportReport("accounts-receivable", "pdf"));

router.get("/accounts-payable", warehouseAccess, accountsPayableReport);
router.get("/accounts-payable/export/excel", warehouseAccess, exportReport("accounts-payable", "excel"));
router.get("/accounts-payable/export/pdf", warehouseAccess, exportReport("accounts-payable", "pdf"));

router.get("/expenses", allReports, expensesReport);
router.get("/expenses/export/excel", allReports, exportReport("expenses", "excel"));
router.get("/expenses/export/pdf", allReports, exportReport("expenses", "pdf"));

router.get("/bank", allReports, bankReport);
router.get("/bank/export/excel", allReports, exportReport("bank", "excel"));
router.get("/bank/export/pdf", allReports, exportReport("bank", "pdf"));

router.get("/cash-box", allReports, cashBoxReport);
router.get("/cash-box/export/excel", allReports, exportReport("cash-box", "excel"));
router.get("/cash-box/export/pdf", allReports, exportReport("cash-box", "pdf"));

router.get("/accounting", allReports, accountingReport);
router.get("/accounting/export/excel", allReports, exportAccountingReport("excel"));
router.get("/accounting/export/pdf", allReports, exportAccountingReport("pdf"));

export default router;
