import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BackRoute } from './MyAxios';
import { useUserStore } from '../store/userStore';

export interface AuthResponse {
  success: boolean;
  data: {
    jwt: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  role: 'acheteur' | 'vendeur';
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export interface ResendOtpPayload {
  email: string;
}

export const useSignIn = () =>
  useMutation<AuthResponse, Error, SignInPayload>({
    mutationFn: async (payload) => {
      const { data } = await BackRoute.post<AuthResponse>('/auth/signin', payload);

      return data;
    },
  });

export const useSignUp = () =>
  useMutation<AuthResponse, Error, SignUpPayload>({
    mutationFn: async (payload) => {
      const { data } = await BackRoute.post<AuthResponse>('/auth/signup', payload);

      return data;
    },
  });

export const useVerifyOtp = () =>
  useMutation<{ success: boolean }, Error, VerifyOtpPayload>({
    mutationFn: async (payload) => {
      const { data } = await BackRoute.post('/auth/verify-otp', payload);

      return data;
    },
  });

export const useResendOtp = () =>
  useMutation<{ success: boolean }, Error, ResendOtpPayload>({
    mutationFn: async (payload) => {
      const { data } = await BackRoute.post('/auth/resend-otp', payload);

      return data;
    },
  });

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await BackRoute.post(
        '/auth/logout',
        {},
        {
          withCredentials: true,
        },
      );
    },

    onSettled: () => {
      useUserStore.getState().clearUser();

      queryClient.clear();
    },
  });
};

export const useAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await BackRoute.post(
        '/auth/account',
        {},
        {
          withCredentials: true,
        },
      );
    },

    onSettled: () => {
      queryClient.clear();
    },
  });
};

export interface Me {
  id: number;
  name: string;
  email: string;
  role: 'acheteur' | 'vendeur' | 'admin';
  seller?: { wpUserId?: string | number | null } | null;
}

export const useMe = () =>
  useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await BackRoute.get('/auth/account'); // GET, cookie envoyé (withCredentials déjà activé)
      return data?.data ?? null;
    },
    retry: false, // si 401 → pas de retry inutile
    staleTime: 5 * 60 * 1000,
  });

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<Me, Error, UpdateProfilePayload>({
    mutationFn: async (payload) => {
      const { data } = await BackRoute.patch('/auth/account', payload);
      return data?.data as Me;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
    },
  });
};
