import { Controller, Post } from "@nestjs/common";
import { ExternalTransactionService } from "./externalTransaction.service";

@Controller('/api/v1/tx')
export class ExternalTransactionController {
    constructor(private extTrxService: ExternalTransactionService){}

    @Post('/get-product')
    async getProduct(){
        return await this.extTrxService.getProductList()
    }
}