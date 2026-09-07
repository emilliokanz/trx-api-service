import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'MOBILE LEGENDS' })
  brand: string;

  @ApiProperty({ example: 'Games' })
  category: string;

  @ApiProperty({ example: 25000, description: 'Selling price' })
  price: number;

  @ApiProperty({ example: 'ml86', description: 'Supplier SKU code' })
  buyer_sku_code: string;

  @ApiProperty({ example: 'Mobile Legends 86 Diamonds' })
  product_name: string;
}
