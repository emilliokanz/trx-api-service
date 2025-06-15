/*
  Warnings:

  - Added the required column `rc` to the `ExternalTransactionHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sn` to the `ExternalTransactionHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExternalTransactionHistory" ADD COLUMN     "rc" TEXT NOT NULL,
ADD COLUMN     "sn" TEXT NOT NULL;
