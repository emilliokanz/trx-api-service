/*
  Warnings:

  - You are about to alter the column `balance` on the `Customer` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `price` on the `ProductPrice` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "ProductPrice" ALTER COLUMN "price" SET DATA TYPE INTEGER;
