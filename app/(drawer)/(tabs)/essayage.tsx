import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCreateAvatar, useGetUserAvatar, useUpdateAvatar } from '@/api/avatar';
import { flattenProducts, isTestableProduct, useProducts, type WooProduct } from '@/api/product';
import { useDeleteTryon, useTryOn, useTryonHistory, type TryOnHistoryItem } from '@/api/tryon';
import { useMe } from '@/api/user';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { PALETTES } from '@/constants/theme';
import { TESTABLE_SLUGS_PARAM } from '@/constants/testableCategories';
import { useCartStore } from '@/store/cartStore';
import { useFilterStore } from '@/store/filterStore';
import { useMeasurementsStore, type Measurements } from '@/store/measurementsStore';
import { useThemeStore } from '@/store/themeStore';
import { formatPrice } from '@/utils/currency';

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

interface WardrobeGridItemProps {
  product: WooProduct;
  selected: boolean;
  invFg: string;
  onSelect: () => void;
}

function WardrobeGridItem({ product, selected, invFg, onSelect }: WardrobeGridItemProps) {
  return (
    <Pressable
      onPress={onSelect}
      className="flex-1 gap-1.5 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={product.name}>
      <View
        className={`aspect-[100/112] overflow-hidden rounded-xl bg-app-fill ${
          selected ? 'border-2 border-app-inv' : 'border border-app-border'
        }`}>
        <Image source={{ uri: product.photos[0] }} className="h-full w-full" resizeMode="cover" />
        {selected && (
          <View className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-app-inv">
            <Ionicons name="checkmark" size={14} color={invFg} />
          </View>
        )}
      </View>
      <Text numberOfLines={1} className="px-0.5 text-[12px] font-medium text-app-fg">
        {product.name}
      </Text>
      <Text className="px-0.5 text-[12.5px] font-bold text-app-fg">
        {formatPrice(product.onSale ? product.salePrice : product.price)}
      </Text>
    </Pressable>
  );
}

export default function EssayageTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  const { productId: initialProductId } = useLocalSearchParams<{ productId?: string }>();
  const setCatalogueSearch = useFilterStore((state) => state.setSearch);

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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialProductId ?? null
  );
  const [previewHistoryItem, setPreviewHistoryItem] = useState<TryOnHistoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);

  const createAvatar = useCreateAvatar();
  const updateAvatar = useUpdateAvatar();
  const tryOn = useTryOn();
  const deleteTryon = useDeleteTryon();
  const addToCart = useCartStore((state) => state.addItem);

  const wardrobeQuery = useProducts({ search, category: TESTABLE_SLUGS_PARAM });
  const wardrobe = flattenProducts(wardrobeQuery.data).filter(isTestableProduct);
  const selectedProduct = wardrobe.find((p) => p.id === selectedProductId) ?? null;

  const historyQuery = useTryonHistory(avatar?.avatarId);
  const history = historyQuery.data?.data ?? [];

  useEffect(() => {
    if (initialProductId) setSelectedProductId(initialProductId);
  }, [initialProductId]);

  // Local measurements are device-only (AsyncStorage). If the user already has
  // a server-side avatar but no local measurements (fresh install, new device,
  // cleared storage...), fall back to the measurements stored with the avatar
  // so the "Essayer sur moi" button isn't silently stuck disabled.
  useEffect(() => {
    if (storedMeasurements || !avatar?.measurements) return;
    const m = avatar.measurements;
    const seeded: Measurements = {
      height: Number(m.height) || 0,
      weight: Number(m.weight) || 0,
      chest: Number(m.chest) || 0,
      waist: Number(m.waist) || 0,
      footLength: Number(m.footLength) || 0,
    };
    if (Object.values(seeded).every((value) => value > 0)) {
      setStoredMeasurements(seeded);
      setForm({
        height: String(seeded.height),
        weight: String(seeded.weight),
        chest: String(seeded.chest),
        waist: String(seeded.waist),
        footLength: String(seeded.footLength),
      });
    }
  }, [avatar, storedMeasurements, setStoredMeasurements]);

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
    setPreviewHistoryItem(null);
    setStoredMeasurements(measurements);
    tryOn.mutate(
      {
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
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tryon-history', avatar.avatarId] });
        },
      }
    );
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

  const stageUri =
    previewHistoryItem?.result_url ?? tryOn.data?.data.overlayUrl ?? avatar.avatarUrl;
  const fitScore = previewHistoryItem
    ? previewHistoryItem.fit_score
    : (tryOn.data?.data.fitScore ?? null);
  const recommendedSize = previewHistoryItem?.recommended_size ?? tryOn.data?.data.recommendedSize;
  const comment = previewHistoryItem?.comment ?? tryOn.data?.data.comment;
  const showFitCard = !!previewHistoryItem || !!tryOn.data;

  const goBuy = () => {
    if (previewHistoryItem) {
      setCatalogueSearch(previewHistoryItem.product_name);
      router.push('/(drawer)/(tabs)/cataloge');
    } else if (selectedProduct) {
      router.push({ pathname: '/produit/[id]', params: { id: selectedProduct.id } });
    }
  };

  return (
    <Container>
      <ScreenHeader title={t('essayage.title')} />

      <FlatList
        data={wardrobe}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3"
        contentContainerClassName="gap-3 px-4 pb-4 pt-2"
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (wardrobeQuery.hasNextPage && !wardrobeQuery.isFetchingNextPage) {
            wardrobeQuery.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={wardrobeQuery.isRefetching}
            onRefresh={() => wardrobeQuery.refetch()}
            tintColor={palette.fg}
          />
        }
        ListHeaderComponent={
          <View className="gap-5 pb-5">
            <View className="aspect-[1/1.14] overflow-hidden rounded-2xl bg-brand-black">
              {tryOn.isPending ? (
                <View className="flex-1 items-center justify-center gap-3">
                  <ActivityIndicator color="#dbea18" />
                  <Text className="text-[13px] font-medium text-white">
                    {t('essayage.trying')}
                  </Text>
                </View>
              ) : (
                <Image source={{ uri: stageUri }} className="h-full w-full" resizeMode="cover" />
              )}
            </View>

            {showFitCard && (
              <View className="flex-row items-center gap-3 rounded-2xl border border-app-border bg-app-surface p-3.5">
                <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-brand-green/10">
                  <Text className="text-[13px] font-bold text-brand-green-deep">
                    {fitScore != null ? `${formatFitScore(fitScore)}%` : '—'}
                  </Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[9.5px] font-bold uppercase tracking-wide text-app-fg-3">
                    {t('essayage.fitScore')}
                  </Text>
                  <Text className="text-[13px] font-semibold text-app-fg">
                    {t('essayage.recommendedSize')} {recommendedSize}
                  </Text>
                  {!!comment && <Text className="text-[11px] text-app-fg-2">{comment}</Text>}
                </View>
                <Pressable
                  onPress={goBuy}
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center rounded-full bg-app-fill">
                  <Ionicons name="bag-outline" size={16} color={palette.fg} />
                </Pressable>
              </View>
            )}

            {tryOn.error && (
              <Text className="text-[12px] text-red-500">{tryOn.error.message}</Text>
            )}

            <View className="gap-2.5 rounded-2xl border border-app-border bg-app-surface p-3.5">
              <Pressable
                onPress={() => setIsEditingMeasurements((prev) => !prev)}
                className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-app-fg">
                  {t('essayage.myMeasurements')}
                </Text>
                <Ionicons
                  name={isEditingMeasurements ? 'chevron-up' : 'pencil-outline'}
                  size={16}
                  color={palette.fg2}
                />
              </Pressable>

              {isEditingMeasurements && (
                <View className="gap-2.5 pt-1">
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

                  {updateAvatar.error && (
                    <Text className="text-[12px] text-red-500">{updateAvatar.error.message}</Text>
                  )}

                  <Pressable
                    onPress={() => {
                      if (!measurementsValid) return;
                      updateAvatar.mutate(
                        { avatarId: avatar.avatarId, measurements },
                        {
                          onSuccess: () => {
                            setStoredMeasurements(measurements);
                            setIsEditingMeasurements(false);
                            queryClient.invalidateQueries({
                              queryKey: ['ai-avatar', 'user', userId],
                            });
                          },
                        }
                      );
                    }}
                    disabled={!measurementsValid || updateAvatar.isPending}
                    className="items-center rounded-lg bg-app-inv py-2.5 disabled:opacity-40">
                    <Text className="text-[13px] font-semibold text-app-inv-fg">
                      {updateAvatar.isPending
                        ? t('essayage.creating')
                        : t('essayage.saveMeasurements')}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {history.length > 0 && (
              <View className="gap-2.5">
                <Text className="text-[15px] font-semibold text-app-fg">
                  {t('essayage.historyTitle')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2.5 pr-4">
                  {history.map((item) => (
                    <View key={item.id_tryon} className="w-[90px] gap-1.5">
                      <Pressable
                        onPress={() => setPreviewHistoryItem(item)}
                        className={`h-[104px] w-[90px] overflow-hidden rounded-xl bg-app-fill ${
                          previewHistoryItem?.id_tryon === item.id_tryon
                            ? 'border-2 border-app-inv'
                            : 'border border-app-border'
                        }`}>
                        <Image
                          source={{ uri: item.result_url }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => {
                            deleteTryon.mutate(String(item.id_tryon));
                            if (previewHistoryItem?.id_tryon === item.id_tryon) {
                              setPreviewHistoryItem(null);
                            }
                          }}
                          hitSlop={6}
                          className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/55">
                          <Ionicons name="close" size={12} color="#fff" />
                        </Pressable>
                      </Pressable>
                      <Text numberOfLines={1} className="text-[10.5px] font-medium text-app-fg-2">
                        {item.product_name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="gap-2.5">
              <Text className="text-[15px] font-semibold text-app-fg">
                {t('essayage.wardrobeTitle')}
              </Text>

              <View className="h-11 flex-row items-center gap-2 rounded-xl border border-app-border-2 bg-app-surface px-3.5">
                <Ionicons name="search" size={16} color={palette.fg3} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('essayage.searchPlaceholder')}
                  placeholderTextColor={palette.fg3}
                  className="flex-1 text-[13px] text-app-fg"
                />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          wardrobeQuery.isPending ? (
            <View className="items-center py-10">
              <ActivityIndicator color={palette.fg} />
            </View>
          ) : (
            <View className="items-center gap-2 py-10">
              <Ionicons name="shirt-outline" size={26} color={palette.fg3} />
              <Text className="text-[12.5px] text-app-fg-3">{t('catalogue.empty')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          wardrobeQuery.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color={palette.fg} />
            </View>
          ) : (
            <View className="h-24" />
          )
        }
        renderItem={({ item: product }) => (
          <WardrobeGridItem
            product={product}
            selected={product.id === selectedProductId}
            invFg={palette.invFg}
            onSelect={() => {
              setSelectedProductId(product.id);
              setPreviewHistoryItem(null);
            }}
          />
        )}
      />

      <View className="pb-safe gap-2 border-t border-app-border bg-app-surface px-4 pt-3">
        {!selectedProduct && (
          <Text className="text-center text-[12px] text-app-fg-3">
            {t('essayage.selectProduct')}
          </Text>
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
      </View>
    </Container>
  );
}
