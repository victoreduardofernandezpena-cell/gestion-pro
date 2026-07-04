import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { requireCompanyId } from "../utils/companyScope.js";

const includeUser = { user: { select: { id: true, name: true, email: true, role: true } } };

const dateFilter = (query) => {
  const filter = {};
  if (query.startDate) filter.gte = new Date(query.startDate);
  if (query.endDate) {
    const end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return Object.keys(filter).length ? { createdAt: filter } : {};
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const userId = Number(req.query.userId);
    const where = {
      companyId: requireCompanyId(req),
      ...dateFilter(req.query),
      ...(Number.isInteger(userId) && userId > 0 ? { userId } : {}),
      ...(req.query.action ? { action: { contains: req.query.action.trim(), mode: "insensitive" } } : {}),
      ...(req.query.module ? { module: { contains: req.query.module.trim(), mode: "insensitive" } } : {})
    };
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, include: includeUser, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count({ where })
    ]);
    res.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de log invalido" });
    const log = await prisma.auditLog.findFirst({ where: { id, companyId: requireCompanyId(req) }, include: includeUser });
    if (!log) return res.status(404).json({ message: "Log no encontrado" });
    res.json(log);
  } catch (error) {
    next(error);
  }
};
