import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UsePipes,
    ValidationPipe,
  } from '@nestjs/common';
  import { ExternalTopupService } from './externalTopup.service';
  import { AddBankAccountDto } from './dto/addBankAccount.dto';
  import { CreateTopupRequestDto } from './dto/createTopupRequest.dto';
  import { GetTransactionListDto } from './dto/getTransactionList.dto';
  
  @Controller('external-topup')
  export class ExternalTopupController {
    constructor(private readonly externalTopupService: ExternalTopupService) {}
  
    @Post('bank-account')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async addBankAccount(@Body() payload: AddBankAccountDto) {
      return this.externalTopupService.addBankAccount(payload);
    }
  
    @Get('bank-account')
    async getBankAccount() {
      return this.externalTopupService.getBankAccount();
    }
  
    @Post('create-topup')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async createTopupRequest(@Body() payload: CreateTopupRequestDto) {
      return this.externalTopupService.createTopupRequest(payload);
    }
  
    @Get('transactions')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    async getTransactionList(@Query() query: GetTransactionListDto) {
      return this.externalTopupService.getTransactionList(query);
    }
  }
  