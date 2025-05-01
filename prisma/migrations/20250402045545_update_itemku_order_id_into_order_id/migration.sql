/*
  Warnings:

  - The primary key for the `ItemkuOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ItemkuOrder` table. All the data in the column will be lost.
  - Changed the type of `orderId` on the `ItemkuOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ItemkuOrder" DROP CONSTRAINT "ItemkuOrder_pkey",
DROP COLUMN "id",
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD CONSTRAINT "ItemkuOrder_pkey" PRIMARY KEY ("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_orderId_key" ON "ItemkuOrder"("orderId");
