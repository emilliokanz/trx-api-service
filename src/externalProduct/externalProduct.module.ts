import { Module } from "@nestjs/common";
import { ExternalProductController } from "./externalProduct.controller";
import { ExternalProductService } from "./externalProduct.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ExternalAuthService } from "src/externalAuth/externalAuth.service";

@Module({
    controllers: [ExternalProductController],
    providers: [ExternalProductService, PrismaService, ExternalAuthService]
})
export class ExternalProductModule {}