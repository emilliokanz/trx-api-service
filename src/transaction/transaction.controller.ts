import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post()
  async createTransaction(@Body() transactionData: any, @Req() req: any) {
    const apiKey = req.headers['api-key'];

    return this.transactionService.addTransaction(
      transactionData,
      apiKey || '',
    );
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/status')
  @HttpCode(200)
  async getPaymentTransactionStatus(@Body() transactionData: any) {
    return this.transactionService.getPaymentTransactionStatus(
      transactionData.ref_id,
    );
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Get('/:id')
  async getJobTransactionStatus(@Param('id') id: string) {
    return this.transactionService.getJobTransactionStatus(id);
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/request')
  async createPaymentTransactionRequest(@Body() transactionData: any) {
    return this.transactionService.requestTransaction(transactionData);
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/compare')
  async compareCurrentPrice(@Body() transactionData: any) {
    return this.transactionService.comparePriceAndBalance(
      transactionData.buyer_sku_code,
      transactionData.userBalance,
    );
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get-one')
  async getTxHistory(@Body() transactionData: any) {
    return this.transactionService.getTransactionHistoryById(
      transactionData.ref_id,
    );
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get')
  async getTxHistories(@Body() transactionData: any) {
    return this.transactionService.getTransactionHistories(
      transactionData.page,
      transactionData.take,
    );
  }
}
