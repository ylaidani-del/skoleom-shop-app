import { useTranslation } from 'react-i18next';

import { applyClientFilters, flattenProducts, useProducts } from '@/api/product';
import { Container } from '@/components/Container';
import { Filter } from '@/components/shop/Filter';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { useFilterStore } from '@/store/filterStore';

export default function CatalogueTab() {
  const { t } = useTranslation();

  const search = useFilterStore((state) => state.search);
  const brands = useFilterStore((state) => state.brands);
  const sort = useFilterStore((state) => state.sort);
  const inStockOnly = useFilterStore((state) => state.inStockOnly);
  const onSaleOnly = useFilterStore((state) => state.onSaleOnly);
  const category = useFilterStore((state) => state.getCategory());

  const query = useProducts({ search, category, brand: brands[0] || 'all' });

  const products = applyClientFilters(flattenProducts(query.data), {
    sort,
    inStockOnly,
    onSaleOnly,
  });

  return (
    <Container>
      <ScreenHeader title={t('catalogue.title')} />

      <Filter />

      <ProductGrid
        products={products}
        isLoading={query.isPending}
        isError={query.isError}
        isRefetching={query.isRefetching}
        isFetchingNextPage={query.isFetchingNextPage}
        onRefresh={() => query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
      />
    </Container>
  );
}
