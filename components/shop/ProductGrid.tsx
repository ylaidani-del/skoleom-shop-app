import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { type WooProduct } from '@/api/product';

import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: WooProduct[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onSelectProduct?: (product: WooProduct) => void;
}

export function ProductGrid({
  products,
  isLoading,
  isError,
  isRefetching,
  isFetchingNextPage,
  onRefresh,
  onEndReached,
  onSelectProduct,
}: ProductGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator color="#1a1a1a" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center gap-3 px-6 py-16">
        <Ionicons name="cloud-offline-outline" size={30} color="#9ca3af" />
        <Text className="text-center text-[13px] text-neutral-500">{t('catalogue.loadError')}</Text>
        <Pressable onPress={onRefresh} className="rounded-full bg-brand-black px-4 py-2">
          <Text className="text-[12.5px] font-semibold text-white">{t('catalogue.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperClassName="gap-3"
      contentContainerClassName="gap-3 px-4 pb-8 pt-1"
      renderItem={({ item }) => <ProductCard product={item} onPress={onSelectProduct} />}
      ListHeaderComponent={
        <Text className="mb-2 text-[11.5px] text-neutral-400">
          {t('catalogue.resultsCount', { count: products.length })}
        </Text>
      }
      ListEmptyComponent={
        <View className="items-center gap-2 px-6 py-16">
          <Ionicons name="search-outline" size={28} color="#9ca3af" />
          <Text className="text-center text-[13px] text-neutral-500">{t('catalogue.empty')}</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator color="#1a1a1a" />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#1a1a1a" />
      }
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      showsVerticalScrollIndicator={false}
    />
  );
}
