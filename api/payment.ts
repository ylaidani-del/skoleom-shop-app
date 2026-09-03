import { useMutation, useQuery } from '@tanstack/react-query';

import { SesyncRoute } from './MyAxios';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export interface CheckoutSession {
  sessionId?: string;
  url?: string;
  clientSecret?: string;
  [key: string]: unknown;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId?: string;
  [key: string]: unknown;
}

export interface ConfirmPaymentPayload {
  sessionId?: string;
  paymentIntentId?: string;
  [key: string]: unknown;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

// Backend wraps some responses as `{ data: T }`, others return T directly.
const unwrap = <T>(payload: unknown): T =>
  (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)
    ? (payload as { data: T }).data
    : payload) as T;

/* ─────────────────────────────────────────────
   Cart checkout (one-off payments)
───────────────────────────────────────────── */

export interface CreateCheckoutSessionPayload {
  cartKey: string;
  [key: string]: unknown;
}

// Hosted Stripe Checkout — redirect the user to `session.url` (WebBrowser.openBrowserAsync)
// and rely on `/api/payment/success` + the Stripe webhook to settle the order.
export const useCreateCheckoutSession = () =>
  useMutation<CheckoutSession, Error, CreateCheckoutSessionPayload>({
    mutationFn: async (payload) => {
      const { data } = await SesyncRoute.post('/api/payment/create-checkout-session', payload);
      return unwrap<CheckoutSession>(data);
    },
  });

// Native in-app payment sheet flow — returns a PaymentIntent client secret scoped to one cart.
export const useCreatePaymentIntent = () =>
  useMutation<PaymentIntent, Error, { cartKey: string }>({
    mutationFn: async ({ cartKey }) => {
      const { data } = await SesyncRoute.post(`/api/payment/${cartKey}/create-intent`);
      return unwrap<PaymentIntent>(data);
    },
  });

export const useConfirmPayment = () =>
  useMutation<unknown, Error, ConfirmPaymentPayload>({
    mutationFn: async (payload) => {
      const { data } = await SesyncRoute.post('/api/payment/confirm', payload);
      return unwrap(data);
    },
  });

export const usePaymentPopup = (options?: { enabled?: boolean }) =>
  useQuery<Record<string, unknown>>({
    queryKey: ['payment', 'popup'],
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/payment/popup');
      return unwrap(data);
    },
    enabled: options?.enabled ?? false,
  });

export const usePaymentSuccess = (options?: { enabled?: boolean }) =>
  useQuery<Record<string, unknown>>({
    queryKey: ['payment', 'success'],
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/payment/success');
      return unwrap(data);
    },
    enabled: options?.enabled ?? false,
    retry: false,
  });

/* ─────────────────────────────────────────────
   Subscriptions
───────────────────────────────────────────── */

export const useSubscriptionCheckout = () =>
  useMutation<CheckoutSession, Error, Record<string, unknown> | void>({
    mutationFn: async (payload) => {
      const { data } = await SesyncRoute.post('/api/payment/subscriptions/checkout', payload ?? {});
      return unwrap<CheckoutSession>(data);
    },
  });

export const useSubscriptionPopup = (options?: { enabled?: boolean }) =>
  useQuery<Record<string, unknown>>({
    queryKey: ['payment', 'subscription-popup'],
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/payment/subscription-popup');
      return unwrap(data);
    },
    enabled: options?.enabled ?? false,
  });

export const useCancelPaymentSubscription = () =>
  useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const { data } = await SesyncRoute.post('/api/payment/subscriptions/cancel');
      return unwrap(data);
    },
  });

export const useResumePaymentSubscription = () =>
  useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const { data } = await SesyncRoute.post('/api/payment/subscriptions/resume');
      return unwrap(data);
    },
  });

export const useChangeSubscriptionPlan = () =>
  useMutation<unknown, Error, { planId: string | number }>({
    mutationFn: async (payload) => {
      const { data } = await SesyncRoute.post('/api/payment/subscriptions/change-plan', payload);
      return unwrap(data);
    },
  });

// Note: POST /api/payment/webhooks/stripe is called by Stripe directly against
// the server — it has no client-side hook.
