import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCreateAvatar, useDeleteAvatar, useGetUserAvatar, useUpdateAvatar } from '@/api/avatar';
import { useCancelSubscription, useCheckout, useSubscription } from '@/api/billing';
import { useCart } from '@/api/cart';
import { useProduct } from '@/api/product';
import { useMe, useSignOut, useUpdateProfile } from '@/api/user';
import { useRecommendations } from '@/api/tryon';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { PALETTES } from '@/constants/theme';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useMeasurementsStore, type Measurements } from '@/store/measurementsStore';
import { useThemeStore } from '@/store/themeStore';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const ROLE_KEYS: Record<string, string> = {
  acheteur: 'auth.roleBuyer',
  vendeur: 'auth.roleSeller',
  admin: 'auth.roleAdmin',
};

const DEFAULT_MEASUREMENTS: Measurements = {
  height: 170,
  weight: 70,
  chest: 95,
  waist: 80,
  footLength: 26,
};

const MEASUREMENT_FIELDS: {
  key: keyof Measurements;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
}[] = [
  { key: 'height', label: 'essayage.heightLabel', unit: 'cm', min: 140, max: 210 },
  { key: 'weight', label: 'essayage.weightLabel', unit: 'kg', min: 35, max: 150 },
  { key: 'chest', label: 'essayage.chestLabel', unit: 'cm', min: 60, max: 140 },
  { key: 'waist', label: 'essayage.waistLabel', unit: 'cm', min: 50, max: 130 },
  { key: 'footLength', label: 'essayage.footLabel', unit: 'cm', min: 20, max: 32, step: 0.5 },
];

interface MeasurementSliderProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
}

function MeasurementSlider({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onValueChange,
}: MeasurementSliderProps) {
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-medium text-app-fg-2">{label}</Text>
        <Text className="text-[12.5px] font-semibold text-app-fg">
          {step < 1 ? value.toFixed(1) : Math.round(value)} {unit}
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={palette.fg}
        maximumTrackTintColor={palette.border}
        thumbTintColor={palette.fg}
      />
    </View>
  );
}

export default function CompteTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const { data: me } = useMe();
  const userId = me?.id ?? null;
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { data: avatarResponse } = useGetUserAvatar(userId);
  const avatar = avatarResponse?.data ?? null;
  const createAvatar = useCreateAvatar();
  const updateAvatar = useUpdateAvatar();
  const deleteAvatar = useDeleteAvatar();

  const { data: subscription, isLoading: isSubLoading } = useSubscription();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();

  const cartCount = useCart().data?.item_count ?? 0;
  const favoritesCount = useFavoritesStore((state) => state.ids.length);

  const { data: recommendations } = useRecommendations();
  const recommendedId = recommendations?.productIds?.[0];
  const { data: recommendedProduct } = useProduct(recommendedId ? String(recommendedId) : '');

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const storedMeasurements = useMeasurementsStore((state) => state.measurements);
  const setStoredMeasurements = useMeasurementsStore((state) => state.setMeasurements);
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>(
    () => storedMeasurements ?? DEFAULT_MEASUREMENTS
  );
  const [measurementsSaved, setMeasurementsSaved] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);

  // Seeded directly during render (not in an effect — see essayage.tsx for the
  // same pattern): if this device has no locally-stored measurements yet but
  // the server-side avatar does (new device, cleared storage...), fall back
  // to those instead of showing generic defaults.
  const [measurementsSeeded, setMeasurementsSeeded] = useState(false);
  if (!measurementsSeeded && !storedMeasurements && avatar?.measurements) {
    const m = avatar.measurements;
    const seeded: Measurements = {
      height: Number(m.height) || 0,
      weight: Number(m.weight) || 0,
      chest: Number(m.chest) || 0,
      waist: Number(m.waist) || 0,
      footLength: Number(m.footLength) || 0,
    };
    if (Object.values(seeded).every((value) => value > 0)) {
      setMeasurementsSeeded(true);
      setMeasurements(seeded);
    }
  }

  const pickAvatarPhoto = async () => {
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

  const canSaveAvatar = !!photo || !!avatar;
  const isSavingAvatar = createAvatar.isPending || updateAvatar.isPending;
  const avatarSaveError = createAvatar.error ?? updateAvatar.error;

  const saveMeasurements = () => {
    setMeasurementsSaved(false);
    if (photo) {
      // A freshly picked photo always (re)creates the avatar — there's one
      // avatar per user server-side, so this transparently replaces any
      // existing one with the new photo + current measurements.
      createAvatar.mutate(
        { photoBase64: photo.base64, measurements },
        {
          onSuccess: () => {
            setStoredMeasurements(measurements);
            setMeasurementsSaved(true);
            setPhoto(null);
            queryClient.invalidateQueries({ queryKey: ['ai-avatar', 'user', userId] });
          },
        }
      );
    } else if (avatar) {
      updateAvatar.mutate(
        { avatarId: avatar.avatarId, measurements },
        {
          onSuccess: () => {
            setStoredMeasurements(measurements);
            setMeasurementsSaved(true);
            queryClient.invalidateQueries({ queryKey: ['ai-avatar', 'user', userId] });
          },
        }
      );
    } else {
      setStoredMeasurements(measurements);
      setMeasurementsSaved(true);
    }
  };

  const removeAvatar = () => {
    if (!avatar) return;
    Alert.alert(
      t('compte.removeAvatarConfirmTitle'),
      t('compte.removeAvatarConfirmBody'),
      [
        { text: t('compte.cancel'), style: 'cancel' },
        {
          text: t('compte.removeAvatar'),
          style: 'destructive',
          onPress: () => {
            deleteAvatar.mutate({ avatarId: avatar.avatarId, userId });
            setPhoto(null);
          },
        },
      ]
    );
  };

  const startEditing = () => {
    setName(me?.name ?? '');
    setEmail(me?.email ?? '');
    setIsEditing(true);
  };

  const save = () => {
    updateProfile({ name, email }, { onSuccess: () => setIsEditing(false) });
  };

  const handleSubscribe = () => {
    checkout.mutate(undefined, {
      onSuccess: async (session) => {
        if (session.url) await WebBrowser.openBrowserAsync(session.url);
      },
    });
  };

  return (
    <Container>
      <ScreenHeader title={t('compte.title')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        <View className="gap-3.5 rounded-2xl border border-app-border bg-app-surface p-4">
          <View className="flex-row items-center gap-3.5">
            <View className="relative h-14 w-14">
              <View className="h-14 w-14 overflow-hidden rounded-full p-0.5">
                <LinearGradient
                  colors={['#4bdd2c', '#dbea18']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                />
                <View className="m-0.5 flex-1 items-center justify-center overflow-hidden rounded-full bg-app-fill">
                  {avatar?.avatarUrl ? (
                    <Image
                      source={{ uri: avatar.avatarUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-[17px] font-bold text-app-fg">
                      {me?.name ? initials(me.name) : '—'}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => setIsEditingMeasurements(true)}
                hitSlop={6}
                accessibilityLabel={t('compte.editAvatar')}
                className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-app-surface bg-app-inv">
                <Ionicons name="pencil" size={10} color={palette.invFg} />
              </Pressable>
            </View>

            <View className="flex-1 gap-0.5">
              <Text className="text-[16px] font-semibold text-app-fg">{me?.name}</Text>
              <Text className="text-[11.5px] text-app-fg-2">
                {me?.role ? t(ROLE_KEYS[me.role] ?? 'auth.roleBuyer') : ''}
              </Text>
            </View>

            {!isEditing && (
              <Pressable
                onPress={startEditing}
                hitSlop={8}
                className="h-[34px] w-[34px] items-center justify-center rounded-full bg-app-fill">
                <Ionicons name="pencil-outline" size={16} color={palette.fg2} />
              </Pressable>
            )}
          </View>

          {isEditing && (
            <View className="gap-2.5 border-t border-app-border pt-3.5">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('auth.name')}
                className="rounded-lg border border-app-border px-3.5 py-2.5 text-[13px] text-app-fg"
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.email')}
                autoCapitalize="none"
                keyboardType="email-address"
                className="rounded-lg border border-app-border px-3.5 py-2.5 text-[13px] text-app-fg"
              />
              <View className="flex-row gap-2.5">
                <Pressable
                  onPress={() => setIsEditing(false)}
                  className="flex-1 items-center rounded-lg border border-app-border py-2.5">
                  <Text className="text-[13px] font-medium text-app-fg-2">
                    {t('compte.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  disabled={isSaving}
                  className="flex-1 items-center rounded-lg bg-app-inv py-2.5 disabled:opacity-50">
                  <Text className="text-[13px] font-semibold text-app-inv-fg">
                    {t('compte.save')}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View className="gap-3 rounded-2xl border border-app-border bg-app-surface p-4">
          <Pressable
            onPress={() => setIsEditingMeasurements((prev) => !prev)}
            className="flex-row items-center justify-between">
            <Text className="text-[13px] font-semibold text-app-fg">
              {t('compte.myAvatarTitle')}
            </Text>
            <Ionicons
              name={isEditingMeasurements ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={palette.fg2}
            />
          </Pressable>

          {isEditingMeasurements && (
            <View className="gap-3.5 border-t border-app-border pt-3.5">
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={pickAvatarPhoto}
                  className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-app-fill">
                  {photo ? (
                    <Image source={{ uri: photo.uri }} className="h-full w-full" resizeMode="cover" />
                  ) : avatar?.avatarUrl ? (
                    <Image
                      source={{ uri: avatar.avatarUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={22} color={palette.fg3} />
                  )}
                </Pressable>
                <View className="flex-1 gap-1.5">
                  <Pressable
                    onPress={pickAvatarPhoto}
                    className="self-start rounded-full border border-app-border px-3 py-1.5">
                    <Text className="text-[12px] font-medium text-app-fg">
                      {photo
                        ? t('essayage.retakePhoto')
                        : avatar
                          ? t('compte.changePhoto')
                          : t('essayage.addPhoto')}
                    </Text>
                  </Pressable>
                  {avatar && (
                    <Pressable onPress={removeAvatar} disabled={deleteAvatar.isPending} hitSlop={6}>
                      <Text className="text-[11.5px] font-medium text-red-500">
                        {deleteAvatar.isPending
                          ? t('compte.removingAvatar')
                          : t('compte.removeAvatar')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {MEASUREMENT_FIELDS.map((field) => (
                <MeasurementSlider
                  key={field.key}
                  label={t(field.label)}
                  unit={field.unit}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={measurements[field.key]}
                  onValueChange={(value) => {
                    setMeasurementsSaved(false);
                    setMeasurements((prev) => ({ ...prev, [field.key]: value }));
                  }}
                />
              ))}

              {avatarSaveError && (
                <Text className="text-[12px] text-red-500">{avatarSaveError.message}</Text>
              )}
              {deleteAvatar.error && (
                <Text className="text-[12px] text-red-500">{deleteAvatar.error.message}</Text>
              )}
              {measurementsSaved && (
                <Text className="text-[12px] text-brand-green-deep">
                  {t('compte.measurementsSaved')}
                </Text>
              )}

              <Pressable
                onPress={saveMeasurements}
                disabled={!canSaveAvatar || isSavingAvatar}
                className="items-center rounded-lg bg-app-inv py-2.5 disabled:opacity-50">
                <Text className="text-[13px] font-semibold text-app-inv-fg">
                  {isSavingAvatar ? t('essayage.creating') : t('essayage.saveMeasurements')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="gap-3 rounded-2xl border border-app-border bg-app-surface p-4">
          <Text className="text-[13px] font-semibold text-app-fg">{t('compte.planTitle')}</Text>

          {isSubLoading ? (
            <ActivityIndicator color={palette.fg} />
          ) : subscription?.status === 'active' ? (
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2">
                <View className="rounded-full bg-brand-green/15 px-2.5 py-1">
                  <Text className="text-[10.5px] font-bold uppercase tracking-wide text-brand-green-deep">
                    {t('compte.planActive')}
                  </Text>
                </View>
                <Text className="text-[12.5px] text-app-fg-2">
                  {subscription.planRole === 'vendeur'
                    ? t('compte.planSeller')
                    : t('compte.planBuyer')}
                </Text>
              </View>
              <Text className="text-[11.5px] text-app-fg-3">
                {subscription.cancelAtPeriodEnd
                  ? t('compte.planEndsOn', { date: formatDate(subscription.currentPeriodEnd) })
                  : t('compte.planRenewsOn', { date: formatDate(subscription.currentPeriodEnd) })}
              </Text>
              {!subscription.cancelAtPeriodEnd && (
                <Pressable
                  onPress={() => cancelSubscription.mutate()}
                  disabled={cancelSubscription.isPending}
                  className="items-center rounded-lg border border-app-border py-2.5 disabled:opacity-50">
                  <Text className="text-[12.5px] font-semibold text-app-fg-2">
                    {cancelSubscription.isPending ? t('compte.canceling') : t('compte.cancelPlan')}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View className="gap-2.5">
              <Text className="text-[12px] text-app-fg-2">{t('compte.planNoneBody')}</Text>
              <GradientButton
                label={checkout.isPending ? t('compte.subscribing') : t('compte.subscribeCta')}
                onPress={handleSubscribe}
                disabled={checkout.isPending}
              />
            </View>
          )}

          {checkout.error && (
            <Text className="text-[12px] text-red-500">{checkout.error.message}</Text>
          )}
          {cancelSubscription.error && (
            <Text className="text-[12px] text-red-500">{cancelSubscription.error.message}</Text>
          )}
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1 items-center gap-1 rounded-xl border border-app-border bg-app-surface-2 py-3.5">
            <Text className="text-[16px] font-bold tracking-tight text-app-fg">{cartCount}</Text>
            <Text className="text-[9.5px] font-medium text-app-fg-3">{t('compte.cartStat')}</Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-xl border border-app-border bg-app-surface-2 py-3.5">
            <Text className="text-[16px] font-bold tracking-tight text-app-fg">
              {favoritesCount}
            </Text>
            <Text className="text-[9.5px] font-medium text-app-fg-3">
              {t('compte.favoritesStat')}
            </Text>
          </View>
        </View>

        {recommendedProduct && (
          <View className="flex-row gap-3 rounded-2xl border border-app-border bg-app-surface-2 p-3.5">
            <Image
              source={{ uri: recommendedProduct.photos[0] }}
              className="h-[70px] w-[58px] rounded-[10px] bg-app-fill"
              resizeMode="cover"
            />
            <View className="flex-1 gap-1">
              <Text className="text-[9.5px] font-bold uppercase tracking-wide text-brand-green-deep">
                {t('compte.recoEyebrow')}
              </Text>
              <Text className="text-[12.5px] leading-[1.45] text-app-fg-2">
                {recommendedProduct.name}
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/produit/[id]',
                    params: { id: recommendedProduct.id },
                  })
                }>
                <Text className="text-[11.5px] font-semibold text-brand-green-deep">
                  {t('compte.recoCta')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => signOut()}
          disabled={isSigningOut}
          className="items-center rounded-xl border border-app-border py-3.5 disabled:opacity-50">
          <Text className="text-[13.5px] font-semibold text-app-fg">{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </Container>
  );
}
