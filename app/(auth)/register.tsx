import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

import { useSignUp } from '@/api/user';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { TextField } from '@/components/TextField';
import { useUserStore } from '@/store/userStore';

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'acheteur' | 'vendeur';
};

export default function Register() {
  const { t } = useTranslation();
  const setSession = useUserStore((state) => state.setSession);
  const { mutateAsync: signUp, isPending } = useSignUp();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
  } = useForm<RegisterForm>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'acheteur' },
  });

  const onSubmit = async (values: RegisterForm) => {
    setFormError(null);
    try {
      const response = await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setSession(response.data.user, response.data.jwt);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Container>
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 text-center text-2xl font-bold">{t('auth.registerTitle')}</Text>

        <TextField
          control={control}
          name="name"
          label={t('auth.name')}
          rules={{ required: t('auth.required') }}
        />
        <TextField
          control={control}
          name="email"
          label={t('auth.email')}
          keyboardType="email-address"
          rules={{ required: t('auth.required') }}
        />
        <TextField
          control={control}
          name="password"
          label={t('auth.password')}
          secureTextEntry
          rules={{
            required: t('auth.required'),
            minLength: { value: 6, message: t('auth.passwordTooShort') },
          }}
        />
        <TextField
          control={control}
          name="confirmPassword"
          label={t('auth.confirmPassword')}
          secureTextEntry
          rules={{
            required: t('auth.required'),
            validate: (value: string) => value === watch('password') || t('auth.passwordMismatch'),
          }}
        />

        <Controller
          control={control}
          name="role"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6 flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 rounded-lg border p-3 ${value === 'acheteur' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                onPress={() => onChange('acheteur')}>
                <Text className="text-center">{t('auth.roleBuyer')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-lg border p-3 ${value === 'vendeur' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                onPress={() => onChange('vendeur')}>
                <Text className="text-center">{t('auth.roleSeller')}</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {formError && <Text className="mb-4 text-center text-red-500">{formError}</Text>}

        <Button
          title={t('auth.register')}
          disabled={isPending}
          onPress={handleSubmit(onSubmit)}
        />

        <Link href="/(auth)/login">
          <Text className="mt-6 text-center text-indigo-500">{t('auth.haveAccount')}</Text>
        </Link>
      </View>
    </Container>
  );
}
