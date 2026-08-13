import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { BackRoute } from './MyAxios';

function extractError(err: unknown): string {
  const axErr = err as AxiosError<{ error?: string }>;
  return axErr.response?.data?.error ?? `Erreur ${axErr.response?.status ?? ''}`.trim();
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
  typeSlug?: string;
  fabric?: string;
}

export interface TryOnInput {
  avatarId: string;
  product: Product;
  measurements: Measurements;
}

export interface TryOnPreview {
  tryOnId: number | null;
  fitScore: number | null;
  recommendedSize: string;
  comment: string;
  overlayUrl: string | null;
  resultPublicId: string | null;
  avatarUrl: string | null;
  garmentUrl: string | null;
  cached: boolean;
  saved: boolean;
}

export interface TryOnResponse {
  data: TryOnPreview;
}

export interface TryOnHistoryItem {
  id_tryon: number;
  product_name: string;
  product_brand: string | null;
  product_type: string | null;
  garment_url: string | null;
  avatar_url: string | null;
  result_url: string;
  fit_score: number | null;
  recommended_size: string | null;
  comment: string | null;
  createdAt: string;
}

export interface TryOnHistoryResponse {
  data: TryOnHistoryItem[];
}

export interface SaveTryOnInput {
  avatarId: string;
  product: Product;
  measurements: Measurements;
  overlayUrl: string;
  resultPublicId: string | null;
  avatarUrl: string | null;
  garmentUrl: string | null;
  fitScore: number | null;
  recommendedSize: string | null;
  comment: string | null;
}

const HISTORY_KEY = 'tryon-history';

export function useTryOn() {
  return useMutation<TryOnResponse, Error, TryOnInput>({
    mutationFn: async (input) => {
      try {
        const res = await BackRoute.post<TryOnResponse>('tryon', input);
        return res.data;
      } catch (err) {
        throw new Error(extractError(err));
      }
    },
  });
}

export function useSaveTryon() {
  const queryClient = useQueryClient();
  return useMutation<{ data: { tryOnId: number } }, Error, SaveTryOnInput>({
    mutationFn: async (input) => {
      try {
        const res = await BackRoute.post('tryon/save', input);
        return res.data;
      } catch (err) {
        throw new Error(extractError(err));
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY, vars.avatarId] });
    },
  });
}

export function useDiscardTryon() {
  return useMutation<{ ok: boolean }, Error, { resultPublicId: string | null }>({
    mutationFn: async ({ resultPublicId }) => {
      if (!resultPublicId) return { ok: true };
      try {
        const res = await BackRoute.post('tryon/discard', { resultPublicId });
        return res.data;
      } catch (err) {
        throw new Error(extractError(err));
      }
    },
  });
}

export function useTryonHistory(avatarId?: string) {
  return useQuery<TryOnHistoryResponse>({
    queryKey: [HISTORY_KEY, avatarId],
    enabled: !!avatarId,
    queryFn: async () => {
      const res = await BackRoute.get<TryOnHistoryResponse>(`tryon/history/${avatarId}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useDeleteTryon() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (tryonId: string) => {
      const res = await BackRoute.delete(`tryon/${tryonId}`);
      return res.data;
    },
    onMutate: async (tryonId) => {
      await queryClient.cancelQueries({ queryKey: [HISTORY_KEY] });
      const snapshots = queryClient.getQueriesData<TryOnHistoryResponse>({
        queryKey: [HISTORY_KEY],
      });
      snapshots.forEach(([key, value]) => {
        if (!value) return;
        queryClient.setQueryData<TryOnHistoryResponse>(key, {
          ...value,
          data: value.data.filter((i) => String(i.id_tryon) !== String(tryonId)),
        });
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      const c = ctx as
        { snapshots?: [readonly unknown[], TryOnHistoryResponse | undefined][] } | undefined;
      c?.snapshots?.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY] });
    },
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
      }>('ai/size', {
        productId,
        measurements,
      });
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const res = await BackRoute.get<{ productIds: number[] }>('api/ai/recommendations');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}
