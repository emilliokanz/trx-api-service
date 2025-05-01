-- DropForeignKey
ALTER TABLE "ItemkuProduct" DROP CONSTRAINT "ItemkuProduct_product_id_fkey";

-- AlterTable
ALTER TABLE "ItemkuProduct" ALTER COLUMN "product_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ItemkuProduct" ADD CONSTRAINT "ItemkuProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ProductPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
