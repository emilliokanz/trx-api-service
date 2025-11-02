-- AlterTable
ALTER TABLE "TransactionHistory" ADD COLUMN     "isRetry" BOOLEAN;

-- CreateTable
CREATE TABLE "RetryItemkuHistory" (
    "ref_id" TEXT NOT NULL,
    "parent_transaction_id" TEXT NOT NULL,

    CONSTRAINT "RetryItemkuHistory_pkey" PRIMARY KEY ("ref_id")
);

-- AddForeignKey
ALTER TABLE "RetryItemkuHistory" ADD CONSTRAINT "RetryItemkuHistory_parent_transaction_id_fkey" FOREIGN KEY ("parent_transaction_id") REFERENCES "TransactionHistory"("ref_id") ON DELETE RESTRICT ON UPDATE CASCADE;
