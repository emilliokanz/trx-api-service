import { HttpException, Injectable } from "@nestjs/common";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import generateSignature from "src/utils/generateSignature";
import { ExternalTxRequestDto } from "./dto/extTxRequest.dto";
import generateReferenceId from "src/utils/generateReferenceId";

@Injectable()
export class ExternalTransactionService {
  constructor() { }

 async addTransaction(transactionData: ExternalTxRequestDto, apiKey: string): Promise<any> {
     const { customer_no } = transactionData;
 
     const batchId = "B" + generateReferenceId
     const _ref_id = generateReferenceId()

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

  async getProductList() {
    const body = {
      command: "prepaid",
      username: process.env.BLUESTUCK_USERNAME,
      sign: generateSignature(
        process.env.BLUESTUCK_USERNAME || '', 
        process.env.BLUESTUCK_API_KEY || '', 
        "pricelist")
    }
    try {
      const response = await this.httpAgentPost(body, 'api/price-list')
      console.log(response)
      return response.data.data
    } catch (e: any) {
      console.log(e.response)
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