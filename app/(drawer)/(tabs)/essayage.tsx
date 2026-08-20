import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
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

import { flattenProducts, useProducts, type WooProduct } from '@/api/product';
import { useCreateAvatar, useGetUserAvatar } from '@/api/avatar';
import { useTryOn } from '@/api/tryon';
import { useMe } from '@/api/user';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import { useMeasurementsStore, type Measurements } from '@/store/measurementsStore';
import { useThemeStore } from '@/store/themeStore';

const WARDROBE_SIZE = 10;

const emptyForm = { height: '', weight: '', chest: '', waist: '', footLength: '' };

const formatFitScore = (score: number) => Math.round(score <= 1 ? score * 100 : score);

interface MeasurementFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

function MeasurementField({ label, value, onChangeText }: MeasurementFieldProps) {
  return (
    <View className="flex-1 gap-1">
      <Text className="text-[10.5px] font-medium text-app-fg-3">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        className="rounded-lg border border-app-border px-2.5 py-2 text-[13px] text-app-fg"
      />
    </View>
  );
}

export default function EssayageTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const { data: me } = useMe();
  const userId = me?.id ?? null;

  const { data: avatarResponse, isLoading: isAvatarLoading } = useGetUserAvatar(userId);
  const avatar = avatarResponse?.data ?? null;

  const storedMeasurements = useMeasurementsStore((state) => state.measurements);
  const setStoredMeasurements = useMeasurementsStore((state) => state.setMeasurements);

  const [form, setForm] = useState(() =>
    storedMeasurements
      ? {
          height: String(storedMeasurements.height),
          weight: String(storedMeasurements.weight),
          chest: String(storedMeasurements.chest),
          waist: String(storedMeasurements.waist),
          footLength: String(storedMeasurements.footLength),
        }
      : emptyForm
  );
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const createAvatar = useCreateAvatar();
  const tryOn = useTryOn();
  const addToCart = useCartStore((state) => state.addItem);

  const productsQuery = useProducts({});
  const wardrobe = flattenProducts(productsQuery.data).slice(0, WARDROBE_SIZE);
  const selectedProduct = wardrobe.find((p) => p.id === selectedProductId) ?? null;

  const measurements: Measurements = {
    height: Number(form.height),
    weight: Number(form.weight),
    chest: Number(form.chest),
    waist: Number(form.waist),
    footLength: Number(form.footLength),
  };
  const measurementsValid = Object.values(measurements).every(
    (value) => Number.isFinite(value) && value > 0
  );

  const setField = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.base64) setPhoto({ uri: asset.uri, base64: asset.base64 });
  };

  const handleCreateAvatar = () => {
    if (!photo || !measurementsValid) return;
    createAvatar.mutate(
      { photoBase64: photo.base64, measurements },
      {
        onSuccess: () => {
          setStoredMeasurements(measurements);
          setPhoto(null);
          queryClient.invalidateQueries({ queryKey: ['ai-avatar', 'user', userId] });
        },
      }
    );
  };

  const handleTryOn = (product: WooProduct) => {
    if (!avatar || !measurementsValid) return;
    setSelectedProductId(product.id);
    setStoredMeasurements(measurements);
    tryOn.mutate({
      avatarId: avatar.avatarId,
      measurements,
      product: {
        id: Number(product.id),
        name: product.name,
        brand: product.brand ?? '',
        price: product.price,
        recommendedSize: product.recommendedSize ?? 'M',
        image: product.photos[0] ?? '',
        type: product.type ?? '',
        typeSlug: product.typeSlug,
      },
    });
  };

  if (isAvatarLoading) {
    return (
      <Container>
        <ScreenHeader title={t('essayage.title')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.fg} />
        </View>
      </Container>
    );
  }

  if (!avatar) {
    return (
      <Container>
        <ScreenHeader title={t('essayage.title')} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-4 pb-10 pt-2">
          <View className="gap-4 rounded-2xl bg-brand-black p-5">
            <Pressable
              onPress={pickPhoto}
              className="aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-white/10">
              {photo ? (
                <Image source={{ uri: photo.uri }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Ionicons name="camera-outline" size={30} color="#dbea18" />
              )}
            </Pressable>

            <Pressable
              onPress={pickPhoto}
              className="items-center rounded-xl border border-white/25 bg-white/10 py-3">
              <Text className="text-[13px] font-medium text-white">
                {photo ? t('essayage.retakePhoto') : t('essayage.addPhoto')}
              </Text>
            </Pressable>

            <Text className="text-[15px] font-semibold text-white">
              {t('essayage.onboardingTitle')}
            </Text>
            <Text className="-mt-3 text-[12px] leading-[1.5] text-white/65">
              {t('essayage.onboardingBody')}
            </Text>

            <View className="flex-row gap-2.5">
              <MeasurementField
                label={t('essayage.heightLabel')}
                value={form.height}
                onChangeText={setField('height')}
              />
              <MeasurementField
                label={t('essayage.weightLabel')}
                value={form.weight}
                onChangeText={setField('weight')}
              />
            </View>
            <View className="flex-row gap-2.5">
              <MeasurementField
                label={t('essayage.chestLabel')}
                value={form.chest}
                onChangeText={setField('chest')}
              />
              <MeasurementField
                label={t('essayage.waistLabel')}
                value={form.waist}
                onChangeText={setField('waist')}
              />
              <MeasurementField
                label={t('essayage.footLabel')}
                value={form.footLength}
                onChangeText={setField('footLength')}
              />
            </View>

            {createAvatar.error && (
              <Text className="text-[12px] text-red-400">{createAvatar.error.message}</Text>
            )}

            <GradientButton
              label={
                createAvatar.isPending ? t('essayage.creating') : t('essayage.createAvatarCta')
              }
              disabled={!photo || !measurementsValid || createAvatar.isPending}
              onPress={handleCreateAvatar}
            />
          </View>
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container>
      <ScreenHeader title={t('essayage.title')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        <View className="aspect-[1/1.14] overflow-hidden rounded-2xl bg-neutral-900">
          {tryOn.isPending ? (
            <View className="flex-1 items-center justify-center gap-3">
              <ActivityIndicator color="#dbea18" />
              <Text className="text-[13px] font-medium text-white">{t('essayage.trying')}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: tryOn.data?.data.overlayUrl ?? avatar.avatarUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          )}
        </View>

        {tryOn.data && (
          <View className="flex-row items-center gap-3 rounded-2xl border border-app-border bg-app-surface p-3.5">
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-brand-green/10">
              <Text className="text-[13px] font-bold text-brand-green-deep">
                {tryOn.data.data.fitScore != null
                  ? `${formatFitScore(tryOn.data.data.fitScore)}%`
                  : '—'}
              </Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-[9.5px] font-bold uppercase tracking-wide text-app-fg-3">
                {t('essayage.fitScore')}
              </Text>
              <Text className="text-[13px] font-semibold text-app-fg">
                {t('essayage.recommendedSize')} {tryOn.data.data.recommendedSize}
              </Text>
              {!!tryOn.data.data.comment && (
                <Text className="text-[11px] text-app-fg-2">{tryOn.data.data.comment}</Text>
              )}
            </View>
          </View>
        )}

        {tryOn.error && <Text className="text-[12px] text-red-500">{tryOn.error.message}</Text>}

        <View className="gap-2.5">
          <Text className="text-[15px] font-semibold text-app-fg">
            {t('essayage.wardrobeTitle')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2.5 pr-4">
            {wardrobe.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => setSelectedProductId(product.id)}
                className={`h-[92px] w-[74px] overflow-hidden rounded-xl bg-app-fill ${
                  product.id === selectedProductId
                    ? 'border-2 border-app-inv'
                    : 'border border-app-border'
                }`}>
                <Image
                  source={{ uri: product.photos[0] }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {!selectedProduct && (
          <Text className="text-[12.5px] text-app-fg-3">{t('essayage.selectProduct')}</Text>
        )}

        <View className="flex-row gap-2.5">
          <GradientButton
            className="flex-1"
            label={tryOn.isPending ? t('essayage.trying') : t('essayage.tryButton')}
            disabled={!selectedProduct || !measurementsValid || tryOn.isPending}
            onPress={() => selectedProduct && handleTryOn(selectedProduct)}
          />
          {tryOn.data && selectedProduct && (
            <Pressable
              onPress={() => addToCart(selectedProduct.id)}
              className="items-center justify-center rounded-xl bg-app-inv px-5">
              <Text className="text-[13.5px] font-semibold text-app-inv-fg">
                {t('essayage.addToCart')}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
