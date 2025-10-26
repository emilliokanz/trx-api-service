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
import { ExternalProduct, ExternalUser, Prisma, Roles } from "@prisma/client";
import { decryptSecret, signPayload, signPayloadAdmin, verifyPayloadAdmin } from "src/utils/payloadValidation";
import toFormData from "src/utils/toFormData";

@Injectable()
export class ExternalTransactionService {
  private readonly logger = new Logger(SchedulerService.name)

  constructor(
    @InjectQueue('extTransactions') private readonly extTransactionQueue: Queue,
    private prisma: PrismaService,
    private owner: OwnerService,
    private externalProductService: ExternalProductService,
  ) { }

  async addTransaction(transactionData: ExternalTxRequestDto, username: string, isWeb?: boolean, role?: string, signature?: string, body?: any) {
    const batch_id = "B" + generateReferenceId()

    const transactionDetail: PreTxDetailDto[] | any = await this.preTransaction(transactionData, username, isWeb, role, signature, body)

    if (transactionDetail.errorCode) {
      return transactionDetail
    }

    const batch = await this.prisma.externalTransactionBatch.create({
      data: {
        batch_id,
        createdBy: transactionDetail[0].user_id
      }
    })

    const createTxHistPayload: Prisma.ExternalTransactionHistoryCreateManyInput[] = transactionDetail.map((x: PreTxDetailDto) => {
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
        externalTransactionBatchBatch_id: batch_id,
        createdBy: x.user_id ?? ""
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
      transactionDetail.forEach(async (x: PreTxDetailDto) => {
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

    return new ApiResponseDto('sucess', { batch_id }, '0000')
  }

  async preTransaction(
    transactionData: ExternalTxRequestDto,
    usernameHeader?: string,
    isWeb?: boolean,
    role?: string,
    signature?: string,
    body?: any
  ) {
    const { code, customer_no, username } = transactionData;

    // Run all validation checks first
    const validationResult = await this.validatePreTransaction(
      transactionData,
      usernameHeader,
      isWeb,
      role,
      signature,
      body
    );

    if (validationResult instanceof ApiResponseDto) {
      return validationResult;
    }

    const { extProduct, type, findUser } = validationResult;

    const junctionProduct = await this.prisma.extProductToSupplierJunction.findMany({
      where: { item_id: code },
      include: { product: true }
    });

    if(type == "DIGIFLAZZ"){
      await this.externalProductService.getDigiflazzPrice()
    }

    if (junctionProduct.length === 0) {
      return new ApiResponseDto(errorMap[2000], null, '2000');
    }

    let cost = 0;
    junctionProduct.forEach((x) => {
      cost += x.product.price * x.qty;
    });
    const totalCost = cost * customer_no.length;

    const superAdminBalance = await this.getAdminBalanceFn(true, type || "");
    if (totalCost > superAdminBalance?.data.deposit) {
      console.log("[BALANCE] Super Admin balance too low");
      return new ApiResponseDto(errorMap[1002], null, '1002');
    }

    if (role === Roles.Admin || role === Roles.Customer) {
      if (!extProduct.admin_price) {
        return new ApiResponseDto(errorMap[2004], null, '2004');
      }

      const adminTotalCost = extProduct.admin_price * customer_no.length;
      const currentUser = await this.prisma.externalUser.findFirst({
        where: { username }
      });

      if (!currentUser) {
        return new ApiResponseDto(errorMap[1004], null, '1004');
      }

      if (adminTotalCost > currentUser.balance) {
        console.log("[BALANCE] Admin balance too low");
        return new ApiResponseDto(errorMap[1002], null, '1002');
      }

      await this.prisma.externalUser.update({
        where: { id: currentUser.id },
        data: { balance: { decrement: adminTotalCost } }
      });
    }

    const txDetails: PreTxDetailDto[] = [];

    customer_no.forEach((custNo) => {
      junctionProduct.forEach((product) => {
        const ref_id = generateReferenceId();
        const profit =
          product.qty > 1
            ? (extProduct.price - product.product.price * product.qty) / product.qty
            : extProduct.price - product.product.price;

        for (let i = 0; i < product.qty; i++) {
          txDetails.push({
            ref_id,
            customer_no: custNo,
            code: product.product.code,
            profit,
            supplierType: product.product.type,
            productDetail: extProduct,
            role: role || "",
            user_id: findUser[0].id || null
          });
        }
      });
    });

    return txDetails;
  }

  async processTransaction(
    customer_no: string,
    code: string,
    ref_id: string,
    batchId: string,
    profit: number,
    supplierType: string,
    productDetail: ExternalProduct,
    role: string,
    userId: number
  ) {
    const payload = {
      customer_no,
      code,
      ref_id,
      profit,
      productDetail,
      role,
      userId
    }
    switch (supplierType) {
      case 'APIBOSS':
        return this.processApibossTransaction(payload);
      case 'DIGIFLAZZ':
        return this.processDigiflazzTransaction(payload);
      // case 'VOUCHERIN':
      //   return this.processVoucherinTransaction(...);

      default:
        console.error(`[SUPPLIER] Unknown supplier type: ${supplierType}`);
        return null;
    }
  }

  private async processApibossTransaction(args: {
    customer_no: string;
    code: string;
    ref_id: string;
    profit: number;
    productDetail: ExternalProduct;
    role: string;
    userId: number;
  }) {
    const config: ExternalProviderConfig = {
      providerName: "APIBOSS",
      apiUrl: "",
      usernameEnvKey: "APIBOSS_USERNAME",
      apiKeyEnvKey: "APIBOSS_APIKEY",
      successStatuses: [0, '0', 'Sukses', 'Successful'],
      pendingStatuses: []
    };
    await this.processExternalTransaction(config, args);
  }

  private async processDigiflazzTransaction(args: {
    customer_no: string;
    code: string;
    ref_id: string;
    profit: number;
    productDetail: ExternalProduct;
    role: string;
    userId: number;
  }) {

    const config: ExternalProviderConfig = {
      providerName: "DIGIFLAZZ",
      apiUrl: "https://api.digiflazz.com/v1/transaction",
      usernameEnvKey: "DIGI_USERNAME",
      apiKeyEnvKey: "DIGI_API_KEY",
      successStatuses: [0, '0', 'Sukses', 'Successful', 'Success'],
      pendingStatuses: ['Pending']
    };
    await this.processExternalTransaction(config, args);
  }

  private async processExternalTransaction(
    providerConfig: ExternalProviderConfig,
    {
      customer_no,
      code,
      ref_id,
      profit,
      productDetail,
      role,
      userId
    }: {
      customer_no: string;
      code: string;
      ref_id: string;
      profit: number;
      productDetail: ExternalProduct;
      role: string;
      userId: number;
    }
  ) {

    const username = process.env[providerConfig.usernameEnvKey] || '';
    const apiKey = process.env[providerConfig.apiKeyEnvKey] || '';
    const sign = generateSignature(username, apiKey, ref_id);

    const requestBody: Record<string, any> = {
      username,
      ref_id,
      sign
    };

    // provider-specific field naming
    if (providerConfig.providerName === "APIBOSS") {
      requestBody["sku_code"] = code;
      requestBody["userid"] = customer_no;
    } else if (providerConfig.providerName === "DIGIFLAZZ") {
      requestBody["buyer_sku_code"] = code;
      requestBody["customer_no"] = customer_no.toString();
    }

    // Dev mode: simulate failure
    if (process.env.NODE_ENV === "dev") {
      await this.prisma.externalTransactionHistory.update({
        where: { ref_id },
        data: {
          status: TransactionStatus.FAILED,
          profit,
          sign,
          username
        }
      });
      if (role === Roles.Admin || role === Roles.Customer) {
        await this.prisma.externalUser.update({
          where: { id: userId },
          data: { balance: { increment: productDetail.admin_price || 0 } }
        });
      }
      console.error(`[${providerConfig.providerName}][DEV] Simulated failure, ref_id: ${ref_id}`);
      return;
    }

    // Production mode
    try {
      const body = providerConfig.providerName === "APIBOSS"
        ? toFormData(requestBody)
        : requestBody;

      const response = await this.httpAgentPost(
        body,
        providerConfig.apiUrl ?? "",
        providerConfig.providerName,
        providerConfig.providerName === "APIBOSS" ? body : null
      );

      const transaction = response.data?.data;
      if (!transaction) {
        throw new Error("No transaction data in response");
      }

      const price = Number(transaction.price) || 0;
      const balance = Number(transaction.balance) || 0;
      let statusRaw: any = transaction.status;

      const successValues = providerConfig.successStatuses;
      const pendingValues = providerConfig.pendingStatuses;
      const status = successValues.includes(statusRaw)
        ? TransactionStatus.SUCCESS
        : pendingValues.includes(statusRaw)
          ? TransactionStatus.PENDING
          : TransactionStatus.FAILED;

      if (status === TransactionStatus.SUCCESS) {
        try {
          await this.owner.divideOwnerProfit(profit || 0, 'EXT');
        } catch {
          console.error(`[${providerConfig.providerName}][PROFIT] Failed dividing profit`);
        }
      }

      await this.prisma.externalTransactionHistory.update({
        where: { ref_id },
        data: {
          status,
          item_price: price,
          profit,
          sign,
          username
        }
      });

      // if (balance !== 0) {
      //   await this.prisma.supplierBalances.update({
      //     where: { name: providerConfig.providerName },
      //     data: { balance }
      //   });
      // } else {
      //   console.error(`[${providerConfig.providerName}] Balance not updated (zero)`);
      // }
    } catch (err: any) {
      console.error(`[${providerConfig.providerName}] Transaction error, ref_id: ${ref_id}`, err.response?.data ?? err);
      // On failure path: refund / update as failed
      await this.prisma.externalTransactionHistory.update({
        where: { ref_id },
        data: {
          status: TransactionStatus.FAILED,
          profit,
          sign,
          username
        }
      });
      if (role === Roles.Admin || role === Roles.Customer) {
        await this.prisma.externalUser.update({
          where: { id: userId },
          data: { balance: { increment: productDetail.admin_price || 0 } }
        });
        console.error(`[${providerConfig.providerName}] Refund balance for ref_id: ${ref_id}`);
      }
    }
  }

  async getAdminBalanceFn(isWeb: boolean, type?: string | null, user?: any) {
    if (!isWeb) {
      const findUser = await this.prisma.externalUser.findFirst({
        where: {
          username: user.username
        }
      })
      if (!findUser) {
        throw new HttpException(
          new ApiResponseDto(errorMap[1004], null, "1004"),
          HttpStatus.BAD_REQUEST
        );
      }
      const decryptApiKey = decryptSecret(findUser.apiKey || '')
      const validPayload = verifyPayloadAdmin(user?.body, user.signature || '', decryptApiKey)

      if (!validPayload) {
        return new ApiResponseDto(errorMap[4003], null, '4003')
      }
    }

    if (user && user.role == Roles.Admin) {
      const findUser = await this.prisma.externalUser.findFirst({
        where: {
          id: user.id
        }
      })
      if (!findUser) {
        throw new HttpException(
          new ApiResponseDto(errorMap[1004], null, "1004"),
          HttpStatus.BAD_REQUEST
        );
      }

      return new ApiResponseDto("success", { deposit: findUser.balance }, '0000')
    }

    if (type == "APIBOSS") {

      let balance = 0;
      let response: any = {};


      const action = 'get_saldo'
      const sign = generateSignature(
        process.env.APIBOSS_USERNAME || '',
        process.env.APIBOSS_APIKEY || '',
        action
      )

      const body = {
        username: process.env.APIBOSS_USERNAME,
        action,
        sign
      };

      try {
        response = await this.httpAgentPost(body, '', 'APIBOSS', null);
        const transaction = response.data?.data;
        balance = transaction.total_balance
      } catch (e) {
        console.log(e, "errors")
        const getBalance = await this.prisma.supplierBalances.findUnique({
          where: {
            name: "APIBOSS"
          }
        })

        balance = getBalance?.balance || 0

        if (!getBalance) {
          this.logger.debug(`[ADMIN BALANCE] balance for Supplier ${type || 'APIBOSS'} not found`)
          return new ApiResponseDto("success", 0, '0000')
        }
      }


      return new ApiResponseDto("success", { deposit: balance }, '0000')
    }

    if (type == "DIGIFLAZZ") {
      const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', 'depo');
      const requestBody = {
        cmd: 'deposit',
        username: process.env.DIGI_USERNAME ?? '',
        sign,
      };

      try {
        const response = await this.httpAgentPost(
          requestBody,
          'https://api.digiflazz.com/v1/cek-saldo',
          "DIGIFLAZZ",
          null
        );

        console.log(response, "get balance response")
        return new ApiResponseDto("success", { deposit: response.data.data.deposit }, '0000')
      } catch (e: any) {
        console.log(e, "errors")
        throw new ApiResponseDto(errorMap[1007], null, "1007")
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

    const supProduct = await this.prisma.externalSupplierProduct.findUnique({
      where: {
        code: transaction?.buyer_sku_code
      }
    })

    const product = await this.prisma.externalProduct.findUnique({
      where: {
        item_id: transaction.buyer_sku_code
      }
    })

    if (!product) {
      return new ApiResponseDto(errorMap[4004], null, '4004')
    }

    if (!supProduct) {
      return new ApiResponseDto(errorMap[4004], null, '4004')
    }

    
    if (supProduct.type == "APIBOSS") {
      return new ApiResponseDto('0000', transaction, '0000')
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

    const requestBody = {
      username: process.env.DIGI_USERNAME ?? '',
      buyer_sku_code: transaction.buyer_sku_code,
      customer_no: transaction.customer_no,
      ref_id: ref_id,
      sign: transaction.sign,
    };

    const response = await this.httpAgentPost(
      requestBody,
      'https://api.digiflazz.com/v1/transaction',
      supProduct.type,
      null
    );

    const trxStatus = response.data.data.status

    const update = await this.prisma.externalTransactionHistory.update({
      where: { ref_id },
      include: {
        user: true
      },
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

    if (trxStatus == "Gagal") {
      if (update.user?.role === Roles.Admin || update.user?.role === Roles.Customer) {
        await this.prisma.externalUser.update({
          where: { id: transaction.createdBy || 0 },
          data: { balance: { increment: product.admin_price || 0 } }
        });
        console.error(`[${supProduct.type}] Refund balance for ref_id: ${ref_id}`);
      }
    }

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
    batch_id: string,
    user: any,
  ) {
    let where: any = { batch_id };

    if (user.role == Roles.Admin) {
      where = {
        ...where,
        createdBy: user.id
      };
    }

    const data = await this.prisma.externalTransactionBatch.findUniqueOrThrow({
      where,
      include: {
        transaction: user.role == Roles.Admin
          ? {
            select: {
              buyer_sku_code: true,
              customer_no: true,
              status: true,
              item_price: true,
              profit: true,
              createdAt: true,
              updatedAt: true
            },
          }
          : true, // fallback to full transaction for non-admin
      },
    });

    if (!data) {
      return new ApiResponseDto(errorMap[4004], data, '4004');
    }

    // Transform only if admin
    if (user.role == Roles.Admin && data.transaction) {
      data.transaction = data.transaction.map(({ profit, ...tx }: any) => ({
        ...tx,
        item_price: (tx.item_price ?? 0) + (tx.profit ?? 0),
      }));
    }

    await this.updateAllTxTStatus()

    return new ApiResponseDto('success', data, '0000');
  }


  async getTxHistoryByBatchIdApi(
    batch_id: string,
    user: any,
  ) {

    const findUser = await this.prisma.externalUser.findMany({
      where: { username: user.username }
    })
    const decryptApiKey = decryptSecret(findUser[0].apiKey || '')
    const validPayload = verifyPayloadAdmin(user.body, user.signature || '', decryptApiKey)

    if (!validPayload) {
      return new ApiResponseDto(errorMap[4003], null, '4003')
    }


    const data = await this.prisma.externalTransactionBatch.findUniqueOrThrow({
      where: {
        batch_id,
        createdBy: findUser[0].id
      }, include: {
        transaction: {
          select: {
            buyer_sku_code: true,
            customer_no: true,
            status: true,
            item_price: true,
            profit: true,
            createdAt: true,
            updatedAt: true
          }
        },
      }
    })

    if (!data) {
      return new ApiResponseDto(errorMap[4004], data, '4004');
    }

    data.transaction = data.transaction.map(({ profit, ...tx }: any) => ({
      ...tx,
      item_price: (tx.item_price ?? 0) + (profit ?? 0),
    }));;
    
    await this.updateAllTxTStatus()

    return new ApiResponseDto('success', data, '0000');

  }

  async getAllTxHistoryByBatch(
    page: number,
    size: number,
    customer_no: string,
    start_date: string,
    end_date: string,
    batch_id: string,
    ref_id: string,
    user: any
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
    if (user.role == Roles.Admin) {
      where.transaction.some.createdBy = user.id;
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

  async getTransactionDetail(ref_id: string, user: any) {
    const findUser = await this.prisma.externalUser.findMany({
      where: { username: user.username }
    })

    const decryptApiKey = decryptSecret(findUser[0].apiKey || '')
    const validPayload = verifyPayloadAdmin(user.body, user.signature || '', decryptApiKey)

    if (!validPayload) {
      return new ApiResponseDto(errorMap[4003], null, '4003')
    }
    const transaction = await this.prisma.externalTransactionHistory.findFirst({
      where: {
        ref_id,
        createdBy: findUser[0].id
      }
    })

    if(transaction){
      await this.getPaymentTransactionStatus(ref_id)
    }

    return new ApiResponseDto('success', transaction, '0000');
  }

  async httpAgentPost(requestBody: any, url: string, supplierType: string, formData: any) {
    if (supplierType === "APIBOSS") {
      const isFormData = formData !== null && formData !== undefined;

      const response = await axios.post(
        process.env.APIBOSS_URL + url,
        isFormData ? formData : requestBody,
        {
          headers: isFormData
            ? formData.getHeaders()
            : { 'Content-Type': 'application/json' }
        }
      );

      this.logger.debug(`[EXTERNAL TRANSACTION] API RESPONSE ${supplierType}`, response.data.data)

      return response
    }
    if (supplierType == "DIGIFLAZZ") {
      const agent = new HttpsProxyAgent(process.env.DIGI_PROXY_URL ?? '');

      const response = await axios.post(url, requestBody, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(`[DIGIFLAZZ] API RESPONSE ${supplierType}`, response.data.data)

      return response;
    }
    else {
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

  private async validatePreTransaction(
    transactionData: ExternalTxRequestDto,
    usernameHeader?: string,
    isWeb?: boolean,
    role?: string,
    signature?: string,
    body?: any
  ): Promise<{ extProduct: any; type: string; findUser: any[] } | ApiResponseDto> {
    const { code, customer_no, username } = transactionData;

    // 1. Check required fields
    if (!code) {
      return new ApiResponseDto(errorMap[4000] + 'code', null, '4000');
    }

    if (!customer_no || customer_no.length === 0) {
      return new ApiResponseDto(errorMap[4000] + 'customer_no', null, '4000');
    }

    if (!isWeb && !usernameHeader) {
      return new ApiResponseDto(errorMap[4002], null, '4002');
    }

    // 2. Get external product
    const extProduct = await this.prisma.externalProduct.findFirst({
      where: { item_id: code },
      include: {
        products: { include: { product: true } }
      }
    });

    if (!extProduct) {
      return new ApiResponseDto(errorMap[2000], null, '2000');
    }

    const type = extProduct.products[0].product.type;

    // 3. Find user
    const findUser = await this.prisma.externalUser.findMany({
      where: { username: username || usernameHeader }
    });

    if (findUser.length === 0) {
      return new ApiResponseDto(errorMap[1004], null, '1004');
    }

    // 4. Validate API key signature if not from web
    if (!isWeb) {
      const decryptApiKey = decryptSecret(findUser[0].apiKey || '');
      const validPayload = verifyPayloadAdmin(body, signature || '', decryptApiKey);
      if (!validPayload) {
        return new ApiResponseDto(errorMap[4003], null, '4003');
      }
    }

    return { extProduct, type, findUser };
  }
}