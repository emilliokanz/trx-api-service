import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
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

@Injectable()
export class ExternalTransactionService {
  constructor(
    @InjectQueue('extTransactions') private readonly extTransactionQueue: Queue,
    private prisma: PrismaService,
    private owner: OwnerService,
    private extProduct: ExternalProductService
  ) { }

  async addTransaction(transactionData: ExternalTxRequestDto, apiKey: string) {
    const batch_id = "B" + generateReferenceId()

    const transactionDetail: any = await this.preTransaction(transactionData, apiKey)
    console.log(transactionDetail, "tx detail")

    if (transactionDetail.errorCode) {
      return transactionDetail
    }

    const batch = await this.prisma.externalTransactionBatch.create({
      data: {
        batch_id
      }
    })

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
            attempts: 3,
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

  async preTransaction(transactionData: ExternalTxRequestDto, apiKey: string) {
    const { code, customer_no, username } = transactionData

    await this.getProductList()

    if (!apiKey) {
      return new ApiResponseDto(errorMap[4002], null, '4002')
    }

    if (!code) {
      return new ApiResponseDto(errorMap[4000] + 'code', null, '4000')
    }

    if (customer_no.length == 0) {
      return new ApiResponseDto(errorMap[4000] + 'customer_no', null, '4000')
    }


    if (Array.isArray(customer_no)) {
      const seen = new Set<string>();
      const duplicates = new Set<string>();
    
      customer_no.forEach(no => {
        if (seen.has(no)) {
          duplicates.add(no);
        } else {
          seen.add(no);
        }
      });
    
      if (duplicates.size > 0) {
        return new ApiResponseDto(errorMap[4006], null, '4006')

      }
    }

    const findUser = await this.prisma.externalUser.findMany({
      where: {
        username
      }
    });

    if (findUser.length == 0) {
      return new ApiResponseDto(errorMap[1004], null, '1004')
    }


    const validApiKey = await bcrypt.compare(apiKey, findUser[0].apiKey || '');

    if (!validApiKey) {
      return new ApiResponseDto(errorMap[4003], null, '4003')
    }

    const extProduct = await this.prisma.externalProduct.findFirst({
      where: {
        item_id: code
      }
    })


    if (!extProduct) {
      return new ApiResponseDto(errorMap[2000], null, '2000')
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

    const cost = 0

    junctionProduct.forEach((x) => {
      const price = x.product.price * x.qty
      cost + price
    })

    const totalCost = cost * customer_no.length

    const adminBalance = await this.getAdminBalanceFn()

    if (totalCost > adminBalance.data) {
      return new ApiResponseDto(errorMap[5000], null, '5000')
    }

    const txDetails: any[] = []

    customer_no.forEach((x) => {    
      const ref_id = generateReferenceId()
      junctionProduct.forEach((product) => {
        if (product.qty > 1) {
          const profit = (extProduct.price - (product.product.price * product.qty)) / product.qty
          for (let i = 1; i <= product.qty; i++) {
            txDetails.push({
              ref_id,
              customer_no: x,
              code: product.product.code,
              profit
            })
          }
        } else {
          const profit = extProduct.price - product.product.price
          txDetails.push({
            ref_id,
            customer_no: x,
            code: product.product.code,
            profit
          })
        }
      })
    })


    return txDetails
  }

  async processTransaction(customer_no: string, code: string, ref_id: string, batchId: string, profit: number) {
    let response : any = {};


    const sign = generateSignature(
      process.env.BLUESTUCK_USERNAME || '',
      process.env.BLUESTUCK_API_KEY || '',
      ref_id
    )

    try {
      const body = {
        username: process.env.BLUESTUCK_USERNAME,
        code,
        customer_no,
        ref_id,
        sign
      };

      try {
        response = await this.httpAgentPost(body, 'api/transaction');
      } catch (error: any) {
        console.error(error.message);
        console.log(error.response?.data);
        response = error.response;
      }
      

      const transaction = response.data?.data;
      console.log(transaction, "transaction response")

      const tx = await this.prisma.externalTransactionHistory.create({
        data: {
          externalTransactionBatchBatch_id: batchId,
          ref_id,
          customer_no: customer_no.toString(),
          buyer_sku_code: code,
          sign,
          rc: transaction.rc || '',
          sn: transaction.sn || '',
          username: process.env.BLUESTUCK_USERNAME || '',
          status: transaction.status || TransactionStatus.FAILED,
          item_price: transaction.price || 0,
          profit
        }
      })

      console.log("saved tx", tx)

    } catch (error: any) {
      console.error(error.message)
      console.log(error.response.data)
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
      const response = await this.httpAgentPost(body, 'api/price-list');

      const products = response.data?.data;

      if (!Array.isArray(products) || products.length === 0) {
        console.warn('No products found in response.');
        return [];
      }

      const mapProduct = await productToDbMapper(products)

      await Promise.all(
        mapProduct.map((product) =>
          this.prisma.externalSupplierProduct.upsert({
            where: { code: product.code },
            update: { ...product }, // update all fields or select which ones
            create: { ...product },
          })
        )
      );

      return new ApiResponseDto("success", products, '0000')
    } catch (e: any) {
      console.error('Error during product list fetch or insert:', e?.response?.data || e.message || e);
      return []; // return something to avoid undefined
    }
  }

  async getAdminBalanceFn() {
    const body = {
      username: process.env.BLUESTUCK_USERNAME,
      sign: generateSignature(
        process.env.BLUESTUCK_USERNAME || '',
        process.env.BLUESTUCK_API_KEY || '',
        'depo'
      ),
    };

    try {
      const response = await this.httpAgentPost(body, 'api/cek-saldo');
      return new ApiResponseDto("success", response.data.data, '0000')


    } catch (error: any) {
      return new ApiResponseDto(errorMap[5000], null, '5000')
    }
  }

  async getPaymentTransactionStatus(ref_id: string) {
      const transaction = await this.prisma.externalTransactionHistory.findFirst({
        where: {
          ref_id
        }
      })
      const product = await this.prisma.externalSupplierProduct.findUnique({
        where: {
          code: transaction?.buyer_sku_code
        }
      })
  
      if (!transaction) {
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

  async httpAgentPost(requestBody: any, url: string) {
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