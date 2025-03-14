import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
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

  @Get(':id')
  async getTransactionStatus(@Param('id') id: string) {
    return this.transactionService.getTransactionStatus(id);
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
}
