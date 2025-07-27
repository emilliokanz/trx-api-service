/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `SupplierBalances` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SupplierBalances_name_key" ON "SupplierBalances"("name");
