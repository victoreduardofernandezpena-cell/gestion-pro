CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK', 'PERMISSION');
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "positionId" INTEGER,
    "departmentId" INTEGER,
    "salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentFrequency" "PaymentFrequency" NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttendanceRecord" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "hoursWorked" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payroll" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "payrollNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "totalGross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayrollItem" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "payrollId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeePayment" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "payrollId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeePayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");
CREATE UNIQUE INDEX "Position_companyId_name_key" ON "Position"("companyId", "name");
CREATE INDEX "Position_companyId_idx" ON "Position"("companyId");
CREATE UNIQUE INDEX "Employee_companyId_documentId_key" ON "Employee"("companyId", "documentId");
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");
CREATE INDEX "Employee_positionId_idx" ON "Employee"("positionId");
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");
CREATE UNIQUE INDEX "AttendanceRecord_companyId_employeeId_date_key" ON "AttendanceRecord"("companyId", "employeeId", "date");
CREATE INDEX "AttendanceRecord_companyId_idx" ON "AttendanceRecord"("companyId");
CREATE INDEX "AttendanceRecord_employeeId_idx" ON "AttendanceRecord"("employeeId");
CREATE UNIQUE INDEX "Payroll_companyId_payrollNumber_key" ON "Payroll"("companyId", "payrollNumber");
CREATE INDEX "Payroll_companyId_idx" ON "Payroll"("companyId");
CREATE UNIQUE INDEX "PayrollItem_payrollId_employeeId_key" ON "PayrollItem"("payrollId", "employeeId");
CREATE INDEX "PayrollItem_companyId_idx" ON "PayrollItem"("companyId");
CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem"("employeeId");
CREATE INDEX "EmployeePayment_companyId_idx" ON "EmployeePayment"("companyId");
CREATE INDEX "EmployeePayment_employeeId_idx" ON "EmployeePayment"("employeeId");
CREATE INDEX "EmployeePayment_payrollId_idx" ON "EmployeePayment"("payrollId");

ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Position" ADD CONSTRAINT "Position_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmployeePayment" ADD CONSTRAINT "EmployeePayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeePayment" ADD CONSTRAINT "EmployeePayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmployeePayment" ADD CONSTRAINT "EmployeePayment_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;
