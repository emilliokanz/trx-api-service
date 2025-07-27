-- CreateTable
CREATE TABLE "SupplierBalances" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "SupplierBalances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierBalanceHistory" (
    "id" SERIAL NOT NULL,
    "supplierBalanceId" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierBalanceHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupplierBalanceHistory" ADD CONSTRAINT "SupplierBalanceHistory_supplierBalanceId_fkey" FOREIGN KEY ("supplierBalanceId") REFERENCES "SupplierBalances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
