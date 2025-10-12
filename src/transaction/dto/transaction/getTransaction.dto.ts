import { Pagination } from "src/common/pagination.dto"

export class GetTransaction extends Pagination {
    sort: string
    dateStart: string
    dateEnd: string
    status: string
    deliveryStatus: string
    gameName: string
    productName: string
    orderId: string
    orderNumber: string
    userInfo: string
}