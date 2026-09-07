import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { BalanceHistoryService } from "./balanceHistory.service";
import PaginationIface from "src/interface/paginationIface";
import { PaginationDto } from "src/dto/pagination.dto";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { GetBalanceHistoryDto } from "./dto/getBalanceHistory.dto";

/** Appended to the descriptions below: no guard is attached to this controller. */
const NOTE =
    ' NOTE: this controller has no guard attached, so the route is currently unauthenticated.';

@ApiTags('Balance History')
@Controller('balanceHistory')
export class BalanceHistoryController {
    constructor(
        private balanceHistory: BalanceHistoryService
    ){}

    @ApiOperation({
        summary: 'List balance mutations',
        description: 'Paginated list of customer balance history records.' + NOTE,
    })
    @ApiBody({ type: PaginationDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @Post('/get-all')
    @HttpCode(200)
    async findAll(@Body() payload: PaginationDto){
        return await this.balanceHistory.getHistories(payload.page, payload.size)
    }

    @ApiOperation({
        summary: 'Single balance mutation',
        description: 'Looks up one balance history record by id.' + NOTE,
    })
    @ApiBody({ type: GetBalanceHistoryDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @Post('/get')
    @HttpCode(200)
    async findById(@Body() payload: any){
        return await this.balanceHistory.getHistory(payload.id)
    }
    
}