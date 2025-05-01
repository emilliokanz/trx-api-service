/*
  Warnings:

  - The `using_delivery_info` column on the `ItemkuOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ItemkuOrder" DROP COLUMN "using_delivery_info",
ADD COLUMN     "using_delivery_info" INTEGER NOT NULL DEFAULT 0;
