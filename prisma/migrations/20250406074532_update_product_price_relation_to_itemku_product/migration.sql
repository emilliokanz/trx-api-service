/*
  Warnings:

  - You are about to drop the column `itemku_game_name` on the `ProductPrice` table. All the data in the column will be lost.
  - You are about to drop the column `itemku_product_name` on the `ProductPrice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[product_id]` on the table `ItemkuProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProductPrice" DROP COLUMN "itemku_game_name",
DROP COLUMN "itemku_product_name";

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuProduct_product_id_key" ON "ItemkuProduct"("product_id");
