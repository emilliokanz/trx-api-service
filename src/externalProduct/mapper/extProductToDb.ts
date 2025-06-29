export async function extProductToDb(productList: any[]) {
  const mappedProducts: any[] = []

  productList.forEach((product: any) => {
    mappedProducts.push({
      item_id: product.item_id,
      game_name: product.game_name,
      item_name: product.item_name,
      server_name: product.server_name,
      group_name: product.group_name,
      stock: product.stock,
      min_order: product.min_order,
      price: product.price,
      admin_price: product.admin_price
    })
  })

  return mappedProducts
}

export function extProductToDbOne(product: any){
  return {
    item_id: product.item_id,
    game_name: product.game_name,
    item_name: product.item_name,
    server_name: product.server_name,
    group_name: product.group_name,
    stock: product.stock,
    min_order: product.min_order,
    price: product.price,
    admin_price: product.admin_price
  }
}