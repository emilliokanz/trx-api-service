import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExtProductFilterDto {
  @ApiPropertyOptional({ example: 'ITM-001' })
  item_id?: string;

  @ApiPropertyOptional({ example: 'Mobile Legends' })
  game_name?: string;

  @ApiPropertyOptional({ example: '86 Diamonds' })
  item_name?: string;

  @ApiPropertyOptional({
    example: 25000,
    description:
      'Exact price match. Compared against `admin_price` for Admin callers and `price` otherwise.',
  })
  price?: number;
}

export class GetExtProductListDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
  size?: number;

  @ApiPropertyOptional({ type: ExtProductFilterDto })
  filter?: ExtProductFilterDto;
}
