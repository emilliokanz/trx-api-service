import { Body, Controller, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post('')
  async createProduct(@Body() productData: CreateProductDto) {
    return this.productService.createProduct(productData);
  }

  @Post('/update')
  async updateProduct(@Body() productData: UpdateProductDto) {
    return this.productService.updateProduct(productData);
  }

  @Post('/get')
  async getProducts(@Body() payload: any) {
    return this.productService.findProducts(payload.page, payload.take);
  }

  @Post('/get-one')
  async getProductById(@Body() payload: any) {
    return this.productService.findProductById(payload.id);
  }
}
