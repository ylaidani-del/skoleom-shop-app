export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function detectPathLanguage(pathname: string): SupportedLanguage | null {
  const [, first] = pathname.split('/');
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(first)
    ? (first as SupportedLanguage)
    : null;
}

export function buildLocalizedPath(path: string, lang: string): string {
  return `/${lang}${path.startsWith('/') ? path : `/${path}`}`;
}
