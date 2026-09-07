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
import { ApiBody, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { GetExtProductListDto } from "./dto/getProductList.dto";
import { JWT_AUTH } from "src/swagger/swagger.setup";

@ApiTags('External Product')
@ApiSecurity(JWT_AUTH)
@Controller('/api/v1/product')
export class ExternalProductController {
  constructor(private extProductService: ExternalProductService, private extAuthService: ExternalAuthService) { }


  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Create external products',
    description:
      'SuperAdmin only. Accepts an array; each item may reference one or more supplier products ' +
      'through `products`, which is how the sell price is composed.',
  })
  @ApiBody({ type: [CreateExtProduct] })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin]) @Post('/create')
  async create(@Body() payload: CreateExtProduct[]) {
    return await this.extProductService.createProduct(payload)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Create supplier products',
    description:
      'SuperAdmin only. Every element is validated individually; a 400 with `errorCode` ' +
      '`4001` lists the offending array indexes and their validation messages.',
  })
  @ApiBody({ type: [CreateSupplierProduct] })
  @ApiOkResponse({ type: ApiResponseDto })
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
  @ApiOperation({
    summary: 'Update an external product',
    description: 'SuperAdmin only. The product is matched on `item_id`.',
  })
  @ApiBody({ type: CreateExtProduct })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/update')
  async update(@Body() payload: CreateExtProduct) {
    return await this.extProductService.updateProduct(payload)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List external products',
    description:
      'Paginated catalogue. The price returned depends on the caller role: admins see ' +
      '`admin_price`, SuperAdmins additionally see the supplier composition.',
  })
  @ApiBody({ type: GetExtProductListDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get-list')
  async getAll(@Body() payload: any, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)
    return await this.extProductService.findProducts(payload.page, payload.size, payload.filter, user.role)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Set customer specific prices',
    description:
      'Admin only. Assigns per-customer selling prices for products the admin owns. ' +
      '`4007` when the target user is not a customer of the caller.',
  })
  @ApiBody({ type: [CreateExtProductCustomer] })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin])
  @Post('/create-customer')
  async createCustomer(@Body() payload: CreateExtProductCustomer[], @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return await this.extProductService.createAdminCustProduct(payload, user.id)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update a customer specific price',
    description: 'Admin only.',
  })
  @ApiBody({ type: CreateExtProductCustomer })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin])
  @Post('/update-customer')
  async updateCustomer(@Body() payload: CreateExtProductCustomer, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return await this.extProductService.updateAdminCustProduct(payload, user.id)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Remove a customer specific price',
    description: 'Admin only.',
  })
  @ApiBody({ type: CreateExtProductCustomer })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin])
  @Post('/delete-customer')
  async deleteCustomer(@Body() payload: CreateExtProductCustomer, @Req() req: any) {
    const user = await this.extAuthService.getUserDetail(req.headers.authorization)

    return await this.extProductService.updateAdminCustProduct(payload, user.id)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Refresh supplier prices from Digiflazz',
    description:
      'SuperAdmin only. Pulls the current Digiflazz price list and syncs it into supplier products. ' +
      'Takes no body.',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/update-supplier')
  async updateDigi() {

    const product = await this.extProductService.getDigiflazzPrice()
    return new ApiResponseDto("success",
      product
    , '0000')

  }

  
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List supplier products',
    description: 'SuperAdmin only. Returns the stored supplier catalogue. Takes no body.',
  })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.SuperAdmin])
  @Post('/get-product')
  async getProducts() {
    return await this.extProductService.getSupplierProduct()
  }
}