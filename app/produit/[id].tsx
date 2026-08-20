import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProduct } from '@/api/product';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useThemeStore } from '@/store/themeStore';
import { formatPrice } from '@/utils/currency';
import { stripHtml } from '@/utils/html';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRUST_TILES = [
  { icon: 'cube-outline' as const, key: 'shippingTitle' },
  { icon: 'refresh-outline' as const, key: 'returnsTitle' },
  { icon: 'shield-checkmark-outline' as const, key: 'shieldTitle' },
];

export default function ProduitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  const insets = useSafeAreaInsets();

  const { data: product, isLoading, isError } = useProduct(id);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const addToCart = useCartStore((state) => state.addItem);

  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <View className="pt-safe flex-1 items-center justify-center bg-app-bg">
        <ActivityIndicator color={palette.fg} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View className="pt-safe flex-1 items-center justify-center gap-3 bg-app-bg px-6">
        <Ionicons name="alert-circle-outline" size={28} color={palette.fg3} />
        <Text className="text-center text-[13px] text-app-fg-2">
          {isError ? t('produit.loadError') : t('produit.notFound')}
        </Text>
        <Pressable onPress={() => router.back()} className="rounded-full bg-app-inv px-4 py-2">
          <Text className="text-[12.5px] font-semibold text-app-inv-fg">
            {t('catalogue.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const description = stripHtml(product.description || product.short_description || '');
  const badgeLabel = product.onSale ? 'Promo' : (product.type ?? '');
  const discountPct = product.onSale
    ? Math.round((1 - product.salePrice / product.regularPrice) * 100)
    : 0;
  const photos = product.photos.length > 0 ? product.photos : [''];

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View className="relative bg-app-surface-2">
          <FlatList
            data={photos}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_WIDTH, aspectRatio: 1 / 1.16 }}
                resizeMode="cover"
              />
            )}
          />

          <Pressable
            onPress={() => router.back()}
            className="absolute left-3.5 h-9 w-9 items-center justify-center rounded-full bg-black/45"
            style={{ top: insets.top + 12 }}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => toggleFavorite(product.id)}
            className="bg-white/92 absolute right-3.5 h-9 w-9 items-center justify-center rounded-full"
            style={{ top: insets.top + 12 }}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#e11d48' : '#1a1a1a'}
            />
          </Pressable>

          {photos.length > 1 && (
            <View className="absolute bottom-3 flex-row justify-center gap-1.5 self-center">
              {photos.map((_, index) => (
                <View
                  key={index}
                  className={`h-1 rounded-full bg-white ${index === activeImage ? 'w-[18px]' : 'w-1 opacity-55'}`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="gap-4 px-4 pt-4">
          <View className="gap-1.5">
            {!!product.brand && (
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-app-fg-3">
                {product.brand}
              </Text>
            )}
            <Text className="text-[21px] font-semibold leading-tight tracking-tight text-app-fg">
              {product.name}
            </Text>

            <View className="flex-row items-baseline gap-2 pt-0.5">
              <Text className="text-[24px] font-bold tracking-tight text-app-fg">
                {formatPrice(product.onSale ? product.salePrice : product.price)}
              </Text>
              {product.onSale && (
                <>
                  <Text className="text-[13px] text-app-fg-3 line-through">
                    {formatPrice(product.regularPrice)}
                  </Text>
                  <View className="rounded-full bg-brand-green/15 px-2 py-0.5">
                    <Text className="text-[11px] font-bold text-brand-green-deep">
                      -{discountPct}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View className="flex-row flex-wrap items-center gap-1.5 pt-0.5">
              {!!badgeLabel && (
                <View className="rounded-full bg-app-fill px-2.5 py-1">
                  <Text className="text-[10.5px] font-semibold text-app-fg-2">{badgeLabel}</Text>
                </View>
              )}
              {!product.inStock && (
                <View className="rounded-full bg-red-500/15 px-2.5 py-1">
                  <Text className="text-[10.5px] font-semibold text-red-500">
                    {t('catalogue.outOfStock')}
                  </Text>
                </View>
              )}
            </View>

            {!!description && (
              <Text className="pt-1 text-[13px] leading-[1.55] text-app-fg-2">{description}</Text>
            )}

            {!!product.sku && (
              <Text className="pt-0.5 text-[11px] text-app-fg-3">
                {t('produit.sku')} · {product.sku}
              </Text>
            )}
          </View>

          <View className="gap-2.5">
            <GradientButton
              icon="sparkles-outline"
              label={t('produit.tryOn')}
              onPress={() =>
                router.push({
                  pathname: '/(drawer)/(tabs)/essayage',
                  params: { productId: product.id },
                })
              }
            />
            <Pressable
              onPress={() => addToCart(product.id)}
              disabled={!product.inStock}
              className="items-center rounded-xl border-[1.5px] border-app-border-2 bg-app-surface py-3.5 disabled:opacity-40">
              <Text className="text-[14px] font-semibold text-app-fg">
                {t('produit.addToCart')}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            {TRUST_TILES.map((tile) => (
              <View
                key={tile.key}
                className="flex-1 items-center gap-1.5 rounded-xl border border-app-border bg-app-surface py-3.5">
                <Ionicons name={tile.icon} size={20} color={palette.fg2} />
                <Text className="text-center text-[10px] font-medium text-app-fg-2">
                  {t(`produit.${tile.key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
