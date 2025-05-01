import { Module } from "@nestjs/common";
import { BalanceHistoryController } from "./balanceHistory.controller";
import { BalanceHistoryService } from "./balanceHistory.service";
import { PrismaService } from "src/prisma/prisma.service";
import { CustomerService } from "src/customer/customer.service";

@Module({
    imports: [],
    controllers: [BalanceHistoryController],
    providers: [BalanceHistoryService, PrismaService, CustomerService]
})

export class BalanceHistoryModule{}