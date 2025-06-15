export async function productToDbMapper(products: any[]){
  const mappedProducts: any[] = []

  products.forEach((product: any) => {
    mappedProducts.push({
      name: product.name,
      category: product.category,
      brand: product.brand,
      type: product.type,
      price: product.price,
      code: product.code,
      status: product.status,
      unlimited_stock: product.unlimited_stock,
      stock: product.stock,
      multi: product.multi,
      start_cut_off: product.start_cut_off || '00:00',
      end_cut_off: product.end_cut_off || '00:00',
      desc: product.desc,
      actualPrice: null
    })
  })

  return mappedProducts
  }