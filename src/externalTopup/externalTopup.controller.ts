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

@Controller('/api/v1/external-topup')
export class ExternalTopupController {
  constructor(private readonly externalTopupService: ExternalTopupService, private readonly extAuthService: ExternalAuthService) { }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin])
  @Post('bank-account')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addBankAccount(@Body() payload: AddBankAccountDto) {
    return this.externalTopupService.addBankAccount(payload);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin, Roles.Admin])
  @Post('bank-account-get')
  async getBankAccount() {
    return this.externalTopupService.getBankAccount();
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin])
  @Post('create-topup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createTopupRequest(@Body() payload: CreateTopupRequestDto, @Req() req: any) {
    if (!req.headers['x-sign'] || req.headers['x-sign'] == undefined) {
      return new ApiResponseDto(errorMap[4011], null, '4011');
    }

    const verify = verifyPayload(payload, req.headers['x-sign'])

    if (!verify) {
      return new ApiResponseDto(errorMap[4011], null, '4011');
    }
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.createTopupRequest(payload, user.id);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin])
  @Post('update-topup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateTopupRequest(@Body() payload: any, @Req() req: any) {
    if (!req.headers['x-sign'] || req.headers['x-sign'] == undefined) {
      return new ApiResponseDto(errorMap[4011], null, '4011');
    }

    const verify = verifyPayload(payload, req.headers['x-sign'])

    if (!verify) {
      return new ApiResponseDto(errorMap[4011], null, '4011');
    }
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.updateTopupRequestStatus(payload.id, payload.status, user.id, +payload.amount);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin, Roles.Admin])
  @Post('transactions')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTransactionList(@Body() query: GetTransactionListDto, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.getTransactionList(query, user);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin, Roles.Admin])
  @Post('transaction')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTransactionById(@Body() query: { id: number }, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return this.externalTopupService.getTransasctionById(+query.id, user);
  }
}
