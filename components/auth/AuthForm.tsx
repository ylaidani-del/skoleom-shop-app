import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSignIn, useSignUp } from '@/api/user';
import { GradientButton } from '@/components/ui/GradientButton';
import { LinearGradient } from '@/components/ui/LinearGradient';
import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';

interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

interface AuthFieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  fg3: string;
  children: React.ReactNode;
}

function AuthField({ icon, fg3, children }: AuthFieldProps) {
  return (
    <View className="h-[50px] flex-row items-center gap-2.5 rounded-xl border-[1.5px] border-app-border-2 bg-app-surface px-3.5">
      <Ionicons name={icon} size={17} color={fg3} />
      {children}
    </View>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useTranslation();
  const router = useRouter();
  const palette = PALETTES[useThemeStore((state) => state.mode)];
  const setSession = useUserStore((state) => state.setSession);
  const insets = useSafeAreaInsets();

  const { mutateAsync: signIn, isPending: isSigningIn } = useSignIn();
  const { mutateAsync: signUp, isPending: isSigningUp } = useSignUp();
  const isPending = isSigningIn || isSigningUp;

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<AuthFormValues>({
    defaultValues: { name: '', email: '', password: '' },
  });

  const isSignup = mode === 'signup';

  const onSubmit = async (values: AuthFormValues) => {
    setFormError(null);
    try {
      const response = isSignup
        ? await signUp({ ...values, role: 'acheteur' })
        : await signIn(values);
      setSession(response.data.user, response.data.jwt);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View className="flex-1 bg-app-bg">
      <View className="relative h-[46%] overflow-hidden">
        <Image
          source={require('@/assets/img/veste1.webp')}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.55)', palette.bg]}
          locations={[0, 0.55, 1]}
          className="absolute inset-0"
        />
        <LinearGradient
          colors={[palette.bg, 'transparent']}
          className="absolute inset-x-0 top-0 h-24"
        />

        <View className="gap-2.5 px-5" style={{ paddingTop: insets.top + 52 }}>
          <Image
            source={require('@/assets/logo.png')}
            className="h-10 w-10"
            resizeMode="contain"
          />
          <Text className="text-[9.5px] font-bold uppercase tracking-[2px] text-white/72">
            Skoleom · Watch. Click. Buy.®
          </Text>
          <Text className="max-w-[270px] text-[26px] font-bold leading-[1.12] tracking-tight text-white">
            {t(isSignup ? 'auth.signupHeadline' : 'auth.loginHeadline')}
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3.5 px-5 pb-8 pt-3.5">
        <View className="flex-row gap-1 rounded-full bg-app-fill p-1">
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            className={`h-[38px] flex-1 items-center justify-center rounded-full ${!isSignup ? 'bg-app-surface' : ''}`}>
            <Text
              className={`text-[13px] font-semibold ${!isSignup ? 'text-app-fg' : 'text-app-fg-2'}`}>
              {t('auth.login')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(auth)/register')}
            className={`h-[38px] flex-1 items-center justify-center rounded-full ${isSignup ? 'bg-app-surface' : ''}`}>
            <Text
              className={`text-[13px] font-semibold ${isSignup ? 'text-app-fg' : 'text-app-fg-2'}`}>
              {t('auth.register')}
            </Text>
          </Pressable>
        </View>

        {isSignup && (
          <View className="gap-1.5">
            <Text className="text-[11px] font-medium text-app-fg-2">{t('auth.name')}</Text>
            <AuthField icon="person-outline" fg3={palette.fg3}>
              <Controller
                control={control}
                name="name"
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Camille Rousseau"
                    placeholderTextColor={palette.fg3}
                    className="flex-1 text-[13.5px] text-app-fg"
                  />
                )}
              />
            </AuthField>
          </View>
        )}

        <View className="gap-1.5">
          <Text className="text-[11px] font-medium text-app-fg-2">{t('auth.email')}</Text>
          <AuthField icon="mail-outline" fg3={palette.fg3}>
            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="vous@exemple.fr"
                  placeholderTextColor={palette.fg3}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="flex-1 text-[13.5px] text-app-fg"
                />
              )}
            />
          </AuthField>
        </View>

        <View className="gap-1.5">
          <Text className="text-[11px] font-medium text-app-fg-2">{t('auth.password')}</Text>
          <AuthField icon="lock-closed-outline" fg3={palette.fg3}>
            <Controller
              control={control}
              name="password"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={palette.fg3}
                  className="flex-1 text-[13.5px] tracking-wide text-app-fg"
                />
              )}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={palette.fg3}
              />
            </Pressable>
          </AuthField>
        </View>

        {!isSignup && (
          <Text className="-mt-1 self-end text-[11.5px] font-medium text-app-fg-2">
            {t('auth.forgotPassword')}
          </Text>
        )}

        {formError && <Text className="text-center text-[12px] text-red-500">{formError}</Text>}

        <GradientButton
          label={t(isSignup ? 'auth.register' : 'auth.login')}
          disabled={isPending}
          onPress={handleSubmit(onSubmit)}
          className="h-[52px]"
        />

        <View className="flex-row items-center gap-3 py-0.5">
          <View className="h-px flex-1 bg-app-border" />
          <Text className="text-[10.5px] font-medium text-app-fg-3">{t('auth.or')}</Text>
          <View className="h-px flex-1 bg-app-border" />
        </View>

        <View className="flex-row gap-2.5">
          <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border-[1.5px] border-app-border-2 bg-app-surface">
            <Ionicons name="logo-apple" size={17} color={palette.fg} />
            <Text className="text-[13px] font-medium text-app-fg">Apple</Text>
          </View>
          <View className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border-[1.5px] border-app-border-2 bg-app-surface">
            <Ionicons name="logo-google" size={17} color={palette.fg} />
            <Text className="text-[13px] font-medium text-app-fg">Google</Text>
          </View>
        </View>

        <Text className="text-center text-[10.5px] leading-[1.5] text-app-fg-3">
          {t('auth.terms')}
        </Text>
      </ScrollView>
    </View>
  );
}
