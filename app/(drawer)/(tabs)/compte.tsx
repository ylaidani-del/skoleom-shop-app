import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useGetUserAvatar } from '@/api/avatar';
import { useCancelSubscription, useCheckout, useSubscription } from '@/api/billing';
import { useProduct } from '@/api/product';
import { useMe, useSignOut, useUpdateProfile } from '@/api/user';
import { useRecommendations } from '@/api/tryon';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { PALETTES } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
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

export default function CompteTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  const { data: me } = useMe();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { data: avatarResponse } = useGetUserAvatar(me?.id ?? null);
  const avatar = avatarResponse?.data ?? null;

  const { data: subscription, isLoading: isSubLoading } = useSubscription();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();

  const cartCount = useCartStore((state) => state.totalCount());
  const favoritesCount = useFavoritesStore((state) => state.ids.length);

  const { data: recommendations } = useRecommendations();
  const recommendedId = recommendations?.productIds?.[0];
  const { data: recommendedProduct } = useProduct(recommendedId ? String(recommendedId) : '');

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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
                onPress={() => router.push('/(drawer)/(tabs)/essayage')}
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
