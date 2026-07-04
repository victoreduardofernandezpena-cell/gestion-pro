import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { assertHrAccess, auditHr } from "./hrShared.js";

export const listDepartments = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const rows = await prisma.department.findMany({ where: { companyId }, orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } });
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getDepartment = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const item = id && await prisma.department.findFirst({ where: { id, companyId: assertHrAccess(req) }, include: { employees: { include: { position: true } } } });
    if (!item) return res.status(404).json({ message: "Departamento no encontrado" });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "El nombre es obligatorio" });
    const duplicate = await prisma.department.findFirst({ where: { companyId, name, isActive: true } });
    if (duplicate) return res.status(409).json({ message: "Ya existe un departamento activo con ese nombre" });
    const item = await prisma.department.create({ data: { companyId, name, description: req.body.description?.trim() || null } });
    await auditHr(req, "HR_DEPARTMENT_CREATED", "Department", item.id, `Departamento creado: ${item.name}`);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.department.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Departamento no encontrado" });
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "El nombre es obligatorio" });
    const duplicate = await prisma.department.findFirst({ where: { companyId, name, isActive: true, id: { not: id } } });
    if (duplicate) return res.status(409).json({ message: "Ya existe un departamento activo con ese nombre" });
    const item = await prisma.department.update({ where: { id }, data: { name, description: req.body.description?.trim() || null } });
    await auditHr(req, "HR_DEPARTMENT_UPDATED", "Department", item.id, `Departamento actualizado: ${item.name}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const changeDepartmentStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.department.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Departamento no encontrado" });
    const item = await prisma.department.update({ where: { id }, data: { isActive: Boolean(req.body.isActive) } });
    await auditHr(req, "HR_DEPARTMENT_STATUS_CHANGED", "Department", item.id, `Departamento ${item.isActive ? "activado" : "desactivado"}: ${item.name}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.department.findFirst({ where: { id, companyId }, include: { _count: { select: { employees: true } } } });
    if (!existing) return res.status(404).json({ message: "Departamento no encontrado" });
    if (existing._count.employees > 0) {
      const item = await prisma.department.update({ where: { id }, data: { isActive: false } });
      await auditHr(req, "HR_DEPARTMENT_STATUS_CHANGED", "Department", item.id, `Departamento desactivado: ${item.name}`);
      return res.json(item);
    }
    await prisma.department.delete({ where: { id } });
    await auditHr(req, "HR_DEPARTMENT_DELETED", "Department", id, `Departamento eliminado: ${existing.name}`);
    return sendDeleted(res, "Departamento");
  } catch (error) {
    next(error);
  }
};
