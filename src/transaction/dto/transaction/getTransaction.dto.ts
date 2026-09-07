import { ApiPropertyOptional } from "@nestjs/swagger"
import { Pagination } from "src/common/pagination.dto"

export class GetTransaction extends Pagination {
    @ApiPropertyOptional({ example: 'desc', description: 'Sort direction on the update timestamp' })
    sort: string

    @ApiPropertyOptional({ example: '2025-09-01', description: 'Inclusive lower bound. Applied only together with dateEnd.' })
    dateStart: string

    @ApiPropertyOptional({ example: '2025-09-30', description: 'Inclusive upper bound. Applied only together with dateStart.' })
    dateEnd: string

    @ApiPropertyOptional({ example: 'SUCCESS', description: 'Order status' })
    status: string

    @ApiPropertyOptional({ example: 'delivered', description: 'Delivery status, matched case insensitively' })
    deliveryStatus: string

    @ApiPropertyOptional({ example: 'Mobile Legends', description: 'Partial, case insensitive match' })
    gameName: string

    @ApiPropertyOptional({ example: '86 Diamonds', description: 'Partial, case insensitive match' })
    productName: string

    @ApiPropertyOptional({ example: '90210', description: 'Exact numeric order id' })
    orderId: string

    @ApiPropertyOptional({ example: 'INV-20250901-001', description: 'Partial, case insensitive match' })
    orderNumber: string

    @ApiPropertyOptional({ example: '12345678(1234)', description: 'Buyer / destination account info' })
    userInfo: string
}
