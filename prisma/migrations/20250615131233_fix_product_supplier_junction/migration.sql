/*
  Warnings:

  - The primary key for the `ExtProductToSupplierJunction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ExtProductToSupplierJunction` table. All the data in the column will be lost.
  - The primary key for the `ExternalProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `product_id` on the `ExternalProduct` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExtProductToSupplierJunction" DROP CONSTRAINT "ExtProductToSupplierJunction_item_id_fkey";

-- DropForeignKey
ALTER TABLE "ExternalProduct" DROP CONSTRAINT "ExternalProduct_product_id_fkey";

-- AlterTable
ALTER TABLE "ExtProductToSupplierJunction" DROP CONSTRAINT "ExtProductToSupplierJunction_pkey",
DROP COLUMN "id",
ALTER COLUMN "item_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ExtProductToSupplierJunction_pkey" PRIMARY KEY ("product_id", "item_id");

-- AlterTable
ALTER TABLE "ExternalProduct" DROP CONSTRAINT "ExternalProduct_pkey",
DROP COLUMN "product_id",
ALTER COLUMN "item_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ExternalProduct_pkey" PRIMARY KEY ("item_id");

-- AddForeignKey
ALTER TABLE "ExtProductToSupplierJunction" ADD CONSTRAINT "ExtProductToSupplierJunction_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ExternalProduct"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
