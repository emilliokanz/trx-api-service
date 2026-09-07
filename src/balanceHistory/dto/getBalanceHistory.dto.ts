import { ApiProperty } from '@nestjs/swagger';

export class GetBalanceHistoryDto {
  @ApiProperty({ example: 15, description: 'Balance history record id' })
  id: number;
}
