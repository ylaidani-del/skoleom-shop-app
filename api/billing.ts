import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BackRoute } from './MyAxios';

export interface SubscriptionData {
  id: number;
  amount: number;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  planRole: 'acheteur' | 'vendeur';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
}

export const useSubscription = () =>
  useQuery<SubscriptionData | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await BackRoute.get('/subscription');
      return (data?.data ?? data) || null;
    },
    retry: false,
    staleTime: 60 * 1000,
  });

export interface CheckoutSession {
  clientSecret: string;
  sessionId: string;
  url?: string;
}

export const useCheckout = () =>
  useMutation<CheckoutSession, Error, void>({
    mutationFn: async () => {
      const { data } = await BackRoute.post('/billing/checkout', {});
      return { clientSecret: data?.clientSecret, sessionId: data?.sessionId, url: data?.url };
    },
  });

export const useConfirmCheckout = () => {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { sessionId: string }>({
    mutationFn: async ({ sessionId }) => {
      const { data } = await BackRoute.post('/billing/confirm', { sessionId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { resume?: boolean } | void>({
    mutationFn: async (payload) => {
      const { data } = await BackRoute.post('/billing/cancel', payload ?? {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
};
