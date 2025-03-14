import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bull';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { PrismaService } from 'src/prisma/prisma.service';
import generateReferenceId from 'src/utils/generateReferenceId';
import generateSignature from 'src/utils/generateSignature';

const USERNAME = 'beyuziDVABxo';
const API_KEY = '50938246-642e-5e7e-8ee2-33cafc35294b';
const PROXY_URL =
  'http://yxYf9w6f1zc2w0g:vmwgdVPeVPOxQsy@185.235.71.237:49224/';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectQueue('userTransactions') private readonly transactionQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async addTransaction(transactionData: any, apiKey: string): Promise<any> {
    const { customer_no } = transactionData;

    const ref_id = generateReferenceId();

    // queue job only if it meets preTransaction requirements
    const isValidated = await this.preTransaction(
      transactionData,
      ref_id,
      apiKey,
    );

    if (typeof isValidated == 'string') {
      return new HttpException(isValidated, HttpStatus.BAD_REQUEST);
    }

    const job = await this.transactionQueue.add(
      {
        ...transactionData,
        createdAt: new Date(),
      },
      {
        deduplication: { id: customer_no },
        jobId: ref_id,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        delay: 2000,
        limiter: {
          max: 1,
          duration: 10000,
          bounceBack: true,
        },
      },
    );

    return {
      id: job.id,
      status: 'queued',
      message: `Transaction queued for userId ${customer_no}`,
    };
  }

  async getTransactionStatus(jobId: string): Promise<any> {
    const job = await this.transactionQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    return {
      id: job.id,
      status: state,
      data: job.data,
    };
  }

  async requestTransaction(transactionData: any) {
    const { buyer_sku_code, customer_no, ref_id } = transactionData;

    try {
      const sign = generateSignature(USERNAME, API_KEY, ref_id);

      const requestBody = {
        username: USERNAME,
        buyer_sku_code: buyer_sku_code,
        customer_no: customer_no,
        ref_id: ref_id,
        sign: sign,
      };

      const response = await httpAgentPost(
        requestBody,
        'https://api.digiflazz.com/v1/transaction',
      );

      await this.prisma.transactionHistory.create({ data: requestBody });

      return response.data;
    } catch (error) {
      return new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async preTransaction(transactionData: any, ref_id: string, apiKey: string) {
    const { buyer_sku_code, customer_no, username } = transactionData;

    if (!buyer_sku_code || !customer_no) {
      return 'Missing field required';
    }

    const jobExist = await this.transactionQueue.getJob(ref_id);

    if (jobExist) {
      return `Transaction exist for ref id ${ref_id}`;
    }

    const findUser = await this.prisma.customer.findMany({
      where: { username },
    });

    if (findUser.length == 0) {
      return 'User not found';
    }

    const validApiKey = await bcrypt.compare(apiKey.trim(), findUser[0].apiKey);
    console.log(validApiKey, 'valid api key');

    if (!validApiKey) {
      return 'Invalid API key';
    }

    const isPriceMatch = await this.comparePriceAndBalance(
      buyer_sku_code,
      Number(findUser[0].balance),
    );

    if (typeof isPriceMatch == 'string') {
      return isPriceMatch;
    }

    const findTransaction = await this.prisma.transactionHistory.findUnique({
      where: { ref_id },
    });

    if (findTransaction) {
      return 'Transaction already exist';
    }

    return true;
  }

  async comparePriceAndBalance(buyer_sku_code: string, userBalance: number) {
    const sellerPrice = await this.prisma.productPrice.findMany({
      where: {
        buyer_sku_code,
      },
    });

    console.log(sellerPrice, ' seller price');

    if (sellerPrice.length == 0) {
      return 'Product not found';
    }

    const sign = generateSignature(USERNAME, API_KEY, 'pricelist');

    const requestBody = {
      cmd: 'prepaid',
      username: USERNAME,
      sign: sign,
      category: sellerPrice[0].category,
      brand: sellerPrice[0].brand,
    };

    const response = await httpAgentPost(
      requestBody,
      'https://api.digiflazz.com/v1/price-list',
    );

    const currentPrice = response.data.data.find(
      (x: any) => x.buyer_sku_code == buyer_sku_code,
    );

    if (sellerPrice[0].price < currentPrice.price) {
      this.logger.debug(`Setup price fo code ${buyer_sku_code} is too low`);
      return `Setup price fo code ${buyer_sku_code} is too low`;
    }

    if (userBalance < currentPrice.price) {
      this.logger.debug(
        `User's balance ${userBalance} is too low for product price ${currentPrice.price}`,
      );
      return `User's balance ${userBalance} is too low for product price ${currentPrice.price}`;
    }

    const sellerBalance = await checkBalance();

    if (sellerBalance.data < currentPrice.price) {
      this.logger.debug(
        `Sellers's balance ${userBalance} is too low for product price ${currentPrice.price}`,
      );
      return `Sellers's balance ${userBalance} is too low for product price ${currentPrice.price}`;
    }

    this.logger.debug(
      `Our price ${sellerPrice[0].price} > current price ${currentPrice.price}`,
    );

    return true;
  }
}

async function checkBalance() {
  const sign = generateSignature(USERNAME, API_KEY, 'depo');
  const requestBody = {
    cmd: 'deposit',
    username: USERNAME,
    sign,
  };
  const response = await httpAgentPost(
    requestBody,
    'https://api.digiflazz.com/v1/cek-saldo',
  );

  return response.data;
}

async function httpAgentPost(requestBody: any, url: string) {
  const agent = new HttpsProxyAgent(PROXY_URL);

  const response = await axios.post(url, requestBody, {
    httpsAgent: agent,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}
