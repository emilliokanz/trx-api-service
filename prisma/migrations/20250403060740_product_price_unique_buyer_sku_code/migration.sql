/*
  Warnings:

  - You are about to drop the column `ref_id` on the `ItemkuOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[buyer_sku_code]` on the table `ProductPrice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ItemkuOrder" DROP CONSTRAINT "ItemkuOrder_ref_id_fkey";

-- DropIndex
DROP INDEX "ItemkuOrder_ref_id_key";

-- AlterTable
ALTER TABLE "ItemkuOrder" DROP COLUMN "ref_id";

-- AlterTable
ALTER TABLE "TransactionHistory" ADD COLUMN     "order_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ProductPrice_buyer_sku_code_key" ON "ProductPrice"("buyer_sku_code");

-- AddForeignKey
ALTER TABLE "TransactionHistory" ADD CONSTRAINT "TransactionHistory_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ItemkuOrder"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;
