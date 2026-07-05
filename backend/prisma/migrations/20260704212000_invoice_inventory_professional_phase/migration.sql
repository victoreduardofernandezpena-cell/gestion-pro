-- Professional invoicing/inventory phase: compatible additive changes only.
CREATE TABLE "Brand" (
  "id" SERIAL NOT NULL,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warehouse" (
  "id" SERIAL NOT NULL,
  "companyId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "reference" TEXT;
ALTER TABLE "Product" ADD COLUMN "brandId" INTEGER;
ALTER TABLE "Product" ADD COLUMN "isComposite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "requiresLot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "requiresSerial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "requiresExpiration" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InventoryMovement" ADD COLUMN "warehouseId" INTEGER;
ALTER TABLE "InventoryMovement" ADD COLUMN "cost" DECIMAL(12,2);
ALTER TABLE "InventoryMovement" ADD COLUMN "reference" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "document" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "note" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "lotNumber" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "serialNumber" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "expirationDate" TIMESTAMP(3);

CREATE UNIQUE INDEX "Brand_companyId_name_key" ON "Brand"("companyId", "name");
CREATE INDEX "Brand_companyId_idx" ON "Brand"("companyId");
CREATE UNIQUE INDEX "Warehouse_companyId_code_key" ON "Warehouse"("companyId", "code");
CREATE INDEX "Warehouse_companyId_idx" ON "Warehouse"("companyId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX "InventoryMovement_warehouseId_idx" ON "InventoryMovement"("warehouseId");

ALTER TABLE "Brand" ADD CONSTRAINT "Brand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
