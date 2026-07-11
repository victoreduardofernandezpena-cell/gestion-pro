-- Add lightweight source tracking for financial movements.
ALTER TABLE "BankTransaction" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "BankTransaction" ADD COLUMN "sourceId" INTEGER;
ALTER TABLE "BankTransaction" ADD COLUMN "sourceNumber" TEXT;

ALTER TABLE "CashTransaction" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "CashTransaction" ADD COLUMN "sourceId" INTEGER;
ALTER TABLE "CashTransaction" ADD COLUMN "sourceNumber" TEXT;

CREATE INDEX "BankTransaction_companyId_sourceType_sourceId_idx" ON "BankTransaction"("companyId", "sourceType", "sourceId");
CREATE INDEX "CashTransaction_companyId_sourceType_sourceId_idx" ON "CashTransaction"("companyId", "sourceType", "sourceId");
