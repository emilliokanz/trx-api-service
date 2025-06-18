import { Body, Controller, HttpCode, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ExternalTransactionService } from "./externalTransaction.service";
import { ExternalTxRequestDto } from "./dto/extTxRequest.dto";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { Validate } from "class-validator";
import { validateDto } from "src/utils/payloadValidation";
import { AuthGuard } from "src/auth/auth.guard";
import { UserRoles } from "src/auth/roles.decorator";
import { Roles } from "@prisma/client";

@Controller('/api/v1/tx')
export class ExternalTransactionController {
    constructor(private extTrxService: ExternalTransactionService){}

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin, Roles.SuperAdmin])
    @Post('/get-product')
    @HttpCode(200)
    async getProductList(){
        return await this.extTrxService.getProductList()
    }

    @Post('/request')
    @HttpCode(200)
    async requestTransaction(@Body() payload: ExternalTxRequestDto, @Req() req:any){
        
        const apiKey = req.headers['api-key'];

        const { errors, dto } = await validateDto(ExternalTxRequestDto, payload);

        if (errors.length > 0) {
          return new ApiResponseDto(errorMap[4001], null, '4001');
        }
        
        return await this.extTrxService.addTransaction(payload, apiKey)
    }


    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/admin-balance')
    @HttpCode(200)
    async getAdminBalance(){
        return await this.extTrxService.getAdminBalanceFn()
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/status')
    @HttpCode(200)
    async getPaymentTxStatus(@Body() payload: {ref_id: string}){
        return await this.extTrxService.getPaymentTransactionStatus(payload.ref_id)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/history')
    @HttpCode(200)
    async getTxHistory(@Body() payload: any){
        return await this.extTrxService.getAllTxHistoryByBatch(payload.page, payload.size)
    }
}