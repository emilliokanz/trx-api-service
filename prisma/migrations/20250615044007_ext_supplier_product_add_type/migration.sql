/*
  Warnings:

  - Added the required column `type` to the `ExternalSupplierProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExternalSupplierProduct" ADD COLUMN     "type" TEXT NOT NULL;
