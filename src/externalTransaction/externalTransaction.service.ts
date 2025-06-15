import { HttpException, Injectable } from "@nestjs/common";
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
import { ExternalSupplierProduct } from "@prisma/client";
import { productToDbMapper } from "./mapper/productToDbMapper";

@Injectable()
export class ExternalTransactionService {
  constructor(
    @InjectQueue('extTransactions') private readonly extTransactionQueue: Queue,
    private prisma: PrismaService,
  ) { }

  async addTransaction(transactionData: ExternalTxRequestDto, apiKey: string): Promise<any> {
    const batch_id = "B" + generateReferenceId()

    const transactionDetail : any = await this.preTransaction(transactionData, apiKey)

    const batch = await this.prisma.externalTransactionBatch.create({
      data: {
        batch_id
      }
    })

    if(transactionDetail && transactionDetail.length > 0){
      transactionDetail.forEach(async(x) => {
        const processorName = `processor-${batch.batch_id}`;
        const transactionDataDetail = {
          customer_no: x.customer_no,
          code: transactionData.code,
          batch_id: batch.batch_id
        }
  
        const job = await this.extTransactionQueue.add(
          processorName,
          {
            ...transactionDataDetail,
            ref_id: x.ref_id,
            transactionDetail,
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
   


    // TO DO
    // Create Batch
    // Pre Transaction (find product, compare to supplier price, check balance)
    // Process TX, add to job iterated

    // queue job only if it meets preTransaction requirements
    //  const transactionDetail = await this.preTransaction(
    //    transactionData,
    //    _ref_id,
    //    apiKey,
    //  );

    //  console.log(transactionDetail, "transaction detail")

    //  if (typeof transactionDetail == 'string') {
    //    return new HttpException(transactionDetail, HttpStatus.BAD_REQUEST);
    //  }

    //  const processorName = `processor-${username}`;

    //  const job = await this.transactionQueue.add(
    //    processorName,
    //    {
    //      ...transactionData,
    //      ref_id: _ref_id,
    //      transactionDetail,
    //    },
    //    {
    //      jobId: _ref_id,
    //      attempts: 3,
    //      backoff: {
    //        type: 'exponential',
    //        delay: 5000,
    //      },
    //    },
    //  );

    //  return {
    //    ref_id: job.id,
    //    status: 'processing',
    //    message: `Transaction in process`,
    //  };
  }

  async preTransaction(transactionData: ExternalTxRequestDto, apiKey: string) {
    const { code, customer_no } = transactionData

    if (!code) {
      return new ApiResponseDto(errorMap[4000] + 'code', null, '4000')
    }

    if (!customer_no) {
      return new ApiResponseDto(errorMap[4000] + 'customer_no', null, '4000')
    }

    const findUser = await this.prisma.externalUser.findMany({
      where: {
        apiKey
      }
    });

    if (findUser.length == 0) {
      return new ApiResponseDto(errorMap[4002], null, '4000')
    }

    const product = await this.prisma.externalSupplierProduct.findFirst({
      where: {
        code
      }
    })

    if (!product) {
      return new ApiResponseDto(errorMap[2000], null, '2000')
    }

    const totalCost = product.price * customer_no.length

    const adminBalance = await this.getAdminBalanceFn()

    if (totalCost > adminBalance) {
      return new ApiResponseDto(errorMap[5000], null, '5000')
    }

    const txDetails: any[] = []

    customer_no.forEach((x) => {
      const ref_id = generateReferenceId()
      txDetails.push({
        ref_id,
        customer_no: x
      }) 
    })


    return txDetails
  }

  async processTransaction(customer_no: string, code: string, ref_id: string, batchId: string) {
    
    const sign = generateSignature(
      process.env.BLUESTUCK_USERNAME || '',
      process.env.BLUESTUCK_API_KEY || '',
      ref_id
    )

    try{
      const body = {
        username: process.env.BLUESTUCK_USERNAME,
        code,
        customer_no,
        ref_id,
        sign
      };

      const response = await this.httpAgentPost(body, 'api/transaction');
      console.log('Success Digiflazz Request Transaction', response.data);

      const transaction = response.data?.data;

      await this.prisma.externalTransactionHistory.create({
        data: {
          ref_id,
          customer_no,
          buyer_sku_code: code,
          sign,
          rc: transaction.rc,
          sn: transaction.sn,
          username: process.env.BLUESTUCK_USERNAME || '',
          status: transaction.status,
          item_price: transaction.price
        }
      })

    }catch(error: any){

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

      return products;
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
      return response.data.data

    } catch (error: any) {
      return new ApiResponseDto(errorMap[5000], null, '5000')
    }
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