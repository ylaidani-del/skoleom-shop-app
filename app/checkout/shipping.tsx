import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  dedupeShippingMethods,
  useEkanMethods,
  useRelayPoints,
  useShippingMethods,
  useUpdateCart,
  type EkanMethod,
  type RelayPoint,
  type ShippingMethod,
} from '@/api/cart';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { formatPrice } from '@/utils/currency';

const isRelayLike = (label: string) => /relay|stop\s?desk|point/i.test(label);

interface SelectableRowProps {
  title: string;
  subtitle?: string;
  cost?: number;
  costIsEstimate?: boolean;
  selected: boolean;
  onPress: () => void;
}

function SelectableRow({
  title,
  subtitle,
  cost,
  costIsEstimate,
  selected,
  onPress,
}: SelectableRowProps) {
  const { t } = useTranslation();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-xl border p-3.5 ${
        selected ? 'border-app-inv bg-app-fill' : 'border-app-border bg-app-surface'
      }`}>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-[1.5px] ${
          selected ? 'border-app-inv bg-app-inv' : 'border-app-border-2'
        }`}>
        {selected && <Ionicons name="checkmark" size={12} color={palette.invFg} />}
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-app-fg">{title}</Text>
        {!!subtitle && <Text className="text-[11px] text-app-fg-3">{subtitle}</Text>}
      </View>
      {cost !== undefined && (
        <Text className="text-[13px] font-bold text-app-fg">
          {cost === 0
            ? t('checkout.free')
            : costIsEstimate
              ? t('checkout.costFrom', { price: formatPrice(cost) })
              : formatPrice(cost)}
        </Text>
      )}
    </Pressable>
  );
}

export default function ShippingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const { data: shippingMethods, isLoading: methodsLoading } = useShippingMethods();
  const { data: ekanMethods } = useEkanMethods();

  const [methodId, setMethodId] = useState<string | undefined>();
  const [relayId, setRelayId] = useState<string | undefined>();
  const [postcode, setPostcode] = useState('');

  const updateCart = useUpdateCart();

  const methods: (ShippingMethod | EkanMethod)[] = useMemo(
    () => [...(ekanMethods ?? []), ...dedupeShippingMethods(shippingMethods ?? [])],
    [ekanMethods, shippingMethods]
  );

  const selectedMethod = methods.find((m) => m.id === methodId);
  const requiresRelay = !!selectedMethod && isRelayLike(selectedMethod.title);

  const { data: relayPoints, isLoading: relayLoading } = useRelayPoints(
    requiresRelay ? { postcode: postcode.trim() } : undefined
  );

  const canContinue = !!methodId && (!requiresRelay || !!relayId);

  const handleContinue = () => {
    updateCart.mutate(
      {
        shipping: {
          method_id: methodId,
          relay_point_id: requiresRelay ? relayId : undefined,
          postcode: requiresRelay ? postcode.trim() : undefined,
        },
      },
      { onSuccess: () => router.push('/checkout/payment') }
    );
  };

  return (
    <View className="flex-1 bg-app-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-app-fill">
          <Ionicons name="chevron-back" size={18} color={palette.fg} />
        </Pressable>
        <Text className="text-[18px] font-semibold text-app-fg">{t('checkout.shippingTitle')}</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-5 px-4 pb-6 pt-2"
        showsVerticalScrollIndicator={false}>
        <View className="gap-2.5">
          <Text className="text-[12px] font-semibold uppercase tracking-wide text-app-fg-3">
            {t('checkout.methodLabel')}
          </Text>
          {methodsLoading ? (
            <ActivityIndicator color={palette.fg} />
          ) : methods.length === 0 ? (
            <Text className="text-[12.5px] text-app-fg-3">{t('checkout.noMethods')}</Text>
          ) : (
            <View className="gap-2">
              {methods.map((method) => (
                <SelectableRow
                  key={method.id}
                  title={method.title}
                  cost={method.cost}
                  costIsEstimate={
                    'costIsEstimate' in method ? Boolean(method.costIsEstimate) : undefined
                  }
                  selected={methodId === method.id}
                  onPress={() => {
                    setMethodId(method.id);
                    setRelayId(undefined);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {requiresRelay && (
          <View className="gap-2.5">
            <Text className="text-[12px] font-semibold uppercase tracking-wide text-app-fg-3">
              {t('checkout.relayLabel')}
            </Text>
            <View className="h-11 justify-center rounded-xl border border-app-border bg-app-surface px-3.5">
              <TextInput
                value={postcode}
                onChangeText={(value) => {
                  setPostcode(value);
                  setRelayId(undefined);
                }}
                placeholder={t('checkout.postcodePlaceholder')}
                placeholderTextColor={palette.fg3}
                keyboardType="number-pad"
                className="text-[12.5px] text-app-fg"
              />
            </View>
            {!postcode.trim() ? (
              <Text className="text-[12px] text-app-fg-3">{t('checkout.enterPostcode')}</Text>
            ) : relayLoading ? (
              <ActivityIndicator color={palette.fg} />
            ) : (relayPoints ?? []).length === 0 ? (
              <Text className="text-[12px] text-app-fg-3">{t('checkout.noRelayPoints')}</Text>
            ) : (
              <View className="gap-2">
                {(relayPoints ?? []).map((point: RelayPoint) => (
                  <SelectableRow
                    key={point.id}
                    title={point.name}
                    subtitle={[point.address, point.city].filter(Boolean).join(' · ')}
                    selected={relayId === point.id}
                    onPress={() => setRelayId(point.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {updateCart.isError && (
          <Text className="text-[12px] text-red-500">{t('checkout.shippingError')}</Text>
        )}
      </ScrollView>

      <View className="gap-2 border-t border-app-border bg-app-surface px-4 pb-6 pt-3">
        <GradientButton
          label={updateCart.isPending ? t('checkout.saving') : t('checkout.continueToPayment')}
          disabled={!canContinue || updateCart.isPending}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}
