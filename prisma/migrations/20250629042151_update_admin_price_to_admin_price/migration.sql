/*
  Warnings:

  - You are about to drop the column `adminPrice` on the `ExternalProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExternalProduct" DROP COLUMN "adminPrice",
ADD COLUMN     "admin_price" INTEGER;
