-- AlterTable
ALTER TABLE "ExternalProduct" ADD COLUMN     "adminPrice" INTEGER;

-- CreateTable
CREATE TABLE "ExternalAdminCustProduct" (
    "cust_id" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalAdminCustProduct_pkey" PRIMARY KEY ("cust_id","item_id")
);

-- AddForeignKey
ALTER TABLE "ExternalAdminCustProduct" ADD CONSTRAINT "ExternalAdminCustProduct_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ExternalProduct"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAdminCustProduct" ADD CONSTRAINT "ExternalAdminCustProduct_cust_id_fkey" FOREIGN KEY ("cust_id") REFERENCES "ExternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
