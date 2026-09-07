import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from './getTransactionList.dto';

export class UpdateTopupRequestDto {
  @ApiProperty({ example: 12, description: 'Id of the top-up request to settle' })
  id: number;

  @ApiProperty({
    enum: TransactionStatus,
    example: TransactionStatus.SUCCESS,
    description: 'New status. `SUCCESS` credits the requesting admin balance.',
  })
  status: TransactionStatus;

  @ApiProperty({
    example: 1000000,
    description: 'Amount actually received. Coerced to a number before it is applied.',
  })
  amount: number;
}
