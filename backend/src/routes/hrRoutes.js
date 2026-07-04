import { Router } from "express";
import { createAttendance, deleteAttendance, listAttendance, listEmployeeAttendance, updateAttendance } from "../controllers/attendanceController.js";
import { changeDepartmentStatus, createDepartment, deleteDepartment, getDepartment, listDepartments, updateDepartment } from "../controllers/departmentController.js";
import { changeEmployeeStatus, createEmployee, deleteEmployee, getEmployee, listEmployees, updateEmployee } from "../controllers/employeeController.js";
import { createEmployeePayment, listEmployeePayments, listEmployeePaymentsByEmployee } from "../controllers/employeePaymentController.js";
import { getAttendanceReport, getEmployeesReport, getHrSummary, getPayrollReport } from "../controllers/hrReportController.js";
import { approvePayroll, cancelPayroll, createPayroll, getPayroll, listPayrolls, payPayroll } from "../controllers/payrollController.js";
import { changePositionStatus, createPosition, deletePosition, getPosition, listPositions, updatePosition } from "../controllers/positionController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/summary", getHrSummary);
router.get("/reports/payroll", getPayrollReport);
router.get("/reports/attendance", getAttendanceReport);
router.get("/reports/employees", getEmployeesReport);

router.get("/departments", listDepartments);
router.get("/departments/:id", getDepartment);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.patch("/departments/:id/status", changeDepartmentStatus);
router.delete("/departments/:id", deleteDepartment);

router.get("/positions", listPositions);
router.get("/positions/:id", getPosition);
router.post("/positions", createPosition);
router.put("/positions/:id", updatePosition);
router.patch("/positions/:id/status", changePositionStatus);
router.delete("/positions/:id", deletePosition);

router.get("/employees", listEmployees);
router.get("/employees/:id", getEmployee);
router.post("/employees", createEmployee);
router.put("/employees/:id", updateEmployee);
router.patch("/employees/:id/status", changeEmployeeStatus);
router.delete("/employees/:id", deleteEmployee);

router.get("/attendance", listAttendance);
router.get("/employees/:id/attendance", listEmployeeAttendance);
router.post("/attendance", createAttendance);
router.put("/attendance/:id", updateAttendance);
router.delete("/attendance/:id", deleteAttendance);

router.get("/payrolls", listPayrolls);
router.get("/payrolls/:id", getPayroll);
router.post("/payrolls", createPayroll);
router.patch("/payrolls/:id/approve", approvePayroll);
router.patch("/payrolls/:id/pay", payPayroll);
router.patch("/payrolls/:id/cancel", cancelPayroll);

router.get("/payments", listEmployeePayments);
router.get("/employees/:id/payments", listEmployeePaymentsByEmployee);
router.post("/payments", createEmployeePayment);

export default router;
