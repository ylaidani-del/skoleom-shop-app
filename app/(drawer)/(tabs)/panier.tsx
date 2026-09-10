import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import {
  useApplyCoupon,
  useCart,
  useRemoveCartItem,
  useRemoveCoupon,
  useUpdateCartItem,
  type CartItem,
} from '@/api/cart';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { formatPrice } from '@/utils/currency';

const toAmount = (value: number | string | undefined) => Number(value ?? 0) || 0;

function CartLineRow({ item }: { item: CartItem }) {
  const { t } = useTranslation();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const isUpdating = updateItem.isPending && updateItem.variables?.itemKey === item.item_key;
  const isRemoving = removeItem.isPending && removeItem.variables?.itemKey === item.item_key;
  const isBusy = isUpdating || isRemoving;

  const setQty = (quantity: number) => {
    if (quantity <= 0) {
      removeItem.mutate({ itemKey: item.item_key });
    } else {
      updateItem.mutate({ itemKey: item.item_key, quantity });
    }
  };

  return (
    <View className="flex-row gap-3 rounded-2xl border border-app-border bg-app-surface p-2.5">
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          className="h-[92px] w-[76px] rounded-[10px] bg-app-fill"
          resizeMode="cover"
        />
      ) : (
        <View className="h-[92px] w-[76px] items-center justify-center rounded-[10px] bg-app-fill">
          <Ionicons name="image-outline" size={20} color={palette.fg3} />
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text numberOfLines={1} className="text-[13px] font-semibold text-app-fg">
          {item.name}
        </Text>
        <Text className="text-[11px] text-app-fg-3">
          {t('panier.unitPrice', { price: formatPrice(toAmount(item.price)) })}
        </Text>

        <View className="mt-auto flex-row items-center justify-between gap-2.5">
          <View className="flex-row items-center gap-0.5 rounded-full bg-app-fill p-0.5">
            <Pressable
              onPress={() => setQty(item.quantity - 1)}
              disabled={isBusy}
              hitSlop={6}
              className="h-[26px] w-[26px] items-center justify-center rounded-full bg-app-surface disabled:opacity-40">
              <Ionicons
                name={item.quantity <= 1 ? 'trash-outline' : 'remove'}
                size={13}
                color={palette.fg}
              />
            </Pressable>
            {isBusy ? (
              <ActivityIndicator size="small" color={palette.fg} className="min-w-[24px]" />
            ) : (
              <Text className="min-w-[24px] text-center text-[12.5px] font-semibold text-app-fg">
                {item.quantity}
              </Text>
            )}
            <Pressable
              onPress={() => setQty(item.quantity + 1)}
              disabled={isBusy}
              hitSlop={6}
              className="h-[26px] w-[26px] items-center justify-center rounded-full bg-app-surface disabled:opacity-40">
              <Ionicons name="add" size={13} color={palette.fg} />
            </Pressable>
          </View>
          <Text className="text-[14px] font-bold text-app-fg">
            {formatPrice(toAmount(item.line_total) || toAmount(item.price) * item.quantity)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PanierTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const { data: cart, isLoading } = useCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

  const [promoInput, setPromoInput] = useState('');

  const items = cart?.items ?? [];
  const coupons = cart?.coupons ?? [];
  const totals = cart?.totals;

  const applyPromo = () => {
    const coupon = promoInput.trim();
    if (!coupon) return;
    applyCoupon.mutate(
      { coupon },
      {
        onSuccess: () => setPromoInput(''),
      }
    );
  };

  if (isLoading) {
    return (
      <Container>
        <ScreenHeader title={t('panier.title')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.fg} />
        </View>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container>
        <ScreenHeader title={t('panier.title')} />
        <View className="flex-1 items-center justify-center gap-3.5 px-6">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-app-fill">
            <Ionicons name="bag-outline" size={26} color={palette.fg3} />
          </View>
          <Text className="text-[16px] font-semibold text-app-fg">{t('panier.emptyTitle')}</Text>
          <Text className="max-w-[240px] text-center text-[12.5px] leading-[1.5] text-app-fg-2">
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

  return (
    <Container>
      <ScreenHeader title={t('panier.title')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 px-4 pb-10 pt-2">
        <View className="gap-2.5">
          {items.map((item) => (
            <CartLineRow key={item.item_key} item={item} />
          ))}
        </View>

        <View className="gap-2">
          <View className="flex-row gap-2">
            <View className="h-11 flex-1 justify-center rounded-xl border border-app-border bg-app-surface px-3.5">
              <TextInput
                value={promoInput}
                onChangeText={setPromoInput}
                placeholder={t('panier.promoPlaceholder')}
                placeholderTextColor={palette.fg3}
                autoCapitalize="characters"
                className="text-[12.5px] text-app-fg"
              />
            </View>
            <Pressable
              onPress={applyPromo}
              disabled={applyCoupon.isPending || !promoInput.trim()}
              className="items-center justify-center rounded-xl bg-app-inv px-[18px] disabled:opacity-40">
              <Text className="text-[13px] font-semibold text-app-inv-fg">
                {applyCoupon.isPending ? t('panier.applying') : t('panier.apply')}
              </Text>
            </Pressable>
          </View>
          {applyCoupon.isError && (
            <Text className="text-[11.5px] text-red-500">{t('panier.promoInvalid')}</Text>
          )}
          {coupons.map((coupon) => (
            <View
              key={coupon}
              className="flex-row items-center justify-between rounded-xl bg-brand-green/10 px-3.5 py-2">
              <Text className="text-[12px] font-semibold text-brand-green-deep">{coupon}</Text>
              <Pressable
                onPress={() => removeCoupon.mutate({ coupon })}
                disabled={removeCoupon.isPending}
                hitSlop={8}>
                <Ionicons name="close" size={14} color={palette.fg2} />
              </Pressable>
            </View>
          ))}
        </View>

        <View className="gap-2.5 rounded-2xl border border-app-border bg-app-surface-2 p-4">
          <View className="flex-row justify-between">
            <Text className="text-[12.5px] text-app-fg-2">{t('panier.subtotal')}</Text>
            <Text className="text-[12.5px] font-medium text-app-fg">
              {formatPrice(toAmount(totals?.subtotal))}
            </Text>
          </View>
          {toAmount(totals?.discount_total) > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-[12.5px] text-brand-green-deep">{t('panier.promoLabel')}</Text>
              <Text className="text-[12.5px] font-semibold text-brand-green-deep">
                -{formatPrice(toAmount(totals?.discount_total))}
              </Text>
            </View>
          )}
          {toAmount(totals?.total_tax) > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-[12.5px] text-app-fg-2">{t('panier.vat')}</Text>
              <Text className="text-[12.5px] font-medium text-app-fg">
                {formatPrice(toAmount(totals?.total_tax))}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-[12.5px] text-app-fg-2">{t('panier.shipping')}</Text>
            <Text className="text-[12.5px] font-semibold text-app-fg">
              {toAmount(totals?.shipping_total) > 0
                ? formatPrice(toAmount(totals?.shipping_total))
                : t('panier.shippingAtNextStep')}
            </Text>
          </View>
          <View className="h-px bg-app-border" />
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-semibold text-app-fg">{t('panier.total')}</Text>
            <Text className="text-[20px] font-bold tracking-tight text-app-fg">
              {formatPrice(toAmount(totals?.total))}
            </Text>
          </View>
        </View>

        <GradientButton
          label={t('panier.checkout')}
          onPress={() => router.push('/checkout/shipping')}
        />
      </ScrollView>
    </Container>
  );
}
