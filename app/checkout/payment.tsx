import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cartKeys, useCart } from '@/api/cart';
import {
  getPaymentPopupUrl,
  paymentIntentIdFromClientSecret,
  useConfirmPayment,
  useCreatePaymentIntent,
} from '@/api/payment';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { useCartKeyStore } from '@/store/cartKeyStore';
import { useThemeStore } from '@/store/themeStore';
import { formatPrice } from '@/utils/currency';

type Phase = 'idle' | 'opening' | 'confirming' | 'success' | 'failed';

export default function PaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  const queryClient = useQueryClient();

  const cartKey = useCartKeyStore((state) => state.cartKey);
  const { data: cart, isLoading } = useCart();
  const createPaymentIntent = useCreatePaymentIntent();
  const confirmPayment = useConfirmPayment();
  const [phase, setPhase] = useState<Phase>('idle');

  const totals = cart?.totals;
  const isBusy = phase === 'opening' || phase === 'confirming';

  // The card is collected by Stripe's own hosted popup page (no native Stripe
  // SDK in this app), opened in an in-app browser. Once it closes — whether
  // the user paid or gave up — the backend is the source of truth for what
  // actually happened, via /payment/confirm's live Stripe status check.
  const handlePay = () => {
    if (!cartKey) return;
    setPhase('opening');
    createPaymentIntent.mutate(
      { cartKey },
      {
        onSuccess: async (intent) => {
          await WebBrowser.openBrowserAsync(getPaymentPopupUrl(intent.clientSecret, intent.amount));
          setPhase('confirming');
          confirmPayment.mutate(
            { paymentIntentId: paymentIntentIdFromClientSecret(intent.clientSecret) },
            {
              onSuccess: (paid) => {
                if (paid) {
                  setPhase('success');
                  queryClient.invalidateQueries({ queryKey: cartKeys.detail(cartKey) });
                } else {
                  setPhase('failed');
                }
              },
              onError: () => setPhase('failed'),
            }
          );
        },
        onError: () => setPhase('idle'),
      }
    );
  };

  if (phase === 'success') {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-app-bg px-6"
        style={{ paddingTop: insets.top }}>
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-green/15">
          <Ionicons name="checkmark" size={28} color="#16a34a" />
        </View>
        <Text className="text-[17px] font-semibold text-app-fg">{t('checkout.successTitle')}</Text>
        <Text className="max-w-[260px] text-center text-[12.5px] leading-[1.5] text-app-fg-2">
          {t('checkout.successBody')}
        </Text>
        <GradientButton
          label={t('checkout.backToShop')}
          onPress={() => router.replace('/(drawer)/(tabs)/cataloge')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-app-fill">
          <Ionicons name="chevron-back" size={18} color={palette.fg} />
        </Pressable>
        <Text className="text-[18px] font-semibold text-app-fg">{t('checkout.paymentTitle')}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.fg} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-4 pb-6 pt-2"
          showsVerticalScrollIndicator={false}>
          <View className="gap-2.5 rounded-2xl border border-app-border bg-app-surface-2 p-4">
            <Text className="text-[12px] font-semibold uppercase tracking-wide text-app-fg-3">
              {t('checkout.orderSummary')}
            </Text>
            <View className="flex-row justify-between">
              <Text className="text-[12.5px] text-app-fg-2">{t('panier.subtotal')}</Text>
              <Text className="text-[12.5px] font-medium text-app-fg">
                {formatPrice(Number(totals?.subtotal) || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[12.5px] text-app-fg-2">{t('panier.shipping')}</Text>
              <Text className="text-[12.5px] font-medium text-app-fg">
                {formatPrice(Number(totals?.shipping_total) || 0)}
              </Text>
            </View>
            <View className="h-px bg-app-border" />
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[14px] font-semibold text-app-fg">{t('panier.total')}</Text>
              <Text className="text-[20px] font-bold tracking-tight text-app-fg">
                {formatPrice(Number(totals?.total) || 0)}
              </Text>
            </View>
          </View>

          <View className="gap-2.5 rounded-2xl border border-app-border bg-app-surface p-4">
            <View className="flex-row items-center gap-2.5">
              <Ionicons name="card-outline" size={18} color={palette.fg2} />
              <Text className="text-[13px] font-semibold text-app-fg">
                {t('checkout.cardPayment')}
              </Text>
            </View>
            <Text className="text-[11.5px] leading-[1.5] text-app-fg-3">
              {t('checkout.cardPaymentBody')}
            </Text>
          </View>

          {createPaymentIntent.isError && (
            <Text className="text-[12px] text-red-500">{t('checkout.paymentError')}</Text>
          )}
          {phase === 'failed' && (
            <Text className="text-[12px] text-red-500">{t('checkout.paymentFailed')}</Text>
          )}
        </ScrollView>
      )}

      <View className="gap-2 border-t border-app-border bg-app-surface px-4 pb-6 pt-3">
        <GradientButton
          label={
            phase === 'opening'
              ? t('checkout.redirecting')
              : phase === 'confirming'
                ? t('checkout.confirming')
                : phase === 'failed'
                  ? t('checkout.tryAgain')
                  : t('checkout.payNow')
          }
          disabled={!cartKey || isBusy}
          onPress={handlePay}
        />
      </View>
    </View>
  );
}
