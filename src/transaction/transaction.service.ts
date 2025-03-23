import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bull';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CustomerService } from 'src/customer/customer.service';
import PaginationIface from 'src/interface/paginationIface';
import { OwnerService } from 'src/owner/owner.service';
import { PrismaService } from 'src/prisma/prisma.service';
import generateReferenceId from 'src/utils/generateReferenceId';
import generateSignature from 'src/utils/generateSignature';
import {
  Bill,
  TransactionDetail,
  TransactionRequest,
  TransactionStatus,
} from './transactionIface';

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
    private customer: CustomerService,
    private owner: OwnerService,
  ) {}

  async addTransaction(transactionData: any, apiKey: string): Promise<any> {
    const { customer_no, username, ref_id } = transactionData;


    let _ref_id = ref_id != undefined ? ref_id : generateReferenceId()

    console.log(_ref_id, "ref id value")


    // queue job only if it meets preTransaction requirements
    const transactionDetail = await this.preTransaction(
      transactionData,
      _ref_id,
      apiKey,
    );

    console.log(transactionDetail, "transaction detail")

    if (typeof transactionDetail == 'string') {
      return new HttpException(transactionDetail, HttpStatus.BAD_REQUEST);
    }

    const processorName = `processor-${username}`;

    const job = await this.transactionQueue.add(
      processorName,
      {
        ...transactionData,
        ref_id: _ref_id,
        transactionDetail,
      },
      {
        jobId: _ref_id,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return {
      ref_id: job.id,
      status: 'processing',
      message: `Transaction in process`,
    };
  }

  async getJobTransactionStatus(jobId: string): Promise<any> {
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

  async getTransactionHistories(page: number, take: number) {
    const data = await this.prisma.transactionHistory.findMany({
      skip: page - 1,
      take,
    });

    const totalData = await this.prisma.transactionHistory.count();

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / take),
    };

    return paginationData;
  }

  async getTransactionHistoryById(ref_id: string) {
    const data = await this.prisma.transactionHistory.findUnique({
      where: { ref_id },
    });

    return data;
  }

  async requestTransaction(transactionData: TransactionRequest) {
    const { buyer_sku_code, customer_no, ref_id, transactionDetail, username } =
      transactionData;

    const { bill, customerData } = transactionDetail;

    const userData = await this.customer.getUserByUsername(username)

    if(userData[0].balance < bill.itemPrice){
      this.logger.debug(`Insuficient Balance for user ${username}: balance = ${userData[0].balance} < ${bill.itemPrice}`)
      return new HttpException('Insuficient Balance', HttpStatus.BAD_REQUEST)
    } 

    await this.customer.deductUserBalance(bill.itemPrice, username);

    try {
      const sign = generateSignature(USERNAME, API_KEY, ref_id);

      const requestBody = {
        username: USERNAME,
        buyer_sku_code: buyer_sku_code,
        customer_no: customer_no,
        ref_id: ref_id,
        sign: sign,
      };

      // const response = await httpAgentPost(
      //   requestBody,
      //   'https://api.digiflazz.com/v1/transaction',
      // );

      await this.prisma.transactionHistory.create({
        data: {
          ...requestBody,
          profit: bill.profit,
          customer_id: customerData.id,
        },
      });


      // console.log('Success Digiflazz Request Transaction', response.data);

      // await this.getPaymentTransactionStatus(ref_id)
      return {message: 'success'}

      // return response.data;
    } catch (error) {
      console.log('Error Digiflazz Request Transaction', error.response.data);

      // Return deducted balance
      await this.customer.addUserBalance(bill.itemPrice, username);
      return new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPaymentTransactionStatus(ref_id: string) {
    const transaction = await this.prisma.transactionHistory.findUnique({
      where: { ref_id },
    });

    if (!transaction) {
      return new HttpException('Transaction not found', HttpStatus.BAD_REQUEST);
    }

    const checkTransactionDate =
      transaction.createdAt.getTime() + 7.776e9 - 300000 <= Date.now();

    const checkTransactionStatus = [
      TransactionStatus.SUCCESS.toString(),
      TransactionStatus.FAILED.toString(),
      TransactionStatus.INDETERMINATE.toString(),
    ].includes(transaction.status || '');

    if (checkTransactionStatus) {
      return transaction;
    }

    if (checkTransactionDate) {
      return new HttpException(
        'Cannot check transaction, transaction has passed 90 days',
        HttpStatus.BAD_REQUEST,
      );
    }

    const requestBody = {
      username: USERNAME,
      buyer_sku_code: transaction.buyer_sku_code,
      customer_no: transaction.customer_no,
      ref_id: ref_id,
      sign: transaction.sign,
    };

    const response = await httpAgentPost(
      requestBody,
      'https://api.digiflazz.com/v1/transaction',
    );

    const trxStatus = response.data.data.status
    
    const update = await this.prisma.transactionHistory.update({
      where: { ref_id },
      data: { status: trxStatus },
    });

    if(trxStatus == TransactionStatus.SUCCESS.toString()){
      const profit = await this.owner.divideOwnerProfit(update.profit || 0);
      console.log("Received Profit", profit)
    }

    if(trxStatus == TransactionStatus.FAILED.toString()){
      const noProfit = await this.owner.decrementOwnerProfit(update.profit || 0);
      console.log("Revert Profit", noProfit)
    }

    return update;
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

    const findUser = await this.customer.getUserByUsername(username);

    if (findUser.length == 0) {
      return 'User not found';
    }

    const validApiKey = await bcrypt.compare(apiKey, findUser[0].apiKey);

    if (!validApiKey) {
      return 'Invalid API key';
    }

    const bill = await this.comparePriceAndBalance(
      buyer_sku_code,
      Number(findUser[0].balance),
      username
    );

    if (typeof bill == 'string') {
      return bill;
    }

    const findTransaction = await this.prisma.transactionHistory.findUnique({
      where: { ref_id },
    });

    if (findTransaction) {
      return 'Transaction already exist';
    }

    const transactionDetail: TransactionDetail = {
      customerData: findUser[0],
      bill,
    };

    return transactionDetail;
  }

  async comparePriceAndBalance(buyer_sku_code: string, userBalance: number, username: string) {
    const sellerPrice = await this.prisma.productPrice.findMany({
      where: {
        buyer_sku_code,
      },
    });

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

    let currentPrice;
    try {
      const response = await httpAgentPost(
        requestBody,
        'https://api.digiflazz.com/v1/price-list',
      );

      const digiflazzPrice = response.data.data.find(
        (x: any) => x.buyer_sku_code == buyer_sku_code,
      );

      currentPrice = digiflazzPrice.price;

      await this.prisma.productPrice.update({
        where: { id: sellerPrice[0].id },
        data: {
          ...sellerPrice[0],
          actualPrice: currentPrice,
        },
      });
    } catch (_) {
      currentPrice = sellerPrice[0].actualPrice;
    }

    if (sellerPrice[0].price < currentPrice) {
      this.logger.debug(`Setup price fo code ${buyer_sku_code} is too low`);
      return `Setup price fo code ${buyer_sku_code} is too low`;
    }

    if (userBalance < sellerPrice[0].price) {
      this.logger.debug(
        `User's balance ${userBalance} is too low for product price ${sellerPrice[0].price}`,
      );
      return `User's balance ${userBalance} is too low for product price ${sellerPrice[0].price}`;
    }

    const sellerBalance = await checkBalance();

    if (sellerBalance.data < currentPrice) {
      this.logger.debug(
        `Sellers's balance ${sellerBalance} is too low for product price ${currentPrice}`,
      );
      return `Sellers's balance ${sellerBalance} is too low for product price ${currentPrice}`;
    }

    this.logger.debug(
      `Our price ${sellerPrice[0].price} > current price ${currentPrice}`,
    );

    this.logger.debug(`Current Seller Balance: ${userBalance}`);

    const bill: Bill = {
      itemPrice: sellerPrice[0].price,
      userBalance,
      profit: sellerPrice[0].price - currentPrice,
    };

    return bill;
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
