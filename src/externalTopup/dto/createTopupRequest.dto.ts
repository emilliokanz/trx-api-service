import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';
import { TransactionType } from './getTransactionList.dto';

export class CreateTopupRequestDto {
  @IsNumber()
  amount: number;

  @IsString()
  accountNo: string;

  @IsString()
  accountName: string;

  @IsString()
  fromBankAccount: string;

  @IsString()
  fromBankName: string;

  @IsString()
  txType: TransactionType;

  @IsInt()
  bankAccountId: number
}
