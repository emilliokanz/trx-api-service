import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateTopupRequestDto {
  @IsInt()
  requestorId: number;

  @IsOptional()
  @IsInt()
  approver?: number;

  @IsString()
  refNo: string;

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

  @IsInt()
  bankAccountId: number
}
