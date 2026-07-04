import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { assertHrAccess, auditHr, employeeInclude, requiredDate } from "./hrShared.js";

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "CHECK", "OTHER"];
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const listEmployeePayments = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    res.json(await prisma.employeePayment.findMany({
      where: { companyId, ...(req.query.employeeId ? { employeeId: Number(req.query.employeeId) } : {}) },
      include: { employee: { include: employeeInclude }, payroll: { select: { payrollNumber: true } } },
      orderBy: { paymentDate: "desc" }
    }));
  } catch (error) {
    next(error);
  }
};

export const listEmployeePaymentsByEmployee = async (req, res, next) => {
  try {
    const employeeId = parseIdParam(req.params.id);
    res.json(await prisma.employeePayment.findMany({
      where: { companyId: assertHrAccess(req), employeeId },
      include: { payroll: { select: { payrollNumber: true } } },
      orderBy: { paymentDate: "desc" }
    }));
  } catch (error) {
    next(error);
  }
};

export const createEmployeePayment = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const employeeId = Number(req.body.employeeId);
    const amount = Number(req.body.amount || 0);
    const method = req.body.method;
    const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : null;
    const cashBoxId = req.body.cashBoxId ? Number(req.body.cashBoxId) : null;
    if (!employeeId) return res.status(400).json({ message: "Empleado obligatorio" });
    if (amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!METHODS.includes(method)) return res.status(400).json({ message: "Metodo de pago invalido" });
    if (bankAccountId && (!Number.isInteger(bankAccountId) || bankAccountId <= 0)) return res.status(400).json({ message: "Cuenta bancaria invalida" });
    if (cashBoxId && (!Number.isInteger(cashBoxId) || cashBoxId <= 0)) return res.status(400).json({ message: "Caja invalida" });
    if (method === "BANK_TRANSFER" && !bankAccountId) return res.status(400).json({ message: "Debe seleccionar la cuenta bancaria que realizara el pago" });
    if (method === "CASH" && !cashBoxId) return res.status(400).json({ message: "Debe seleccionar la caja que realizara el pago" });
    const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });
    const paymentDate = requiredDate(req.body.paymentDate, "Fecha de pago obligatoria");
    const reference = req.body.reference?.trim() || null;
    const item = await prisma.$transaction(async (tx) => {
      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
        if (!bankAccount || !bankAccount.isActive) {
          const error = new Error("Cuenta bancaria no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(bankAccount.currentBalance) < amount) {
          const error = new Error("Balance insuficiente en la cuenta bancaria seleccionada");
          error.status = 400;
          throw error;
        }
        await tx.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance: roundMoney(Number(bankAccount.currentBalance) - amount) } });
        await tx.bankTransaction.create({ data: { companyId, bankAccountId, type: "WITHDRAWAL", amount, description: `Pago empleado: ${employee.firstName} ${employee.lastName}`, reference, transactionDate: paymentDate } });
      }
      if (cashBoxId) {
        const cashBox = await tx.cashBox.findFirst({ where: { id: cashBoxId, companyId } });
        if (!cashBox || !cashBox.isActive) {
          const error = new Error("Caja no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(cashBox.currentBalance) < amount) {
          const error = new Error("Balance insuficiente en la caja seleccionada");
          error.status = 400;
          throw error;
        }
        await tx.cashBox.update({ where: { id: cashBoxId }, data: { currentBalance: roundMoney(Number(cashBox.currentBalance) - amount) } });
        await tx.cashTransaction.create({ data: { companyId, cashBoxId, type: "CASH_OUT", amount, description: `Pago empleado: ${employee.firstName} ${employee.lastName}`, reference, transactionDate: paymentDate } });
      }
      return tx.employeePayment.create({
        data: {
          companyId,
          employeeId,
          payrollId: req.body.payrollId ? Number(req.body.payrollId) : null,
          amount,
          method,
          reference,
          paymentDate,
          notes: req.body.notes?.trim() || null
        },
        include: { employee: { include: employeeInclude }, payroll: true }
      });
    });
    await auditHr(req, "HR_EMPLOYEE_PAYMENT_CREATED", "EmployeePayment", item.id, `Pago a empleado: ${employee.firstName} ${employee.lastName}`);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};
