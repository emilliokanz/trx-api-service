export interface CreateExtProduct {
    item_id: string,
    game_name: string,
    item_name: string,
    server_name: string,
    group_name: string,
    stock: number,
    min_order: number,
    price: number,
    products: ExtProductJunction[]
}

 interface ExtProductJunction {
    item_id?: string
    product_id: number,
    qty: number
}