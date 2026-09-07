import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TopUpRequestDto {
  @ApiProperty({ example: 'xld10', description: 'Supplier SKU code' })
  @IsNotEmpty()
  @IsString()
  buyer_sku_code: string;

  @ApiProperty({ example: '087800001233', description: 'Destination account / phone number' })
  @IsNotEmpty()
  @IsString()
  customer_no: string;

  @ApiPropertyOptional({ default: false, description: 'Run against the supplier sandbox' })
  @IsOptional()
  @IsBoolean()
  testing?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Allow decimal amounts' })
  @IsOptional()
  @IsBoolean()
  allow_dot?: boolean;

  @ApiPropertyOptional({ example: 100000, description: 'Reject the order above this price' })
  @IsOptional()
  @IsInt()
  max_price?: number;
}
