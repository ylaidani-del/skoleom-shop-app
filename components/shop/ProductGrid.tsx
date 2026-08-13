import { View, Text } from 'react-native'
import React from 'react'

import {type product} from '../../types/product'

interface ProductGridProps {
  products: product[];
  onProductPress: (product: product) => void;
}
const ProductGrid = (

  {products, onProductPress}: {products: product[], onProductPress: (product: product) => void}
) => {



  console.log('products', products)


  return (
    <View>
      {/* {products.map((product) => (
    <ProductCard key={product.name} product={product} onPress={() => onProductPress(product)} />
      ))} */}

      <Text>ProductGrid</Text>
    </View>
  )
}

export default ProductGrid