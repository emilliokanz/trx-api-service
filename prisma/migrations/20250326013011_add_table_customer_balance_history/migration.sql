-- CreateEnum
CREATE TYPE "BalanceTransactionType" AS ENUM ('Withdrawal', 'Deposit');

-- CreateTable
CREATE TABLE "CustomerBalanceHistory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "bf_balance" INTEGER NOT NULL,
    "af_balance" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerBalanceHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomerBalanceHistory" ADD CONSTRAINT "CustomerBalanceHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
