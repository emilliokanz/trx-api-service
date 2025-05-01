/*
  Warnings:

  - Added the required column `item_name` to the `ItemkuProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemkuProduct" ADD COLUMN     "item_name" TEXT NOT NULL;
