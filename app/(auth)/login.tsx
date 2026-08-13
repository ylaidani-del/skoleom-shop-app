import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/core/auth/AuthProvider';

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) setFormError(error);
  };

  return (
    <Container>
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 text-center text-2xl font-bold">{t('auth.loginTitle')}</Text>

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
          rules={{ required: t('auth.required') }}
        />

        {formError && <Text className="mb-4 text-center text-red-500">{formError}</Text>}

        <Button title={t('auth.login')} disabled={isSubmitting} onPress={handleSubmit(onSubmit)} />

        <Link href="/(auth)/register">
          <Text className="mt-6 text-center text-indigo-500">{t('auth.noAccount')}</Text>
        </Link>
      </View>
    </Container>
  );
}
