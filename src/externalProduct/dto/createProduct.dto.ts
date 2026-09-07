import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtProductJunction {
    @ApiPropertyOptional({ example: 'ITM-001', description: 'Parent external item id' })
    item_id?: string

    @ApiProperty({ example: 12, description: 'Id of the supplier product to draw from' })
    product_id: number

    @ApiProperty({ example: 2, description: 'How many units of the supplier product per order' })
    qty: number
}

export class CreateExtProduct {
    @ApiProperty({ example: 'ITM-001', description: 'External item id, unique per product' })
    item_id: string

    @ApiProperty({ example: 'Mobile Legends' })
    game_name: string

    @ApiProperty({ example: '86 Diamonds' })
    item_name: string

    @ApiProperty({ example: 'Asia', description: 'Server / region label' })
    server_name: string

    @ApiProperty({ example: 'Diamond', description: 'Grouping label used in listings' })
    group_name: string

    @ApiProperty({ example: 100 })
    stock: number

    @ApiProperty({ example: 1 })
    min_order: number

    @ApiProperty({ example: 25000, description: 'Price shown to customers' })
    price: number

    @ApiProperty({ example: 23000, description: 'Price charged to admins' })
    admin_price: number

    @ApiProperty({
        type: [ExtProductJunction],
        description: 'Supplier products this item is composed of.',
    })
    products: ExtProductJunction[]
}
