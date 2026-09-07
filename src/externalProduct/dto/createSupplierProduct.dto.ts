import {
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  isBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierProduct {
  @ApiProperty({ example: 'Mobile Legends 86 Diamonds', description: 'Supplier product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Games' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'MOBILE LEGENDS' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Umum', description: 'Supplier product type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 23000, description: 'Current supplier price' })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'ml86', description: 'Supplier SKU code (buyer_sku_code)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: true, description: 'Whether the product is sellable' })
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  unlimited_stock: boolean;

  @ApiProperty({ example: 100, description: 'Ignored when unlimited_stock is true' })
  @Type(() => Number)
  @IsNumber()
  stock: number;

  @ApiProperty({ example: false, description: 'Supports multi transactions' })
  @IsBoolean()
  multi: boolean;

  @ApiProperty({ example: '23:00', description: 'Start of the daily cut off window (HH:mm)' })
  @IsString()
  start_cut_off: string;

  @ApiProperty({ example: '01:00', description: 'End of the daily cut off window (HH:mm)' })
  @IsString()
  end_cut_off: string;

  @ApiProperty({ example: 'Instant process', description: 'Free-form supplier notes' })
  @IsString()
  desc: string;

  @ApiProperty({ example: 23000, description: 'Base price used for margin checks' })
  @Type(() => Number)
  @IsNumber()
  actualPrice: number;
}
