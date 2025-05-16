-- CreateTable
CREATE TABLE "ItemkuToProductJunction" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "ItemkuToProductJunction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemkuToProductJunction" ADD CONSTRAINT "ItemkuToProductJunction_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ProductPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemkuToProductJunction" ADD CONSTRAINT "ItemkuToProductJunction_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ItemkuProduct"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
