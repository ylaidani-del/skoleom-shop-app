import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/core/auth/AuthProvider';

type RegisterForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterForm) => {
    setFormError(null);
    const { error } = await signUp(values.email, values.password);
    if (error) setFormError(error);
  };

  return (
    <Container>
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 text-center text-2xl font-bold">{t('auth.registerTitle')}</Text>

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

        {formError && <Text className="mb-4 text-center text-red-500">{formError}</Text>}

        <Button
          title={t('auth.register')}
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        <Link href="/(auth)/login">
          <Text className="mt-6 text-center text-indigo-500">{t('auth.haveAccount')}</Text>
        </Link>
      </View>
    </Container>
  );
}
