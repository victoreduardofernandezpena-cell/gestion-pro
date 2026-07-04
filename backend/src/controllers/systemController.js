import os from "os";
import prisma from "../prisma.js";
import { listBackupFiles } from "../utils/backupUtils.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const getDatabaseStatus = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "connected";
  } catch (error) {
    return "disconnected";
  }
};

export const health = async (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: await getDatabaseStatus()
  });
};

export const status = async (req, res) => {
  const companyId = requireCompanyId(req);
  const [databaseStatus, totalUsers, totalClients, totalProducts, totalInvoices, totalPurchases, totalExpenses, backups] =
    await Promise.all([
      getDatabaseStatus(),
      prisma.userCompany.count({ where: { companyId, isActive: true, user: { isActive: true } } }),
      prisma.client.count({ where: { companyId } }),
      prisma.product.count({ where: { companyId } }),
      prisma.invoice.count({ where: { companyId } }),
      prisma.purchase.count({ where: { companyId } }),
      prisma.expense.count({ where: { companyId } }),
      listBackupFiles()
    ]);

  await createAuditLog({
    action: "SYSTEM_STATUS_VIEWED",
    module: "SYSTEM",
    entityType: "System",
    description: "Consulta de estado del sistema",
    req
  });

  res.json({
    backendStatus: "ok",
    databaseStatus,
    totalUsers,
    totalClients,
    totalProducts,
    totalInvoices,
    totalPurchases,
    totalExpenses,
    lastBackup: backups[0] || null,
    appVersion: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime()
  });
};

export const info = async (req, res) => {
  res.json({
    appName: "Gestion Pro",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: `${os.platform()} ${os.release()}`,
    databaseProvider: "postgresql",
    frontendUrl: process.env.FRONTEND_URL || null
  });
};
