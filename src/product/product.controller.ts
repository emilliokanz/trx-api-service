import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductService } from './product.service';

@Controller('/api/v1/itemku/product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('')
  async createProduct(@Body() productData: CreateProductDto) {
    return this.productService.createProduct(productData);
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update')
  async updateProduct(@Body() productData: UpdateProductDto) {
    return this.productService.updateProduct(productData);
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get')
  async getProducts(@Body() payload: any) {
    return this.productService.findProducts(payload.page, payload.take);
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get-one')
  async getProductById(@Body() payload: any) {
    return this.productService.findProductById(payload.id);
  }
}
