import { IsNotEmpty } from 'class-validator';


export class ExternalTxRequestDto {
    @IsNotEmpty()
    username: string

    @IsNotEmpty()
    code: string

    @IsNotEmpty()
    customer_no: string[]
}

export class ExternalTxRequestWebDto {

    @IsNotEmpty()
    code: string

    @IsNotEmpty()
    customer_no: string[]
}

export interface ExternalTxRequest {
    code: string
    customer_no: string
    batch_id: string
}