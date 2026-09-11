import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddCartItem } from '@/api/cart';
import {
  isExternalProduct,
  isTestableProduct,
  isVariableProduct,
  useProduct,
  useProductVariations,
} from '@/api/product';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useThemeStore } from '@/store/themeStore';
import { formatPrice } from '@/utils/currency';
import { stripHtml } from '@/utils/html';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = SCREEN_WIDTH * 1.16;

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
  const addToCart = useAddCartItem();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const variable = !!product && isVariableProduct(product);
  const external = !!product && isExternalProduct(product);

  const variationsQuery = useProductVariations(product?.id ?? '', { enabled: variable });
  const variations = useMemo(() => variationsQuery.data ?? [], [variationsQuery.data]);

  // Keyed by attribute `name`, not `slug`: the product endpoint and the
  // variations endpoint report different (inconsistently-slugified) slugs for
  // the same attribute, but both agree on `name` — verified against the live
  // API, where a product's attribute slug came back equal to its name while
  // the matching variation's slug was properly kebab-cased.
  const attributeKey = (attr: { name: string }) => attr.name;

  const selectedVariation = useMemo(() => {
    if (!variable || !product?.variationAttributes) return undefined;
    const attrs = product.variationAttributes;
    if (attrs.some((a) => !selectedOptions[attributeKey(a)])) return undefined;
    return variations.find((v) =>
      v.attributes.every((a) => selectedOptions[attributeKey(a)] === a.option)
    );
  }, [variable, product?.variationAttributes, selectedOptions, variations]);

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
  const photos = product.photos.length > 0 ? product.photos : [''];

  const displayOnSale = selectedVariation ? selectedVariation.onSale : product.onSale;
  const displayPrice = selectedVariation
    ? selectedVariation.onSale
      ? selectedVariation.salePrice
      : selectedVariation.price
    : product.onSale
      ? product.salePrice
      : product.price;
  const displayRegularPrice = selectedVariation ? selectedVariation.regularPrice : product.regularPrice;
  const discountPct = displayOnSale ? Math.round((1 - displayPrice / displayRegularPrice) * 100) : 0;

  // Before a variation is picked we don't know stock yet, so don't flash a false "out of stock".
  const effectiveInStock = variable ? (selectedVariation ? selectedVariation.inStock : true) : product.inStock;
  const canAddToCart = !external && (!variable || !!selectedVariation) && effectiveInStock;

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View className="relative bg-app-surface-2" style={{ height: GALLERY_HEIGHT }}>
          <FlatList
            data={photos}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ height: GALLERY_HEIGHT }}
            onMomentumScrollEnd={(e) =>
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_WIDTH, height: GALLERY_HEIGHT }}
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
              {variable && !selectedVariation && (
                <Text className="text-[12px] font-medium text-app-fg-3">{t('produit.from')}</Text>
              )}
              <Text className="text-[24px] font-bold tracking-tight text-app-fg">
                {formatPrice(displayPrice)}
              </Text>
              {displayOnSale && (
                <>
                  <Text className="text-[13px] text-app-fg-3 line-through">
                    {formatPrice(displayRegularPrice)}
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
              {(!variable || !!selectedVariation) && !effectiveInStock && (
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
          </View>

          <View className="gap-2.5">
            {isTestableProduct(product) && (
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
            )}

            {external ? (
              <Pressable
                onPress={() => product.external_url && Linking.openURL(product.external_url)}
                disabled={!product.external_url}
                className="items-center rounded-xl border-[1.5px] border-app-border-2 bg-app-surface py-3.5 disabled:opacity-40">
                <Text className="text-[14px] font-semibold text-app-fg">
                  {product.buttonText || t('produit.buyExternally')}
                </Text>
              </Pressable>
            ) : (
              <>
                {variable &&
                  product.variationAttributes?.map((attr) => {
                    const key = attributeKey(attr);
                    return (
                      <View key={key} className="gap-1.5">
                        <Text className="text-[12px] font-medium text-app-fg-2">
                          {stripHtml(attr.name)}
                        </Text>
                        <View className="flex-row flex-wrap gap-1.5">
                          {attr.options.map((option) => {
                            const active = selectedOptions[key] === option;
                            return (
                              <Pressable
                                key={option}
                                onPress={() =>
                                  setSelectedOptions((prev) => ({ ...prev, [key]: option }))
                                }
                                className={`rounded-full border px-3 py-1.5 ${
                                  active
                                    ? 'border-app-inv bg-app-inv'
                                    : 'border-app-border bg-app-surface'
                                }`}>
                                <Text
                                  className={`text-[12px] font-semibold ${
                                    active ? 'text-app-inv-fg' : 'text-app-fg'
                                  }`}>
                                  {option}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}

                {variable && variationsQuery.isLoading && (
                  <ActivityIndicator color={palette.fg} />
                )}

                <View className="flex-row items-center justify-between rounded-xl border border-app-border bg-app-surface px-3.5 py-2">
                  <Text className="text-[12.5px] font-medium text-app-fg-2">
                    {t('produit.quantity')}
                  </Text>
                  <View className="flex-row items-center gap-0.5 rounded-full bg-app-fill p-0.5">
                    <Pressable
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      hitSlop={6}
                      className="h-[28px] w-[28px] items-center justify-center rounded-full bg-app-surface disabled:opacity-40">
                      <Ionicons name="remove" size={14} color={palette.fg} />
                    </Pressable>
                    <Text className="min-w-[28px] text-center text-[13px] font-semibold text-app-fg">
                      {quantity}
                    </Text>
                    <Pressable
                      onPress={() => setQuantity((q) => q + 1)}
                      hitSlop={6}
                      className="h-[28px] w-[28px] items-center justify-center rounded-full bg-app-surface">
                      <Ionicons name="add" size={14} color={palette.fg} />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    addToCart.mutate(
                      {
                        productId: selectedVariation ? selectedVariation.id : product.id,
                        quantity,
                      },
                      {
                        onSuccess: () => {
                          router.push('/(drawer)/(tabs)/panier');
                        },
                      }
                    )
                  }
                  disabled={!canAddToCart || addToCart.isPending}
                  className="items-center rounded-xl border-[1.5px] border-app-border-2 bg-app-surface py-3.5 disabled:opacity-40">
                  <Text className="text-[14px] font-semibold text-app-fg">
                    {addToCart.isPending
                      ? t('produit.addingToCart')
                      : addToCart.isSuccess
                        ? t('produit.addedToCart')
                        : variable && !selectedVariation
                          ? t('produit.selectOptions')
                          : t('produit.addToCart')}
                  </Text>
                </Pressable>
                {addToCart.isError && (
                  <Text className="text-center text-[11.5px] text-red-500">
                    {t('produit.addToCartError')}
                  </Text>
                )}
              </>
            )}
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
