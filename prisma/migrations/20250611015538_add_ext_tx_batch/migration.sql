-- AlterTable
ALTER TABLE "ExternalTransactionHistory" ADD COLUMN     "externalTransactionBatchBatch_id" TEXT;

-- CreateTable
CREATE TABLE "ExternalTransactionBatch" (
    "batch_id" TEXT NOT NULL,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalTransactionBatch_pkey" PRIMARY KEY ("batch_id")
);

-- AddForeignKey
ALTER TABLE "ExternalTransactionBatch" ADD CONSTRAINT "ExternalTransactionBatch_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "ExternalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalTransactionHistory" ADD CONSTRAINT "ExternalTransactionHistory_externalTransactionBatchBatch_i_fkey" FOREIGN KEY ("externalTransactionBatchBatch_id") REFERENCES "ExternalTransactionBatch"("batch_id") ON DELETE SET NULL ON UPDATE CASCADE;
