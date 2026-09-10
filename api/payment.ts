import { useMutation } from '@tanstack/react-query';

import { SESYNC_BASE_URL, SesyncRoute } from './MyAxios';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
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

// A Stripe client secret is "pi_<id>_secret_<key>" — the id alone is the
// PaymentIntent id `/confirm` expects.
export const paymentIntentIdFromClientSecret = (clientSecret: string): string =>
  clientSecret.split('_secret_')[0];

// `/api/payment/popup` is not a JSON endpoint — verified live: it serves a
// full standalone HTML page (Stripe Elements card form + Apple/Google Pay
// Express Checkout) reading `clientSecret`/`amount` from the query string.
// It's meant to be opened in a browser, not fetched — hence a URL builder
// instead of a query hook.
export const getPaymentPopupUrl = (clientSecret: string, amount?: number): string => {
  const params = new URLSearchParams({ clientSecret });
  if (amount !== undefined) params.set('amount', String(amount));
  return `${SESYNC_BASE_URL}/api/payment/popup?${params.toString()}`;
};

/* ─────────────────────────────────────────────
   Cart checkout (one-off payments)
───────────────────────────────────────────── */

// Creates a Stripe PaymentIntent scoped to one cart. The card is then
// collected via the hosted popup page (`getPaymentPopupUrl`) opened in an
// in-app browser — there's no native Stripe SDK in this app, so the popup's
// own Stripe Elements form is what actually takes the card.
export const useCreatePaymentIntent = () =>
  useMutation<PaymentIntent, Error, { cartKey: string }>({
    mutationFn: async ({ cartKey }) => {
      const { data } = await SesyncRoute.post(`/api/payment/${cartKey}/create-intent`);
      return unwrap<PaymentIntent>(data);
    },
  });

// Asks the backend to check the PaymentIntent's live status with Stripe.
// Verified live: this returns a bare boolean body (not `{ success: true }`),
// so a truthy check on the raw response — not property access — is correct.
export const useConfirmPayment = () =>
  useMutation<boolean, Error, { paymentIntentId: string }>({
    mutationFn: async (payload) => {
      const { data } = await SesyncRoute.post('/api/payment/confirm', payload);
      return data === true || data === 'true';
    },
  });

/* ─────────────────────────────────────────────
   Subscriptions
───────────────────────────────────────────── */

export interface CheckoutSession {
  sessionId?: string;
  url?: string;
  [key: string]: unknown;
}

export const useSubscriptionCheckout = () =>
  useMutation<CheckoutSession, Error, Record<string, unknown> | void>({
    mutationFn: async (payload) => {
      const { data } = await SesyncRoute.post('/api/payment/subscriptions/checkout', payload ?? {});
      return unwrap<CheckoutSession>(data);
    },
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
