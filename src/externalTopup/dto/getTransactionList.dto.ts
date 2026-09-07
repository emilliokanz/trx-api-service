import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ example: '2025-08-03', description: 'Inclusive lower bound, ISO date' })
  @IsOptional()
  @IsDateString()
  startDate?: string; // ISO format (e.g., 2025-08-03)

  @ApiPropertyOptional({ example: '2025-08-31', description: 'Inclusive upper bound, ISO date' })
  @IsOptional()
  @IsDateString()
  endDate?: string; // ISO format (e.g., 2025-08-03)

  @ApiPropertyOptional({ example: 'John Doe', description: 'Filter by account holder name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ example: 'BCA', description: 'Filter by destination bank' })
  @IsOptional()
  @IsString()
  toBankName?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Filter by destination account' })
  @IsOptional()
  @IsString()
  toBankAccount?: string;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  txType?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number, 1 based' })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Rows per page' })
  @IsOptional()
  @IsNumber()
  size?: number = 10;
}
