import { ExternalProduct } from "@prisma/client"
import { ApiResponseDto } from "src/dto/apiResponse.dto"
import { errorMap } from "src/lib/errorCodes"

export default function preTransactionValidation(extProduct: ExternalProduct, isWeb: string, usernameHeader: string, code: string, customer_no: any[]) {
    if (!extProduct) {
        return new ApiResponseDto(errorMap[2000], null, '2000')
    }

    if (!isWeb && !usernameHeader) {
        return new ApiResponseDto(errorMap[4002], null, '4002')
    }

    if (!code) {
        return new ApiResponseDto(errorMap[4000] + 'code', null, '4000')
    }

    if (customer_no.length == 0) {
        return new ApiResponseDto(errorMap[4000] + 'customer_no', null, '4000')
    }
}