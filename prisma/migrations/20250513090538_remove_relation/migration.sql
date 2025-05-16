/*
  Warnings:

  - You are about to drop the `_ProductPriceToItemkuProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProductPriceToItemkuProduct" DROP CONSTRAINT "_ProductPriceToItemkuProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductPriceToItemkuProduct" DROP CONSTRAINT "_ProductPriceToItemkuProduct_B_fkey";

-- DropTable
DROP TABLE "_ProductPriceToItemkuProduct";

-- AddForeignKey
ALTER TABLE "ItemkuProduct" ADD CONSTRAINT "ItemkuProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ProductPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
