import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { AddBankAccountDto } from "./dto/addBankAccount.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { CreateTopupRequestDto } from "./dto/createTopupRequest.dto";
import { ExternalUser, Prisma, Roles, TransactionStatus } from "@prisma/client";
import { GetTransactionListDto } from "./dto/getTransactionList.dto";
import generateReferenceId from "src/utils/generateReferenceId";
import PaginationIface from "src/interface/paginationIface";

@Injectable()
export class ExternalTopupService {
  constructor(private prisma: PrismaService) { }

  async addBankAccount(payload: AddBankAccountDto) {
    const findBankAccount = await this.prisma.bankAccount.findMany({
      where: payload,
    });

    if (findBankAccount.length >= 1) {
      throw new HttpException(
        new ApiResponseDto(
          errorMap[4009] +
          payload.accountNo +
          "-" +
          payload.accountName +
          "-" +
          payload.bankName,
          null,
          "4009"
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const create = await this.prisma.bankAccount.create({
      data: {
        accountName: payload.accountName,
        bankName: payload.bankName,
        accountNo: payload.accountNo,
      },
    });

    return new ApiResponseDto("success", create, "0000");
  }

  async getBankAccount() {
    return new ApiResponseDto(
      "success",
      await this.prisma.bankAccount.findMany(),
      "0000"
    );
  }

  async createTopupRequest(
    payload: CreateTopupRequestDto,
    requestorId: number
  ) {
    const { bankAccountId } = payload;

    // 1. Check if user exists
    const user = await this.prisma.externalUser.findUnique({
      where: { id: requestorId },
    });

    if (!user) {
      throw new HttpException(
        new ApiResponseDto(errorMap[1004], null, "1004"),
        HttpStatus.BAD_REQUEST
      );
    }

    // 2. Check if toBankAccount exists
    const destinationBankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (payload.txType == "DEPOSIT" && !destinationBankAccount) {
      throw new HttpException(
        new ApiResponseDto(
          errorMap[4010] + "bankAccountId " + bankAccountId,
          null,
          "4010"
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    // 3. Check if admin balance is enough
    if(payload.txType == 'WITHDRAWAL' && user.balance < payload.amount){
      throw new HttpException(
        new ApiResponseDto(
          errorMap[1002] + " " + user.balance,
          null,
          "1002"
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const transaction = await this.prisma.topupTransaction.create({
        data: {
          requestorId: requestorId,
          approver: null,
          refNo: "TP" + generateReferenceId(),
          amount: payload.amount,
          accountNo: "-",
          accountName: "-",
          fromBankAccount: payload.fromAccount,
          toBankAccount: payload.toAccount,
          fromBankName: payload.fromBankName,
          toBankName: payload.toBankName,
          fromBankAccountName: payload.fromAccountName,
          toBankAccountName: payload.toAccountName,
          txType: payload.txType,
          status: "PENDING",
        },
      });

      return new ApiResponseDto("success", transaction, "0000");
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException(
          new ApiResponseDto(errorMap[4001], null, "4001"),
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        new ApiResponseDto("Internal server error", null, "5000"),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateTopupRequestStatus(
    id: number,
    status: TransactionStatus,
    approverId: number,
    amount: number
  ) {
    const existingTransaction = await this.prisma.topupTransaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      throw new HttpException(
        new ApiResponseDto(
          errorMap[4004] + "topupTransactionId " + id,
          null,
          "4004"
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedTransaction = await this.prisma.topupTransaction.update({
      where: { id },
      data: {
        status,
        approver: approverId,
        amount: amount == 0 ? existingTransaction.amount : amount
      },
    });

    let data: Prisma.ExternalUserUpdateInput = {};

    if (status == TransactionStatus.SUCCESS) {
      let difference = 0
      if (amount != 0) {
        difference = existingTransaction.amount - amount
      }
      if (updatedTransaction.txType == "DEPOSIT") {
        data = {
          balance: {
            increment: existingTransaction.amount - difference
          }
        }
      } else if (updatedTransaction.txType == "WITHDRAWAL") {
        data = {
          balance: {
            decrement: existingTransaction.amount - difference
          }
        }
      }
      await this.prisma.externalUser.update({
        where: {
          id: existingTransaction.requestorId,
        },
        data,
      });
    }


    return new ApiResponseDto("success", updatedTransaction, "0000");
  }

  async getTransactionList(query: GetTransactionListDto, user: ExternalUser) {
    const {
      startDate,
      endDate,
      accountName,
      toBankName,
      toBankAccount,
      txType,
      status,
      page,
      size
    } = query;

    const where: Prisma.TopupTransactionWhereInput = {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lt: new Date(endDate),
        },
      }),
      ...(accountName && {
        accountName: { contains: accountName, mode: "insensitive" },
      }),
      ...(toBankName && {
        toBankName: { contains: toBankName, mode: "insensitive" },
      }),
      ...(toBankAccount && {
        toBankAccount: { contains: toBankAccount, mode: "insensitive" },
      }),
      ...(txType && {
        txType,
      }),
      ...(status && {
        status,
      }),
      ...(user.role == Roles.Admin && {
        requestorId: user.id
      })
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.topupTransaction.findMany({
        where,
        skip: ((page || 1) - 1) * (size || 10),
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.topupTransaction.count({ where }),
    ]);

    const returnData = {
      data,
      totalData: total,
      page,
      pageLength: Math.ceil(total / (size || 10))
    };

    return new ApiResponseDto("success", returnData, "0000");
  }

  async getTransasctionById(id: number, user: ExternalUser) {
    const findTransaction = await this.prisma.topupTransaction.findUnique({
      where: {
        id
      }
    })
    if (!findTransaction) {
      throw new HttpException(
        new ApiResponseDto(
          errorMap[4004] + "topupTransactionId " + id,
          null,
          "4004"
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if(user.role == Roles.Admin && findTransaction.requestorId !== user.id){
      throw new HttpException(
        new ApiResponseDto(
          errorMap[4004] + "topupTransactionId " + id,
          null,
          "4004"
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    return new ApiResponseDto("success", findTransaction, "0000");
  }
}
