import prisma from "../prisma.js";
import { roundMoney, sumBy } from "../utils/dashboardAnalytics.js";
import { assertHrAccess, employeeInclude, requiredDate } from "./hrShared.js";

const currentMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  };
};

export const getHrSummary = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const { start, end } = currentMonthRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [employees, payrollsThisMonth, paidPayments, attendanceToday] = await Promise.all([
      prisma.employee.findMany({ where: { companyId }, select: { status: true, salary: true } }),
      prisma.payroll.findMany({ where: { companyId, createdAt: { gte: start, lte: end } } }),
      prisma.employeePayment.findMany({ where: { companyId, paymentDate: { gte: start, lte: end } } }),
      prisma.attendanceRecord.findMany({ where: { companyId, date: { gte: today, lt: tomorrow } } })
    ]);
    const active = employees.filter((employee) => employee.status === "ACTIVE");
    const pendingPayrollAmount = sumBy(payrollsThisMonth.filter((item) => item.status === "DRAFT" || item.status === "APPROVED"), (item) => item.totalNet);
    res.json({
      totalEmployees: employees.length,
      activeEmployees: active.length,
      inactiveEmployees: employees.length - active.length,
      monthlyPayrollEstimate: roundMoney(sumBy(active, (employee) => employee.salary)),
      payrollsThisMonth: payrollsThisMonth.length,
      paidThisMonth: roundMoney(sumBy(paidPayments, (payment) => payment.amount)),
      pendingPayrollAmount: roundMoney(pendingPayrollAmount),
      attendanceToday: {
        present: attendanceToday.filter((item) => item.status === "PRESENT").length,
        absent: attendanceToday.filter((item) => item.status === "ABSENT").length,
        late: attendanceToday.filter((item) => item.status === "LATE").length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollReport = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const where = { companyId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.startDate && req.query.endDate) {
      where.paymentDate = { gte: requiredDate(req.query.startDate), lte: requiredDate(req.query.endDate) };
    }
    const payrolls = await prisma.payroll.findMany({ where, include: { payments: true, _count: { select: { items: true } } }, orderBy: { paymentDate: "desc" } });
    res.json({
      payrolls,
      totalGross: roundMoney(sumBy(payrolls, (item) => item.totalGross)),
      totalDeductions: roundMoney(sumBy(payrolls, (item) => item.totalDeductions)),
      totalNet: roundMoney(sumBy(payrolls, (item) => item.totalNet)),
      totalPaid: roundMoney(payrolls.reduce((sum, item) => sum + sumBy(item.payments, (payment) => payment.amount), 0))
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceReport = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const where = { companyId };
    if (req.query.employeeId) where.employeeId = Number(req.query.employeeId);
    if (req.query.status) where.status = req.query.status;
    if (req.query.startDate && req.query.endDate) {
      where.date = { gte: requiredDate(req.query.startDate), lte: requiredDate(req.query.endDate) };
    }
    const records = await prisma.attendanceRecord.findMany({ where, include: { employee: { include: employeeInclude } }, orderBy: { date: "desc" } });
    const summaryByStatus = records.reduce((map, record) => ({ ...map, [record.status]: (map[record.status] || 0) + 1 }), {});
    res.json({ records, summaryByStatus });
  } catch (error) {
    next(error);
  }
};

export const getEmployeesReport = async (req, res, next) => {
  try {
    const companyId = assertHrAccess(req);
    const employees = await prisma.employee.findMany({ where: { companyId }, include: employeeInclude, orderBy: { lastName: "asc" } });
    const byDepartment = employees.reduce((map, employee) => ({ ...map, [employee.department?.name || "Sin departamento"]: (map[employee.department?.name || "Sin departamento"] || 0) + 1 }), {});
    const byPosition = employees.reduce((map, employee) => ({ ...map, [employee.position?.name || "Sin puesto"]: (map[employee.position?.name || "Sin puesto"] || 0) + 1 }), {});
    res.json({
      employees,
      active: employees.filter((employee) => employee.status === "ACTIVE").length,
      inactive: employees.filter((employee) => employee.status !== "ACTIVE").length,
      byDepartment,
      byPosition
    });
  } catch (error) {
    next(error);
  }
};
