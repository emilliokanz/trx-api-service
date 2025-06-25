-- AlterTable
ALTER TABLE "ExternalUser" ADD COLUMN     "email" TEXT,
ADD COLUMN     "isAdmin" BOOLEAN,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "referalCode" TEXT;
