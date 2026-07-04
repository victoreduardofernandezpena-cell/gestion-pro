import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { assertHrAccess, auditHr, dateOrNull, emailRegex, employeeInclude, requiredDate } from "./hrShared.js";

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "TERMINATED"];
const FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY"];

const employeeData = (body, { partial = false } = {}) => {
  const data = {
    firstName: body.firstName?.trim(),
    lastName: body.lastName?.trim(),
    documentId: body.documentId?.trim() || null,
    phone: body.phone?.trim() || null,
    email: body.email?.trim().toLowerCase() || null,
    address: body.address?.trim() || null,
    birthDate: dateOrNull(body.birthDate),
    hireDate: partial && !body.hireDate ? undefined : requiredDate(body.hireDate, "La fecha de ingreso es obligatoria"),
    terminationDate: dateOrNull(body.terminationDate),
    positionId: body.positionId ? Number(body.positionId) : null,
    departmentId: body.departmentId ? Number(body.departmentId) : null,
    salary: Number(body.salary || 0),
    paymentFrequency: body.paymentFrequency,
    status: body.status || "ACTIVE",
    notes: body.notes?.trim() || null
  };
  return data;
};

const validateEmployee = async (companyId, data, id = null) => {
  if (!data.firstName) return "El nombre es obligatorio";
  if (!data.lastName) return "El apellido es obligatorio";
  if (data.email && !emailRegex.test(data.email)) return "Email invalido";
  if (data.salary < 0) return "El salario no puede ser negativo";
  if (!FREQUENCIES.includes(data.paymentFrequency)) return "Frecuencia de pago invalida";
  if (!STATUSES.includes(data.status)) return "Estado invalido";
  if (data.documentId) {
    const duplicate = await prisma.employee.findFirst({ where: { companyId, documentId: data.documentId, ...(id ? { id: { not: id } } : {}) } });
    if (duplicate) return "Ya existe un empleado con ese documento";
  }
  return null;
};

export const listEmployees = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const search = req.query.search?.trim();
    const where = {
      companyId,
      ...(STATUSES.includes(req.query.status) ? { status: req.query.status } : {}),
      ...(req.query.departmentId ? { departmentId: Number(req.query.departmentId) } : {}),
      ...(req.query.positionId ? { positionId: Number(req.query.positionId) } : {}),
      ...(search ? { OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { documentId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ] } : {})
    };
    res.json(await prisma.employee.findMany({ where, include: employeeInclude, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const item = id && await prisma.employee.findFirst({
      where: { id, companyId: assertHrAccess(req) },
      include: {
        ...employeeInclude,
        attendanceRecords: { orderBy: { date: "desc" }, take: 20 },
        payments: { orderBy: { paymentDate: "desc" }, take: 20, include: { payroll: { select: { payrollNumber: true } } } },
        payrollItems: { orderBy: { createdAt: "desc" }, take: 20, include: { payroll: true } }
      }
    });
    if (!item) return res.status(404).json({ message: "Empleado no encontrado" });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const data = employeeData(req.body);
    const message = await validateEmployee(companyId, data);
    if (message) return res.status(400).json({ message });
    const item = await prisma.employee.create({ data: { ...data, companyId }, include: employeeInclude });
    await auditHr(req, "HR_EMPLOYEE_CREATED", "Employee", item.id, `Empleado creado: ${item.firstName} ${item.lastName}`);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.employee.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Empleado no encontrado" });
    const data = employeeData(req.body);
    const message = await validateEmployee(companyId, data, id);
    if (message) return res.status(400).json({ message });
    const item = await prisma.employee.update({ where: { id }, data, include: employeeInclude });
    await auditHr(req, "HR_EMPLOYEE_UPDATED", "Employee", item.id, `Empleado actualizado: ${item.firstName} ${item.lastName}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const changeEmployeeStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const status = req.body.status;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: "Estado invalido" });
    const existing = id && await prisma.employee.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Empleado no encontrado" });
    const item = await prisma.employee.update({ where: { id }, data: { status, terminationDate: status === "TERMINATED" ? dateOrNull(req.body.terminationDate) || new Date() : dateOrNull(req.body.terminationDate) }, include: employeeInclude });
    await auditHr(req, "HR_EMPLOYEE_STATUS_CHANGED", "Employee", item.id, `Estado cambiado a ${status}: ${item.firstName} ${item.lastName}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.employee.findFirst({ where: { id, companyId }, include: { _count: { select: { attendanceRecords: true, payrollItems: true, payments: true } } } });
    if (!existing) return res.status(404).json({ message: "Empleado no encontrado" });
    if (existing._count.attendanceRecords || existing._count.payrollItems || existing._count.payments) {
      const item = await prisma.employee.update({ where: { id }, data: { status: "INACTIVE" }, include: employeeInclude });
      await auditHr(req, "HR_EMPLOYEE_STATUS_CHANGED", "Employee", item.id, `Empleado inactivado: ${item.firstName} ${item.lastName}`);
      return res.json(item);
    }
    await prisma.employee.delete({ where: { id } });
    await auditHr(req, "HR_EMPLOYEE_DELETED", "Employee", id, `Empleado eliminado: ${existing.firstName} ${existing.lastName}`);
    return sendDeleted(res, "Empleado");
  } catch (error) {
    next(error);
  }
};
