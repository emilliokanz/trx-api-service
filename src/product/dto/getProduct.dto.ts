import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
  take?: number;
}

export class GetProductByIdDto {
  @ApiProperty({ example: 7, description: 'Product price id' })
  id: number;
}
