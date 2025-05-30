import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { ItemkuOrder, Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { TransactionService } from './transaction.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { TransactionRequestDto } from './dto/transaction.dto';
import { FastifyRequest } from 'fastify';
import * as fs from 'fs';
import * as util from 'util';
import { pipeline } from 'stream';
import * as path from 'path';
import { UpdateTransactionRequestDto } from './dto/transaction/updateTransaction.dto';
const pump = util.promisify(pipeline);


@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async createTransaction(@Body() transactionData: TransactionRequestDto, @Req() req: any) {
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
  @Post('/update-all-status')
  @HttpCode(200)
  async updateAllStatus() {
    return this.transactionService.updateAllTxTStatus();
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
      transactionData.username
    );
  }
  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @HttpCode(200)
  @Post('/get-one')
  async getTxHistory(@Body() transactionData: any) {
    return this.transactionService.getTransactionHistoryById(
      transactionData.ref_id,
    );
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @HttpCode(200)
  @Post('/get')
  async getTxHistories(@Body() transactionData: any) {
    return this.transactionService.getTransactionHistories(
      transactionData.page,
      transactionData.take,
      transactionData.status,
      transactionData.source
    );
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @HttpCode(200)
  @Post('/get-itemku-history')
  async getItemkuTxHistories(@Body() transactionData: any) {
    return this.transactionService.getItemkuOrderHistory(
      transactionData.page,
      transactionData.take,
      transactionData.status,
    );
  }

  @Post('/mock-order-itemku')
  async mockItemkuOrder(@Body() data : ItemkuOrder){
    return this.transactionService.updateItemkuOrderStatus(data)
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @Post('/update-order-itemku')
  async updateItemkuOrder(@Body() data : ItemkuOrder){
    return this.transactionService.updateItemkuOrderStatus(data)
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @Post('/bulk-update-tx')
  async bulkUpdatetx(){
    return this.transactionService.bulkUpdateItemkuOrderStatus()
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @Post('/manual-update-tx')
  async manualUpdatetx(@Body() data : any){
    return this.transactionService.manualUpdateTxHistory(data.refIds)
  }
  
  @Post('/get-digiflazz')
  async getDigiflazzProductPrice(){
    return this.transactionService.getDigiflazzPrice()
  }

  @Post('/get-itemku')
  async getItemkuProductPrice(){
    return this.transactionService.getItemkuPrice()
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @Post('/update-tx-history')
  async updateTransactionHistoryDetail(@Body() data: UpdateTransactionRequestDto){
    return this.transactionService.updateTxHistoryById(data)
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])  
  @Post('/itemku/product/upload')
  async uploadFile(@Req() req: any): Promise<any> {
    try {
      // Make sure the uploads directory exists
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      
      // Process file upload with Fastify
      const data = await req.file();
      
      if (!data) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }
      
      // Validate file type
      const fileExtension = path.extname(data.filename).toLowerCase();
      if (!['.xls', '.xlsx'].includes(fileExtension)) {
        throw new HttpException('Only Excel files (.xls, .xlsx) are allowed', HttpStatus.BAD_REQUEST);
      }
      
      // Create a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `file-${uniqueSuffix}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Write the file
      const writeStream = fs.createWriteStream(filePath);
      await pump(data.file, writeStream);
      
      // Parse the excel file
      const result = await this.transactionService.parseItemkuExcel(filePath);
      
      // Optional: Remove the file after processing
      // fs.unlinkSync(filePath);
      
      return { status: 'success', data: result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error processing file upload',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
