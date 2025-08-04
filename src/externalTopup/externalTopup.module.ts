import { Module } from "@nestjs/common";
import { ExternalTopupController } from "./externalTopup.controller";
import { ExternalTopupService } from "./externalTopup.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ExternalAuthService } from "src/externalAuth/externalAuth.service";

@Module({
    controllers: [ExternalTopupController],
    providers: [ExternalTopupService, PrismaService, ExternalAuthService]
})

export class ExternalTopupModule {}