import { Router } from "express";
import {
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  duplicateInvoice,
  downloadInvoicePdf,
  getInvoice,
  listInvoices,
  updateInvoice
} from "../controllers/invoiceController.js";
import { createInvoicePayment, createInvoicePaymentBreakdown, listInvoicePayments } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRoles("admin", "ventas", "contabilidad"), listInvoices);
router.get("/:id/pdf", authorizeRoles("admin", "ventas", "contabilidad"), downloadInvoicePdf);
router.get("/:id", authorizeRoles("admin", "ventas", "contabilidad"), getInvoice);
router.post("/", authorizeRoles("admin", "ventas"), createInvoice);
router.put("/:id", authorizeRoles("admin", "ventas"), updateInvoice);
router.post("/:id/duplicate", authorizeRoles("admin", "ventas"), duplicateInvoice);
router.delete("/:id", authorizeRoles("admin"), deleteInvoice);
router.patch("/:id/cancel", authorizeRoles("admin", "ventas"), cancelInvoice);
router.get("/:id/payments", authorizeRoles("admin", "ventas", "contabilidad"), listInvoicePayments);
router.post("/:id/payments/breakdown", authorizeRoles("admin", "ventas", "contabilidad"), createInvoicePaymentBreakdown);
router.post("/:id/payments", authorizeRoles("admin", "ventas", "contabilidad"), createInvoicePayment);

export default router;
