/*
  Warnings:

  - Added the required column `transaction_ref_id` to the `RetryItemkuHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RetryItemkuHistory" ADD COLUMN     "transaction_ref_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RetryItemkuHistory" ADD CONSTRAINT "RetryItemkuHistory_transaction_ref_id_fkey" FOREIGN KEY ("transaction_ref_id") REFERENCES "TransactionHistory"("ref_id") ON DELETE RESTRICT ON UPDATE CASCADE;
