-- CreateEnum
CREATE TYPE "NumberingDocumentType" AS ENUM ('INVOICE', 'PURCHASE', 'ACCOUNTING_ENTRY');

-- CreateEnum
CREATE TYPE "SystemCategoryType" AS ENUM ('EXPENSE', 'PRODUCT', 'CLIENT', 'SUPPLIER', 'PAYMENT', 'OTHER');

-- CreateTable
CREATE TABLE "CompanySetting" (
    "id" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "tradeName" TEXT,
    "rnc" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'DOP',
    "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
    "defaultTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSetting" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberingSetting" (
    "id" SERIAL NOT NULL,
    "documentType" "NumberingDocumentType" NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NumberingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemCategory" (
    "id" SERIAL NOT NULL,
    "type" "SystemCategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSetting" (
    "id" SERIAL NOT NULL,
    "invoiceTerms" TEXT,
    "invoiceNotes" TEXT,
    "purchaseTerms" TEXT,
    "purchaseNotes" TEXT,
    "footerText" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showRnc" BOOLEAN NOT NULL DEFAULT true,
    "showAddress" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxSetting_name_isActive_idx" ON "TaxSetting"("name", "isActive");

-- CreateIndex
CREATE INDEX "NumberingSetting_documentType_isActive_idx" ON "NumberingSetting"("documentType", "isActive");

-- CreateIndex
CREATE INDEX "SystemCategory_type_name_isActive_idx" ON "SystemCategory"("type", "name", "isActive");
