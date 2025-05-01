/*
  Warnings:

  - The primary key for the `ItemkuOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `deliveryInfo` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryInfoField` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `gameName` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `isFromAds` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `orderIncome` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumber` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `refId` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `requiredInformation` on the `ItemkuOrder` table. All the data in the column will be lost.
  - You are about to drop the column `usingDeliveryInfo` on the `ItemkuOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_id]` on the table `ItemkuOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order_number]` on the table `ItemkuOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `ItemkuOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `game_name` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_income` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_number` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `required_information` to the `ItemkuOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ItemkuOrder" DROP CONSTRAINT "ItemkuOrder_refId_fkey";

-- DropIndex
DROP INDEX "ItemkuOrder_orderId_key";

-- DropIndex
DROP INDEX "ItemkuOrder_orderNumber_key";

-- DropIndex
DROP INDEX "ItemkuOrder_refId_key";

-- AlterTable
ALTER TABLE "ItemkuOrder" DROP CONSTRAINT "ItemkuOrder_pkey",
DROP COLUMN "deliveryInfo",
DROP COLUMN "deliveryInfoField",
DROP COLUMN "gameName",
DROP COLUMN "isFromAds",
DROP COLUMN "orderId",
DROP COLUMN "orderIncome",
DROP COLUMN "orderNumber",
DROP COLUMN "productId",
DROP COLUMN "productName",
DROP COLUMN "refId",
DROP COLUMN "requiredInformation",
DROP COLUMN "usingDeliveryInfo",
ADD COLUMN     "delivery_info" TEXT,
ADD COLUMN     "delivery_info_field" TEXT,
ADD COLUMN     "game_name" TEXT NOT NULL,
ADD COLUMN     "is_from_ads" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD COLUMN     "order_income" INTEGER NOT NULL,
ADD COLUMN     "order_number" TEXT NOT NULL,
ADD COLUMN     "product_id" INTEGER NOT NULL,
ADD COLUMN     "product_name" TEXT NOT NULL,
ADD COLUMN     "ref_id" TEXT,
ADD COLUMN     "required_information" JSONB NOT NULL,
ADD COLUMN     "using_delivery_info" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "ItemkuOrder_pkey" PRIMARY KEY ("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_order_id_key" ON "ItemkuOrder"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_order_number_key" ON "ItemkuOrder"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_ref_id_key" ON "ItemkuOrder"("ref_id");

-- AddForeignKey
ALTER TABLE "ItemkuOrder" ADD CONSTRAINT "ItemkuOrder_ref_id_fkey" FOREIGN KEY ("ref_id") REFERENCES "TransactionHistory"("ref_id") ON DELETE SET NULL ON UPDATE CASCADE;
