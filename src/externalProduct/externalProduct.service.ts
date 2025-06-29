import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateExtProduct } from "./dto/createProduct.dto";
import { extProductToDb, extProductToDbOne } from "./mapper/extProductToDb";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { ExternalUser, Prisma } from "@prisma/client";
import PaginationIface from "src/interface/paginationIface";
import { ExternalAuthService } from "src/externalAuth/externalAuth.service";
import { CreateExtProductCustomer } from "./dto/createProductCustomer.dto";

@Injectable()
export class ExternalProductService {
    constructor(private prisma: PrismaService, private externalUser: ExternalAuthService) { }

    async createProduct(payload: CreateExtProduct[]) {
        const mappedProducts = await extProductToDb(payload)
        try {
            const product = await this.prisma.externalProduct.createMany({
                data: mappedProducts, skipDuplicates: true
            })


            for (const x of payload) {
                let sPrice = 0

                for (const y of x.products) {
                    y.item_id = x.item_id
                    const product = await this.prisma.externalSupplierProduct.findFirst({
                        where: {
                            id: y.product_id
                        }
                    })

                    if (!product) {
                        return new ApiResponseDto(errorMap[2000], { product_id: y.product_id }, '2000')
                    }

                    sPrice = sPrice + (product.price * y.qty)
                }

                if (x.price <= sPrice) {
                    return new ApiResponseDto(errorMap[2001], { item_id: x.item_id }, '2001')
                }
            }

            const juctionProducts: any = payload.map(x => x.products)

            const args: Prisma.ExtProductToSupplierJunctionCreateManyArgs = {
                data: juctionProducts[0],
                skipDuplicates: true,
            }

            if (product && args) {
                await this.prisma.extProductToSupplierJunction.createMany(args)
            }

            return new ApiResponseDto("success", product, '0000')

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
            await this.prisma.extProductToSupplierJunction.deleteMany({
                where: {
                    item_id: product.item_id
                }
            });

            const sPrice = 0

            for (const x of payload.products) {
                const product = await this.prisma.externalSupplierProduct.findFirst({
                    where: {
                        id: x.product_id
                    }
                })

                if (!product) {
                    return new ApiResponseDto(errorMap[2000], { product_id: x.product_id }, '2000')
                }

                sPrice + (product.price * x.qty)
            }

            if (payload.price <= sPrice) {
                return new ApiResponseDto(errorMap[2001], null, '2001')
            }

            const createData = payload.products.map(x => ({
                item_id: product.item_id,
                product_id: x.product_id,
                qty: x.qty !== 0 ? x.qty : 1
            }));

            await this.prisma.extProductToSupplierJunction.createMany({
                data: createData
            });
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

        return new ApiResponseDto("success", result, '0000')
    }

    async findProductById(item_id: string) {
        const findProduct = await this.prisma.externalProduct.findFirst({
            where: {
                item_id
            }
        });

        if (!findProduct) {
            return new ApiResponseDto(errorMap[2000], null, '2000')
        }

        return new ApiResponseDto('success', findProduct, '0000');
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
            ...(page > 0 && {
                skip: (page - 1) * take,
                take,
            }),
            where,
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
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

        return new ApiResponseDto("success", paginationData, '0000')
    }

    async createAdminCustProduct(payload: CreateExtProductCustomer[], admin_id: number) {

        const success: any = []
        const failed: string[] = []

        if (payload.length == 0) {
            throw new HttpException(new ApiResponseDto(errorMap[4000], null, '4000'), HttpStatus.BAD_REQUEST)
        }

        for (const item of payload) {
            const errors = await this.validateCustProduct(item.item_id, item.cust_id, admin_id, item.price)

            if (errors.length > 0) {
                failed.push(...errors);
                continue; // skip to next item
            }

            else try {
                const addProduct = await this.prisma.externalAdminCustProduct.create({
                    data: {
                        price: item.price,
                        cust_id: item.cust_id,
                        item_id: item.item_id
                    }
                })

                success.push(addProduct)

            } catch (error: any) {
                console.error(error.message)
                failed.push(`${errorMap[5000]} ${item.item_id}`)
            }
        }

        return new ApiResponseDto("success", {
            success, failed
        }, '0000')

    }

    async updateAdminCustProduct(payload: CreateExtProductCustomer, admin_id: number) {
        const { item_id, cust_id, price } = payload
        const errors = await this.validateCustProduct(item_id, cust_id, admin_id, price)

        if (errors.length > 0) {
            throw new HttpException(new ApiResponseDto(errorMap[4008], errors, '4008'), HttpStatus.BAD_REQUEST)
        }

        else try {
            const updateProduct = await this.prisma.externalAdminCustProduct.update({
                data: {
                    price: price,
                }, where: {
                    cust_id_item_id: {
                        cust_id: cust_id,
                        item_id: item_id
                    }
                }
            })

            return new ApiResponseDto("success", {
                updateProduct
            }, '0000')

        } catch (error: any) {
            console.error(error.message)
            throw new HttpException(new ApiResponseDto(errorMap[5000], errors, '5000'), HttpStatus.BAD_REQUEST)
        }

    }

    async deleteAdminCustProduct(payload: CreateExtProductCustomer, admin_id: number) {
        const { item_id, cust_id, price } = payload
        const errors = await this.validateCustProduct(item_id, cust_id, admin_id, price)

        if (errors.length > 0) {
            throw new HttpException(new ApiResponseDto(errorMap[4008], errors, '4008'), HttpStatus.BAD_REQUEST)
        }

        else try {
            const updateProduct = await this.prisma.externalAdminCustProduct.delete({
                where: {
                    cust_id_item_id: {
                        cust_id: cust_id,
                        item_id: item_id
                    }
                }
            })

            return new ApiResponseDto("success", {
                updateProduct
            }, '0000')

        } catch (error: any) {
            console.error(error.message)
            throw new HttpException(new ApiResponseDto(errorMap[5000], errors, '5000'), HttpStatus.BAD_REQUEST)
        }
    }

    async validateCustProduct(item_id: string, cust_id: number, admin_id: number, price: number) {
        const errors: string[] = [];

        const product = await this.findProductById(item_id)

        if (!product.data) {
            errors.push(`${errorMap[2000]} ${item_id}`)
        }

        const user = await this.externalUser.findUserById(cust_id)

        if (!user.data) {
            errors.push(`${errorMap[1004]} ${cust_id}`)
        }

        if (user.data.externalAdminUsersUserId !== admin_id) {
            errors.push(`${errorMap[4007]} ${user.data.name}`)
        }

        if (product && price < product.data.adminPrice) {
            errors.push(`${errorMap[2002]} ${item_id}`)
        }

        return errors
    }

    async productPriceValidation(pPrice: number, sPrice: number, qty: number) {
        return pPrice > (sPrice * qty)
    }
}