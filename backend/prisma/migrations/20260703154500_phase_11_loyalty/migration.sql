-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTMENT', 'CANCELLED');

-- DropIndex
DROP INDEX IF EXISTS "NumberingSetting_documentType_isActive_idx";

-- DropIndex
DROP INDEX IF EXISTS "SystemCategory_type_name_isActive_idx";

-- DropIndex
DROP INDEX IF EXISTS "TaxSetting_name_isActive_idx";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "loyaltyDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "credentialCode" TEXT NOT NULL,
    "qrCodeValue" TEXT NOT NULL,
    "barcodeValue" TEXT NOT NULL,
    "pointsBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "moneyBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalRedeemed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" SERIAL NOT NULL,
    "loyaltyAccountId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "invoiceId" INTEGER,
    "paymentId" INTEGER,
    "type" "LoyaltyTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "points" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltySetting" (
    "id" SERIAL NOT NULL,
    "amountPerPoint" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "rewardValue" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "minimumPurchaseAmount" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "allowRedeem" BOOLEAN NOT NULL DEFAULT true,
    "minimumRedeemAmount" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltySetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_clientId_key" ON "LoyaltyAccount"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_credentialCode_key" ON "LoyaltyAccount"("credentialCode");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_createdAt_idx" ON "LoyaltyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_clientId_idx" ON "LoyaltyTransaction"("clientId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_invoiceId_idx" ON "LoyaltyTransaction"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTransaction_paymentId_type_key" ON "LoyaltyTransaction"("paymentId", "type");

-- AddForeignKey
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
