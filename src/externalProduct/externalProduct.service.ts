import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateExtProduct } from "./dto/createProduct.dto";
import { extProductToDb, extProductToDbOne } from "./mapper/extProductToDb";
import { ApiResponseDto } from "src/dto/apiResponse.dto";
import { errorMap } from "src/lib/errorCodes";
import { ExternalUser, Prisma, ProductPrice, Roles } from "@prisma/client";
import PaginationIface from "src/interface/paginationIface";
import { ExternalAuthService } from "src/externalAuth/externalAuth.service";
import { CreateExtProductCustomer } from "./dto/createProductCustomer.dto";
import { productToDbMapper } from "src/externalTransaction/mapper/productToDbMapper";
import { CreateSupplierProduct } from "./dto/createSupplierProduct.dto";
import generateSignature from "src/utils/generateSignature";
import { HttpsProxyAgent } from "https-proxy-agent";
import axios from "axios";

@Injectable()
export class ExternalProductService {
    constructor(private prisma: PrismaService, private externalUser: ExternalAuthService) { }

    async createProduct(payload: CreateExtProduct[]) {
        const success: any[] = []
        const failed: string[] = []

        if (payload.length === 0) {
            throw new HttpException(
                new ApiResponseDto(errorMap[4000], null, '4000'),
                HttpStatus.BAD_REQUEST,
            )
        }

        const mappedProducts = await extProductToDb(payload)

        try {
            // Loop through each product individually
            for (const [index, x] of payload.entries()) {
                const errors = await this.validateProduct(x)

                if (errors.length > 0) {
                    failed.push(...errors)
                    continue
                }

                const productData = mappedProducts[index]

                // Create product one by one
                const createdProduct = await this.prisma.externalProduct.create({
                    data: productData,
                })

                // Prepare and create junction entries for this product
                const junctionProducts = x.products.map((y) => ({
                    ...y,
                    item_id: x.item_id,
                }))

                if (junctionProducts.length > 0) {
                    await this.prisma.extProductToSupplierJunction.createMany({
                        data: junctionProducts,
                        skipDuplicates: true,
                    })
                }

                success.push(createdProduct)
            }

            return new ApiResponseDto('success', { success, failed }, '0000')
        } catch (error: any) {
            console.error(error.message)
            throw new HttpException(
                new ApiResponseDto(errorMap[5000], null, '5000'),
                HttpStatus.BAD_REQUEST,
            )
        }
    }


    async getSupplierProduct() {
        const supplierProduct = await this.prisma.externalSupplierProduct.findMany()

        return new ApiResponseDto("success", supplierProduct, '0000')
    }

    async createSupplierProductFn(payload: CreateSupplierProduct[]) {
        const mapProduct = await productToDbMapper(payload);

        const results = await Promise.all(
            mapProduct.map(async (product) => {
                try {
                    const result = await this.prisma.externalSupplierProduct.upsert({
                        where: { code: product.code },
                        update: { ...product },
                        create: { ...product },
                    });

                    console.log(`Upserted product with code: ${product.code}`);
                    return result;
                } catch (error) {
                    console.error(`Failed to upsert product with code: ${product.code}`, error);
                    throw error;
                }
            })
        );

        return new ApiResponseDto("success", results, "0000");
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

        const errors = await this.validateProduct(payload)

        if (errors.length > 0) {
            throw new HttpException(new ApiResponseDto(errorMap[4008], errors, '4008'), HttpStatus.BAD_REQUEST)
        }

        const mappedProducts = extProductToDbOne(payload)

        await this.prisma.externalProduct.update({
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

    async validateProduct(payload: CreateExtProduct) {
        const errors: string[] = []

        let sPrice = 0

        if (payload.products) {
            for (const x of payload.products) {
                const product = await this.prisma.externalSupplierProduct.findUnique({
                    where: {
                        id: x.product_id
                    }
                })

                if (!product) {
                    errors.push(`${errorMap[2000]} ${x.product_id}`)
                    continue
                }

                sPrice = sPrice + (product.price * x.qty)
            }
        }

        if (payload.price <= sPrice) {
            errors.push(`${errorMap[2001]} ${payload.item_id}`)

        }

        if (payload.admin_price < payload.price) {
            errors.push(`${errorMap[2003]} ${payload.item_id}`)
        }

        return errors
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

    async findProducts(page: number, take: number, filter: any, role: Roles) {
        const where: any = {};
        let include: any = {};

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
            if (role == "Admin") {
                where.admin_price = filter.price;
            } else {
                where.price = filter.price;
            }
        }

        if (role == "SuperAdmin") {
            include = {
                products: {
                    include: {
                        product: true,
                    },
                },
            }
        }

        const data = await this.prisma.externalProduct.findMany({
            ...(page > 0 && {
                skip: (page - 1) * take,
                take,
            }),
            where,
            include
        });

        const totalData = await this.prisma.externalProduct.count({
            where
        });

        if (role == "Admin") {
            data.forEach((x) => {
                x.price = x.admin_price || 0
                delete (x as any).admin_price;
            })
        }

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
                continue;
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

        if (product && price < product.data.admin_price) {
            errors.push(`${errorMap[2002]} ${item_id}`)
        }

        return errors
    }

    async productPriceValidation(pPrice: number, sPrice: number, qty: number) {
        return pPrice > (sPrice * qty)
    }

    private async updateProductDigiflazz(productData: ProductPrice[]) {
        productData.forEach(async (p) => {
            await this.prisma.externalSupplierProduct.upsert({
                create: {
                    brand: p.brand,
                    code: p.buyer_sku_code,
                    category: p.category,
                    price: p.price,
                    name: p.product_name,
                    type: "DIGIFLAZZ",
                    status: true,
                    unlimited_stock: true,
                    stock: 100,
                    multi: true,
                    start_cut_off: '00:00',
                    end_cut_off: '00:00',
                    desc: "",
                    actualPrice: null,
                },
                update: {
                    brand: p.brand,
                    code: p.buyer_sku_code,
                    category: p.category,
                    price: p.price,
                    name: p.product_name
                },
                where: {
                    code: p.buyer_sku_code
                }
            })
        })
    }

    async getDigiflazzPrice() {
        const sign = generateSignature(process.env.DIGI_USERNAME ?? '', process.env.DIGI_API_KEY ?? '', 'pricelist');

        const requestBody = {
            cmd: 'prepaid',
            username: process.env.DIGI_USERNAME ?? '',
            sign: sign,
            category: 'GAMES',
            brand: 'MOBILE LEGEND',
        };

        try {
            const response = await httpAgentPost(
                requestBody,
                'https://api.digiflazz.com/v1/price-list',
            );

            // update product list 
            await this.updateProductDigiflazz(response.data.data)

            return response.data.data

        } catch (e: any) {
            console.log(`error getting digiflazz price: ${e.message}`)
        }
    }
}

async function httpAgentPost(requestBody: any, url: string) {
    const agent = new HttpsProxyAgent(process.env.DIGI_PROXY_URL ?? '');

    const response = await axios.post(url, requestBody, {
        httpsAgent: agent,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response;
}