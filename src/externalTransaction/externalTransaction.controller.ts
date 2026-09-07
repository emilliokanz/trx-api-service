import { Body, Controller, HttpCode, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ExternalTransactionService } from "./externalTransaction.service";
import { ExternalTxRequestDto } from "./dto/extTxRequest.dto";
import { TopUpRequestDto } from "./dto/topUpRequest.dto";
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
import {
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiTags,
} from "@nestjs/swagger";
import { BatchIdDto, RefIdDto, TxHistoryQueryDto } from "./dto/txQuery.dto";
import { API_SIGNATURE, API_USERNAME, JWT_AUTH } from "src/swagger/swagger.setup";

@ApiTags('External Transaction')
@Controller('/api/v1/tx')
export class ExternalTransactionController {
    constructor(private extTrxService: ExternalTransactionService, private authService: AuthService, private prisma: PrismaService) { }

    @ApiOperation({
        summary: 'Submit a transaction request (web session)',
        description:
            'Queues one transaction per entry in `customer_no` and returns the batch id. ' +
            'Requires BOTH a JWT and an `x-sign` header holding the HMAC-SHA256 hex digest ' +
            'of the request body. `username` is taken from the JWT, not from the body. ' +
            'Answers 200 with `errorCode` `4011` (missing signature) or `4012` (bad signature).',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiSecurity(API_SIGNATURE)
    @ApiBody({ type: ExternalTxRequestDto })
    @ApiOkResponse({ type: ApiResponseDto })
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
    @ApiOperation({
        summary: 'Balance of the calling admin',
        description: 'Reads the balance of the account identified by the JWT.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiOkResponse({ type: ApiResponseDto })
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/admin-balance')
    @HttpCode(200)
    async getAdminBalance(@Req() req: any) {
        const user = await this.authService.getUserDetail(req.headers.authorization)

        return await this.extTrxService.getAdminBalanceFn(true, null, user)
    }

    @ApiOperation({
        summary: 'Balance of the calling admin (API key)',
        description:
            'Machine-to-machine variant of `/admin-balance`: authenticate with the ' +
            '`x-username` + `x-sign` header pair instead of a JWT.',
    })
    @ApiSecurity(API_USERNAME)
    @ApiSecurity(API_SIGNATURE)
    @ApiOkResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @Post('/ext/admin-balance')
    @HttpCode(200)
    async getAdminBalanceApi(@Req() req: any, @ApiUserDetail() user: any) {
        return await this.extTrxService.getAdminBalanceFn(false, null, user)
    }

    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Status of a payment transaction',
        description: 'Re-reads the transaction status from the supplier by reference id.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: RefIdDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @UserRoles([Roles.SuperAdmin])
    @Post('/status')
    @HttpCode(200)
    async getPaymentTxStatus(@Body() payload: { ref_id: string }) {
        return await this.extTrxService.getPaymentTransactionStatus(payload.ref_id)
    }

    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Direct supplier top-up',
        description:
            'Sends a single top-up straight to the supplier, bypassing the batch queue. ' +
            'Unknown body properties are stripped by the validation pipe.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: TopUpRequestDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/topup')
    @HttpCode(200)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async topUp(@Body() payload: TopUpRequestDto) {
        return await this.extTrxService.topUpTransaction(payload)
    }

    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Transaction history grouped by batch',
        description:
            'Paginated list of transaction batches visible to the caller. Every filter is optional.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: TxHistoryQueryDto })
    @ApiOkResponse({ type: ApiResponseDto })
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
    @ApiOperation({
        summary: 'Transactions inside one batch',
        description: 'Returns every transaction belonging to the given `batch_id`.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: BatchIdDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/history-detail')
    @HttpCode(200)
    async getTxHistoryDetail(@Body() payload: any, @Req() req: any) {
        const user = await this.authService.getUserDetail(req.headers.authorization)

        return await this.extTrxService.getTxHistoryByBatchId(payload.batch_id, user)
    }

    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Flat, paginated transaction list',
        description:
            'Same filters as `/history`, but returns individual transactions instead of batches.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: TxHistoryQueryDto })
    @ApiOkResponse({ type: ApiResponseDto })
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

    @ApiOperation({
        summary: 'Submit a transaction request (API key)',
        description:
            'Machine-to-machine variant of `/request-web`. Authenticate with `x-username` + ' +
            '`x-sign`; the signature is verified against the caller API key over the raw body.',
    })
    @ApiSecurity(API_USERNAME)
    @ApiSecurity(API_SIGNATURE)
    @ApiBody({ type: ExternalTxRequestDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @Post('/ext/request')
    @HttpCode(200)
    async requestTransaction(@Body() payload: ExternalTxRequestDto, @ApiUserDetail() userDetail: any) {
        console.log(userDetail)
        return await this.extTrxService.addTransaction(payload, userDetail.username, false, userDetail.role, userDetail.signature, userDetail.body)
    }

    
    @ApiOperation({
        summary: 'Transactions inside one batch (API key)',
        description: 'Machine-to-machine variant of `/history-detail`.',
    })
    @ApiSecurity(API_USERNAME)
    @ApiSecurity(API_SIGNATURE)
    @ApiBody({ type: BatchIdDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @Post('/ext/history-detail')
    @HttpCode(200)
    async getTxHistoryDetailApi(@Body() payload: any, @ApiUserDetail() user: any) {
        return await this.extTrxService.getTxHistoryByBatchIdApi(payload.batch_id, user)
    }

    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Single transaction detail',
        description: 'Looks up one transaction by its reference id.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: RefIdDto })
    @ApiOkResponse({ type: ApiResponseDto })
    @UserRoles([Roles.SuperAdmin])
    @Post('/ext/tx-detail')
    @HttpCode(200)
    async getTxDetail(@Body() payload: { ref_id: string }, @ApiUserDetail() user: any) {
        return await this.extTrxService.getTransactionDetail(payload.ref_id, user)
    }

    @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Sign a payload with a user API key',
        description:
            'Helper endpoint: returns the HMAC-SHA256 hex digest of the posted JSON body, signed ' +
            'with the API key of the user named in the `x-username` header. Use the result as ' +
            'the `x-sign` header of the real request.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiSecurity(API_USERNAME)
    @ApiBody({
        description: 'The exact JSON body that will be sent to the signed endpoint.',
        schema: {
            type: 'object',
            additionalProperties: true,
            example: { code: 'ML5', customer_no: ['12345678(1234)'] },
        },
    })
    @ApiOkResponse({ schema: { type: 'string', example: '3b8c1f9e...' } })
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
    @ApiOperation({
        summary: 'Sign a payload with the service secret',
        description:
            'Same as `/sign`, but signed with `PAYLOAD_SECRET`. This is the signature expected ' +
            'by `/request-web` and by the external top-up endpoints.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({
        description: 'The exact JSON body that will be sent to the signed endpoint.',
        schema: {
            type: 'object',
            additionalProperties: true,
            example: { amount: 100000, toAccount: '1234567890' },
        },
    })
    @ApiOkResponse({ schema: { type: 'string', example: '3b8c1f9e...' } })
    @UserRoles([Roles.SuperAdmin, Roles.Admin])
    @Post('/sign-sup')
    async signPayloadSup(@Body() payload: any, @Req() req: any) {
        return signPayload(payload)
    }
}