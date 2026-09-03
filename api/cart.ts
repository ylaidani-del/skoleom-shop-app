import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCartKeyStore } from '@/store/cartKeyStore';

import { SesyncRoute } from './MyAxios';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export interface CartItem {
  item_key: string;
  id: number;
  name: string;
  quantity: number;
  price: string;
  line_subtotal?: string;
  line_total?: string;
  image?: string;
  variation?: Record<string, string>;
  [key: string]: unknown;
}

export interface CartTotals {
  subtotal: string;
  shipping_total?: string;
  discount_total?: string;
  tax_total?: string;
  total: string;
  [key: string]: unknown;
}

export interface Cart {
  cart_key: string;
  items: CartItem[];
  item_count: number;
  coupons?: string[];
  needs_payment?: boolean;
  needs_shipping?: boolean;
  shipping?: Record<string, unknown>;
  totals: CartTotals;
  [key: string]: unknown;
}

export interface ShippingZone {
  id: number;
  name: string;
  order?: number;
  [key: string]: unknown;
}

export interface ShippingMethod {
  id: string;
  title: string;
  cost?: string;
  [key: string]: unknown;
}

export interface RelayPoint {
  id: string;
  name: string;
  address?: string;
  city?: string;
  [key: string]: unknown;
}

export interface EkanMethod {
  id: string;
  title: string;
  cost?: string;
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

const storeCart = (cart: Cart) => {
  if (cart?.cart_key) useCartKeyStore.getState().setCartKey(cart.cart_key);
  return cart;
};

// Ensures a CoCart session exists before an item is added, so callers never
// have to create the cart themselves before their first "add to cart".
async function ensureCartKey(): Promise<string> {
  const existing = useCartKeyStore.getState().cartKey;
  if (existing) return existing;

  const { data } = await SesyncRoute.post('/api/cart/create');
  const cart = unwrap<Cart>(data);
  storeCart(cart);
  return cart.cart_key;
}

/* ─────────────────────────────────────────────
   Query keys
───────────────────────────────────────────── */

export const cartKeys = {
  all: ['cart'] as const,
  detail: (cartKey?: string | null) => ['cart', cartKey] as const,
  ekanMethods: (cartKey?: string | null) => ['cart', cartKey, 'ekan-methods'] as const,
  shippingZones: ['cart', 'shipping', 'zones'] as const,
  shippingMethods: ['cart', 'shipping', 'methods'] as const,
  shippingMethodsByCountry: (country?: string) =>
    ['cart', 'shipping', 'methods', 'by-country', country] as const,
  zoneMethods: (zoneId?: number | string) =>
    ['cart', 'shipping', 'zones', zoneId, 'methods'] as const,
  relayPoints: (params?: Record<string, unknown>) =>
    ['cart', 'shipping', 'relay-points', params] as const,
};

/* ─────────────────────────────────────────────
   Cart lifecycle
───────────────────────────────────────────── */

export const useCreateCart = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, void>({
    mutationFn: async () => {
      const { data } = await SesyncRoute.post('/api/cart/create');
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => {
      storeCart(cart);
      qc.setQueryData(cartKeys.detail(cart.cart_key), cart);
    },
  });
};

export const useCart = (options?: { enabled?: boolean }) => {
  const cartKey = useCartKeyStore((state) => state.cartKey);

  return useQuery<Cart>({
    queryKey: cartKeys.detail(cartKey),
    queryFn: async () => {
      const { data } = await SesyncRoute.get(`/api/cart/${cartKey}`);
      return unwrap<Cart>(data);
    },
    enabled: !!cartKey && (options?.enabled ?? true),
    staleTime: 30 * 1000,
  });
};

export const useClearCart = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, void>({
    mutationFn: async () => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/clear`);
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

export interface LinkCustomerPayload {
  customer_id: number | string;
}

export const useLinkCustomer = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, LinkCustomerPayload>({
    mutationFn: async (payload) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/link-customer`, payload);
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

/* ─────────────────────────────────────────────
   Cart items
───────────────────────────────────────────── */

export interface AddCartItemPayload {
  id: number | string;
  quantity?: number;
  variation?: Record<string, string>;
}

export const useAddCartItem = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, AddCartItemPayload>({
    mutationFn: async (payload) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/items/add`, payload);
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => {
      storeCart(cart);
      qc.setQueryData(cartKeys.detail(cart.cart_key), cart);
    },
  });
};

export interface UpdateCartItemPayload {
  itemKey: string;
  quantity: number;
}

export const useUpdateCartItem = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, UpdateCartItemPayload>({
    mutationFn: async ({ itemKey, quantity }) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/items/${itemKey}/update`, {
        quantity,
      });
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

export const useRemoveCartItem = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, { itemKey: string }>({
    mutationFn: async ({ itemKey }) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.delete(`/api/cart/${cartKey}/items/${itemKey}/remove`);
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

/* ─────────────────────────────────────────────
   Cart-level update & coupons
───────────────────────────────────────────── */

export type UpdateCartPayload = Record<string, unknown>;

export const useUpdateCart = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, UpdateCartPayload>({
    mutationFn: async (payload) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/update`, payload);
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

export const useApplyCoupon = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, { coupon: string }>({
    mutationFn: async (payload) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/coupon`, payload);
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

export const useRemoveCoupon = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, { coupon: string }>({
    mutationFn: async ({ coupon }) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.delete(`/api/cart/${cartKey}/coupon`, {
        params: { coupon },
      });
      return unwrap<Cart>(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

/* ─────────────────────────────────────────────
   Shipping
───────────────────────────────────────────── */

export const useShippingZones = () =>
  useQuery<ShippingZone[]>({
    queryKey: cartKeys.shippingZones,
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/zones');
      return unwrap<ShippingZone[]>(data);
    },
    staleTime: 10 * 60 * 1000,
  });

export const useShippingMethods = () =>
  useQuery<ShippingMethod[]>({
    queryKey: cartKeys.shippingMethods,
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/methods');
      return unwrap<ShippingMethod[]>(data);
    },
    staleTime: 10 * 60 * 1000,
  });

export const useShippingMethodsByCountry = (country?: string) =>
  useQuery<ShippingMethod[]>({
    queryKey: cartKeys.shippingMethodsByCountry(country),
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/methods/by-country', {
        params: { country },
      });
      return unwrap<ShippingMethod[]>(data);
    },
    enabled: !!country,
    staleTime: 10 * 60 * 1000,
  });

export const useZoneShippingMethods = (zoneId?: number | string) =>
  useQuery<ShippingMethod[]>({
    queryKey: cartKeys.zoneMethods(zoneId),
    queryFn: async () => {
      const { data } = await SesyncRoute.get(`/api/cart/shipping/zones/${zoneId}/methods`);
      return unwrap<ShippingMethod[]>(data);
    },
    enabled: !!zoneId,
    staleTime: 10 * 60 * 1000,
  });

export const useRelayPoints = (params?: { country?: string; city?: string }) =>
  useQuery<RelayPoint[]>({
    queryKey: cartKeys.relayPoints(params),
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/relay-points', { params });
      return unwrap<RelayPoint[]>(data);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useEkanMethods = () => {
  const cartKey = useCartKeyStore((state) => state.cartKey);

  return useQuery<EkanMethod[]>({
    queryKey: cartKeys.ekanMethods(cartKey),
    queryFn: async () => {
      const { data } = await SesyncRoute.get(`/api/cart/${cartKey}/ekan-methods`);
      return unwrap<EkanMethod[]>(data);
    },
    enabled: !!cartKey,
    staleTime: 5 * 60 * 1000,
  });
};

export interface AssignOrderShippingPayload {
  method_id: string;
  [key: string]: unknown;
}

export const useAssignOrderShipping = () =>
  useMutation<unknown, Error, { orderId: number | string; payload: AssignOrderShippingPayload }>({
    mutationFn: async ({ orderId, payload }) => {
      const { data } = await SesyncRoute.post(`/api/cart/order/${orderId}/shipping`, payload);
      return unwrap(data);
    },
  });
