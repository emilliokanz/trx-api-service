import { IsNotEmpty } from "class-validator";

export class UpdateTransactionRequestDto {
  @IsNotEmpty()
  buyer_sku_code: string;
  
  @IsNotEmpty()
  customer_no: string;
  
  source: string;
  
  @IsNotEmpty()
  ref_id: string;
}