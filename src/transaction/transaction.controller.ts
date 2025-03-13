import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(@Body() transactionData: any) {
    return this.transactionService.addTransaction(transactionData);
  }

  @Get(':id')
  async getTransactionStatus(@Param('id') id: string) {
    return this.transactionService.getTransactionStatus(id);
  }
}