import { IsOptional, IsEnum, IsString, IsNumber, IsDateString } from 'class-validator';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export class GetTransactionListDto {
  @IsOptional()
  @IsDateString()
  createdDate?: string; // ISO format (e.g., 2025-08-03)

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  toBankName?: string;

  @IsOptional()
  @IsString()
  toBankAccount?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  txType?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;
}
