import { useInfiniteQuery, useQueries, useQuery, keepPreviousData } from '@tanstack/react-query';
import { ShopRoute } from './MyAxios';
export interface WooTaxonomyRef {
  id: number;
  name: string;
  slug: string;
  parent?: number;
}

export interface BackendProduct {
  id: number;
  title: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  sku: string;
  stock_quantity: number | null;
  is_in_stock: boolean;
  description: string;
  short_description: string;
  categories: WooTaxonomyRef[];
  brands: WooTaxonomyRef[];
  tags: unknown[];
  images: string[];
  featured_image: string;
}

export interface BackendProductsResponse {
  status: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  data: BackendProduct[];
}

interface RawTaxonomyItem {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  count?: number;
  image?: {
    src?: string;
    url?: string;
  };
}

export interface WooImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  regularPrice: number;
  salePrice: number;
  onSale: boolean;
  inStock: boolean;
  sku: string;
  short_description?: string;
  brands?: WooTaxonomyRef[];
  external_url?: string;
  photos: string[];
  images: WooImage[];
  brand?: string;
  brandSlug?: string;
  categories?: WooTaxonomyRef[];
  type?: string;
  typeSlug?: string;
  slug?: string;
  recommendedSize?: string;
  fabric?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPage {
  items: WooProduct[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

/* ─────────────────────────────────────────────
   Filtres
───────────────────────────────────────────── */

export type SortKey = 'reco' | 'price-asc' | 'price-desc' | 'name' | 'newest';

export interface ProductFilters {
  /** envoyés au serveur (déclenchent un refetch) */
  search?: string;
  brand?: number | string;
  category?: number | string;
}

const PER_PAGE = 24;

/* ─────────────────────────────────────────────
   Mapping backend → front
───────────────────────────────────────────── */

const toNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const mapProduct = (p: BackendProduct): WooProduct => {
  const gallery = [p.featured_image, ...(p.images ?? [])].filter(Boolean) as string[];
  const regularPrice = toNumber(p.regular_price || p.price);
  const salePrice = toNumber(p.sale_price);
  const price = toNumber(p.price);

  return {
    id: String(p.id),
    name: p.title,
    description: p.description ?? '',
    price,
    regularPrice,
    salePrice,
    onSale: salePrice > 0 && salePrice < regularPrice,
    inStock: p.is_in_stock ?? (p.stock_quantity ?? 0) > 0,
    sku: p.sku ?? '',
    photos: gallery,
    images: gallery.map((src, index) => ({
      id: index,
      src,
      name: p.title,
      alt: p.title,
    })),
    brand: p.brands?.[0]?.name,
    brandSlug: p.brands?.[0]?.slug,
    categories: p.categories,
    type: p.categories?.[0]?.name,
    typeSlug: p.categories?.[0]?.slug,
    slug: p.slug,
    recommendedSize: 'M',
    fabric: '',
    createdAt: '',
    updatedAt: '',
  };
};

export const useProductVariations = (id: string) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product-variations', id],
    queryFn: async () => {
      const { data } = await ShopRoute.get(`/products/${id}/variations`);
      return data;
    },
    enabled: !!id,
  });
  return { data, isLoading, isError, error };
};

export const useProductSearch = (query: string) => {
  const { data, isLoading, isError, error } = useQuery<ProductPage>({
    queryKey: ['products-search', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: query,
        limit: String(PER_PAGE),
      });
      const { data } = await ShopRoute.get<BackendProductsResponse>(
        `/products?${params.toString()}`
      );
      return {
        items: (data.data ?? []).map(mapProduct),
        total: data.meta?.total ?? 0,
        totalPages: data.meta?.total_pages ?? 1,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? PER_PAGE,
      };
    },
    enabled: query.trim().length > 1,
    staleTime: 1000 * 60 * 2,
  });

  return { data: data?.items ?? [], isLoading, isError, error };
};

export const useProducts = (filters: ProductFilters = {}) =>
  useInfiniteQuery<ProductPage>({
    queryKey: ['products', filters.search ?? '', filters.brand ?? '', filters.category ?? ''],
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam ?? 1);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });

      if (filters.search?.trim()) params.append('search', filters.search.trim());

      // brand : le controller le gère spécialement (slug ou id)
      if (filters.brand && filters.brand !== 'all') {
        params.append('brand', String(filters.brand));
      }

      // category : le backend attend `categories` (pluriel, voir getProductsByCategory)
      if (filters.category && filters.category !== 'all') {
        params.append('categories', String(filters.category));
      }

      const { data } = await ShopRoute.get<BackendProductsResponse>(
        `/products?${params.toString()}`
      );

      return {
        items: (data.data ?? []).map(mapProduct),
        total: data.meta?.total ?? 0,
        totalPages: data.meta?.total_pages ?? 1,
        page: data.meta?.page ?? page,
        limit: data.meta?.limit ?? PER_PAGE,
      };
    },
    getNextPageParam: (lastPage) => {
      if (typeof lastPage.totalPages === 'number') {
        return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
      }
      return lastPage.items.length === PER_PAGE ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

export const flattenProducts = (data: ReturnType<typeof useProducts>['data']): WooProduct[] =>
  data?.pages.flatMap((page) => page.items) ?? [];

export interface ClientFilters {
  category?: string; // slug ou 'all'
  brand?: string; // slug ou 'all'
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortKey;
}

export const applyClientFilters = (items: WooProduct[], f: ClientFilters): WooProduct[] => {
  let out = items.slice();

  if (f.category && f.category !== 'all') {
    out = out.filter((p) => p.typeSlug === f.category || p.type === f.category);
  }
  if (f.brand && f.brand !== 'all') {
    out = out.filter((p) => p.brandSlug === f.brand || p.brand === f.brand);
  }
  if (typeof f.minPrice === 'number') out = out.filter((p) => p.price >= f.minPrice!);
  if (typeof f.maxPrice === 'number') out = out.filter((p) => p.price <= f.maxPrice!);
  if (f.inStockOnly) out = out.filter((p) => p.inStock);
  if (f.onSaleOnly) out = out.filter((p) => p.onSale);

  switch (f.sort) {
    case 'price-asc':
      out.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      out.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    // 'reco' et 'newest' : on garde l'ordre serveur
    default:
      break;
  }

  return out;
};

/* Facettes dérivées de la liste chargée (pour remplir la sidebar) */
export const deriveFacets = (items: WooProduct[]) => {
  const cats = new Map<string, string>();
  const brands = new Map<string, string>();
  let priceMax = 0;

  for (const p of items) {
    if (p.typeSlug && p.type) cats.set(p.typeSlug, p.type);
    if (p.brandSlug && p.brand) brands.set(p.brandSlug, p.brand);
    if (p.price > priceMax) priceMax = p.price;
  }

  return {
    categories: [...cats.entries()].map(([slug, label]) => ({ slug, label })),
    brands: [...brands.entries()].map(([slug, label]) => ({ slug, label })),
    priceMax: Math.ceil((priceMax || 2000) / 50) * 50,
  };
};

export const useProduct = (id: string) => {
  const { data, isLoading, isError, error } = useQuery<WooProduct>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await ShopRoute.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
  return { data, isLoading, isError, error };
};

export const useProductsByIds = (ids: string[]) => {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['product', id],
      queryFn: async () => {
        const { data } = await ShopRoute.get<WooProduct>(`/products/${id}`);
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  return {
    products: results.map((r) => r.data).filter((p): p is WooProduct => !!p),
    isLoading: ids.length > 0 && results.some((r) => r.isLoading),
  };
};

/* ─────────────────────────────────────────────
   À COLLER dans product.ts, juste avant `export { PER_PAGE };`
───────────────────────────────────────────── */

export interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  count: number;
  image?: string;
}

// Normalise une réponse qui peut être soit un tableau (wc/v3),
// soit { data: [...] } (service/v1 agrégé)
// const asArray = (data: unknown): any[] => {
const asArray = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const d = (data as { data?: unknown })?.data;
  return Array.isArray(d) ? d : [];
};

const mapTaxonomy = (t: RawTaxonomyItem): TaxonomyItem => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
  parent: t.parent ?? 0,
  count: t.count ?? 0,
  image: t.image?.src ?? t.image?.url ?? undefined,
});

export const useCategories = (parent = 1929, enabled = true) =>
  useQuery<TaxonomyItem[]>({
    queryKey: ['categories', parent],
    queryFn: async () => {
      const { data } = await ShopRoute.get('/products/categories', {
        params: { per_page: 100, parent, hide_empty: true },
      });
      return asArray(data).map(mapTaxonomy);
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  });

const CATEGORIES_PER_PAGE = 20;

// Infinite / scroll fetching. Omit `parent` to page through ALL categories
// (for grouping); pass a parent id to page through one parent's children.
export const useCategoriesInfinite = (
  parent?: number,
  perPage = CATEGORIES_PER_PAGE,
  enabled = true
) =>
  useInfiniteQuery({
    queryKey: ['categories-infinite', parent ?? 'all', perPage],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = {
        per_page: perPage,
        page: pageParam,
        hide_empty: true,
      };
      if (parent !== undefined) params.parent = parent;
      const { data } = await ShopRoute.get('/products/categories', { params });
      return asArray(data).map(mapTaxonomy);
    },
    // WooCommerce returns a plain array; if we got a full page, assume there's another.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === perPage ? allPages.length + 1 : undefined,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
export const useAllCategories = (enabled = true) =>
  useQuery<TaxonomyItem[]>({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const perPage = 100;
      const acc: TaxonomyItem[] = [];
      for (let page = 1; page <= 20; page += 1) {
        const { data } = await ShopRoute.get('/products/categories', {
          params: { per_page: perPage, page, hide_empty: true },
        });
        const arr = asArray(data).map(mapTaxonomy);
        acc.push(...arr);
        if (arr.length < perPage) break;
      }
      return acc;
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  });

export const useBrands = () =>
  useQuery<TaxonomyItem[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await ShopRoute.get('/products/brands');
      return asArray(data).map(mapTaxonomy);
    },
    staleTime: 1000 * 60 * 10,
  });

export const useTags = () =>
  useQuery<TaxonomyItem[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await ShopRoute.get('/products/tags', {
        params: { per_page: 100 },
      });
      return asArray(data).map(mapTaxonomy);
    },
    staleTime: 1000 * 60 * 10,
  });

export { PER_PAGE };
