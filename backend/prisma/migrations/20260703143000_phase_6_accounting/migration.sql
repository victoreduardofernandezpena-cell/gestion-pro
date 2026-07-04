-- CreateEnum
CREATE TYPE "AccountingAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountingEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AccountingAccount" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountingAccountType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" SERIAL NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "totalDebit" DECIMAL(12,2) NOT NULL,
    "totalCredit" DECIMAL(12,2) NOT NULL,
    "status" "AccountingEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntryLine" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingAccount_code_key" ON "AccountingAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEntry_entryNumber_key" ON "AccountingEntry"("entryNumber");

-- AddForeignKey
ALTER TABLE "AccountingEntryLine" ADD CONSTRAINT "AccountingEntryLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "AccountingEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntryLine" ADD CONSTRAINT "AccountingEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
