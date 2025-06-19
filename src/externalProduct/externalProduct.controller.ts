import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { ExternalProductService } from "./externalProduct.service";
import { CreateExtProduct } from "./dto/createProduct.dto";
import { AuthGuard } from "src/auth/auth.guard";
import { Roles } from "@prisma/client";
import { UserRoles } from "src/auth/roles.decorator";
import { PaginationDto } from "src/dto/pagination.dto";

@Controller('/api/v1/product')
export class ExternalProductController {
    constructor(private extProductService: ExternalProductService) { }

    
    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin, Roles.SuperAdmin])@Post('/create')
    async create(@Body() payload: CreateExtProduct[]) {
        return await this.extProductService.createProduct(payload)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin, Roles.SuperAdmin])
    @Post('/update')
    async update(@Body() payload: CreateExtProduct) {
        return await this.extProductService.updateProduct(payload)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin, Roles.SuperAdmin])
    @Post('/get-list')
    async getAll(@Body() payload: any) {
        return await this.extProductService.findProducts(payload.page, payload.size, payload.filter)
    }
}