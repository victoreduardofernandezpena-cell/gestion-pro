import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import accountsReceivableRoutes from "./routes/accountsReceivableRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import accountsPayableRoutes from "./routes/accountsPayableRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import cashBoxRoutes from "./routes/cashBoxRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import accountingRoutes from "./routes/accountingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import loyaltyRoutes from "./routes/loyaltyRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import taxesRoutes from "./routes/taxesRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");
fs.mkdirSync(path.join(uploadsDir, "logos"), { recursive: true });
const configuredOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOrigins = [
  ...configuredOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/$/, "");
      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      const error = new Error("Origen no permitido por CORS");
      error.status = 403;
      return callback(error);
    },
    credentials: true
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/accounts-receivable", accountsReceivableRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/accounts-payable", accountsPayableRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/cash-boxes", cashBoxRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/hr", hrRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
