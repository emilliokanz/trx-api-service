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
import { GetTransaction } from './dto/transaction/getTransaction.dto';
import { AuthService } from 'src/auth/auth.service';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  ComparePriceDto,
  GetTxHistoriesDto,
  ItemkuRefIdDto,
  ManualUpdateTxDto,
  RetryItemkuOrderDto,
} from './dto/transaction/itemkuRequest.dto';
import { ItemkuOrderDto } from './dto/transaction/itemkuOrder.dto';
import { JWT_AUTH } from 'src/swagger/swagger.setup';
const pump = util.promisify(pipeline);


/**
 * Appended to the description of routes that declare @UserRoles without an
 * accompanying @UseGuards(AuthGuard), so the spec does not overstate what is
 * actually enforced.
 */
const NOTE =
  ' NOTE: this route carries @UserRoles but no @UseGuards(AuthGuard), so no token is checked ' +
  'today and the role restriction is not enforced.';

@ApiTags('Itemku Transaction')
@ApiSecurity(JWT_AUTH)
@Controller('/api/v1/itemku/transactions')
export class TransactionController {

  constructor(private readonly transactionService: TransactionService) { }

  @ApiOperation({
    summary: 'Status of a payment transaction',
    description: 'Re-reads the supplier status for one reference id.' + NOTE,
  })
  @ApiBody({ type: ItemkuRefIdDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/status')
  @HttpCode(200)
  async getPaymentTransactionStatus(@Body() transactionData: any) {
    return this.transactionService.getPaymentTransactionStatus(
      transactionData.ref_id,
    );
  }

  @ApiOperation({
    summary: 'Re-sync every pending transaction',
    description:
      'Walks all non-final transactions and refreshes them from the supplier. No body.' + NOTE,
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update-all-status')
  @HttpCode(200)
  async updateAllStatus() {
    return this.transactionService.updateAllTxTStatus();
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Queue job status',
    description: 'Returns the state of the BullMQ job that carries this transaction.',
  })
  @ApiParam({ name: 'id', description: 'Queue job id', example: '1421' })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Get('/:id')
  async getJobTransactionStatus(@Param('id') id: string) {
    return this.transactionService.getJobTransactionStatus(id);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Retry failed Itemku orders',
    description: 'SuperAdmin only. Re-queues the given Itemku order ids.',
  })
  @ApiBody({ type: RetryItemkuOrderDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/retry')
  async createPaymentTransactionRequest(@Body() body: any) {
    return this.transactionService.retryItemkuTransaction(body.order_id);
  }

  @ApiOperation({
    summary: 'Compare current price against a balance',
    description:
      'Resolves the current selling price of a SKU for a customer and checks it against the ' +
      'supplied balance.' + NOTE,
  })
  @ApiBody({ type: ComparePriceDto })
  @ApiOkResponse({ type: ApiResponseDto })
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
  @ApiOperation({
    summary: 'Single transaction history entry',
    description: 'Looks up one transaction history record by reference id.',
  })
  @ApiBody({ type: ItemkuRefIdDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @HttpCode(200)
  @Post('/get-one')
  async getTxHistory(@Body() transactionData: any) {

    return new ApiResponseDto('success', await this.transactionService.getTransactionHistoryById(
      transactionData.ref_id,
    ), '0000');

  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @ApiOperation({
    summary: 'Transaction history list',
    description:
      'Paginated history. Note that `status` and `source` are not combined -- when `source` ' +
      'is present it replaces the `status` filter.',
  })
  @ApiBody({ type: GetTxHistoriesDto })
  @ApiOkResponse({ type: ApiResponseDto })
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
  @ApiOperation({
    summary: 'Itemku order history',
    description:
      'Paginated Itemku order list. Text filters match partially and case insensitively; the ' +
      'date range applies only when both `dateStart` and `dateEnd` are given.',
  })
  @ApiBody({ type: GetTransaction })
  @ApiOkResponse({ type: ApiResponseDto })
  @HttpCode(200)
  @Post('/get-itemku-history')
  async getItemkuTxHistories(@Body() transactionData: GetTransaction) {
    return this.transactionService.getItemkuOrderHistory(
      transactionData
    );
  }


  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Simulate an Itemku order webhook',
    description:
      'SuperAdmin only. Feeds a synthetic Itemku order through the same path as ' +
      '`/update-order-itemku`. Intended for testing.',
  })
  @ApiBody({ type: ItemkuOrderDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/mock-order-itemku')
  async mockItemkuOrder(@Body() data: ItemkuOrder) {
    return this.transactionService.updateItemkuOrderStatus(data)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Upsert an Itemku order',
    description: 'Stores the order and moves its transaction forward when the status changed.',
  })
  @ApiBody({ type: ItemkuOrderDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update-order-itemku')
  async updateItemkuOrder(@Body() data: ItemkuOrder) {
    return this.transactionService.updateItemkuOrderStatus(data)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Bulk re-sync Itemku orders',
    description: 'Refreshes every tracked Itemku order in one pass. No body.',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/bulk-update-tx')
  async bulkUpdatetx() {
    return this.transactionService.bulkUpdateItemkuOrderStatus()
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Manually re-sync transactions',
    description: 'Refreshes the given reference ids against the supplier.',
  })
  @ApiBody({ type: ManualUpdateTxDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/manual-update-tx')
  async manualUpdatetx(@Body() data: any) {
    return this.transactionService.manualUpdateTxHistory(data.refIds)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Fetch the Digiflazz price list',
    description: 'SuperAdmin only. Returns the raw supplier price list. No body.',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/get-digiflazz')
  async getDigiflazzProductPrice() {
    return this.transactionService.getDigiflazzPrice()
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Fetch the Itemku price list',
    description: 'SuperAdmin only. Returns the raw Itemku price list. No body.',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/get-itemku')
  async getItemkuProductPrice() {
    return this.transactionService.getItemkuPrice()
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update a transaction history entry',
    description: 'Rewrites the SKU / destination of an existing transaction, matched on `ref_id`.',
  })
  @ApiBody({ type: UpdateTransactionRequestDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update-tx-history')
  async updateTransactionHistoryDetail(@Body() data: UpdateTransactionRequestDto) {
    return this.transactionService.updateTxHistoryById(data)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Import Itemku products from Excel',
    description:
      'Multipart upload of a single `.xls`/`.xlsx` file (10 MB max). The sheet is parsed and ' +
      'the rows are imported. Rejects any other extension with a 400.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Excel file (.xls or .xlsx)' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { status: { type: 'string', example: 'success' }, data: { type: 'object' } },
    },
  })
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
