import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { assertHrAccess, auditHr } from "./hrShared.js";

const positionData = (body) => ({
  name: body.name?.trim(),
  description: body.description?.trim() || null,
  baseSalary: Number(body.baseSalary || 0)
});

export const listPositions = async (req, res, next) => {
  try {
    const rows = await prisma.position.findMany({ where: { companyId: assertHrAccess(req) }, orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } });
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getPosition = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const item = id && await prisma.position.findFirst({ where: { id, companyId: assertHrAccess(req) }, include: { employees: { include: { department: true } } } });
    if (!item) return res.status(404).json({ message: "Puesto no encontrado" });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createPosition = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const data = positionData(req.body);
    if (!data.name) return res.status(400).json({ message: "El nombre es obligatorio" });
    if (data.baseSalary < 0) return res.status(400).json({ message: "El salario base no puede ser negativo" });
    const duplicate = await prisma.position.findFirst({ where: { companyId, name: data.name, isActive: true } });
    if (duplicate) return res.status(409).json({ message: "Ya existe un puesto activo con ese nombre" });
    const item = await prisma.position.create({ data: { ...data, companyId } });
    await auditHr(req, "HR_POSITION_CREATED", "Position", item.id, `Puesto creado: ${item.name}`);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updatePosition = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.position.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Puesto no encontrado" });
    const data = positionData(req.body);
    if (!data.name) return res.status(400).json({ message: "El nombre es obligatorio" });
    if (data.baseSalary < 0) return res.status(400).json({ message: "El salario base no puede ser negativo" });
    const duplicate = await prisma.position.findFirst({ where: { companyId, name: data.name, isActive: true, id: { not: id } } });
    if (duplicate) return res.status(409).json({ message: "Ya existe un puesto activo con ese nombre" });
    const item = await prisma.position.update({ where: { id }, data });
    await auditHr(req, "HR_POSITION_UPDATED", "Position", item.id, `Puesto actualizado: ${item.name}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const changePositionStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.position.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Puesto no encontrado" });
    const item = await prisma.position.update({ where: { id }, data: { isActive: Boolean(req.body.isActive) } });
    await auditHr(req, "HR_POSITION_STATUS_CHANGED", "Position", item.id, `Puesto ${item.isActive ? "activado" : "desactivado"}: ${item.name}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deletePosition = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.position.findFirst({ where: { id, companyId }, include: { _count: { select: { employees: true } } } });
    if (!existing) return res.status(404).json({ message: "Puesto no encontrado" });
    if (existing._count.employees > 0) {
      const item = await prisma.position.update({ where: { id }, data: { isActive: false } });
      await auditHr(req, "HR_POSITION_STATUS_CHANGED", "Position", item.id, `Puesto desactivado: ${item.name}`);
      return res.json(item);
    }
    await prisma.position.delete({ where: { id } });
    await auditHr(req, "HR_POSITION_DELETED", "Position", id, `Puesto eliminado: ${existing.name}`);
    return sendDeleted(res, "Puesto");
  } catch (error) {
    next(error);
  }
};
