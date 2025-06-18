import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateExtProduct } from "./dto/createProduct.dto";
import { extProductToDb, extProductToDbOne } from "./mapper/extProductToDb";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { Prisma } from "@prisma/client";
import PaginationIface from "src/interface/paginationIface";

@Injectable()
export class ExternalProductService {
    constructor(private prisma: PrismaService) { }

    async createProduct(payload: CreateExtProduct[]) {
        const mappedProducts = await extProductToDb(payload)
        try {
            const product = await this.prisma.externalProduct.createMany({
                data: mappedProducts, skipDuplicates: true
            })

            const juctionProducts: any = payload.map(x => x.products)

            const args: Prisma.ExtProductToSupplierJunctionCreateManyArgs = {
                data: juctionProducts[0],
                skipDuplicates: true,
            }

            if (product && args) {
                await this.prisma.extProductToSupplierJunction.createMany(args)
            }

            return product
        } catch (error: any) {
            console.log(error.message)
            return new ApiResponseDto(errorMap[5000], null, '5000')
        }
    }

    async updateProduct(payload: CreateExtProduct) {
        const product = await this.prisma.externalProduct.findFirst({
            where: {
                item_id: payload.item_id
            }
        })

        if (!product) {
            return new ApiResponseDto(errorMap[2000], null, '2000')
        }

        const mappedProducts = extProductToDbOne(payload)


        const update = await this.prisma.externalProduct.update({
            where: {
                item_id: payload.item_id
            }, data: mappedProducts
        })


        if (payload.products) {
            payload.products.forEach(async (x) => {
                let qty = x.qty !== 0 ? x.qty : 1

                await this.prisma.extProductToSupplierJunction.upsert({
                    where: {
                        product_id_item_id: {
                            item_id: product.item_id,
                            product_id: x.product_id
                        }
                    },
                    create: {
                        item_id: product.item_id,
                        product_id: x.product_id,
                        qty
                    },
                    update: {
                        qty
                    },
                })
            })
        }

        const updatedProduct = await this.prisma.externalProduct.findFirst({
            where: {
                item_id: payload.item_id
            }, include: {
                products: true,
            }
        })

        const result = {
            ...updatedProduct,
            products: updatedProduct?.products,
        };

        return result;
    }

  async findProductById(item_id: string) {
    const findProduct = await this.prisma.externalProduct.findMany({
      where: {
        item_id
      },
    });

    if (!findProduct) {
        return new ApiResponseDto(errorMap[2000], null, '2000')
    }

    return findProduct[0];
  }


  async findProducts(page: number, take: number, filter: any) {
    const where: any = {};

    if (filter?.item_id) {
      where.item_id = filter.item_id;
    }
  
    if (filter?.game_name) {
      where.game_name = filter.game_name;
    }
  
    if (filter?.item_name) {
      where.item_name = filter.item_name;
    }
  
    if (filter?.price != null) {
      where.price = filter.price;
    }

    const data = await this.prisma.externalProduct.findMany({
      skip: page - 1,
      take,
      where,
      include: {
        products: {
            include: {
                product: true
            }
        }
      }
    });

    const totalData = await this.prisma.externalProduct.count({
        where
    });

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / take),
    };

    return paginationData;
  }
}