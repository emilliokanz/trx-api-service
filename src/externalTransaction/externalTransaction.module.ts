import { Module } from "@nestjs/common";
import { ExternalTransactionService } from "./externalTransaction.service";
import { ExternalTransactionController } from "./externalTransaction.controller";

@Module({
    imports: [],
    controllers: [ExternalTransactionController],
    providers: [ExternalTransactionService]
})

export class ExternalTransactionModule {}