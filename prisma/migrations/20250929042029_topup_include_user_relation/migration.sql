-- AddForeignKey
ALTER TABLE "TopupTransaction" ADD CONSTRAINT "TopupTransaction_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "ExternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
