-- Create companies first so existing data can be assigned safely.
CREATE TABLE "Company" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "tradeName" TEXT,
  "code" TEXT NOT NULL,
  "rnc" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

INSERT INTO "Company" ("name", "tradeName", "code", "isActive")
VALUES ('Empresa Inicial', 'Empresa Inicial', 'DEFAULT', true)
ON CONFLICT ("code") DO NOTHING;

CREATE TABLE "UserCompany" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "role" "Role" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");
CREATE INDEX "UserCompany_userId_idx" ON "UserCompany"("userId");
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");

INSERT INTO "UserCompany" ("userId", "companyId", "role", "isActive")
SELECT u."id", c."id", u."role", u."isActive"
FROM "User" u
CROSS JOIN "Company" c
WHERE c."code" = 'DEFAULT'
ON CONFLICT ("userId", "companyId") DO NOTHING;

-- Add tenant columns.
ALTER TABLE "AuditLog" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Client" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Product" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "InventoryMovement" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "LoyaltyAccount" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "LoyaltyTransaction" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "LoyaltySetting" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Supplier" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "PurchasePayment" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "BankAccount" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "BankTransaction" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "CashBox" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "CashTransaction" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Expense" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "AccountingAccount" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "AccountingEntry" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "AccountingEntryLine" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "CompanySetting" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "TaxSetting" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "NumberingSetting" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "SystemCategory" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "DocumentSetting" ADD COLUMN "companyId" INTEGER;

-- Assign existing historical records to the initial company.
UPDATE "AuditLog" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "Client" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "Product" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "Invoice" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "Payment" p SET "companyId" = i."companyId" FROM "Invoice" i WHERE p."invoiceId" = i."id";
UPDATE "LoyaltyAccount" la SET "companyId" = c."companyId" FROM "Client" c WHERE la."clientId" = c."id";
UPDATE "LoyaltyTransaction" lt SET "companyId" = c."companyId" FROM "Client" c WHERE lt."clientId" = c."id";
UPDATE "Supplier" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "Purchase" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "PurchasePayment" pp SET "companyId" = p."companyId" FROM "Purchase" p WHERE pp."purchaseId" = p."id";
UPDATE "BankAccount" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "BankTransaction" bt SET "companyId" = ba."companyId" FROM "BankAccount" ba WHERE bt."bankAccountId" = ba."id";
UPDATE "CashBox" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "CashTransaction" ct SET "companyId" = cb."companyId" FROM "CashBox" cb WHERE ct."cashBoxId" = cb."id";
UPDATE "Expense" e SET "companyId" = COALESCE(ba."companyId", cb."companyId", (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT'))
FROM "BankAccount" ba, "CashBox" cb
WHERE (e."bankAccountId" = ba."id" OR e."bankAccountId" IS NULL)
  AND (e."cashBoxId" = cb."id" OR e."cashBoxId" IS NULL);
UPDATE "Expense" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "AccountingAccount" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "AccountingEntry" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "AccountingEntryLine" line SET "companyId" = entry."companyId" FROM "AccountingEntry" entry WHERE line."entryId" = entry."id";
UPDATE "CompanySetting" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "TaxSetting" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "NumberingSetting" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "SystemCategory" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "DocumentSetting" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "LoyaltySetting" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT');
UPDATE "InventoryMovement" im SET "companyId" = p."companyId" FROM "Product" p WHERE im."productId" = p."id";

-- Fallback for any orphaned historical rows.
UPDATE "InventoryMovement" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "Payment" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "PurchasePayment" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "BankTransaction" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "CashTransaction" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "AccountingEntryLine" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "LoyaltyAccount" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;
UPDATE "LoyaltyTransaction" SET "companyId" = (SELECT "id" FROM "Company" WHERE "code" = 'DEFAULT') WHERE "companyId" IS NULL;

-- Tenant columns are required for operational data.
ALTER TABLE "Client" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "InventoryMovement" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "LoyaltyAccount" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "LoyaltyTransaction" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "LoyaltySetting" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Purchase" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "PurchasePayment" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "BankAccount" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "BankTransaction" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "CashBox" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "CashTransaction" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AccountingAccount" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AccountingEntry" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AccountingEntryLine" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "CompanySetting" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "TaxSetting" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "NumberingSetting" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "SystemCategory" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "DocumentSetting" ALTER COLUMN "companyId" SET NOT NULL;

-- Replace global unique constraints with tenant-aware constraints.
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_rnc_key";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_code_key";
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_invoiceNumber_key";
ALTER TABLE "LoyaltyAccount" DROP CONSTRAINT IF EXISTS "LoyaltyAccount_clientId_key";
ALTER TABLE "LoyaltyAccount" DROP CONSTRAINT IF EXISTS "LoyaltyAccount_credentialCode_key";
ALTER TABLE "Supplier" DROP CONSTRAINT IF EXISTS "Supplier_rnc_key";
ALTER TABLE "Purchase" DROP CONSTRAINT IF EXISTS "Purchase_purchaseNumber_key";
ALTER TABLE "AccountingAccount" DROP CONSTRAINT IF EXISTS "AccountingAccount_code_key";
ALTER TABLE "AccountingEntry" DROP CONSTRAINT IF EXISTS "AccountingEntry_entryNumber_key";

-- Foreign keys.
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltySetting" ADD CONSTRAINT "LoyaltySetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashBox" ADD CONSTRAINT "CashBox_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountingAccount" ADD CONSTRAINT "AccountingAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountingEntryLine" ADD CONSTRAINT "AccountingEntryLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanySetting" ADD CONSTRAINT "CompanySetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxSetting" ADD CONSTRAINT "TaxSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NumberingSetting" ADD CONSTRAINT "NumberingSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemCategory" ADD CONSTRAINT "SystemCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentSetting" ADD CONSTRAINT "DocumentSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes and tenant-aware unique constraints.
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");
CREATE UNIQUE INDEX "Client_companyId_rnc_key" ON "Client"("companyId", "rnc");
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");
CREATE UNIQUE INDEX "Product_companyId_code_key" ON "Product"("companyId", "code");
CREATE INDEX "InventoryMovement_companyId_idx" ON "InventoryMovement"("companyId");
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");
CREATE INDEX "LoyaltyAccount_companyId_idx" ON "LoyaltyAccount"("companyId");
CREATE UNIQUE INDEX "LoyaltyAccount_companyId_clientId_key" ON "LoyaltyAccount"("companyId", "clientId");
CREATE UNIQUE INDEX "LoyaltyAccount_companyId_credentialCode_key" ON "LoyaltyAccount"("companyId", "credentialCode");
CREATE INDEX "LoyaltyTransaction_companyId_idx" ON "LoyaltyTransaction"("companyId");
CREATE UNIQUE INDEX "LoyaltySetting_companyId_key" ON "LoyaltySetting"("companyId");
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");
CREATE UNIQUE INDEX "Supplier_companyId_rnc_key" ON "Supplier"("companyId", "rnc");
CREATE INDEX "Purchase_companyId_idx" ON "Purchase"("companyId");
CREATE UNIQUE INDEX "Purchase_companyId_purchaseNumber_key" ON "Purchase"("companyId", "purchaseNumber");
CREATE INDEX "PurchasePayment_companyId_idx" ON "PurchasePayment"("companyId");
CREATE INDEX "BankAccount_companyId_idx" ON "BankAccount"("companyId");
CREATE INDEX "BankTransaction_companyId_idx" ON "BankTransaction"("companyId");
CREATE INDEX "CashBox_companyId_idx" ON "CashBox"("companyId");
CREATE INDEX "CashTransaction_companyId_idx" ON "CashTransaction"("companyId");
CREATE INDEX "Expense_companyId_idx" ON "Expense"("companyId");
CREATE INDEX "AccountingAccount_companyId_idx" ON "AccountingAccount"("companyId");
CREATE UNIQUE INDEX "AccountingAccount_companyId_code_key" ON "AccountingAccount"("companyId", "code");
CREATE INDEX "AccountingEntry_companyId_idx" ON "AccountingEntry"("companyId");
CREATE UNIQUE INDEX "AccountingEntry_companyId_entryNumber_key" ON "AccountingEntry"("companyId", "entryNumber");
CREATE INDEX "AccountingEntryLine_companyId_idx" ON "AccountingEntryLine"("companyId");
CREATE UNIQUE INDEX "CompanySetting_companyId_key" ON "CompanySetting"("companyId");
CREATE INDEX "TaxSetting_companyId_idx" ON "TaxSetting"("companyId");
CREATE UNIQUE INDEX "NumberingSetting_companyId_documentType_key" ON "NumberingSetting"("companyId", "documentType");
CREATE UNIQUE INDEX "SystemCategory_companyId_type_name_key" ON "SystemCategory"("companyId", "type", "name");
CREATE UNIQUE INDEX "DocumentSetting_companyId_key" ON "DocumentSetting"("companyId");
