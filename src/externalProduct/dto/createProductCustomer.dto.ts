import { ApiProperty } from '@nestjs/swagger';

export class CreateExtProductCustomer {
    @ApiProperty({ example: 'ITM-001', description: 'External item id of the product' })
    item_id : string

    @ApiProperty({ example: 42, description: 'Id of the customer this price applies to' })
    cust_id: number

    @ApiProperty({ example: 26000, description: 'Customer specific selling price' })
    price: number
}
