import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const requiredDate = (value, message = "Fecha invalida") => {
  const date = dateOrNull(value);
  if (!date) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
  return date;
};

export const assertHrAccess = (req) => requireCompanyId(req);

export const auditHr = (req, action, entityType, entityId, description) =>
  createAuditLog({ action, module: "RECURSOS_HUMANOS", entityType, entityId, description, req });

export const getNextPayrollNumber = async (companyId, tx = prisma) => {
  const rows = await tx.payroll.findMany({ where: { companyId }, select: { payrollNumber: true } });
  const max = rows.reduce((current, row) => {
    const match = row.payrollNumber?.match(/^NOM-(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `NOM-${String(max + 1).padStart(6, "0")}`;
};

export const employeeInclude = {
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } }
};
