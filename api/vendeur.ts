import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SesyncRoute } from './MyAxios';

export interface VendeurProduct {
  id: number;
  name: string;
  slug?: string;
  status?: string;
  price?: string;
  regular_price?: string;
  stock_status?: string;
  images?: Array<{ src: string }>;
}

export interface VendeurProductDetail {
  id: number;
  name: string;
  status?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  sku?: string;
  stock_status?: string;
  stock_quantity?: number | null;
  description?: string;
  short_description?: string;
  images?: Array<{ id?: number; src: string; alt?: string }>;
}

export interface ProductsResponse {
  data: VendeurProduct[];
  meta: { total: number; page: number; per_page: number; total_pages: number };
}

export interface VendeurOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  billing?: { first_name?: string; last_name?: string; email?: string };
  line_items?: Array<{ product_id: number; name: string; quantity: number; total: string }>;
}

export interface VendeurOrdersResponse {
  data: VendeurOrder[];
  meta: { total: number; page: number; per_page: number; total_pages: number; truncated: boolean };
}

export interface VendeurReview {
  id: number;
  product_id: number;
  reviewer: string;
  review: string;
  rating: number;
  date_created: string;
  status: string;
}

export function useVendeurProducts(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['vendeur', 'products', params],
    queryFn: async () => {
      const { data } = await SesyncRoute.get<ProductsResponse>('/vendeur/products', { params });
      return data;
    },
  });
}

export function useVendeurOrders(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['vendeur', 'orders', params],
    queryFn: async () => {
      const { data } = await SesyncRoute.get<VendeurOrdersResponse>('/vendeur/orders', {
        params,
      });
      return data;
    },
  });
}

export interface VendeurStats {
  linked: boolean;
  range: { months: number; since: string };
  truncated: { products: boolean; orders: boolean };
  products: { total: number; inStock: number; outOfStock: number; onBackorder: number };
  revenue: {
    total: number;
    currency: string;
    trendPct: number;
    up: boolean;
    monthly: { month: string; total: number }[];
    weekly: { week: string; total: number }[];
  };
  orders: {
    total: number;
    paid: number;
    trendPct: number;
    up: boolean;
    weekly: { week: string; count: number }[];
  };
  topProducts: { id: number; name: string; quantity: number; revenue: number }[];
}

export function useVendeurStats(months = 6) {
  return useQuery({
    queryKey: ['vendeur', 'stats', months],
    queryFn: async () => {
      const { data } = await SesyncRoute.get<VendeurStats>('/vendeur/stats', {
        params: { months },
      });
      return data;
    },
    staleTime: 60_000,
  });
}

export interface VendeurCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
}

interface RawCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
}

const asCategoryArray = (data: unknown): RawCategory[] => {
  if (Array.isArray(data)) return data as RawCategory[];
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as RawCategory[]) : [];
};

// Existing shop categories only — a product's `categories` must always be
// sent as `{ id }` (never `{ name }`), or WooCommerce silently creates a
// brand-new category instead of attaching to one that already exists.
export function useVendeurCategories() {
  return useQuery<VendeurCategory[]>({
    queryKey: ['vendeur', 'categories'],
    queryFn: async () => {
      const perPage = 100;
      const acc: VendeurCategory[] = [];
      for (let page = 1; page <= 20; page += 1) {
        const { data } = await SesyncRoute.get('/products/categories', {
          params: { per_page: perPage, page, orderby: 'name', order: 'asc' },
        });
        const batch = asCategoryArray(data).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parent: c.parent ?? 0,
        }));
        acc.push(...batch);
        if (batch.length < perPage) break;
      }
      return acc;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await SesyncRoute.post('/vendeur/products', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendeur', 'products'] });
    },
  });
}

export function useVendeurProduct(id: number | null) {
  return useQuery({
    queryKey: ['vendeur', 'product', id],
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await SesyncRoute.get<VendeurProductDetail>(`/products/${id}`);
      return data;
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => {
      const { data } = await SesyncRoute.patch<VendeurProductDetail>(`/products/${id}`, body);
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vendeur', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['vendeur', 'product', vars.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await SesyncRoute.delete(`/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendeur', 'products'] });
    },
  });
}
