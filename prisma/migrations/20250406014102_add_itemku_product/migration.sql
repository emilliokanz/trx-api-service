-- CreateTable
CREATE TABLE "ItemkuProduct" (
    "item_id" INTEGER NOT NULL,
    "game_name" TEXT NOT NULL,
    "server_name" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "stock" TEXT NOT NULL,
    "min_order" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemkuProduct_pkey" PRIMARY KEY ("item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuProduct_item_id_key" ON "ItemkuProduct"("item_id");

-- AddForeignKey
ALTER TABLE "ItemkuProduct" ADD CONSTRAINT "ItemkuProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ProductPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemkuProduct" ADD CONSTRAINT "ItemkuProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
