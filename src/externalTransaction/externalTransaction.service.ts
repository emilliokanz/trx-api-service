import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import generateSignature from "src/utils/generateSignature";
import { ExternalTxRequestDto } from "./dto/extTxRequest.dto";
import generateReferenceId from "src/utils/generateReferenceId";
import { InjectQueue } from "@nestjs/bullmq";
import { PrismaService } from "src/prisma/prisma.service";
import { Queue } from "bullmq";
import { errorMap } from "src/lib/errorCodes";
import * as bcrypt from 'bcrypt';
import { productToDbMapper } from "./mapper/productToDbMapper";
import { TransactionStatus } from "src/transaction/transactionIface";
import { OwnerService } from "src/owner/owner.service";
import { ExternalProductService } from "src/externalProduct/externalProduct.service";
import { take } from "rxjs";
import PaginationIface from "src/interface/paginationIface";
import { PreTxDetailDto } from "./dto/preTxDetail.dto";
import { SchedulerService } from "src/scheduler/scheduler.service";
import * as FormData from "form-data";
import { Prisma, Roles } from "@prisma/client";

@Injectable()
export class ExternalTransactionService {
  private readonly logger = new Logger(SchedulerService.name)

  constructor(
    @InjectQueue('extTransactions') private readonly extTransactionQueue: Queue,
    private prisma: PrismaService,
    private owner: OwnerService,
    private extProduct: ExternalProductService,
  ) { }

  async addTransaction(transactionData: ExternalTxRequestDto, apiKey: string, isWeb?: boolean, role?: string) {
    const batch_id = "B" + generateReferenceId()

    const transactionDetail: any = await this.preTransaction(transactionData, apiKey, isWeb)

    if (transactionDetail.errorCode) {
      return transactionDetail
    }

    const batch = await this.prisma.externalTransactionBatch.create({
      data: {
        batch_id
      }
    })

    const createTxHistPayload: Prisma.ExternalTransactionHistoryCreateManyInput[] = transactionDetail.map((x: any) => {
      return {
        ref_id: x.ref_id,
        buyer_sku_code: x.code,
        customer_no: x.customer_no.toString(),
        profit: x.profit,
        username: "",
        sign: "",
        rc: "",
        sn: "",
        status: TransactionStatus.PENDING,
        externalTransactionBatchBatch_id: batch_id
      }
    });

    console.log("[BATCH] Pre Tx Histories: ", createTxHistPayload)

    try {
      const createTransactionHistory = await this.prisma.externalTransactionHistory.createMany({
        data: createTxHistPayload
      })
      console.log("[BATCH] successfuly input pre Tx History", createTransactionHistory)
    } catch (error: any) {
      console.error(error)
      console.error('[BATCH] inputing pre Tx History to batch failed')
    }

    if (transactionDetail && transactionDetail.length > 0) {
      transactionDetail.forEach(async (x) => {
        const processorName = `processor-${batch.batch_id}`;

        const job = await this.extTransactionQueue.add(
          processorName,
          {
            ...x,
            batch_id: batch.batch_id
          },
          {
            jobId: x.ref_id,
            attempts: 1,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        );

        console.log({
          ref_id: job.id,
          status: 'processing',
          message: `Transaction in process`,
        })
      })
    }

    return new ApiResponseDto('sucess', null, '0000')
  }

  async preTransaction(transactionData: ExternalTxRequestDto, apiKey: string, isWeb?: boolean, role?: string) {
    const { code, customer_no, username } = transactionData

    const extProduct = await this.prisma.externalProduct.findFirst({
      where: {
        item_id: code
      }, include: {
        products: {
          include: {
            product: true
          }
        }
      }
    })

    const type = extProduct?.products[0].product.type

    if (!extProduct) {
      return new ApiResponseDto(errorMap[2000], null, '2000')
    }

    if (type !== "APIBOSS") {
      await this.getProductList()
    }

    if (!isWeb && !apiKey) {
      return new ApiResponseDto(errorMap[4002], null, '4002')
    }

    if (!code) {
      return new ApiResponseDto(errorMap[4000] + 'code', null, '4000')
    }

    if (customer_no.length == 0) {
      return new ApiResponseDto(errorMap[4000] + 'customer_no', null, '4000')
    }

    const findUser = await this.prisma.externalUser.findMany({
      where: {
        username
      }
    });

    if (findUser.length == 0) {
      return new ApiResponseDto(errorMap[1004], null, '1004')
    }

    if (!isWeb) {
      const validApiKey = await bcrypt.compare(apiKey, findUser[0].apiKey || '');

      if (!validApiKey) {
        return new ApiResponseDto(errorMap[4003], null, '4003')
      }
    }

    const junctionProduct = await this.prisma.extProductToSupplierJunction.findMany({
      where: {
        item_id: code
      }, include: {
        product: true
      }
    })

    if (junctionProduct.length == 0) {
      return new ApiResponseDto(errorMap[2000], null, '2000')
    }

    let cost = 0

    junctionProduct.forEach((x) => {
      const price = x.product.price * x.qty
      cost = cost + price
    })

    const totalCost = cost * customer_no.length

    const adminBalance = await this.getAdminBalanceFn(type || "")

    if (totalCost > adminBalance.data) {
      return new ApiResponseDto(errorMap[1002], null, '1002')
    }

    if (role == Roles.Admin || role == Roles.Customer) {
      const findUser = await this.prisma.externalUser.findFirst({
        where: {
          username
        }
      })

      if (!findUser) {
        return new ApiResponseDto(errorMap[1004], null, '1004')
      }

      if (totalCost > findUser?.balance) {
        return new ApiResponseDto(errorMap[1002], null, '1002')
      }
    }

    const txDetails: PreTxDetailDto[] = []

    customer_no.forEach((x) => {
      junctionProduct.forEach((product) => {
        if (product.qty > 1) {
          const profit = (extProduct.price - (product.product.price * product.qty)) / product.qty
          for (let i = 0; i < product.qty; i++) {
            const ref_id = generateReferenceId()
            txDetails.push({
              ref_id,
              customer_no: x,
              code: product.product.code,
              profit,
              supplierType: product.product.type
            })
          }
        } else {
          const profit = extProduct.price - product.product.price
          const ref_id = generateReferenceId()
          txDetails.push({
            ref_id,
            customer_no: x,
            code: product.product.code,
            profit,
            supplierType: product.product.type
          })
        }
      })
    })


    return txDetails
  }

  async processTransaction(customer_no: string, code: string, ref_id: string, batchId: string, profit: number, supplierType: string) {
    let response: any = {};

    // APIBOSS TX
    if (supplierType == "APIBOSS") {
      const sign = generateSignature(
        process.env.APIBOSS_USERNAME || '',
        process.env.APIBOSS_APIKEY || '',
        ref_id
      )

      const body = {
        username: process.env.APIBOSS_USERNAME,
        sku_code: code,
        userid: customer_no,
        ref_id,
        sign
      };

      const form = new FormData();
      form.append('username', process.env.APIBOSS_USERNAME || '');
      form.append('sku_code', code);
      form.append('userid', customer_no);
      form.append('ref_id', ref_id);
      form.append('sign', sign);

      if (process.env.NODE_ENV !== "dev") {
        try {
          response = await this.httpAgentPost(body, '', 'APIBOSS', form);
        } catch (error: any) {
          console.error(error.message);
          console.log(error.response?.data);
          response = error.response;
        }
      }

      const transaction = response.data?.data;

      if (!transaction) {
        console.error(`[APIBOSS] Failed getting response, transaction ref_id: ${ref_id} mark as Failed`)
      }

      const price = Number(transaction?.price) ?? 0
      let status = transaction?.status ?? TransactionStatus.FAILED

      if(status == 0 || status == '0' || status == 'Sukses' || status == 'Successful'){
        status = TransactionStatus.SUCCESS
      } else {
        status = TransactionStatus.FAILED
      }

      const balance = Number(transaction?.balance) ?? 0

      await this.prisma.externalTransactionHistory.update({
        where: {
          ref_id
        },
        data: {
          status: status,
          item_price: price,
          profit,
          sign,
          username: process.env.APIBOSS_USERNAME || ''
        }
      });


      if (balance !== 0) {
        await this.prisma.supplierBalances.update({
          where: {
            name: supplierType
          }, data: {
            balance: +transaction.balance
          }
        })
      } else {
        console.error('[APIBOSS] Balance not updated, failed to receive API response')
      }
    }
  }

  async getProductList() {
    const body = {
      command: 'prepaid',
      username: process.env.BLUESTUCK_USERNAME,
      sign: generateSignature(
        process.env.BLUESTUCK_USERNAME || '',
        process.env.BLUESTUCK_API_KEY || '',
        'pricelist'
      ),
    };

    try {
      // const response = await this.httpAgentPost(body, 'api/price-list');

      // const products = response.data?.data;

      // if (!Array.isArray(products) || products.length === 0) {
      //   console.warn('No products found in response.');
      //   return [];
      // }

      // const mapProduct = await productToDbMapper(products)

      // await Promise.all(
      //   mapProduct.map((product) =>
      //     this.prisma.externalSupplierProduct.upsert({
      //       where: { code: product.code },
      //       update: { ...product }, // update all fields or select which ones
      //       create: { ...product },
      //     })
      //   )
      // );

      const dbProduct = await this.prisma.externalSupplierProduct.findMany()

      return new ApiResponseDto("success", dbProduct, '0000')
    } catch (e: any) {
      console.error('Error during product list fetch or insert:', e?.response?.data || e.message || e);
      return []; // return something to avoid undefined
    }
  }

  async getAdminBalanceFn(type: string | null) {
    if (type = "APIBOSS") {
      const getBalance = await this.prisma.supplierBalances.findUnique({
        where: {
          name: "APIBOSS"
        }
      })

      if (!getBalance) {
        this.logger.debug(`[ADMIN BALANCE] balance for Supplier ${type} not found`)
        return new ApiResponseDto("success", 0, '0000')

      }
      return new ApiResponseDto("success", getBalance?.balance, '0000')

    } else {
      const body = {
        username: process.env.BLUESTUCK_USERNAME,
        sign: generateSignature(
          process.env.BLUESTUCK_USERNAME || '',
          process.env.BLUESTUCK_API_KEY || '',
          'depo'
        ),
      };

      try {
        const response = await this.httpAgentPost(body, 'api/cek-saldo', '', null);
        return new ApiResponseDto("success", response.data.data, '0000')
      } catch (error: any) {
        return new ApiResponseDto(errorMap[5000], null, '5000')
      }
    }

  }

  async getPaymentTransactionStatus(ref_id: string) {
    const transaction = await this.prisma.externalTransactionHistory.findFirst({
      where: {
        ref_id
      }
    })


    if (!transaction) {
      return new ApiResponseDto(errorMap[4004], null, '4004')
    }

    if(transaction.username == 'arvin0181'){
      return null
    }

    const product = await this.prisma.externalSupplierProduct.findUnique({
      where: {
        code: transaction?.buyer_sku_code
      }
    })

    if (!product) {
      return new ApiResponseDto(errorMap[4004], null, '4004')
    }

    const checkTransactionDate =
      transaction.createdAt.getTime() + 7.776e9 - 300000 <= Date.now();

    const checkTransactionStatus = [
      TransactionStatus.SUCCESS.toString(),
      TransactionStatus.FAILED.toString(),
    ].includes(transaction.status || '');

    if (checkTransactionStatus) {
      return transaction;
    }

    if (checkTransactionDate) {
      return new ApiResponseDto(errorMap[4005], null, '4005')
    }

    const body = {
      username: process.env.BLUESTUCK_USERNAME,
      code: transaction.buyer_sku_code,
      customer_no: transaction.customer_no,
      ref_id: transaction.ref_id,
      sign: transaction.sign
    };

    const response = await this.httpAgentPost(
      body,
      'api/transaction',
      product.type,
      null
    );

    const trxStatus = response.data.data.status

    const update = await this.prisma.externalTransactionHistory.update({
      where: { ref_id },
      data: { status: trxStatus },
    });

    if (trxStatus == TransactionStatus.SUCCESS.toString()) {
      const profit = await this.owner.divideOwnerProfit(update.profit || 0, 'EXT');
      console.debug("Received Profit", update.profit)
      // const updateUserBalance = await this.balance.createBalanceHistory({
      //   username: transaction.customer_username ?? '',
      //   af_balance: transaction.customer?.balance ?? 0,
      //   bf_balance: (transaction.customer?.balance ?? 0) + (transaction.item_price ?? 0),
      //   amount: transaction.item_price ?? 0,
      //   customerId: transaction.customer?.id ?? 0,
      //   name: transaction.customer?.name ?? '',
      //   ref_id,
      //   type: 'Transaction'
      // })
      // console.debug("Update customer balance", updateUserBalance)
    }

    // if (trxStatus == TransactionStatus.FAILED.toString()) {
    //   await this.customer.addUserBalance(transaction.item_price || 0, transaction.customer_username || '')
    // }

    return update;
  }

  async updateAllTxTStatus() {
    const data = await this.prisma.externalTransactionHistory.findMany({
      where: {
        status: TransactionStatus.PENDING
      }
    })
    const updatedIds: string[] = []
    data.forEach(async (x) => {
      if (x.status == TransactionStatus.PENDING) {
        try {
          const statusFetch = await this.getPaymentTransactionStatus(x.ref_id)
          updatedIds.push(x.ref_id)
          console.log(statusFetch)
        } catch (e) {
          console.log(e)
          console.error(`failed fetching status, refID : ${x.ref_id}`)
        }
      }
    })

    return updatedIds
  }

  async getTxHistoryByBatchId(
    batch_id: string
  ) {
    const data = await this.prisma.externalTransactionBatch.findFirst({
      where: {
        batch_id
      }, include: {
        transaction: true
      }
    })

    if (!data) {
      return new ApiResponseDto(errorMap[4004], data, '4004');
    }

    return new ApiResponseDto('success', data, '0000');

  }

  async getAllTxHistoryByBatch(
    page: number,
    size: number,
    customer_no: string,
    start_date: string,
    end_date: string,
    batch_id: string,
    ref_id: string
  ) {
    const where: any = {
      transaction: {
        some: {}
      }
    };

    if (customer_no !== '') {
      where.transaction.some.customer_no = customer_no;
    }

    if (start_date !== '' && end_date !== '') {
      where.transaction.some.createdAt = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    } else if (start_date !== '') {
      where.transaction.some.createdAt = {
        gte: new Date(start_date)
      };
    } else if (end_date !== '') {
      where.transaction.some.createdAt = {
        lte: new Date(end_date)
      };
    }

    if (batch_id !== '') {
      where.batch_id = batch_id;
    }

    if (ref_id !== '') {
      where.transaction.some.ref_id = ref_id;
    }

    const data = await this.prisma.externalTransactionBatch.findMany({
      skip: (page - 1) * size,
      take: size,
      orderBy: {
        createdAt: 'desc'
      },
      where
    });

    const totalData = await this.prisma.externalTransactionBatch.count({
      where
    });

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / size)
    };

    return new ApiResponseDto('success', paginationData, '0000');
  }

  async getAllTxHistoryDetailByBatch(page: number,
    size: number,
    customer_no: string,
    start_date: string,
    end_date: string,
    ref_id: string,
    batch_id: string) {
    const where: any = {
    };

    if (batch_id !== '') {
      where.externalTransactionBatchBatch_id = batch_id;
    }

    if (customer_no !== '') {
      where.customer_no = customer_no;
    }

    if (start_date !== '' && end_date !== '') {
      where.createdAt = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    } else if (start_date !== '') {
      where.createdAt = {
        gte: new Date(start_date)
      };
    } else if (end_date !== '') {
      where.createdAt = {
        lte: new Date(end_date)
      };
    }

    if (ref_id !== '') {
      where.ref_id = ref_id;
    }

    const data = await this.prisma.externalTransactionHistory.findMany({
      skip: (page - 1) * size,
      take: size,
      orderBy: {
        createdAt: 'desc'
      },
      where
    });

    const totalData = await this.prisma.externalTransactionHistory.count({
      where
    });

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / size)
    };

    return new ApiResponseDto('success', paginationData, '0000');
  }

  async httpAgentPost(requestBody: any, url: string, supplierType: string, formData: any) {
    if (supplierType == "APIBOSS") {
      const response = await axios.post(
        process.env.APIBOSS_URL + url,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      this.logger.debug(`[EXTERNAL TRANSACTION] API RESPONSE ${supplierType}`, response.data)

      return response
    } else {
      const agent = new HttpsProxyAgent(process.env.DIGI_PROXY_URL ?? '');

      const response = await axios.post(process.env.BLUESTUCK_URL + url, requestBody, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response;
    }
  }
}