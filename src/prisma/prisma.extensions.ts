import { Prisma, Roles } from "@prisma/client";

export function createUserTrackingExtension(getCurrentUser: () => { id: any, role: any }) {
    const excludeModelCreate = ['TransactionHistory', 'User']
    const excludeModelFindMany = ['User', "ProductPrice", "ExternalUser", "ExternalProduct", "BankAccount"]


    return Prisma.defineExtension({
        name: 'userTracking',
        query: {
            $allModels: {
                async create({ args, query, model }) {
                    const { id } = getCurrentUser();
                    if (id && !excludeModelCreate.includes(model)) {
                        const modelHasCreatedBy = Prisma.dmmf.datamodel.models
                            .find(m => m.name === model)?.fields
                            .some(field => field.name === 'createdBy')

                        if (modelHasCreatedBy) {
                            args.data = {
                                ...args.data,
                                createdBy: id
                            }
                        }

                    }

                    return query(args)
                },
                

                async findMany({ args, query, model }) {
                    const { id, role } = getCurrentUser();
                    if (id && role == Roles.Admin && !excludeModelFindMany.includes(model)) {
                        args.where = { ...args.where, createdBy: id }
                    }
                    else if (id && role == Roles.SuperAdmin && !excludeModelFindMany.includes(model)) {
                        args.where = { ...args.where }
                    }
                    return query(args)
                },

                async count({ args, query, model }) {
                    const { id, role } = getCurrentUser();
                    if (id && role == Roles.Admin && !excludeModelFindMany.includes(model)) {
                        args.where = { ...args.where, createdBy: id }
                    }
                    return query(args)
                }
            }
        }
    })
}