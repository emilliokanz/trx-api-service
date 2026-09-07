import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExternalTopupService } from './externalTopup.service';
import { AddBankAccountDto } from './dto/addBankAccount.dto';
import { CreateTopupRequestDto } from './dto/createTopupRequest.dto';
import { GetTransactionListDto } from './dto/getTransactionList.dto';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserRoles } from 'src/auth/roles.decorator';
import { ExternalAuthService } from 'src/externalAuth/externalAuth.service';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { errorMap } from 'src/lib/errorCodes';
import { verifyPayload } from 'src/utils/payloadValidation';
import { ApiBody, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UpdateTopupRequestDto } from './dto/updateTopupRequest.dto';
import { GetTopupTransactionByIdDto } from './dto/getTransactionById.dto';
import { API_SIGNATURE, JWT_AUTH } from 'src/swagger/swagger.setup';

@ApiTags('External Topup')
@ApiSecurity(JWT_AUTH)
@Controller('/api/v1/external-topup')
export class ExternalTopupController {
  constructor(private readonly externalTopupService: ExternalTopupService, private readonly extAuthService: ExternalAuthService) { }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Register a destination bank account',
    description:
      'SuperAdmin only. Adds an account customers can transfer to. Unknown body properties ' +
      'are stripped.',
  })
  @ApiBody({ type: AddBankAccountDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('bank-account')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addBankAccount(@Body() payload: AddBankAccountDto) {
    return this.externalTopupService.addBankAccount(payload);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List destination bank accounts',
    description: 'Returns the accounts available for top-up transfers. Takes no body.',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin, Roles.Admin])
  @Post('bank-account-get')
  async getBankAccount() {
    return this.externalTopupService.getBankAccount();
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Submit a top-up request',
    description:
      'Admin only. Requires an `x-sign` header holding the HMAC-SHA256 hex digest of the ' +
      'request body (see `POST /api/v1/tx/sign-sup`). Answers with `errorCode` `4011` when ' +
      'the header is missing and `4012` when the signature does not match. The request lands ' +
      'in `PENDING` until a SuperAdmin settles it.',
  })
  @ApiSecurity(API_SIGNATURE)
  @ApiBody({ type: CreateTopupRequestDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin])
  @Post('create-topup')
  async createTopupRequest(@Body() payload: CreateTopupRequestDto, @Req() req: any) {
    if (!req.headers['x-sign']) {
      return new ApiResponseDto(errorMap[4011], null, '4011');
    }

    const verify = verifyPayload(payload, req.headers['x-sign'])

    if (!verify) {
      return new ApiResponseDto(errorMap[4012], null, '4012');
    }
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.createTopupRequest(payload, user.id);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Settle a top-up request',
    description:
      'SuperAdmin only. Approves or rejects a pending request; `SUCCESS` credits the ' +
      "requester's balance by `amount`. Also requires the `x-sign` header over the body.",
  })
  @ApiSecurity(API_SIGNATURE)
  @ApiBody({ type: UpdateTopupRequestDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('update-topup')
  async updateTopupRequest(@Body() payload: any, @Req() req: any) {
    if (!req.headers['x-sign']) {
      return new ApiResponseDto(errorMap[4011], null, '4011');
    }

    const verify = verifyPayload(payload, req.headers['x-sign'])

    if (!verify) {
      return new ApiResponseDto(errorMap[4012], null, '4012');
    }
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.updateTopupRequestStatus(payload.id, payload.status, user.id, +payload.amount);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List top-up transactions',
    description:
      'Paginated and filterable. Admins only see their own requests; SuperAdmins see all of them.',
  })
  @ApiBody({ type: GetTransactionListDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin, Roles.Admin])
  @Post('transactions')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTransactionList(@Body() query: GetTransactionListDto, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.getTransactionList(query, user);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Single top-up transaction',
    description: 'Looks up one top-up request by id, scoped to what the caller may see.',
  })
  @ApiBody({ type: GetTopupTransactionByIdDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin, Roles.Admin])
  @Post('transaction')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTransactionById(@Body() query: { id: number }, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.getTransasctionById(+query.id, user);
  }
}
