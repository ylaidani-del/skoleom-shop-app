import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { BackRoute } from './MyAxios';
import { USAGE_KEY } from './usage';

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

function toApiError(err: unknown): ApiError {
  const axErr = err as AxiosError<{ error?: string; code?: string }>;
  const message = axErr.response?.data?.error ?? `Erreur ${axErr.response?.status ?? ''}`.trim();
  return new ApiError(message, axErr.response?.data?.code);
}

export interface Measurements {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  footLength: number;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  recommendedSize: string;
  image: string;
  type: string;
  fabric?: string;
}

export interface UserAvatarResponse {
  data: {
    avatarId: string;
    dbId: number;
    originalUrl: string;
    avatarUrl: string;
    measurements: Record<string, number | null>;
    usable: boolean;
  };
}

export interface CreateAvatarInput {
  photoBase64: string;
  measurements: Measurements;
}

export interface CreateAvatarResponse {
  data: {
    avatarId: string;
    avatarUrl?: string; // URL Cloudinary du jumeau généré
    bodyMap?: {
      shoulder: { y: number };
      chest: { y: number; width: number };
      waist: { y: number; width: number };
      hip: { y: number; width: number };
    };
    scanPoints?: { x: number; y: number; label: string }[];
  };
}

export function useCreateAvatar() {
  const queryClient = useQueryClient();
  return useMutation<CreateAvatarResponse, ApiError, CreateAvatarInput>({
    mutationFn: async (input) => {
      try {
        const res = await BackRoute.post<CreateAvatarResponse>(`avatar`, input);
        return res.data;
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [USAGE_KEY] }),
  });
}

export function useSize(productId: number | undefined, measurements: Measurements) {
  return useQuery({
    queryKey: ['ai-size', productId, measurements],
    enabled: !!productId,
    queryFn: async () => {
      const res = await BackRoute.post<{
        recommendedSize: string;
        fitScore: number;
        confidence: string;
      }>(`ai/size`, { productId, measurements });
      return res.data;
    },
    staleTime: 60_000,
  });
}

export interface UpdateAvatarInput {
  avatarId: string;
  measurements: Measurements;
}

export interface UpdateAvatarResponse {
  data: {
    avatarId: string;
    dbId: number;
    originalUrl: string;
    avatarUrl: string;
    measurements: Record<string, number | null>;
    usable: boolean;
  };
}

export function useUpdateAvatar() {
  return useMutation<UpdateAvatarResponse, ApiError, UpdateAvatarInput>({
    mutationFn: async ({ avatarId, measurements }) => {
      try {
        const res = await BackRoute.put<UpdateAvatarResponse>(`avatar/${avatarId}`, {
          measurements,
        });
        return res.data;
      } catch (err) {
        throw toApiError(err);
      }
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, { avatarId: string; userId: number | null }>({
    mutationFn: async ({ avatarId }) => {
      try {
        const res = await BackRoute.delete(`avatar/${avatarId}`);
        return res.data;
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (_data, { userId }) => {
      queryClient.setQueryData(['ai-avatar', 'user', userId], null);
      queryClient.invalidateQueries({ queryKey: [USAGE_KEY] });
    },
  });
}

export function useGetUserAvatar(userId: number | null) {
  return useQuery<UserAvatarResponse | null>({
    queryKey: ['ai-avatar', 'user', userId],
    enabled: !!userId,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const res = await BackRoute.get<UserAvatarResponse>(`avatar/user/${userId}`);
        return res.data;
      } catch (err) {
        const ax = err as AxiosError;
        if (ax.response?.status === 404) return null;
        throw toApiError(err);
      }
    },
  });
}
