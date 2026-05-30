import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TopUpRequestDto {
  @IsNotEmpty()
  @IsString()
  buyer_sku_code: string;

  @IsNotEmpty()
  @IsString()
  customer_no: string;

  @IsOptional()
  @IsBoolean()
  testing?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_dot?: boolean;

  @IsOptional()
  @IsInt()
  max_price?: number;
}
