import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UpdateTransactionRequestDto {
  @ApiProperty({ example: 'ml86', description: 'Supplier SKU code of the transaction' })
  @IsNotEmpty()
  buyer_sku_code: string;

  @ApiProperty({ example: '12345678(1234)', description: 'Destination account' })
  @IsNotEmpty()
  customer_no: string;

  @ApiPropertyOptional({ example: 'itemku', description: 'Origin of the transaction' })
  source: string;

  @ApiProperty({ example: 'TRX-20250901-0001', description: 'Reference id of the transaction to update' })
  @IsNotEmpty()
  ref_id: string;
}
