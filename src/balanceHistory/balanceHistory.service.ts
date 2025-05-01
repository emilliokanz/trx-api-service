import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCustBalanceHistoryDto } from "./dto/balanceHistory.dto";
import { CustomerService } from "src/customer/customer.service";
import { CustomerBalanceType } from "@prisma/client";

@Injectable()
export class BalanceHistoryService {
    constructor(private prisma: PrismaService, private readonly customer: CustomerService) { }

    async createBalanceHistory(payload: CreateCustBalanceHistoryDto) {
        const user = await this.customer.getUserByUsername(payload.username)
        if (user.length == 0) {
            return new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        return await this.prisma.customerBalanceHistory.create({
            data: {
                ...payload,
                customerId: user[0].id}
        })
    }

    async updateCustomerBalance(username: string, amount: number, type: CustomerBalanceType){
        const user = await this.customer.getUserByUsername(username)

        if(user.length == 0){
            return new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        let af_balance = 0

        if(type == 'Deposit'){
            await this.customer.addUserBalance(amount, username)
            af_balance = user[0].balance + amount

        }
        if(type == 'Withdrawal'){
            await this.customer.deductUserBalance(amount, username)
            af_balance = user[0].balance - amount

        }

        return await this.createBalanceHistory({
            username: user[0].username,
            af_balance,
            bf_balance: user[0].balance,
            amount: amount,
            customerId: user[0].id,
            name: user[0].name ?? '' ,
            ref_id: '',
            type
          })
        
    }

    async getHistories(page: number, take: number){
        return await this.prisma.customerBalanceHistory.findMany({
            skip: page - 1,
            take
        })
    }

    async getHistory(id: number){
        return await this.prisma.customerBalanceHistory.findUniqueOrThrow({
            where: {
                id
            }
        })
    }
}
