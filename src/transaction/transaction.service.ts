import { InjectQueue } from '@nestjs/bullmq';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx';
import { Queue } from 'bullmq';
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
import { TransactionRequestDto } from './dto/transaction.dto';
import { BalanceHistoryService } from 'src/balanceHistory/balanceHistory.service';
import { generateItemkuHeader } from 'src/utils/generateItemkuHeader';
import { ItemkuOrder, Prisma, ProductPrice } from '@prisma/client';
import { getGarenaPlayerId, getMlPlayerId } from 'src/utils/mobileLegends/getPlayerId';
import { ProductService } from 'src/product/product.service';
import { GameItemDto } from './dto/gameItem.dto';
import { TelegramLib } from 'src/lib/telegram';
import { UpdateTransactionRequestDto } from './dto/transaction/updateTransaction.dto';
import { GetTransaction } from './dto/transaction/getTransaction.dto';
import * as moment from 'moment';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  telegramLib: TelegramLib;

  constructor(
    @InjectQueue('userTransactions') private readonly transactionQueue: Queue,
    private prisma: PrismaService,
    private customer: CustomerService,
    private owner: OwnerService,
    private balance: BalanceHistoryService,
    private product: ProductService
  ) {
    this.telegramLib = new TelegramLib();
  }

  async addTransaction(transactionData: TransactionRequestDto, apiKey: string): Promise<any> {
    const { customer_no, username, ref_id } = transactionData;


    let _ref_id = ref_id != undefined ? ref_id : generateReferenceId()

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

  async getTransactionHistories(page: number, take: number, status?: string, source?: string) {
    let where: any = {}

    if(status){
      where = {
        status
      }
    }

    if(source){
      where = {
        source,
      }
    }
    
    const data = await this.prisma.transactionHistory.findMany({
      skip: page - 1,
      take,
      where,
      include: {
        order: true
      }
    });

    const totalData = await this.prisma.transactionHistory.count({
      where
    });

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / take),
    };

    return paginationData;
  }

  async getItemkuOrderHistory(transactionData: GetTransaction) {
    const { page, size, dateEnd, dateStart, sort, status } = transactionData;
    console.log(dateStart, dateEnd, "dates")
  
    const whereClause: Prisma.ItemkuOrderWhereInput = {
      transactionHistory: {
        every: {
          ...(status ? { status } : {}),
        },
      },
      ...(dateStart && dateEnd
        ? {
            updatedAt: {
              gte: moment(dateStart, 'DD-MM-YYYY').toDate(),
              lte: moment(dateEnd, 'DD-MM-YYYY').toDate(),
            },
          }
        : {}),
    };
  
    const orderByClause: Prisma.ItemkuOrderOrderByWithAggregationInput =
      sort === 'DATE_ASC'
        ? { updatedAt: 'asc'  }
        : {   updatedAt: 'desc'  }
  
    const data = await this.prisma.itemkuOrder.findMany({
      skip: (page - 1) * size,
      take: size,
      where: whereClause,
      include: {
        transactionHistory: true,
      },
      orderBy: orderByClause
    });
  
    const totalData = await this.prisma.itemkuOrder.count({
      where: whereClause,
    });
  
    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / size),
    };
  
    this.updateAllTxTStatus;
  
    return paginationData;
  }
  
  async updateAllTxTStatus(){
    const data = await this.prisma.transactionHistory.findMany()
    const updatedIds: string[] = []
    data.forEach(async(x) => {
        if(x.status == TransactionStatus.PENDING){
          try{
            const statusFetch = await this.getPaymentTransactionStatus(x.ref_id)
            updatedIds.push(x.ref_id)
            console.log(statusFetch)
          }catch(e){
            console.log(e)
            console.error(`failed fetching status, refID : ${x.ref_id}`)
          }
        }
    })

    return updatedIds
  }

  async manualUpdateTxHistory(refIds: string[]){
    try{
      await this.prisma.transactionHistory.updateMany({
        where: {
          ref_id: {
            in: refIds
          }
        },
        data: {
          status: TransactionStatus.SUCCESS
        }
      })
    }catch(e){
      console.error(`failed updating all tx`)
      console.log(e)
      return e
    }

    return refIds
  }
  
  async getTransactionHistoryById(ref_id: string) {
    const data = await this.prisma.transactionHistory.findUnique({
      where: { ref_id },
      include: {
        order: true,
      }
      // include: {
      //   customer: true
      // }
    });

    return data;
  }


  async requestTransaction(transactionData: TransactionRequest) {
    const { buyer_sku_code, customer_no, ref_id, transactionDetail, username } =
      transactionData;

    const { bill, customerData } = transactionDetail;

    const userData = await this.customer.getUserByUsername(username)

    if (userData[0].balance < bill.itemPrice) {
      this.logger.debug(`Insuficient Balance for user ${username}: balance = ${userData[0].balance} < ${bill.itemPrice}`)
      return new HttpException('Insuficient Balance', HttpStatus.BAD_REQUEST)
    }

    await this.customer.deductUserBalance(bill.itemPrice, username);

    try {
      const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', ref_id);

      const requestBody = {
        username: process.env.DIGI_USERNAME ?? '',
        buyer_sku_code: buyer_sku_code,
        customer_no: customer_no,
        ref_id: ref_id,
        sign: sign,
      };

      const response = await httpAgentPost(
        requestBody,
        'https://api.digiflazz.com/v1/transaction',
      );

      await this.prisma.transactionHistory.create({
        data: {
          ...requestBody,
          profit: bill.profit,
          customer_id: customerData.id,
          createdBy: customerData.createdBy,
          item_price: bill.itemPrice,
          customer_username: username
        },
      });


      console.log('Success Digiflazz Request Transaction', response.data);

      await this.getPaymentTransactionStatus(ref_id)

      return response.data;

    } catch (error) {
      if (error.response.data.data) {
        await this.telegramLib.sendMessage(error.response.data.data, 'FAILED')
        console.log('Error Digiflazz Request Transaction', error.response.data.data);
      } else {
        await this.telegramLib.sendMessage(error.message.toString(), 'FAILED')
        console.log('Error processing transaction', error.message)
      }

      // Return deducted balance
      await this.customer.addUserBalance(bill.itemPrice, username);
      return new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPaymentTransactionStatus(ref_id: string) {
    const transaction = await this.getTransactionHistoryById(ref_id)
    const product = await this.prisma.productPrice.findUnique({
      where: {
        buyer_sku_code: transaction?.buyer_sku_code
      }
    })

    if (!transaction) {
      return new HttpException('Transaction not found', HttpStatus.BAD_REQUEST);
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
      return new HttpException(
        'Cannot check transaction, transaction has passed 90 days',
        HttpStatus.BAD_REQUEST,
      );
    }

    const requestBody = {
      username: process.env.DIGI_USERNAME ?? '',
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

    if (trxStatus == TransactionStatus.SUCCESS.toString()) {
      console.log(transaction, "transaction")
      let setProfit = 0
      if(transaction.source == 'ITEMKU'){
        if(transaction.order?.price && product?.price){
          setProfit = transaction.order?.price - product?.price
          console.log(setProfit, "profit amount", product?.price, "product price")
        }
      } else {
        setProfit = transaction.profit || 0
      }

      const profit = await this.owner.divideOwnerProfit(setProfit);
      this.logger.debug("Received Profit", profit)
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

    const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', 'pricelist');

    const requestBody = {
      cmd: 'prepaid',
      username: process.env.DIGI_USERNAME ?? '',
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
      this.logger.debug(`Setup price for code ${buyer_sku_code} is too low`);
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

  async getItemkuOrderList() {
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      date_start: today,
      order_status: 'REQUIRE_PROCESS',
      limit: 30
    };
    const { authToken, nonce } = generateItemkuHeader(payload)
    const apiUrl = 'https://tokoku-gateway.itemku.com/api/order/list';
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Api-Key': process.env.ITEMKU_API_KEY ?? '',
        'Nonce': nonce,
        'Content-Type': 'application/json'
      }
    })

    const orders = response.data.data

    console.log("Pending Orders", orders)

    if (orders.length > 0) {
      orders.forEach(async (x: ItemkuOrder) => {
        if (x.game_name === "Garena Free Fire" || x.game_name === "Garena Free Fire MAX" || x.game_name === 'Mobile Legends') {
          console.log('Processing Order', x)
          await this.updateItemkuOrderStatus(x)
        } else {
          console.log('No new Mobile Legends or Free Fire order found')
        }
      })
    } else {
      this.logger.debug('No new order found')
    }


    return response.data.data
  }

  async updateItemkuOrderStatus(orderData: ItemkuOrder) {
    const itemkuOrder = await this.prisma.itemkuOrder.findUnique({
      where: {
        order_id: orderData.order_id
      }
    })

    if (itemkuOrder) {
      this.logger.debug(`order id ${orderData.order_id}, already existed`)
      return null
    }

    await this.processUpdateItemkuOrder(orderData)
  }

  async bulkUpdateItemkuOrderStatus() {

    const transactions = await this.prisma.transactionHistory.findMany({
      where: {
        buyer_sku_code: {
          not: ''
        },
        status: TransactionStatus.FAILED,
        source: 'ITEMKU'
      },
      include: {
        order: true
      }
    })

    if(transactions.length !== 0){
      transactions.forEach(async(tx) => {
        const ref_id = generateReferenceId();
        
  
        if(tx.order){
          try{
            await this.processTransaction(ref_id, tx.buyer_sku_code, tx.customer_no, tx.order_id || 0, tx.order)
          }catch(_){
            console.error(`failed processing tx: ${ref_id}, with orderId: ${tx.order_id}`)
          }
        }
      })
  
      const toDeleteRefIds : string[]= []
      transactions.forEach((x) => toDeleteRefIds.push(x.ref_id))
  
      await this.prisma.transactionHistory.deleteMany({
        where: {
          ref_id: {
            in: toDeleteRefIds
          }
        }
      })
    }

    return transactions
  }

  async processUpdateItemkuOrder(orderData: ItemkuOrder){
    let customer_no: string | null = ''

    const payload = {
      order_id: orderData.order_id,
      action: "DELIVER",
    };

    const { authToken, nonce } = generateItemkuHeader(payload)
    const apiUrl = 'https://tokoku-gateway.itemku.com/api/order/action'; // Ganti dengan URL endpoint Anda

    try {
      if(process.env.NODE_ENV !== "dev"){
        const updateOrder = await axios.post(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'X-Api-Key': process.env.ITEMKU_API_KEY ?? '',
            'Nonce': nonce,
            'Content-Type': 'application/json'
          }
        })
        console.log(updateOrder)
      }

      const jsonString = orderData.required_information?.toString().replace(/(\w+):/g, '"$1":');
      const requiredInformation = JSON.parse(`{ "required_information": ${jsonString} }`);


      if (orderData.game_name === "Mobile Legends") {
        this.logger.debug('getting ml player id history')
        customer_no = getMlPlayerId(requiredInformation)
      }

      if (orderData.game_name === "Garena Free Fire" || orderData.game_name === "Garena Free Fire MAX") {
        this.logger.debug(`getting ${orderData.game_name} ml player id history`)
        customer_no = getGarenaPlayerId(requiredInformation)
      }


      const mapOrderData = {
        order_id: orderData.order_id,
        order_number: orderData.order_number,
        product_id: orderData.product_id,
        price: orderData.price,
        quantity: orderData.quantity,
        game_name: orderData.game_name,
        product_name: orderData.product_name,
        using_delivery_info: orderData.using_delivery_info,
        delivery_info: orderData.delivery_info,
        order_income: orderData.order_income,
        is_from_ads: orderData.is_from_ads,
        delivery_info_field: orderData.delivery_info_field
      }

      const updateHistory = await this.prisma.itemkuOrder.upsert({
        create: {
          ...mapOrderData,
          status: 'DELIVER',
          required_information: requiredInformation
        },
        update: {
          status: 'DELIVER'
        },
        where: {
          order_id: orderData.order_id
        }
      })

      console.log(updateHistory, "updating itemku order")

      this.logger.debug('processing transaction')

      const product = await this.getProductByItemKu(orderData.game_name, orderData.product_name)

      if (!product) {
        const ref_id = generateReferenceId();
        await this.createFailedTransactionHistory(ref_id, '', customer_no ?? '', orderData.order_id, orderData)
        return null
      }

      // Loop transaction based on quantity ammount
      for (let i = 0; i < orderData.quantity; i++) {
        const ref_id = generateReferenceId();
        await this.processTransaction(ref_id, product.buyer_sku_code, customer_no ?? '', orderData.order_id, orderData);
      }

    } catch (e: any) {
      this.logger.debug(e.message)
    }
  }

  async createFailedTransactionHistory(ref_id: string, buyer_sku_code: string, customer_no: string, order_id: number, itemkuOrder: ItemkuOrder) {
    const requestBody = {
      username: process.env.DIGI_USERNAME ?? '',
      buyer_sku_code: buyer_sku_code,
      customer_no: customer_no,
      ref_id: ref_id,
      sign: '',
    };

    await this.prisma.transactionHistory.create({
      data: {
        ...requestBody,
        status: TransactionStatus.FAILED,
        profit: 0,
        customer_id: null,
        createdBy: null,
        item_price: 0,
        customer_username: '',
        source: 'ITEMKU',
        order_id
      },
    });
  }

  async getProductByItemKu(gameName: string, productName: string) {
    const product = await this.prisma.productPrice.findMany({
      where: {
        ItemkuProduct: {
          some: {
            item_name: productName,
            game_name: gameName
          }
        }
      }
    })

    console.log(product, "found product")

    if (product.length === 0) {
      this.logger.error(`Searching product with game name: ${gameName} and product name: ${productName} not found`)
      return null
    } else {
      return product[0]
    }
  }

  async getDigiflazzPrice() {
    const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', 'pricelist');


    const requestBody = {
      cmd: 'prepaid',
      username: process.env.DIGI_USERNAME ?? '',
      sign: sign,
      category: 'GAMES',
      brand: 'MOBILE LEGEND',
    };

    try {
      const response = await httpAgentPost(
        requestBody,
        'https://api.digiflazz.com/v1/price-list',
      );

      // update product list 
      await this.product.updateProductDigiflazz(response.data.data)

      return response.data.data

    } catch (e: any) {
      this.logger.debug(`error getting digiflazz price: ${e.message}`)
    }
  }

  async getItemkuPrice() {

    const { authToken, nonce } = generateItemkuHeader('')
    const apiUrl = 'https://tokoku-gateway.itemku.com/api/product/list';
    const response = await axios.post(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Api-Key': process.env.ITEMKU_API_KEY ?? '',
        'Nonce': nonce,
        'Content-Type': 'application/json'
      }
    })
    console.log(response.data.data)

    const orders = response.data.data
  }

  async processTransaction(ref_id: string, buyer_sku_code: string, customer_no: string, order_id: number, itemkuOrder?: ItemkuOrder) {
    try {
      const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', ref_id);

      const requestBody = {
        username: process.env.DIGI_USERNAME ?? '',
        buyer_sku_code: buyer_sku_code,
        customer_no: customer_no,
        ref_id: ref_id,
        sign: sign,
      };

      if(process.env.NODE_ENV !== "dev"){
        const response = await httpAgentPost(
          requestBody,
          'https://api.digiflazz.com/v1/transaction',
        );

        console.log('Success Digiflazz Request Transaction', response.data);
      }

      await this.prisma.transactionHistory.create({
        data: {
          ...requestBody,
          profit: 0,
          customer_id: null,
          createdBy: null,
          item_price: 0,
          customer_username: '',
          source: 'ITEMKU',
          order_id
        },
      });



      await this.getPaymentTransactionStatus(ref_id)
    } catch (error: any) {
      if (error.response.data.data) {
        await this.telegramLib.sendMessage(error.response.data.data, 'FAILED ITEMKU', itemkuOrder)
        console.log('Error Digiflazz Request Transaction', error.response.data.data);
      } else {
        await this.telegramLib.sendMessage(error.message.toString(), 'FAILED ITEMKU', itemkuOrder)
        console.log('Error processing transaction', error.message)
      }
      console.log('Error Digiflazz Request Transaction', error.response.data);
    }
  }

  async parseItemkuExcel(filePath: string) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet data to JSON
    const rawData: any = xlsx.utils.sheet_to_json(worksheet);
    const gameItems: GameItemDto[] = [];

    for (const row of rawData) {
      try {
        // Extract and map Excel columns to DTO properties
        const gameItemData: GameItemDto = {
          gameName: row['Nama Game'] || '',
          idItem: row['ID Item'] || '',
          serverName: row['Server Name'] || '',
          groupName: row['Grup Name'] || '',
          itemName: row['Nama Item'] || '',
          stock: parseInt(row['Stok'] || '0'),
          minOrder: parseInt(row['Min. Pesanan'] || '1'),
          price: parseInt(row['Harga'] || '0')
        };

        gameItems.push(gameItemData);


      } catch (error) {
        console.error(`Error processing row: ${JSON.stringify(row)}`);
        console.error(error);
      }
    }


    const products = await this.prisma.productPrice.findMany({
      where: {
        brand: 'MOBILE LEGENDS'
      }
    })

    const updateProducts: ProductPrice[] = await this.compareAndUpdateProductPrice(products, gameItems)



    return updateProducts;
  }

  async compareAndUpdateProductPrice(products: ProductPrice[], itemkuProducts: GameItemDto[]): Promise<ProductPrice[]> {
    const updatedProducts: any = [];

    // First update all itemkuProducts in parallel
    await Promise.all(itemkuProducts.map(async (item) => {
      await this.prisma.itemkuProduct.upsert({
        create: {
          item_id: item.idItem,
          game_name: item.gameName,
          group_name: item.groupName,
          min_order: item.minOrder,
          price: item.price,
          server_name: item.serverName,
          stock: item.stock,
          item_name: item.itemName
        },
        update: {
          game_name: item.gameName,
          group_name: item.groupName,
          min_order: item.minOrder,
          price: item.price,
          server_name: item.serverName,
          stock: item.stock,
          item_name: item.itemName
        },
        where: {
          item_id: item.idItem
        }
      });
    }));

    // Process products sequentially to avoid race conditions
    for (const product of products) {
      const productNameParts = product.product_name.split(' - ');
      if (productNameParts.length < 2) continue;

      const gameName = productNameParts[0].trim();
      const productValue = productNameParts[1].trim();

      // Find matching itemku product (synchronously)
      const matchingItem = itemkuProducts.find((item) => {
        const normalizedItemName = item.itemName.toLowerCase();
        const normalizedProductValue = productValue.toLowerCase();

        const itemText = normalizedItemName.replace(/\d+/g, '').trim();
        const productText = normalizedProductValue.replace(/\d+/g, '').trim();

        const itemNumbers: string[] = normalizedItemName.match(/\d+/g) || [];
        const productNumbers: string[] = normalizedProductValue.match(/\d+/g) || [];

        const hasMatchingNumber = productNumbers.some(pNum =>
          itemNumbers.includes(pNum)
        );

        return hasMatchingNumber &&
          item.groupName === 'Diamond' &&
          (itemText.includes(productText) || productText.includes(itemText));
      });

      if (matchingItem) {
        try {
          // Update product price with itemku product reference
          const updatedProduct = await this.prisma.productPrice.update({
            where: { id: product.id },
            data: {
              ItemkuProduct: {
                connect: {
                  item_id: matchingItem.idItem
                }
              }
            },
            include: {
              ItemkuProduct: true
            }
          });

          // Update itemku product with product reference
          await this.prisma.itemkuProduct.update({
            where: {
              item_id: matchingItem.idItem
            },
            data: {
              product_id: product.id
            }
          });

          updatedProducts.push(updatedProduct);
        } catch (error) {
          console.error(`Failed to update product ${product.id}:`, error);
        }
      }
    }

    return updatedProducts;
  }

  async updateTxHistoryById(data: UpdateTransactionRequestDto){
    const findTx = await this.prisma.transactionHistory.findUnique({where: {
      ref_id: data.ref_id
    }})

    if(!findTx){
      return new HttpException("Transaction not found", HttpStatus.OK)
    }

    const update = await this.prisma.transactionHistory.update({
      where: {
        ref_id: data.ref_id
      }, data
    })

    return update
  }
}
async function checkBalance() {
  const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', 'depo');
  const requestBody = {
    cmd: 'deposit',
    username: process.env.DIGI_USERNAME ?? '',
    sign,
  };
  const response = await httpAgentPost(
    requestBody,
    'https://api.digiflazz.com/v1/cek-saldo',
  );

  return response.data;
}

async function httpAgentPost(requestBody: any, url: string) {
  const agent = new HttpsProxyAgent(process.env.DIGI_PROXY_URL ?? '');

  const response = await axios.post(url, requestBody, {
    httpsAgent: agent,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}

