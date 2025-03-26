/*
  Warnings:

  - Changed the type of `type` on the `CustomerBalanceHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CustomerBalanceType" AS ENUM ('Withdrawal', 'Deposit', 'Transaction');

-- AlterTable
ALTER TABLE "CustomerBalanceHistory" ADD COLUMN     "ref_id" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "CustomerBalanceType" NOT NULL;

-- DropEnum
DROP TYPE "BalanceTransactionType";
