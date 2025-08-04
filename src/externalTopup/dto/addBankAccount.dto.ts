import { IsNotEmpty, IsString } from "class-validator"

export class AddBankAccountDto {
    @IsString()
    @IsNotEmpty()
    accountNo : string

    @IsString()
    @IsNotEmpty()
    bankName : string

    @IsString()
    @IsNotEmpty()
    accountName : string
}