-- DropForeignKey
ALTER TABLE "ItemkuProduct" DROP CONSTRAINT "ItemkuProduct_product_id_fkey";

-- CreateTable
CREATE TABLE "_ProductPriceToItemkuProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductPriceToItemkuProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductPriceToItemkuProduct_B_index" ON "_ProductPriceToItemkuProduct"("B");

-- AddForeignKey
ALTER TABLE "_ProductPriceToItemkuProduct" ADD CONSTRAINT "_ProductPriceToItemkuProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ItemkuProduct"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductPriceToItemkuProduct" ADD CONSTRAINT "_ProductPriceToItemkuProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductPrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
