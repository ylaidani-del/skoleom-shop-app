import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useEkanMethods,
  useRelayPoints,
  useShippingZones,
  useUpdateCart,
  useZoneShippingMethods,
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
  cost?: string;
  selected: boolean;
  onPress: () => void;
}

function SelectableRow({ title, subtitle, cost, selected, onPress }: SelectableRowProps) {
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
      {!!cost && (
        <Text className="text-[13px] font-bold text-app-fg">{formatPrice(Number(cost) || 0)}</Text>
      )}
    </Pressable>
  );
}

export default function ShippingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const { data: zones, isLoading: zonesLoading } = useShippingZones();
  const [zoneId, setZoneId] = useState<number | string | undefined>();
  const { data: zoneMethods, isLoading: methodsLoading } = useZoneShippingMethods(zoneId);
  const { data: ekanMethods } = useEkanMethods();
  const { data: relayPoints, isLoading: relayLoading } = useRelayPoints();

  const [methodId, setMethodId] = useState<string | undefined>();
  const [relayId, setRelayId] = useState<string | undefined>();

  const updateCart = useUpdateCart();

  const methods: (ShippingMethod | EkanMethod)[] = useMemo(
    () => [...(ekanMethods ?? []), ...(zoneMethods ?? [])],
    [ekanMethods, zoneMethods]
  );

  const selectedMethod = methods.find((m) => m.id === methodId);
  const requiresRelay = !!selectedMethod && isRelayLike(selectedMethod.title);
  const canContinue = !!methodId && (!requiresRelay || !!relayId);

  const handleContinue = () => {
    updateCart.mutate(
      {
        shipping: {
          zone_id: zoneId,
          method_id: methodId,
          relay_point_id: requiresRelay ? relayId : undefined,
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
            {t('checkout.zoneLabel')}
          </Text>
          {zonesLoading ? (
            <ActivityIndicator color={palette.fg} />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {(zones ?? []).map((zone) => (
                <Pressable
                  key={zone.id}
                  onPress={() => {
                    setZoneId(zone.id);
                    setMethodId(undefined);
                  }}
                  className={`rounded-full border px-3.5 py-2 ${
                    zoneId === zone.id
                      ? 'border-app-inv bg-app-inv'
                      : 'border-app-border bg-app-surface'
                  }`}>
                  <Text
                    className={`text-[12px] font-medium ${
                      zoneId === zone.id ? 'text-app-inv-fg' : 'text-app-fg'
                    }`}>
                    {zone.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View className="gap-2.5">
          <Text className="text-[12px] font-semibold uppercase tracking-wide text-app-fg-3">
            {t('checkout.methodLabel')}
          </Text>
          {methodsLoading ? (
            <ActivityIndicator color={palette.fg} />
          ) : methods.length === 0 ? (
            <Text className="text-[12.5px] text-app-fg-3">{t('checkout.selectZoneFirst')}</Text>
          ) : (
            <View className="gap-2">
              {methods.map((method) => (
                <SelectableRow
                  key={method.id}
                  title={method.title}
                  cost={method.cost}
                  selected={methodId === method.id}
                  onPress={() => setMethodId(method.id)}
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
            {relayLoading ? (
              <ActivityIndicator color={palette.fg} />
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
