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

export class CreateSupplierProduct {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsBoolean()
  @IsNotEmpty()
  status: boolean;

  @IsBoolean()
  unlimited_stock: boolean;

  @Type(() => Number)
  @IsNumber()
  stock: number;

  @IsBoolean()
  multi: boolean;

  @IsString()
  start_cut_off: string;
  
  @IsString()
  end_cut_off: string;

  @IsString()
  desc: string;

  @Type(() => Number)
  @IsNumber()
  actualPrice: number;
}
