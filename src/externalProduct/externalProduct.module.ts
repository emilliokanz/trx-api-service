import { Module } from "@nestjs/common";
import { ExternalProductController } from "./externalProduct.controller";
import { ExternalProductService } from "./externalProduct.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
    controllers: [ExternalProductController],
    providers: [ExternalProductService, PrismaService]
})
export class ExternalProductModule {}