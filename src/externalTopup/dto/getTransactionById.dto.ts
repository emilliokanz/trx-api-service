import { ApiProperty } from '@nestjs/swagger';

export class GetTopupTransactionByIdDto {
  @ApiProperty({ example: 12, description: 'Id of the top-up transaction' })
  id: number;
}
