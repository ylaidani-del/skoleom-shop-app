import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useSignIn } from '@/api/user';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { TextField } from '@/components/TextField';
import { useUserStore } from '@/store/userStore';

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const { t } = useTranslation();
  const setSession = useUserStore((state) => state.setSession);
  const { mutateAsync: signIn, isPending } = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: { email: 'youcef@gmail.com', password: 'a@gmail.com' },
  });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      const response = await signIn(values);
      setSession(response.data.user, response.data.jwt);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
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

        <Button title={t('auth.login')} disabled={isPending} onPress={handleSubmit(onSubmit)} />

        <Link href="/(auth)/register">
          <Text className="mt-6 text-center text-indigo-500">{t('auth.noAccount')}</Text>
        </Link>
      </View>
    </Container>
  );
}
