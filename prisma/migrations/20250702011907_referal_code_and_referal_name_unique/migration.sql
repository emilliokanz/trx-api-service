/*
  Warnings:

  - A unique constraint covering the columns `[referalCode]` on the table `ExternalUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referalName]` on the table `ExternalUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExternalUser_referalCode_key" ON "ExternalUser"("referalCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalUser_referalName_key" ON "ExternalUser"("referalName");
