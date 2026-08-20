import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { flattenProducts, useProducts } from '@/api/product';
import { Container } from '@/components/Container';
import { ProductCard } from '@/components/shop/ProductCard';
import { ScreenHeader } from '@/components/shop/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { useUserStore } from '@/store/userStore';

const POWER_ICONS = [
  'shirt-outline',
  'resize-outline',
  'chatbubble-ellipses-outline',
  'cube-outline',
] as const;

export default function AccueilTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  const query = useProducts({});
  const featured = flattenProducts(query.data).slice(0, 4);

  const powers = [1, 2, 3, 4].map((n) => ({
    icon: POWER_ICONS[n - 1],
    title: t(`accueil.power${n}Title`),
    body: t(`accueil.power${n}Body`),
  }));

  const rows = [featured.slice(0, 2), featured.slice(2, 4)].filter((row) => row.length > 0);

  return (
    <Container>
      <ScreenHeader
        title={
          user?.name
            ? t('accueil.greeting', { name: user.name.split(' ')[0] })
            : t('accueil.greetingDefault')
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-7 px-4 pb-10 pt-3">
        <View className="min-h-[392px] justify-end overflow-hidden rounded-2xl">
          <Image
            source={require('@/assets/img/veste1.webp')}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
            locations={[0, 0.48, 1]}
            className="absolute inset-0"
          />

          <View className="gap-3.5 p-5">
            <Text className="text-[9.5px] font-bold uppercase tracking-[2px] text-white/75">
              {t('accueil.heroEyebrow')}
            </Text>
            <Text className="text-[29px] font-bold leading-[1.08] tracking-tight text-white">
              {t('accueil.heroTitle')}
            </Text>
            <Text className="text-white/72 max-w-[280px] text-[13px] leading-[1.45]">
              {t('accueil.heroBody')}
            </Text>

            <View className="flex-row gap-2.5 pt-0.5">
              <GradientButton
                className="flex-1"
                icon="sparkles-outline"
                label={t('accueil.createAvatar')}
                onPress={() => router.push('/(drawer)/(tabs)/essayage')}
              />

              <Pressable
                onPress={() => router.push('/(drawer)/(tabs)/cataloge')}
                className="border-white/28 bg-white/14 items-center justify-center rounded-xl border px-4 py-3 active:opacity-80">
                <Text className="text-[13.5px] font-medium text-white">{t('accueil.explore')}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-baseline justify-between gap-2.5">
            <Text className="text-[17px] font-semibold tracking-tight text-app-fg">
              {t('accueil.powersTitle')}
            </Text>
            <Text className="text-[11px] font-medium text-app-fg-3">
              {t('accueil.powersIncluded')}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2.5 pr-4">
            {powers.map((power) => (
              <View
                key={power.title}
                className="w-[154px] gap-2.5 rounded-xl border border-app-border bg-app-surface p-3.5">
                <View className="h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-brand-green/10">
                  <Ionicons name={power.icon} size={17} color="#22b222" />
                </View>
                <Text className="text-[13px] font-semibold leading-tight text-app-fg">
                  {power.title}
                </Text>
                <Text className="text-[11.5px] leading-[1.4] text-app-fg-2">{power.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="gap-2.5">
          <View className="flex-row items-baseline justify-between gap-2.5">
            <Text className="text-[17px] font-semibold tracking-tight text-app-fg">
              {t('accueil.trendingTitle')}
            </Text>
            <Pressable onPress={() => router.push('/(drawer)/(tabs)/cataloge')}>
              <Text className="text-[11.5px] font-semibold text-brand-green-deep">
                {t('accueil.seeAll')}
              </Text>
            </Pressable>
          </View>
          <Text className="-mt-1 text-[11.5px] text-app-fg-3">{t('accueil.trendingSubtitle')}</Text>

          <View className="gap-3">
            {rows.map((row, index) => (
              <View key={index} className="flex-row gap-3">
                {row.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {row.length === 1 && <View className="flex-1" />}
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(drawer)/(tabs)/cataloge')}
          className="min-h-[172px] justify-end overflow-hidden rounded-2xl active:opacity-90">
          <Image
            source={require('@/assets/img/voiture.webp')}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.25)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="absolute inset-0"
          />
          <View className="gap-1 p-4">
            <Text className="text-[9.5px] font-bold uppercase tracking-[2px] text-brand-yellow">
              {t('accueil.wtbEyebrow')}
            </Text>
            <Text className="max-w-[230px] text-[16px] font-semibold leading-tight text-white">
              {t('accueil.wtbTitle')}
            </Text>
            <Text className="text-[11.5px] text-white/70">{t('accueil.wtbBody')}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </Container>
  );
}
