import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { BalanceHistoryService } from "./balanceHistory.service";
import PaginationIface from "src/interface/paginationIface";
import { PaginationDto } from "src/dto/pagination.dto";

@Controller('balanceHistory')
export class BalanceHistoryController {
    constructor(
        private balanceHistory: BalanceHistoryService
    ){}

    @Post('/get-all')
    @HttpCode(200)
    async findAll(@Body() payload: PaginationDto){
        return await this.balanceHistory.getHistories(payload.page, payload.size)
    }

    @Post('/get')
    @HttpCode(200)
    async findById(@Body() payload: any){
        return await this.balanceHistory.getHistory(payload.id)
    }
    
}