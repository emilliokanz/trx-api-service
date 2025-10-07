import { Body, Controller, HttpCode, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ExternalTransactionService } from "./externalTransaction.service";
import { ExternalTxRequestDto } from "./dto/extTxRequest.dto";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { Validate } from "class-validator";
import { decryptSecret, signPayload, signPayloadAdmin, validateDto, verifyPayload } from "src/utils/payloadValidation";
import { AuthGuard } from "src/auth/auth.guard";
import { UserRoles } from "src/auth/roles.decorator";
import { Roles } from "@prisma/client";
import { AuthService } from "src/auth/auth.service";
import { ApiUserDetail } from "src/utils/decorators/api-user-detail.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@Controller('/api/v1/tx')
export class ExternalTransactionController {
    constructor(private extTrxService: ExternalTransactionService, private authService: AuthService, private prisma: PrismaService) { }

    @UseGuards(AuthGuard)
    @Post('/request-web')
    @HttpCode(200)
    async requestTransactionWeb(@Body() payload: ExternalTxRequestDto, @Req() req: any) {
        if (!req.headers['x-sign'] || req.headers['x-sign'] == undefined) {
            return new ApiResponseDto(errorMap[4011], null, '4011');
        }

        const verify = verifyPayload(payload, req.headers['x-sign'])

        if (!verify) {
            return new ApiResponseDto(errorMap[4012], null, '4012');
        }

        const user = await this.authService.getUserDetail(req.headers.authorization)

        payload.username = user.username

        const { errors, dto } = await validateDto(ExternalTxRequestDto, payload);

        if (errors.length > 0) {
            return new ApiResponseDto(errorMap[4001], null, '4001');
        }

        return await this.extTrxService.addTransaction(payload, '', true, user.role)
    }


    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/admin-balance')
    @HttpCode(200)
    async getAdminBalance(@Req() req: any) {
        const user = await this.authService.getUserDetail(req.headers.authorization)

        return await this.extTrxService.getAdminBalanceFn(true, null, user)
    }

    @UseGuards(AuthGuard)
    @Post('/ext/admin-balance')
    @HttpCode(200)
    async getAdminBalanceApi(@Req() req: any, @ApiUserDetail() user: any) {
        return await this.extTrxService.getAdminBalanceFn(false, null, user)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/status')
    @HttpCode(200)
    async getPaymentTxStatus(@Body() payload: { ref_id: string }) {
        return await this.extTrxService.getPaymentTransactionStatus(payload.ref_id, true)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/history')
    @HttpCode(200)
    async getTxHistory(@Body() payload: any, @Req() req: any) {
        const user = await this.authService.getUserDetail(req.headers.authorization)

        return await this.extTrxService.getAllTxHistoryByBatch(
            payload.page || '',
            payload.size || '',
            payload.customer_no || '',
            payload.start_date || '',
            payload.end_date || '',
            payload.batch_id || '',
            payload.ref_id || '',
            user
        )
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/history-detail')
    @HttpCode(200)
    async getTxHistoryDetail(@Body() payload: any, @Req() req: any) {
        const user = await this.authService.getUserDetail(req.headers.authorization)

        return await this.extTrxService.getTxHistoryByBatchId(payload.batch_id, user)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/transaction-detail-list')
    @HttpCode(200)
    async getTxHistoryDetailByBatchId(@Body() payload: any) {
        return await this.extTrxService.getAllTxHistoryDetailByBatch(
            payload.page || '',
            payload.size || '',
            payload.customer_no || '',
            payload.start_date || '',
            payload.end_date || '',
            payload.ref_id || '',
            payload.batch_id || ''
        )
    }

    @UseGuards(AuthGuard)
    @Post('/ext/request')
    @HttpCode(200)
    async requestTransaction(@Body() payload: ExternalTxRequestDto, @ApiUserDetail() userDetail: any) {
        console.log(userDetail)
        return await this.extTrxService.addTransaction(payload, userDetail.username, false, userDetail.role, userDetail.signature, userDetail.body)
    }

    
    @UseGuards(AuthGuard)
    @Post('/ext/history-detail')
    @HttpCode(200)
    async getTxHistoryDetailApi(@Body() payload: any, @ApiUserDetail() user: any) {
        return await this.extTrxService.getTxHistoryByBatchIdApi(payload.batch_id, user)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/ext/tx-detail')
    @HttpCode(200)
    async getTxDetail(@Body() payload: { ref_id: string }, @ApiUserDetail() user: any) {
        return await this.extTrxService.getTransactionDetail(payload.ref_id, user)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/sign')
    async signPayload(@Body() payload: any, @Req() req: any) {
        const username = req.headers["x-username"]

        const findUser = await this.prisma.externalUser.findFirst({
            where: {username}
        })

        const decryptApiKey = decryptSecret(findUser?.apiKey || "")


        return signPayloadAdmin(payload, decryptApiKey)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/sign-sup')
    async signPayloadSup(@Body() payload: any, @Req() req: any) {
        return signPayload(payload)
    }
}