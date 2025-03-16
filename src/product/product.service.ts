import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import PaginationIface from 'src/interface/paginationIface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createProduct(productData: CreateProductDto) {
    const { brand, buyer_sku_code, category, price, product_name } =
      productData;

    const findProduct = await this.findProductByCode(
      productData.buyer_sku_code,
    );

    if (findProduct) {
      return new HttpException(
        'Product with buyer_sku_code already exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const createProduct = await this.prisma.productPrice.create({
      data: {
        brand,
        buyer_sku_code,
        category,
        price,
        product_name,
      },
    });

    return createProduct;
  }

  async updateProduct(productData: UpdateProductDto) {
    await this.findProductById(productData.id);
    const { brand, buyer_sku_code, category, price, product_name } =
      productData;

    const update = await this.prisma.productPrice.update({
      where: {
        id: productData.id,
      },
      data: {
        brand,
        buyer_sku_code,
        category,
        price,
        product_name,
      },
    });

    return update;
  }

  async findProductByCode(buyer_sku_code: string) {
    const findProduct = await this.prisma.productPrice.findMany({
      where: {
        buyer_sku_code: buyer_sku_code,
      },
    });

    return findProduct[0];
  }

  async findProductById(id: number) {
    const findProduct = await this.prisma.productPrice.findUnique({
      where: {
        id,
      },
    });

    if (!findProduct) {
      return new HttpException('Product not found', HttpStatus.BAD_REQUEST);
    }

    return findProduct;
  }

  async findProducts(page: number, take: number) {
    const data = await this.prisma.productPrice.findMany({
      skip: page - 1,
      take,
    });

    const totalData = await this.prisma.productPrice.count();

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / take),
    };

    return paginationData;
  }
}
