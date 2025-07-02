-- AddForeignKey
ALTER TABLE "ExternalAdminUsers" ADD CONSTRAINT "ExternalAdminUsers_cust_id_fkey" FOREIGN KEY ("cust_id") REFERENCES "ExternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
