import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(@Body() transactionData: any, @Req() req: any) {
    const apiKey = req.headers['api-key'];

    return this.transactionService.addTransaction(
      transactionData,
      apiKey || '',
    );
  }

  @Post('/status')
  @HttpCode(200)
  async getPaymentTransactionStatus(@Body() transactionData: any) {
    return this.transactionService.getPaymentTransactionStatus(
      transactionData.ref_id,
    );
  }

  @Get('/:id')
  async getJobTransactionStatus(@Param('id') id: string) {
    return this.transactionService.getJobTransactionStatus(id);
  }

  @Post('/request')
  async createPaymentTransactionRequest(@Body() transactionData: any) {
    return this.transactionService.requestTransaction(transactionData);
  }

  @Post('/compare')
  async compareCurrentPrice(@Body() transactionData: any) {
    return this.transactionService.comparePriceAndBalance(
      transactionData.buyer_sku_code,
      transactionData.userBalance,
    );
  }

  @Post('/get-one')
  async getTxHistory(@Body() transactionData: any) {
    return this.transactionService.getTransactionHistoryById(
      transactionData.ref_id,
    );
  }
  @Post('/get')
  async getTxHistories(@Body() transactionData: any) {
    return this.transactionService.getTransactionHistories(
      transactionData.page,
      transactionData.take,
    );
  }
}
