-- AddForeignKey
ALTER TABLE "ExternalAdminUsers" ADD CONSTRAINT "ExternalAdminUsers_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "ExternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
