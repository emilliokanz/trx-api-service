-- CreateTable
CREATE TABLE "ExternalAdminUsers" (
    "cust_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalAdminUsers_pkey" PRIMARY KEY ("cust_id","admin_id")
);
