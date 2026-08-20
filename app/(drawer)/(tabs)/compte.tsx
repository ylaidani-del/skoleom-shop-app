import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useProduct } from '@/api/product';
import { useMe, useSignOut, useUpdateProfile } from '@/api/user';
import { useRecommendations } from '@/api/tryon';
import { Container } from '@/components/Container';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';

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

  const { data: me } = useMe();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

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

  return (
    <Container>
      <ScreenHeader title={t('compte.title')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-4 pb-10 pt-2">
        <View className="gap-3.5 rounded-2xl border border-neutral-200 bg-white p-4">
          <View className="flex-row items-center gap-3.5">
            <View className="h-14 w-14 overflow-hidden rounded-full p-0.5">
              <LinearGradient
                colors={['#4bdd2c', '#dbea18']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <View className="m-0.5 flex-1 items-center justify-center rounded-full bg-neutral-100">
                <Text className="text-[17px] font-bold text-neutral-900">
                  {me?.name ? initials(me.name) : '—'}
                </Text>
              </View>
            </View>

            <View className="flex-1 gap-0.5">
              <Text className="text-[16px] font-semibold text-neutral-900">{me?.name}</Text>
              <Text className="text-[11.5px] text-neutral-500">
                {me?.role ? t(ROLE_KEYS[me.role] ?? 'auth.roleBuyer') : ''}
              </Text>
            </View>

            {!isEditing && (
              <Pressable
                onPress={startEditing}
                hitSlop={8}
                className="h-[34px] w-[34px] items-center justify-center rounded-full bg-neutral-100">
                <Ionicons name="pencil-outline" size={16} color="#555" />
              </Pressable>
            )}
          </View>

          {isEditing && (
            <View className="gap-2.5 border-t border-neutral-100 pt-3.5">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('auth.name')}
                className="rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[13px] text-neutral-900"
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.email')}
                autoCapitalize="none"
                keyboardType="email-address"
                className="rounded-lg border border-neutral-200 px-3.5 py-2.5 text-[13px] text-neutral-900"
              />
              <View className="flex-row gap-2.5">
                <Pressable
                  onPress={() => setIsEditing(false)}
                  className="flex-1 items-center rounded-lg border border-neutral-200 py-2.5">
                  <Text className="text-[13px] font-medium text-neutral-600">
                    {t('compte.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  disabled={isSaving}
                  className="flex-1 items-center rounded-lg bg-brand-black py-2.5 disabled:opacity-50">
                  <Text className="text-[13px] font-semibold text-white">{t('compte.save')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View className="flex-row gap-2.5">
          <View className="flex-1 items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 py-3.5">
            <Text className="text-[16px] font-bold tracking-tight text-neutral-900">
              {cartCount}
            </Text>
            <Text className="text-[9.5px] font-medium text-neutral-400">
              {t('compte.cartStat')}
            </Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 py-3.5">
            <Text className="text-[16px] font-bold tracking-tight text-neutral-900">
              {favoritesCount}
            </Text>
            <Text className="text-[9.5px] font-medium text-neutral-400">
              {t('compte.favoritesStat')}
            </Text>
          </View>
        </View>

        {recommendedProduct && (
          <View className="flex-row gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5">
            <Image
              source={{ uri: recommendedProduct.photos[0] }}
              className="h-[70px] w-[58px] rounded-[10px] bg-neutral-100"
              resizeMode="cover"
            />
            <View className="flex-1 gap-1">
              <Text className="text-[9.5px] font-bold uppercase tracking-wide text-brand-green-deep">
                {t('compte.recoEyebrow')}
              </Text>
              <Text className="text-[12.5px] leading-[1.45] text-neutral-600">
                {recommendedProduct.name}
              </Text>
              <Pressable onPress={() => router.push('/(drawer)/(tabs)/cataloge')}>
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
          className="items-center rounded-xl border border-neutral-200 py-3.5 disabled:opacity-50">
          <Text className="text-[13.5px] font-semibold text-neutral-900">{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </Container>
  );
}
