

import axios from 'axios';
import { Platform } from 'react-native';

import { useUserStore } from '../store/userStore';
import { detectPathLanguage, buildLocalizedPath } from '../i18n/urlLanguage';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_BACKEND_URL environment variable');
}

const SESYNC_BASE_URL = process.env.EXPO_PUBLIC_SESYNC_URL;

if (!SESYNC_BASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_SESYNC_URL environment variable');
}


let refreshPromise: Promise<boolean> | null = null;

async function runRefresh(): Promise<boolean> {
  try {
    const res = await axios.post(`${BASE_URL}/auth/refreshToken`, {}, { withCredentials: true });
    return res.data?.success === true;
  } catch {
    return false;
  }
}

function refreshTokenOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

let redirecting = false;

const createAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // sends the httpOnly auth cookies on every request
    timeout: 30_000,
  });


  instance.interceptors.request.use((config) => {
    const { token } = useUserStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (
        !originalRequest ||
        originalRequest._retry ||
        originalRequest.url?.includes('/auth/refreshToken') ||
        error.response?.status !== 401
      ) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      const ok = await refreshTokenOnce();
      if (ok) {
        return instance(originalRequest);
      }

      // Refresh failed → the session is over. Only tear down if we thought we were
      // logged in (a user in the store) and the store is hydrated.
      const { user, hasHydrated } = useUserStore.getState();
      if (user && hasHydrated && !redirecting) {
        redirecting = true;
        useUserStore.getState().clearUser();
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/connection')
        ) {
          const lang = detectPathLanguage(window.location.pathname) ?? 'fr';
          window.location.href = buildLocalizedPath('/connection', lang);
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

const BackRoute = createAxiosInstance(BASE_URL);
const ShopRoute = createAxiosInstance(BASE_URL);
const SesyncRoute = createAxiosInstance(SESYNC_BASE_URL);

export { BackRoute, ShopRoute, SesyncRoute, SESYNC_BASE_URL };
