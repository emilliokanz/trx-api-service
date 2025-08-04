import { Injectable } from "@nestjs/common";
import { AddBankAccountDto } from "./dto/addBankAccount.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { CreateTopupRequestDto } from "./dto/createTopupRequest.dto";
import { Prisma } from "@prisma/client";
import { GetTransactionListDto } from "./dto/getTransactionList.dto";

@Injectable()
export class ExternalTopupService {
    constructor(
    private prisma: PrismaService,
    ){}

    async addBankAccount(payload: AddBankAccountDto){
        const findBankAccount = await this.prisma.bankAccount.findMany({
            where : payload
        })

        if(findBankAccount.length >= 1){
            throw new ApiResponseDto(errorMap[4009] + payload.accountNo + "-" + payload.accountName + "-" + payload.bankName, null, '4009')
        }

        const create = await this.prisma.bankAccount.create({
            data: {
                accountName: payload.accountName,
                bankName: payload.bankName,
                accountNo: payload.accountNo,
            }
        })

        return new ApiResponseDto("success", create, "2000")
    }

    async getBankAccount(){
        return new ApiResponseDto("success", await this.prisma.bankAccount.findMany(), "2000")
    }

    async createTopupRequest(payload: CreateTopupRequestDto) {
        const { requestorId, bankAccountId } = payload;
    
        // 1. Check if user exists
        const user = await this.prisma.externalUser.findUnique({
          where: { id: requestorId },
        });
    
        if (!user) {
            throw new ApiResponseDto(errorMap[1004] ,null, '1004')
        }
    
        // 2. Check if toBankAccount exists
        const destinationBankAccount = await this.prisma.bankAccount.findUnique({
          where: { id: bankAccountId },
        });
    
        if (!destinationBankAccount) {
            throw new ApiResponseDto(errorMap[4010] + "bankAccountId" + " " + bankAccountId, null, '4010')
        }
    
        // 3. Create top-up transaction
        const transaction = await this.prisma.topupTransaction.create({
          data: {
            requestorId: payload.requestorId,
            approver: payload.approver,
            refNo: payload.refNo,
            amount: payload.amount,
            accountNo: payload.accountNo,
            accountName: payload.accountName,
            fromBankAccount: payload.fromBankAccount,
            toBankAccount: destinationBankAccount.accountNo,
            fromBankName: payload.fromBankName,
            toBankName: destinationBankAccount.bankName,
            txType: "DEPOSIT",
            status: "PENDING"
          },
        });
    
        return new ApiResponseDto("success", transaction, "2000")
      }

      async getTransactionList(query: GetTransactionListDto) {
        const {
          createdDate,
          accountName,
          toBankName,
          toBankAccount,
          txType,
          status,
          page,
          pageSize,
        } = query;
      
        const where: Prisma.TopupTransactionWhereInput = {
          ...(createdDate && {
            createdAt: {
              gte: new Date(createdDate),
              lt: new Date(new Date(createdDate).getTime() + 24 * 60 * 60 * 1000),
            },
          }),
          ...(accountName && {
            accountName: { contains: accountName, mode: 'insensitive' },
          }),
          ...(toBankName && {
            toBankName: { contains: toBankName, mode: 'insensitive' },
          }),
          ...(toBankAccount && {
            toBankAccount: { contains: toBankAccount, mode: 'insensitive' },
          }),
          ...(txType && {
            txType,
          }),
          ...(status && {
            status,
          }),
        };
      
        const [data, total] = await this.prisma.$transaction([
          this.prisma.topupTransaction.findMany({
            where,
            skip: ((page || 1 )- 1) * (pageSize || 10),
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.topupTransaction.count({ where }),
        ]);
      
        const returnData =  {
          data,
          meta: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / (pageSize || 10)),
          },
        };

        return new ApiResponseDto("success", returnData, "2000")
      }
      
}