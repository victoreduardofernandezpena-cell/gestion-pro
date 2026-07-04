import { roundMoney } from "./dashboardAnalytics.js";

export const calculateHoursWorked = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  return roundMoney((end.getTime() - start.getTime()) / (1000 * 60 * 60));
};

export const payrollGrossForEmployee = (employee) => {
  const salary = Number(employee.salary || 0);
  if (employee.paymentFrequency === "WEEKLY") return roundMoney(salary / 4);
  if (employee.paymentFrequency === "BIWEEKLY") return roundMoney(salary / 2);
  return roundMoney(salary);
};

export const calculatePayrollItems = (employees, overrides = []) => {
  const overrideMap = new Map(overrides.map((item) => [Number(item.employeeId), item]));
  return employees.map((employee) => {
    const override = overrideMap.get(employee.id) || {};
    const grossSalary = roundMoney(override.grossSalary ?? payrollGrossForEmployee(employee));
    const deductions = roundMoney(override.deductions || 0);
    const bonuses = roundMoney(override.bonuses || 0);
    const netSalary = roundMoney(grossSalary + bonuses - deductions);
    return {
      employeeId: employee.id,
      grossSalary,
      deductions,
      bonuses,
      netSalary,
      notes: override.notes || null
    };
  });
};

export const calculatePayrollTotals = (items) => ({
  totalGross: roundMoney(items.reduce((sum, item) => sum + Number(item.grossSalary || 0), 0)),
  totalDeductions: roundMoney(items.reduce((sum, item) => sum + Number(item.deductions || 0), 0)),
  totalNet: roundMoney(items.reduce((sum, item) => sum + Number(item.netSalary || 0), 0))
});
