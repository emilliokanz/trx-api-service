import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';
import { TransactionType } from './getTransactionList.dto';

export class CreateTopupRequestDto {
  @ApiProperty({ example: 1000000, description: 'Amount transferred, in rupiah' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '1234567890', description: 'Destination account number' })
  @IsString()
  toAccount: string;

  @ApiProperty({ example: 'PT Contoh Sejahtera', description: 'Destination account holder' })
  @IsString()
  toAccountName: string;

  @ApiProperty({ example: 'BCA', description: 'Destination bank' })
  @IsString()
  toBankName: string;

  @ApiProperty({ example: '9876543210', description: 'Source account number' })
  @IsString()
  fromAccount: string;

  @ApiProperty({ example: 'John Doe', description: 'Source account holder' })
  @IsString()
  fromAccountName: string;

  @ApiProperty({ example: 'BNI', description: 'Source bank' })
  @IsString()
  fromBankName: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.DEPOSIT })
  @IsString()
  txType: TransactionType;

  @ApiProperty({ example: 1, description: 'Id of the destination bank account record' })
  @IsInt()
  bankAccountId: number
}
