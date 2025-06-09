import { HttpException, Injectable } from "@nestjs/common";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ApiResponse } from "src/dto/apiResponse.dto";
import generateSignature from "src/utils/generateSignature";

@Injectable()
export class ExternalTransactionService {
  constructor() { }

  // async requestTransaction(body: any){
  //     try {
  //         const { id, pin, user, pass, kodeproduk, tujuan, idtrx } = body;

  //         // Validasi input
  //         if (!id || !pin || !user || !pass || !kodeproduk || !tujuan || !idtrx) {
  //             return new ApiResponse()
  //         }

  //         // Konfigurasi Proxy
  //         const agent = new HttpsProxyAgent(process.env.PROXY_URL || '');

  //         // Kirim request ke API
  //         const response = await axios.get(process.env.API_URL || '', {
  //           params: { id, pin, user, pass, kodeproduk, tujuan, idtrx },
  //           httpsAgent: agent,
  //         });

  //         // Kirim hasil response ke client
  //         res.json(response.data);
  //       } catch (error) {
  //         res.status(500).json({ error: error.message });
  //       }
  // }

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