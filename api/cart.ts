import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCartKeyStore } from '@/store/cartKeyStore';

import { SesyncRoute } from './MyAxios';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

// The Sesync/CoCart response shape as it actually comes over the wire —
// verified live: `quantity` is an object, and money fields are inconsistently
// scaled (see `toMoney` below), never a clean plain number.
interface RawCartItem {
  item_key: string;
  id: number;
  name: string;
  quantity: number | { value: number; min_purchase?: number; max_purchase?: number };
  price: string | number;
  price_regular?: string | number;
  price_sale?: string | number;
  price_discounted?: string | number;
  is_discounted?: boolean;
  totals?: {
    subtotal?: string | number;
    subtotal_tax?: string | number;
    total?: string | number;
    tax?: string | number;
  };
  featured_image?: string;
  image?: string;
  meta?: { variation?: Record<string, unknown> };
  variation?: Record<string, string>;
  [key: string]: unknown;
}

interface RawCartTotals {
  subtotal?: string | number;
  subtotal_tax?: string | number;
  shipping_total?: string | number;
  shipping_tax?: string | number;
  discount_total?: string | number;
  discount_tax?: string | number;
  total?: string | number;
  total_tax?: string | number;
  [key: string]: unknown;
}

interface RawCart {
  cart_key: string;
  items: RawCartItem[];
  item_count: number;
  coupons?: string[];
  needs_payment?: boolean;
  needs_shipping?: boolean;
  shipping?: Record<string, unknown>;
  totals: RawCartTotals;
  [key: string]: unknown;
}

// Normalized shapes the UI can trust: `quantity` is always a plain number,
// every money field is always a plain decimal number in EUR.
export interface CartItem {
  item_key: string;
  id: number;
  name: string;
  quantity: number;
  price: number;
  price_regular?: number;
  price_sale?: number;
  price_discounted?: number;
  is_discounted?: boolean;
  line_subtotal: number;
  line_subtotal_tax: number;
  line_total: number;
  line_tax: number;
  image?: string;
  variation?: Record<string, string>;
  [key: string]: unknown;
}

export interface CartTotals {
  subtotal: number;
  subtotal_tax: number;
  shipping_total: number;
  shipping_tax: number;
  discount_total: number;
  discount_tax: number;
  total: number;
  total_tax: number;
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

// The real WooCommerce shipping-method REST object has no flat `cost` field —
// it's buried in `settings.cost.value` (flat_rate) or `settings.shipping_rates.value`
// (a weight-tiered rate table, sometimes JSON-encoded as a string) for carrier
// methods like Colissimo/Mondial Relay. Verified live against both
// `/shipping/methods` and `/shipping/zones/{id}/methods`.
interface RawShippingMethod {
  id: number | string;
  method_id: string;
  title: string;
  method_title?: string;
  enabled?: boolean;
  order?: number;
  settings?: {
    cost?: { value?: string | number | null };
    shipping_rates?: { value?: unknown };
  };
  [key: string]: unknown;
}

export interface ShippingMethod {
  id: string;
  method_id: string;
  title: string;
  enabled: boolean;
  // A known, exact cost (free shipping, or a plain flat-rate amount).
  cost?: number;
  // A tiered/weight-based carrier only gives us its cheapest tier client-side —
  // the true cost depends on cart weight, which the backend computes once this
  // method is actually assigned to the cart. `costIsEstimate` tells the UI to
  // label it "from X€" instead of presenting it as final.
  costIsEstimate?: boolean;
  [key: string]: unknown;
}

export interface RelayPoint {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  distanceKm?: number;
  [key: string]: unknown;
}

export interface EkanMethod {
  id: string;
  title: string;
  cost?: number;
  [key: string]: unknown;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

// Backend wraps some responses as `{ data: T }`, others return T directly.
// Note: some error responses (e.g. WP REST errors) ALSO carry a `data` key
// (`{ code, message, data: { status } }`), so a caller expecting an array must
// still go through `toArray` below rather than trust this blindly.
const unwrap = <T>(payload: unknown): T =>
  (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)
    ? (payload as { data: T }).data
    : payload) as T;

// Guards every list-shaped response: an error payload that slips past `unwrap`
// (see note above) is an object, not an array — spreading or mapping it
// directly is what throws "iterator method is not callable" / "x.map is not
// a function". Coercing to [] here makes that class of crash impossible.
const toArray = <T>(v: unknown): T[] => (Array.isArray(v) ? v : []);

// The cart response scales money inconsistently: a field sent as a JSON
// *string* is in minor units (cents) and needs /100; a field sent as a JSON
// *number* is already a decimal amount. Verified live — every price field on
// a cart response follows this rule with no exceptions found.
const toMoney = (v: unknown): number => {
  if (typeof v === 'string') return (Number(v) || 0) / 100;
  if (typeof v === 'number') return v;
  return 0;
};

const toQuantity = (v: RawCartItem['quantity']): number =>
  typeof v === 'number' ? v : (v?.value ?? 0);

const normalizeCartItem = (item: RawCartItem): CartItem => ({
  ...item,
  quantity: toQuantity(item.quantity),
  price: toMoney(item.price),
  price_regular: item.price_regular !== undefined ? toMoney(item.price_regular) : undefined,
  price_sale: item.price_sale !== undefined ? toMoney(item.price_sale) : undefined,
  price_discounted:
    item.price_discounted !== undefined ? toMoney(item.price_discounted) : undefined,
  line_subtotal: toMoney(item.totals?.subtotal),
  line_subtotal_tax: toMoney(item.totals?.subtotal_tax),
  line_total: toMoney(item.totals?.total),
  line_tax: toMoney(item.totals?.tax),
  image: item.featured_image ?? item.image,
});

const normalizeCart = (cart: RawCart): Cart => ({
  ...cart,
  items: (cart.items ?? []).map(normalizeCartItem),
  totals: {
    ...cart.totals,
    subtotal: toMoney(cart.totals?.subtotal),
    subtotal_tax: toMoney(cart.totals?.subtotal_tax),
    shipping_total: toMoney(cart.totals?.shipping_total),
    shipping_tax: toMoney(cart.totals?.shipping_tax),
    discount_total: toMoney(cart.totals?.discount_total),
    discount_tax: toMoney(cart.totals?.discount_tax),
    total: toMoney(cart.totals?.total),
    total_tax: toMoney(cart.totals?.total_tax),
  },
});

const unwrapCart = (payload: unknown): Cart => normalizeCart(unwrap<RawCart>(payload));

const storeCart = (cart: Cart) => {
  if (cart?.cart_key) useCartKeyStore.getState().setCartKey(cart.cart_key);
  return cart;
};

// Single source of truth for creating a CoCart session — every other helper
// that needs a fresh cart goes through this instead of calling the endpoint itself.
async function createCart(): Promise<Cart> {
  const { data } = await SesyncRoute.post('/api/cart/create');
  const cart = unwrapCart(data);
  storeCart(cart);
  return cart;
}

// Ensures a CoCart session exists before an item is added, so callers never
// have to create the cart themselves before their first "add to cart".
//
// Note: the Sesync backend never 404s on an unknown cart_key — POSTing to
// `/cart/{anything}/items/add` silently adopts/creates a session under that
// key. So a "retry with a fresh cart on error" strategy was tried and dropped:
// a 500 here is a deterministic business error (e.g. a variable product added
// without a variation), not a stale session, and swapping in a new empty cart
// on every such error would silently orphan whatever was already in the cart.
async function ensureCartKey(): Promise<string> {
  const existing = useCartKeyStore.getState().cartKey;
  if (existing) return existing;
  const cart = await createCart();
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
    mutationFn: createCart,
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

export const useCart = (options?: { enabled?: boolean }) => {
  const cartKey = useCartKeyStore((state) => state.cartKey);

  return useQuery<Cart>({
    queryKey: cartKeys.detail(cartKey),
    queryFn: async () => {
      const { data } = await SesyncRoute.get(`/api/cart/${cartKey}`);
      return unwrapCart(data);
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
      return unwrapCart(data);
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
      return unwrapCart(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

/* ─────────────────────────────────────────────
   Cart items
───────────────────────────────────────────── */

export interface AddCartItemPayload {
  productId: number | string;
  quantity?: number;
  variation?: Record<string, string>;
}

export const useAddCartItem = () => {
  const qc = useQueryClient();
  return useMutation<Cart, Error, AddCartItemPayload>({
    mutationFn: async ({ productId, quantity, variation }) => {
      const cartKey = await ensureCartKey();
      const { data } = await SesyncRoute.post(`/api/cart/${cartKey}/items/add`, {
        productId,
        quantity: quantity ?? 1,
        ...(variation ? { variation } : {}),
      });
      return unwrapCart(data);
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
      return unwrapCart(data);
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
      return unwrapCart(data);
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
      return unwrapCart(data);
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
      return unwrapCart(data);
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
      return unwrapCart(data);
    },
    onSuccess: (cart) => qc.setQueryData(cartKeys.detail(cart.cart_key), cart),
  });
};

/* ─────────────────────────────────────────────
   Shipping
───────────────────────────────────────────── */

// `shipping_rates` comes back as an actual array for some methods and as a
// JSON-encoded string for others — verified live on the same endpoint
// (Colissimo-with-signature vs. Colissimo-without-signature).
const parseShippingRates = (
  value: unknown
): { price?: string | number; shipping_class?: string[] }[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeShippingMethod = (raw: RawShippingMethod): ShippingMethod => {
  const rawCost = raw.settings?.cost?.value;
  const numericFlatCost =
    rawCost !== undefined && rawCost !== null && rawCost !== '' && !Number.isNaN(Number(rawCost))
      ? Number(rawCost)
      : undefined;

  const rates = parseShippingRates(raw.settings?.shipping_rates?.value);
  // Some rate tables mix general weight tiers with a shipping-class-specific
  // override (e.g. a discounted rate for one product category) — verified
  // live where the class-specific tier was cheaper than the real starting
  // price. Prefer the general ("all" classes) tiers for the estimate; only
  // fall back to every tier if the method has no general tier at all (in
  // which case the estimate is inherently unreliable — see `hasGeneralRate`).
  const generalRates = rates.filter(
    (r) => !r.shipping_class || r.shipping_class.length === 0 || r.shipping_class.includes('all')
  );
  const hasGeneralRate = generalRates.length > 0;
  const ratesForEstimate = hasGeneralRate ? generalRates : rates;
  const cheapestRate = ratesForEstimate.length
    ? Math.min(...ratesForEstimate.map((r) => Number(r.price) || 0))
    : undefined;

  const cost = raw.method_id === 'free_shipping' ? 0 : (numericFlatCost ?? cheapestRate);

  return {
    ...raw,
    id: String(raw.id),
    method_id: raw.method_id,
    title: raw.title || raw.method_title || '',
    enabled: raw.enabled ?? true,
    cost,
    costIsEstimate: cost !== undefined && numericFlatCost === undefined && cheapestRate !== undefined,
    // Internal ranking hint for `dedupeShippingMethods`, not shown in the UI:
    // an exact flat cost, then a general-tier estimate, then (least
    // trustworthy) a rate table with only shipping-class-restricted tiers.
    _rank: numericFlatCost !== undefined ? 2 : hasGeneralRate ? 1 : 0,
  };
};

// The catalogue often has several near-duplicate zone configurations (test
// zones, leftover staging setups) exposing the same carrier under different
// method ids/costs/rate tables. Since the UI shows methods without making
// the user pick a zone first, collapse duplicates by `method_id`, preferring
// the most trustworthy cost source (see `_rank` above) and only using price
// as a tiebreaker between equally-trustworthy duplicates.
export const dedupeShippingMethods = (methods: ShippingMethod[]): ShippingMethod[] => {
  const byMethodId = new Map<string, ShippingMethod>();
  for (const method of methods) {
    if (!method.enabled) continue;
    const existing = byMethodId.get(method.method_id);
    const rank = Number(method._rank ?? 0);
    const existingRank = Number(existing?._rank ?? -1);
    if (
      !existing ||
      rank > existingRank ||
      (rank === existingRank && (method.cost ?? Infinity) < (existing.cost ?? Infinity))
    ) {
      byMethodId.set(method.method_id, method);
    }
  }
  return [...byMethodId.values()];
};

export const useShippingZones = () =>
  useQuery<ShippingZone[]>({
    queryKey: cartKeys.shippingZones,
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/zones');
      return toArray<ShippingZone>(unwrap(data));
    },
    staleTime: 10 * 60 * 1000,
  });

export const useShippingMethods = () =>
  useQuery<ShippingMethod[]>({
    queryKey: cartKeys.shippingMethods,
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/methods');
      return toArray<RawShippingMethod>(unwrap(data)).map(normalizeShippingMethod);
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
      return toArray<RawShippingMethod>(unwrap(data)).map(normalizeShippingMethod);
    },
    enabled: !!country,
    staleTime: 10 * 60 * 1000,
  });

export const useZoneShippingMethods = (zoneId?: number | string) =>
  useQuery<ShippingMethod[]>({
    queryKey: cartKeys.zoneMethods(zoneId),
    queryFn: async () => {
      const { data } = await SesyncRoute.get(`/api/cart/shipping/zones/${zoneId}/methods`);
      return toArray<RawShippingMethod>(unwrap(data)).map(normalizeShippingMethod);
    },
    // `zoneId` can legitimately be 0 ("Locations not covered by your other
    // zones"), so this must check for undefined, not falsiness.
    enabled: zoneId !== undefined,
    staleTime: 10 * 60 * 1000,
  });

export const useRelayPoints = (params?: { postcode?: string; country?: string; city?: string }) =>
  useQuery<RelayPoint[]>({
    queryKey: cartKeys.relayPoints(params),
    queryFn: async () => {
      const { data } = await SesyncRoute.get('/api/cart/shipping/relay-points', { params });
      return toArray<RelayPoint>(unwrap(data));
    },
    // The endpoint requires a postcode — don't call it without one.
    enabled: !!params?.postcode,
    staleTime: 5 * 60 * 1000,
  });

export const useEkanMethods = () => {
  const cartKey = useCartKeyStore((state) => state.cartKey);

  return useQuery<EkanMethod[]>({
    queryKey: cartKeys.ekanMethods(cartKey),
    queryFn: async () => {
      const { data } = await SesyncRoute.get(`/api/cart/${cartKey}/ekan-methods`);
      return toArray<EkanMethod>(unwrap(data));
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
