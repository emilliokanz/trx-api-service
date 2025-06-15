import { Body, Controller, Post, Req, UsePipes, ValidationPipe } from "@nestjs/common";
import { ExternalTransactionService } from "./externalTransaction.service";
import { ExternalTxRequestDto } from "./dto/extTxRequest.dto";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { Validate } from "class-validator";
import { validateDto } from "src/utils/payloadValidation";

@Controller('/api/v1/tx')
export class ExternalTransactionController {
    constructor(private extTrxService: ExternalTransactionService){}

    @Post('/get-product')
    async getProductList(){
        const data = await this.extTrxService.getProductList()
        return new ApiResponseDto("success", data, '0000')
    }

    @Post('/request')
    async requestTransaction(@Body() payload: ExternalTxRequestDto, @Req() req:any){
        
        const apiKey = req.headers['api-key'];

        const { errors, dto } = await validateDto(ExternalTxRequestDto, payload);

        if (errors.length > 0) {
          return new ApiResponseDto(errorMap[4001], null, '4001');
        }
        const data = await this.extTrxService.addTransaction(payload, apiKey)
        return new ApiResponseDto("success", data, '0000')
    }


    @Post('/admin-balance')
    async getAdminBalance(){
        const data = await this.extTrxService.getAdminBalanceFn()
        return new ApiResponseDto("success", data, '0000')
    }
}