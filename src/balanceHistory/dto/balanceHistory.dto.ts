import { CustomerBalanceType } from "@prisma/client";
import { IsNotEmpty } from "class-validator";

export class CreateCustBalanceHistoryDto {
    @IsNotEmpty()
    username: string

    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    type: CustomerBalanceType

    @IsNotEmpty()
    bf_balance: number

    @IsNotEmpty()
    af_balance: number

    @IsNotEmpty()
    amount: number

    @IsNotEmpty()
    ref_id: string

    @IsNotEmpty()
    customerId: number
}