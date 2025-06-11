-- CreateTable
CREATE TABLE "ExternalUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "role" "Roles" NOT NULL,
    "apiKey" TEXT,
    "isCustomer" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externalAdminUsersUserId" INTEGER,

    CONSTRAINT "ExternalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAdminUsers" (
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalAdminUsers_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ExternalUserBalanceHistory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "type" "CustomerBalanceType" NOT NULL,
    "bf_balance" INTEGER NOT NULL,
    "af_balance" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "ref_id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalUserBalanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalTransactionHistory" (
    "ref_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "buyer_sku_code" TEXT NOT NULL,
    "customer_no" TEXT NOT NULL,
    "sign" TEXT NOT NULL,
    "customer_id" INTEGER,
    "status" TEXT,
    "customer_username" TEXT,
    "source" TEXT,
    "item_price" INTEGER,
    "profit" INTEGER,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_id" INTEGER,

    CONSTRAINT "ExternalTransactionHistory_pkey" PRIMARY KEY ("ref_id")
);

-- CreateTable
CREATE TABLE "ExternalProduct" (
    "item_id" INTEGER NOT NULL,
    "game_name" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "server_name" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "min_order" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "product_id" INTEGER,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalProduct_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "ExternalSupplierProduct" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "actualPrice" INTEGER,
    "buyer_sku_code" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalSupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalProduct_item_id_key" ON "ExternalProduct"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSupplierProduct_buyer_sku_code_key" ON "ExternalSupplierProduct"("buyer_sku_code");

-- AddForeignKey
ALTER TABLE "ExternalUser" ADD CONSTRAINT "ExternalUser_externalAdminUsersUserId_fkey" FOREIGN KEY ("externalAdminUsersUserId") REFERENCES "ExternalAdminUsers"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalUserBalanceHistory" ADD CONSTRAINT "ExternalUserBalanceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ExternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalTransactionHistory" ADD CONSTRAINT "ExternalTransactionHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "ExternalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalProduct" ADD CONSTRAINT "ExternalProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ExternalSupplierProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalProduct" ADD CONSTRAINT "ExternalProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "ExternalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalSupplierProduct" ADD CONSTRAINT "ExternalSupplierProduct_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "ExternalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
