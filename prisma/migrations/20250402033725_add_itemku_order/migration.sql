-- CreateTable
CREATE TABLE "ItemkuOrder" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "gameName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "usingDeliveryInfo" BOOLEAN NOT NULL DEFAULT false,
    "deliveryInfoField" TEXT,
    "status" TEXT NOT NULL,
    "requiredInformation" JSONB NOT NULL,
    "deliveryInfo" TEXT,
    "orderIncome" INTEGER NOT NULL,
    "isFromAds" BOOLEAN NOT NULL DEFAULT false,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemkuOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_orderId_key" ON "ItemkuOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_orderNumber_key" ON "ItemkuOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ItemkuOrder_refId_key" ON "ItemkuOrder"("refId");

-- AddForeignKey
ALTER TABLE "ItemkuOrder" ADD CONSTRAINT "ItemkuOrder_refId_fkey" FOREIGN KEY ("refId") REFERENCES "TransactionHistory"("ref_id") ON DELETE SET NULL ON UPDATE CASCADE;
