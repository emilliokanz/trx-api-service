import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateExtProduct } from "./dto/createProduct.dto";
import { extProductToDb, extProductToDbOne } from "./mapper/extProductToDb";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { Prisma } from "@prisma/client";

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

        const mappedProducts = await extProductToDbOne(payload)


        const update = await this.prisma.externalProduct.update({
            where: {
                item_id: payload.item_id
            }, data: mappedProducts
        })


        if (payload.products) {
            payload.products.forEach(async (x) => {
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
                        qty: x.qty
                    },
                    update: {
                        qty: x.qty
                    },
                })
            })
        }

        const updatedProduct = await this.prisma.externalProduct.findFirst({
            where: {
                item_id: payload.item_id
            }, include: {
                ExtProductToSupplierJunction: true,
            }
        })

        const result = {
            ...updatedProduct,
            products: updatedProduct?.ExtProductToSupplierJunction,
        };
        delete result.ExtProductToSupplierJunction;

        return result;
    }
}