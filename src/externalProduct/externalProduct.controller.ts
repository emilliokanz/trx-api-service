import { Body, Controller, Post } from "@nestjs/common";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { ExternalProductService } from "./externalProduct.service";
import { CreateExtProduct } from "./dto/createProduct.dto";

@Controller('/api/v1/product')
export class ExternalProductController {
    constructor(private extProductService: ExternalProductService) { }

    @Post('/create')
    async create(@Body() payload: CreateExtProduct[]) {
        const data = await this.extProductService.createProduct(payload)
        return new ApiResponseDto("success", data, '0000')
    }

    @Post('/update')
    async update(@Body() payload: CreateExtProduct) {
        const data = await this.extProductService.updateProduct(payload)
        return new ApiResponseDto("success", data, '0000')
    }
}