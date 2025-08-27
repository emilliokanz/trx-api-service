import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';
import { TransactionType } from './getTransactionList.dto';

export class CreateTopupRequestDto {
  @IsNumber()
  amount: number;

  @IsString()
  toAccount: string;

  @IsString()
  toAccountName: string;

  @IsString()
  toBankName: string;

  @IsString()
  fromAccount: string;

  @IsString()
  fromAccountName: string;

  @IsString()
  fromBankName: string;

  @IsString()
  txType: TransactionType;

  @IsInt()
  bankAccountId: number
}
