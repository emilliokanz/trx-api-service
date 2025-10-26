import { Body, Controller, HttpException, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { ExternalProductService } from "./externalProduct.service";
import { CreateExtProduct } from "./dto/createProduct.dto";
import { AuthGuard } from "src/auth/auth.guard";
import { Roles } from "@prisma/client";
import { UserRoles } from "src/auth/roles.decorator";
import { PaginationDto } from "src/dto/pagination.dto";
import { CreateExtProductCustomer } from "./dto/createProductCustomer.dto";
import { ExternalAuthService } from "src/externalAuth/externalAuth.service";
import { CreateSupplierProduct } from "./dto/createSupplierProduct.dto";
import { validateDto } from "src/utils/payloadValidation";
import { errorMap } from "src/lib/errorCodes";

@Controller('/api/v1/product')
export class ExternalProductController {
  constructor(private extProductService: ExternalProductService, private extAuthService: ExternalAuthService) { }


  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin]) @Post('/create')
  async create(@Body() payload: CreateExtProduct[]) {
    return await this.extProductService.createProduct(payload)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin])
  @Post('/create-supplier')
  async createSupplierProduct(@Body() payload: CreateSupplierProduct[]) {
    const errors: any = [];

    for (let i = 0; i < payload.length; i++) {
      const { errors: validationErrors } = await validateDto(CreateSupplierProduct, payload[i]);

      if (validationErrors.length > 0) {
        errors.push({
          index: i,
          errors: validationErrors,
        });
      }
    }

    if (errors.length > 0) {
      throw new HttpException(
        new ApiResponseDto(errorMap[4001], errors, '4001'),
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.extProductService.createSupplierProductFn(payload);
  }


  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin])
  @Post('/update')
  async update(@Body() payload: CreateExtProduct) {
    return await this.extProductService.updateProduct(payload)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get-list')
  async getAll(@Body() payload: any, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)
    return await this.extProductService.findProducts(payload.page, payload.size, payload.filter, user.role)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin])
  @Post('/create-customer')
  async createCustomer(@Body() payload: CreateExtProductCustomer[], @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return await this.extProductService.createAdminCustProduct(payload, user.id)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin])
  @Post('/update-customer')
  async updateCustomer(@Body() payload: CreateExtProductCustomer, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return await this.extProductService.updateAdminCustProduct(payload, user.id)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin])
  @Post('/delete-customer')
  async deleteCustomer(@Body() payload: CreateExtProductCustomer, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return await this.extProductService.updateAdminCustProduct(payload, user.id)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.SuperAdmin])
  @Post('/get-product')
  async updateDigi() {

    const product = await this.extProductService.getDigiflazzPrice()
    return new ApiResponseDto("success", {
      product
    }, '0000')

  }
}