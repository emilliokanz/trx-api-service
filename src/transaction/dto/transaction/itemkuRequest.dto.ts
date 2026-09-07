import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemkuRefIdDto {
  @ApiProperty({ example: 'TRX-20250901-0001', description: 'Transaction reference id' })
  ref_id: string;
}

export class RetryItemkuOrderDto {
  @ApiProperty({
    type: [Number],
    example: [90210, 90211],
    description: 'Itemku order ids to re-run',
  })
  order_id: number[];
}

export class ComparePriceDto {
  @ApiProperty({ example: 'ml86', description: 'Supplier SKU code to price' })
  buyer_sku_code: string;

  @ApiProperty({ example: 500000, description: 'Balance to check the price against' })
  userBalance: number;

  @ApiProperty({ example: 'johndoe', description: 'Customer the price applies to' })
  username: string;
}

export class GetTxHistoriesDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
  take?: number;

  @ApiPropertyOptional({ example: 'SUCCESS', description: 'Filter by transaction status' })
  status?: string;

  @ApiPropertyOptional({
    example: 'itemku',
    description: 'Filter by origin. Overrides `status` -- only one filter is applied.',
  })
  source?: string;
}

export class ManualUpdateTxDto {
  @ApiProperty({
    type: [String],
    example: ['TRX-20250901-0001', 'TRX-20250901-0002'],
    description: 'Reference ids to re-sync against the supplier',
  })
  refIds: string[];
}
