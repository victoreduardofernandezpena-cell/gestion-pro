import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { calculatePayrollItems, calculatePayrollTotals } from "../utils/payrollCalculator.js";
import { assertHrAccess, auditHr, employeeInclude, getNextPayrollNumber, requiredDate } from "./hrShared.js";

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const payrollInclude = {
  items: { include: { employee: { include: employeeInclude } } },
  payments: { include: { employee: { select: { firstName: true, lastName: true } } } }
};

export const listPayrolls = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const where = {
      companyId,
      ...(req.query.status ? { status: req.query.status } : {})
    };
    res.json(await prisma.payroll.findMany({ where, include: { _count: { select: { items: true, payments: true } } }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const getPayroll = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const item = id && await prisma.payroll.findFirst({ where: { id, companyId: assertHrAccess(req) }, include: payrollInclude });
    if (!item) return res.status(404).json({ message: "Nomina no encontrada" });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const createPayroll = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const startDate = requiredDate(req.body.startDate, "Fecha inicial obligatoria");
    const endDate = requiredDate(req.body.endDate, "Fecha final obligatoria");
    const paymentDate = requiredDate(req.body.paymentDate, "Fecha de pago obligatoria");
    if (endDate < startDate) return res.status(400).json({ message: "La fecha final no puede ser menor que la inicial" });
    const employeeIds = Array.isArray(req.body.employeeIds) ? req.body.employeeIds.map(Number).filter(Boolean) : [];
    const employees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE", ...(employeeIds.length ? { id: { in: employeeIds } } : {}) }
    });
    if (!employees.length) return res.status(400).json({ message: "No hay empleados activos para generar nomina" });
    const calculatedItems = calculatePayrollItems(employees, req.body.items || []);
    const totals = calculatePayrollTotals(calculatedItems);

    const payroll = await prisma.$transaction(async (tx) => {
      const payrollNumber = await getNextPayrollNumber(companyId, tx);
      return tx.payroll.create({
        data: {
          companyId,
          payrollNumber,
          startDate,
          endDate,
          paymentDate,
          ...totals,
          status: "DRAFT",
          notes: req.body.notes?.trim() || null,
          items: { create: calculatedItems.map((item) => ({ ...item, companyId })) }
        },
        include: payrollInclude
      });
    });
    await auditHr(req, "HR_PAYROLL_CREATED", "Payroll", payroll.id, `Nomina creada: ${payroll.payrollNumber}`);
    res.status(201).json(payroll);
  } catch (error) {
    next(error);
  }
};

export const approvePayroll = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const existing = id && await prisma.payroll.findFirst({ where: { id, companyId: assertHrAccess(req) } });
    if (!existing) return res.status(404).json({ message: "Nomina no encontrada" });
    if (existing.status !== "DRAFT") return res.status(400).json({ message: "Solo una nomina en borrador puede aprobarse" });
    const item = await prisma.payroll.update({ where: { id }, data: { status: "APPROVED" }, include: payrollInclude });
    await auditHr(req, "HR_PAYROLL_APPROVED", "Payroll", item.id, `Nomina aprobada: ${item.payrollNumber}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const payPayroll = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = assertHrAccess(req);
    const method = req.body.method || "BANK_TRANSFER";
    const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : null;
    const cashBoxId = req.body.cashBoxId ? Number(req.body.cashBoxId) : null;
    const existing = id && await prisma.payroll.findFirst({ where: { id, companyId }, include: { items: true } });
    if (!existing) return res.status(404).json({ message: "Nomina no encontrada" });
    if (existing.status !== "APPROVED") return res.status(400).json({ message: "Solo una nomina aprobada puede pagarse" });
    if (bankAccountId && (!Number.isInteger(bankAccountId) || bankAccountId <= 0)) return res.status(400).json({ message: "Cuenta bancaria invalida" });
    if (cashBoxId && (!Number.isInteger(cashBoxId) || cashBoxId <= 0)) return res.status(400).json({ message: "Caja invalida" });
    if (method === "BANK_TRANSFER" && !bankAccountId) return res.status(400).json({ message: "Debe seleccionar la cuenta bancaria que realizara el pago" });
    if (method === "CASH" && !cashBoxId) return res.status(400).json({ message: "Debe seleccionar la caja que realizara el pago" });
    const paymentDate = requiredDate(req.body.paymentDate || existing.paymentDate, "Fecha de pago invalida");
    const totalNet = existing.items.reduce((sum, payrollItem) => sum + Number(payrollItem.netSalary), 0);
    const reference = req.body.reference?.trim() || existing.payrollNumber;
    const item = await prisma.$transaction(async (tx) => {
      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
        if (!bankAccount || !bankAccount.isActive) {
          const error = new Error("Cuenta bancaria no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(bankAccount.currentBalance) < totalNet) {
          const error = new Error("Balance insuficiente en la cuenta bancaria seleccionada");
          error.status = 400;
          throw error;
        }
        await tx.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance: roundMoney(Number(bankAccount.currentBalance) - totalNet) } });
        await tx.bankTransaction.create({ data: { companyId, bankAccountId, type: "WITHDRAWAL", amount: totalNet, description: `Pago nomina #${existing.payrollNumber}`, reference, transactionDate: paymentDate } });
      }
      if (cashBoxId) {
        const cashBox = await tx.cashBox.findFirst({ where: { id: cashBoxId, companyId } });
        if (!cashBox || !cashBox.isActive) {
          const error = new Error("Caja no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(cashBox.currentBalance) < totalNet) {
          const error = new Error("Balance insuficiente en la caja seleccionada");
          error.status = 400;
          throw error;
        }
        await tx.cashBox.update({ where: { id: cashBoxId }, data: { currentBalance: roundMoney(Number(cashBox.currentBalance) - totalNet) } });
        await tx.cashTransaction.create({ data: { companyId, cashBoxId, type: "CASH_OUT", amount: totalNet, description: `Pago nomina #${existing.payrollNumber}`, reference, transactionDate: paymentDate } });
      }
      for (const payrollItem of existing.items) {
        await tx.employeePayment.create({
          data: {
            companyId,
            employeeId: payrollItem.employeeId,
            payrollId: existing.id,
            amount: payrollItem.netSalary,
            method,
            reference,
            paymentDate,
            notes: req.body.notes?.trim() || "Pago de nomina"
          }
        });
      }
      return tx.payroll.update({ where: { id }, data: { status: "PAID", paymentDate }, include: payrollInclude });
    });
    await auditHr(req, "HR_PAYROLL_PAID", "Payroll", item.id, `Nomina pagada: ${item.payrollNumber}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const cancelPayroll = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const existing = id && await prisma.payroll.findFirst({ where: { id, companyId: assertHrAccess(req) } });
    if (!existing) return res.status(404).json({ message: "Nomina no encontrada" });
    if (existing.status === "PAID") return res.status(400).json({ message: "No se puede cancelar una nomina pagada" });
    const item = await prisma.payroll.update({ where: { id }, data: { status: "CANCELLED" }, include: payrollInclude });
    await auditHr(req, "HR_PAYROLL_CANCELLED", "Payroll", item.id, `Nomina cancelada: ${item.payrollNumber}`);
    res.json(item);
  } catch (error) {
    next(error);
  }
};
