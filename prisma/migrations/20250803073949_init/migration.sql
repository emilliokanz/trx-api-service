-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "TopupTransaction" (
    "id" SERIAL NOT NULL,
    "requestorId" INTEGER NOT NULL,
    "approver" INTEGER,
    "refNo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "fromBankAccount" TEXT NOT NULL,
    "toBankAccount" TEXT NOT NULL,
    "fromBankName" TEXT NOT NULL,
    "toBankName" TEXT NOT NULL,
    "txType" "TxType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopupTransaction_pkey" PRIMARY KEY ("id")
);
