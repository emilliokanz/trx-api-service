import { IsNotEmpty } from "class-validator";

export class TransactionRequestDto {
  @IsNotEmpty()
  buyer_sku_code: string;
  
  @IsNotEmpty()
  customer_no: string;
  
  @IsNotEmpty()
  username: string;
  
  source: string;

  ref_id: string;
}