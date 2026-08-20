import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useProductsByIds, type WooProduct } from '@/api/product';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/currency';

const VAT_RATE = 0.2;
const PROMO_CODE = 'SKOLEOM10';
const PROMO_RATE = 0.1;

const unitPrice = (product: WooProduct) => (product.onSale ? product.salePrice : product.price);

export default function PanierTab() {
  const { t } = useTranslation();
  const router = useRouter();

  const lines = useCartStore((state) => state.lines);
  const setQty = useCartStore((state) => state.setQty);

  const { products, isLoading } = useProductsByIds(lines.map((line) => line.productId));

  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const rows = useMemo(
    () =>
      lines
        .map((line) => {
          const product = products.find((p) => p.id === line.productId);
          if (!product) return null;
          return { line, product, total: unitPrice(product) * line.qty };
        })
        .filter(
          (row): row is { line: (typeof lines)[number]; product: WooProduct; total: number } =>
            !!row
        ),
    [lines, products]
  );

  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const discount = promoApplied ? subtotal * PROMO_RATE : 0;
  const vat = (subtotal - discount) * VAT_RATE;
  const total = subtotal - discount + vat;

  const applyPromo = () => setPromoApplied(promoInput.trim().toUpperCase() === PROMO_CODE);

  if (lines.length === 0) {
    return (
      <Container>
        <ScreenHeader title={t('panier.title')} />
        <View className="flex-1 items-center justify-center gap-3.5 px-6">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-neutral-100">
            <Ionicons name="bag-outline" size={26} color="#9ca3af" />
          </View>
          <Text className="text-[16px] font-semibold text-neutral-900">
            {t('panier.emptyTitle')}
          </Text>
          <Text className="max-w-[240px] text-center text-[12.5px] leading-[1.5] text-neutral-500">
            {t('panier.emptyBody')}
          </Text>
          <GradientButton
            label={t('panier.exploreShop')}
            onPress={() => router.push('/(drawer)/(tabs)/cataloge')}
          />
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <ScreenHeader title={t('panier.title')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1a1a1a" />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ScreenHeader title={t('panier.title')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 px-4 pb-10 pt-2">
        <View className="gap-2.5">
          {rows.map(({ line, product, total: lineTotal }) => (
            <View
              key={line.productId}
              className="flex-row gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5">
              <Image
                source={{ uri: product.photos[0] }}
                className="h-[92px] w-[76px] rounded-[10px] bg-neutral-100"
                resizeMode="cover"
              />
              <View className="flex-1 gap-1">
                {!!product.brand && (
                  <Text className="text-[9.5px] font-semibold uppercase tracking-wide text-neutral-400">
                    {product.brand}
                  </Text>
                )}
                <Text numberOfLines={1} className="text-[13px] font-semibold text-neutral-900">
                  {product.name}
                </Text>
                <Text className="text-[11px] text-neutral-400">
                  {t('panier.unitPrice', { price: formatPrice(unitPrice(product)) })}
                </Text>

                <View className="mt-auto flex-row items-center justify-between gap-2.5">
                  <View className="flex-row items-center gap-0.5 rounded-full bg-neutral-100 p-0.5">
                    <Pressable
                      onPress={() => setQty(line.productId, line.qty - 1)}
                      hitSlop={6}
                      className="h-[26px] w-[26px] items-center justify-center rounded-full bg-white">
                      <Ionicons name="remove" size={13} color="#1a1a1a" />
                    </Pressable>
                    <Text className="min-w-[24px] text-center text-[12.5px] font-semibold text-neutral-900">
                      {line.qty}
                    </Text>
                    <Pressable
                      onPress={() => setQty(line.productId, line.qty + 1)}
                      hitSlop={6}
                      className="h-[26px] w-[26px] items-center justify-center rounded-full bg-white">
                      <Ionicons name="add" size={13} color="#1a1a1a" />
                    </Pressable>
                  </View>
                  <Text className="text-[14px] font-bold text-neutral-900">
                    {formatPrice(lineTotal)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row gap-2">
          <View className="h-11 flex-1 justify-center rounded-xl border border-neutral-200 bg-white px-3.5">
            <TextInput
              value={promoInput}
              onChangeText={setPromoInput}
              placeholder={t('panier.promoPlaceholder')}
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              className="text-[12.5px] text-neutral-900"
            />
          </View>
          <Pressable
            onPress={applyPromo}
            className="items-center justify-center rounded-xl bg-brand-black px-[18px]">
            <Text className="text-[13px] font-semibold text-white">{t('panier.apply')}</Text>
          </Pressable>
        </View>

        <View className="gap-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <View className="flex-row justify-between">
            <Text className="text-[12.5px] text-neutral-500">{t('panier.subtotal')}</Text>
            <Text className="text-[12.5px] font-medium text-neutral-900">
              {formatPrice(subtotal)}
            </Text>
          </View>
          {promoApplied && (
            <View className="flex-row justify-between">
              <Text className="text-[12.5px] text-brand-green-deep">{t('panier.promoLabel')}</Text>
              <Text className="text-[12.5px] font-semibold text-brand-green-deep">
                -{formatPrice(discount)}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-[12.5px] text-neutral-500">{t('panier.vat')}</Text>
            <Text className="text-[12.5px] font-medium text-neutral-900">{formatPrice(vat)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[12.5px] text-neutral-500">{t('panier.shipping')}</Text>
            <Text className="text-[12.5px] font-semibold text-brand-green-deep">
              {t('panier.free')}
            </Text>
          </View>
          <View className="h-px bg-neutral-200" />
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-semibold text-neutral-900">{t('panier.total')}</Text>
            <Text className="text-[20px] font-bold tracking-tight text-neutral-900">
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <GradientButton label={t('panier.checkout')} />
      </ScrollView>
    </Container>
  );
}
