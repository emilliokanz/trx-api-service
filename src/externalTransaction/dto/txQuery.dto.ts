import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefIdDto {
  @ApiProperty({
    example: 'TRX-20250901-0001',
    description: 'Reference id of a single transaction',
  })
  ref_id: string;
}

export class BatchIdDto {
  @ApiProperty({
    example: '7c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
    description: 'Batch id returned when the transaction request was accepted',
  })
  batch_id: string;
}

/** Body of `/history` and `/transaction-detail-list`. Every field is optional. */
export class TxHistoryQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
  size?: number;

  @ApiPropertyOptional({ example: '087800001233', description: 'Filter by destination account' })
  customer_no?: string;

  @ApiPropertyOptional({ example: '2025-09-01', description: 'Inclusive lower bound (YYYY-MM-DD)' })
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-09-30', description: 'Inclusive upper bound (YYYY-MM-DD)' })
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by batch id' })
  batch_id?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction reference id' })
  ref_id?: string;
}
