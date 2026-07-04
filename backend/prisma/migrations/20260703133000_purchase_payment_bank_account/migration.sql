-- AlterTable
ALTER TABLE "PurchasePayment" ADD COLUMN "bankAccountId" INTEGER,
ADD COLUMN "bankTransactionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "PurchasePayment_bankTransactionId_key" ON "PurchasePayment"("bankTransactionId");

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
