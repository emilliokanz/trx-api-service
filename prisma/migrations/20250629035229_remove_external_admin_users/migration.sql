/*
  Warnings:

  - You are about to drop the `ExternalAdminUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExternalUser" DROP CONSTRAINT "ExternalUser_externalAdminUsersUserId_fkey";

-- DropTable
DROP TABLE "ExternalAdminUsers";
