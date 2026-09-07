import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';


export class ExternalTxRequestDto {
    @ApiProperty({
        example: 'johndoe',
        description:
            'Owner of the transaction. On `/request-web` it is overwritten with the JWT subject, ' +
            'so the value sent there is ignored.',
    })
    @IsNotEmpty()
    username: string

    @ApiProperty({ example: 'ML5', description: 'Product code to purchase' })
    @IsNotEmpty()
    code: string

    @ApiProperty({
        type: [String],
        example: ['12345678(1234)', '87654321(4321)'],
        description: 'Destination account(s). One transaction is queued per entry.',
    })
    @IsNotEmpty()
    customer_no: string[]
}

export class ExternalTxRequestWebDto {

    @ApiProperty({ example: 'ML5', description: 'Product code to purchase' })
    @IsNotEmpty()
    code: string

    @ApiProperty({ type: [String], example: ['12345678(1234)'] })
    @IsNotEmpty()
    customer_no: string[]
}

export interface ExternalTxRequest {
    code: string
    customer_no: string
    batch_id: string
}
