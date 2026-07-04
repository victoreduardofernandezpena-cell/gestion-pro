import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { calculateHoursWorked } from "../utils/payrollCalculator.js";
import { assertHrAccess, auditHr, dateOrNull, employeeInclude, requiredDate } from "./hrShared.js";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "VACATION", "SICK", "PERMISSION"];

const attendanceData = (body) => {
  const date = requiredDate(body.date, "La fecha es obligatoria");
  date.setHours(0, 0, 0, 0);
  const checkIn = dateOrNull(body.checkIn);
  const checkOut = dateOrNull(body.checkOut);
  return {
    employeeId: Number(body.employeeId),
    date,
    checkIn,
    checkOut,
    hoursWorked: calculateHoursWorked(checkIn, checkOut),
    status: body.status,
    notes: body.notes?.trim() || null
  };
};

export const listAttendance = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const where = {
      companyId,
      ...(req.query.employeeId ? { employeeId: Number(req.query.employeeId) } : {}),
      ...(STATUSES.includes(req.query.status) ? { status: req.query.status } : {}),
      ...(req.query.date ? { date: requiredDate(req.query.date) } : {})
    };
    if (where.date) where.date.setHours(0, 0, 0, 0);
    res.json(await prisma.attendanceRecord.findMany({ where, include: { employee: { include: employeeInclude } }, orderBy: { date: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const listEmployeeAttendance = async (req, res, next) => {
  try {
    const employeeId = parseIdParam(req.params.id);
    res.json(await prisma.attendanceRecord.findMany({ where: { companyId: assertHrAccess(req), employeeId }, orderBy: { date: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const createAttendance = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const data = attendanceData(req.body);
    if (!data.employeeId) return res.status(400).json({ message: "Empleado obligatorio" });
    if (!STATUSES.includes(data.status)) return res.status(400).json({ message: "Estado de asistencia invalido" });
    const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, companyId } });
    if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });
    const duplicate = await prisma.attendanceRecord.findUnique({ where: { companyId_employeeId_date: { companyId, employeeId: data.employeeId, date: data.date } } });
    if (duplicate) return res.status(409).json({ message: "Ya existe asistencia para este empleado en esa fecha" });
    const item = await prisma.attendanceRecord.create({ data: { ...data, companyId }, include: { employee: true } });
    await auditHr(req, "HR_ATTENDANCE_CREATED", "AttendanceRecord", item.id, `Asistencia registrada: ${employee.firstName} ${employee.lastName}`);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.attendanceRecord.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Asistencia no encontrada" });
    const data = attendanceData(req.body);
    if (!STATUSES.includes(data.status)) return res.status(400).json({ message: "Estado de asistencia invalido" });
    const duplicate = await prisma.attendanceRecord.findFirst({ where: { companyId, employeeId: data.employeeId, date: data.date, id: { not: id } } });
    if (duplicate) return res.status(409).json({ message: "Ya existe asistencia para este empleado en esa fecha" });
    const item = await prisma.attendanceRecord.update({ where: { id }, data, include: { employee: true } });
    await auditHr(req, "HR_ATTENDANCE_UPDATED", "AttendanceRecord", item.id, "Asistencia actualizada");
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteAttendance = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const existing = id && await prisma.attendanceRecord.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Asistencia no encontrada" });
    await prisma.attendanceRecord.delete({ where: { id } });
    await auditHr(req, "HR_ATTENDANCE_DELETED", "AttendanceRecord", id, "Asistencia eliminada");
    return sendDeleted(res, "Asistencia");
  } catch (error) {
    next(error);
  }
};
