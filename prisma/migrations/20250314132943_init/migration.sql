-- CreateTable
CREATE TABLE "TransactionHistory" (
    "ref_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "buyer_sku_code" TEXT NOT NULL,
    "customer_no" TEXT NOT NULL,
    "sign" TEXT NOT NULL,

    CONSTRAINT "TransactionHistory_pkey" PRIMARY KEY ("ref_id")
);
