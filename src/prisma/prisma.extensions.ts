import { Prisma } from "@prisma/client";

export function createUserTrackingExtension(getCurrentUserId: () => any){
    const excludeModel = ['TransactionHistory', 'User']
    

    return Prisma.defineExtension({
        name: 'userTracking',
        query: {
            $allModels: {
                async create({args, query, model}){
                    const userId = getCurrentUserId();
                    if(userId && !excludeModel.includes(model)) {
                        const modelHasCreatedBy = Prisma.dmmf.datamodel.models
                        .find(m => m.name === model)?.fields
                        .some(field => field.name === 'createdBy')

                        if(modelHasCreatedBy){
                            args.data = {
                                ...args.data,
                                createdBy: userId
                            }
                        }

                    }

                    return query(args)

                }
            }
        }
    })
}