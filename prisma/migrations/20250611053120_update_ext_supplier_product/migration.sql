/*
  Warnings:

  - You are about to drop the column `buyer_sku_code` on the `ExternalSupplierProduct` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `ExternalSupplierProduct` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `ExternalSupplierProduct` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `desc` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_cut_off` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `multi` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_cut_off` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unlimited_stock` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ExternalSupplierProduct_buyer_sku_code_key";

-- AlterTable
ALTER TABLE "ExternalSupplierProduct" DROP COLUMN "buyer_sku_code",
DROP COLUMN "product_name",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "desc" TEXT NOT NULL,
ADD COLUMN     "end_cut_off" TEXT NOT NULL,
ADD COLUMN     "multi" BOOLEAN NOT NULL,
ADD COLUMN     "start_cut_off" TEXT NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL,
ADD COLUMN     "unlimited_stock" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "ExtProductToSupplierJunction" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "ExtProductToSupplierJunction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSupplierProduct_code_key" ON "ExternalSupplierProduct"("code");

-- AddForeignKey
ALTER TABLE "ExtProductToSupplierJunction" ADD CONSTRAINT "ExtProductToSupplierJunction_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ExternalSupplierProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtProductToSupplierJunction" ADD CONSTRAINT "ExtProductToSupplierJunction_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ExternalProduct"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
