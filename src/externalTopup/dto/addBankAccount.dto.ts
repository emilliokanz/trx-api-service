import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class AddBankAccountDto {
    @ApiProperty({ example: '1234567890', description: 'Bank account number' })
    @IsString()
    @IsNotEmpty()
    accountNo : string

    @ApiProperty({ example: 'BCA', description: 'Bank name' })
    @IsString()
    @IsNotEmpty()
    bankName : string

    @ApiProperty({ example: 'PT Contoh Sejahtera', description: 'Name registered on the account' })
    @IsString()
    @IsNotEmpty()
    accountName : string
}
