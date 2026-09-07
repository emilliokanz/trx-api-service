import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger shape of the Prisma `ItemkuOrder` model. Kept here because the Prisma
 * client only exports a type, which carries no runtime metadata for the spec.
 */
export class ItemkuOrderDto {
  @ApiProperty({ example: 90210, description: 'Itemku order id (primary key)' })
  order_id: number;

  @ApiProperty({ example: 'INV-20250901-001', description: 'Itemku order number, unique' })
  order_number: string;

  @ApiProperty({ example: 'SUCCESS', description: 'Order status as reported by Itemku' })
  status: string;

  @ApiProperty({ example: 25000, description: 'Unit price' })
  price: number;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 24000, description: 'Net amount received for the order' })
  order_income: number;

  @ApiProperty({ example: 1234, description: 'Itemku product id' })
  product_id: number;

  @ApiProperty({ example: '86 Diamonds' })
  product_name: string;

  @ApiProperty({ example: 'Mobile Legends' })
  game_name: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Buyer supplied fields required to fulfil the order',
    example: { user_id: '12345678', zone_id: '1234' },
  })
  required_information: Record<string, any>;

  @ApiPropertyOptional({ example: '12345678(1234)', nullable: true })
  delivery_info?: string | null;

  @ApiPropertyOptional({ example: 'user_id', nullable: true })
  delivery_info_field?: string | null;

  @ApiPropertyOptional({ example: 0, default: 0 })
  using_delivery_info?: number;

  @ApiPropertyOptional({ example: false, default: false })
  is_from_ads?: boolean;
}
