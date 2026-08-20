import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { type WooProduct } from '@/api/product';
import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

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
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  if (isLoading) {
    return (
      <View className="items-center justify-center py-16">
        <ActivityIndicator color={palette.fg} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center gap-3 px-6 py-16">
        <Ionicons name="cloud-offline-outline" size={30} color={palette.fg3} />
        <Text className="text-center text-[13px] text-app-fg-2">{t('catalogue.loadError')}</Text>
        <Pressable onPress={onRefresh} className="rounded-full bg-app-inv px-4 py-2">
          <Text className="text-[12.5px] font-semibold text-app-inv-fg">
            {t('catalogue.retry')}
          </Text>
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
        <Text className="mb-2 text-[11.5px] text-app-fg-3">
          {t('catalogue.resultsCount', { count: products.length })}
        </Text>
      }
      ListEmptyComponent={
        <View className="items-center gap-2 px-6 py-16">
          <Ionicons name="search-outline" size={28} color={palette.fg3} />
          <Text className="text-center text-[13px] text-app-fg-2">{t('catalogue.empty')}</Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator color={palette.fg} />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={palette.fg} />
      }
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      showsVerticalScrollIndicator={false}
    />
  );
}
