import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import { type WooProduct } from '@/api/product';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { formatPrice } from '@/utils/currency';

interface ProductCardProps {
  product: WooProduct;
  onPress?: (product: WooProduct) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const addToCart = useCartStore((state) => state.addItem);

  const cover = product.photos[0];
  const badgeLabel = product.onSale ? 'Promo' : (product.type ?? '');

  return (
    <Pressable
      onPress={() => onPress?.(product)}
      className="flex-1 gap-2 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={product.name}>
      <View className="aspect-[100/112] overflow-hidden rounded-xl bg-neutral-100">
        {cover ? (
          <Image source={{ uri: cover }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="image-outline" size={22} color="#9ca3af" />
          </View>
        )}

        <Pressable
          onPress={() => toggleFavorite(product.id)}
          hitSlop={8}
          className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-white/90"
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? t('catalogue.removeFromFavorites') : t('catalogue.addToFavorites')
          }>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={15}
            color={isFavorite ? '#e11d48' : '#1a1a1a'}
          />
        </Pressable>

        {!!badgeLabel && (
          <View className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1">
            <Text className="text-[9.5px] font-semibold text-white">{badgeLabel}</Text>
          </View>
        )}

        {!product.inStock && (
          <View className="absolute inset-0 items-center justify-center bg-black/45">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">
              {t('catalogue.outOfStock')}
            </Text>
          </View>
        )}
      </View>

      <View className="gap-0.5 px-0.5">
        {!!product.brand && (
          <Text className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            {product.brand}
          </Text>
        )}
        <Text
          numberOfLines={1}
          className="text-[12.5px] font-semibold leading-tight text-neutral-900">
          {product.name}
        </Text>
        <View className="flex-row items-center justify-between gap-1.5 pt-0.5">
          <View className="flex-shrink flex-row items-baseline gap-1.5">
            <Text className="text-[13.5px] font-bold text-neutral-900">
              {formatPrice(product.onSale ? product.salePrice : product.price)}
            </Text>
            {product.onSale && (
              <Text className="text-[11px] text-neutral-400 line-through">
                {formatPrice(product.regularPrice)}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => addToCart(product.id)}
            disabled={!product.inStock}
            hitSlop={8}
            className="h-[26px] w-[26px] items-center justify-center rounded-full bg-neutral-900 disabled:opacity-30"
            accessibilityRole="button"
            accessibilityLabel={t('catalogue.addToCart')}>
            <Ionicons name="add" size={15} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
