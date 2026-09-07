import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductService } from './product.service';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { GetProductByIdDto, GetProductsDto } from './dto/getProduct.dto';

/**
 * Appended to the description of routes that declare @UserRoles without an
 * accompanying @UseGuards(AuthGuard), so the spec does not overstate what is
 * actually enforced.
 */
const NOTE =
  ' NOTE: this route carries @UserRoles but no @UseGuards(AuthGuard), so no token is checked ' +
  'today and the role restriction is not enforced.';

@ApiTags('Itemku Product')
@Controller('/api/v1/itemku/product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @ApiOperation({
    summary: 'Create an Itemku product price',
    description: 'Registers a product together with its selling price.' + NOTE,
  })
  @ApiBody({ type: CreateProductDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('')
  async createProduct(@Body() productData: CreateProductDto) {
    return this.productService.createProduct(productData);
  }

  @ApiOperation({
    summary: 'Update an Itemku product price',
    description: 'Updates the product identified by `id`.' + NOTE,
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update')
  async updateProduct(@Body() productData: UpdateProductDto) {
    return this.productService.updateProduct(productData);
  }

  @ApiOperation({
    summary: 'List Itemku product prices',
    description: 'Paginated product list.' + NOTE,
  })
  @ApiBody({ type: GetProductsDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get')
  async getProducts(@Body() payload: any) {
    return this.productService.findProducts(payload.page, payload.take);
  }

  @ApiOperation({
    summary: 'Single Itemku product price',
    description: 'Looks up one product by id.' + NOTE,
  })
  @ApiBody({ type: GetProductByIdDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get-one')
  async getProductById(@Body() payload: any) {
    return this.productService.findProductById(payload.id);
  }
}
