import { ExternalProduct, Roles } from '@prisma/client';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class PreTxDetailDto {
  @IsString()
  @IsNotEmpty()
  ref_id: string;

  @IsString()
  @IsNotEmpty()
  customer_no: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  profit: number;

  @IsString()
  @IsNotEmpty()
  supplierType: string;

  productDetail: ExternalProduct

  role: string

  user_id: number | null
}
