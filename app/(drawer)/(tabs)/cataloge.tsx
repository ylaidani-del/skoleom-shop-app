import { View, Text } from 'react-native'
import React from 'react'
import Filter from '../../../components/shop/Filter'
import ProductGrid from '../../../components/shop/ProductGrid'
import {
  useProducts,
  flattenProducts,
  applyClientFilters,
  deriveFacets,
  useCategories,
  useBrands,
} from '../../../api/product';
import { useFilterStore, type SortOption } from '../../../store/filterStore';


const CatalogueTab = () => {

  
  const selectedCategory = useFilterStore((s) => s.selectedCategory);
  const brands = useFilterStore((s) => s.brands);
  const search = useFilterStore((s) => s.search);
  const sort = useFilterStore((s) => s.sort);
  const maxPrice = useFilterStore((s) => s.maxPrice);
  const inStockOnly = useFilterStore((s) => s.inStockOnly);
  const onSaleOnly = useFilterStore((s) => s.onSaleOnly);
  const priceTouched = useFilterStore((s) => s.priceTouched);
  const setCategory = useFilterStore((s) => s.setCategory);
  const setSearch = useFilterStore((s) => s.setSearch);
  const setSort = useFilterStore((s) => s.setSort);
  const toggleBrand = useFilterStore((s) => s.toggleBrand);
  const toggleInStock = useFilterStore((s) => s.toggleInStock);
  const toggleOnSale = useFilterStore((s) => s.toggleOnSale);
  const patch = useFilterStore((s) => s.patch);
  const reset = useFilterStore((s) => s.reset);
  // const { data: categories } = useCategories();
  // const { data: brands } = useBrands();

  // console.log('categories', categories)
  const query = useProducts({
    search,
    category: selectedCategory || 'all',
    brand: brands[0] || 'all',
  });


  console.log('query', query)
  return (

    <View>
<Filter />

      <ProductGrid />
    </View>
  )
}

export default CatalogueTab